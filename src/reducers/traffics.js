import URL from 'url';
import update from 'immutability-helper';
import {isMatchingTraffic} from '../lib/util';

const DEFAULT_STATE = {
    filters: {
        domain: [],
        'has-response-header': [],
        method: [],
        'mime-type': [],
        'status-code': [],
        'larger-than': ['100', '10k', '1M']
    },
    trafficInfos: [],
    trafficGroups: {}
};

/*
{
    filters: {
        domain: [a.com, b.com],
        method: ['GET', 'POST']
    },
    trafficInfos: [
        {
            index: 0,
            traffic: <raw traffic object>,
            hostname: 'www.yahoo.com',
            port: '',
            ruleIds: [rule id, ...],
            processed: {
                <namespace>: {
                    'evt': 'v_api',
                    's': '123'
                }
            }
        }
    ],
    trafficGroups: {
        [<rule id>]: {
            dataKeys: {
                <namespace>: ['evt', 's']
            },
            trafficIndexes: [traffic index, ...]
        }
    }
}
*/

export default (state, {type, payload}) => {
    switch (type) {
    case 'NEW_TRAFFIC':
        return handleNewTraffic(state, payload);
    case 'PROCESS_TRAFFICS':
        return processTraffics(state, payload);
    case 'NAVIGATE':
        return DEFAULT_STATE;
    default:
        return state || DEFAULT_STATE;
    }
};

const removeOldRules = (state, {ruleInfos}) => {
    const trafficInfosUpdate = {};

    state.trafficInfos.forEach((trafficInfo, trafficInfoIndex) => {
        if (trafficInfo.ruleIds.length > 0) {
            trafficInfo.ruleIds.forEach((ruleId, ruleIdIndex) => {
                if (!ruleInfos[ruleId]) {
                    trafficInfosUpdate[trafficInfoIndex] = {
                        ruleIds: {
                            $splice: [[ruleIdIndex, 1]]
                        }
                    };
                }
            });
        }
    });

    if (Object.keys(trafficInfosUpdate).length === 0) {
        return state;
    }

    state = update(state, {
        trafficInfos: trafficInfosUpdate
    });

    return state;
};

const processRule = (state, {ruleInfo}) => {
    const trafficIndexes = [];
    const dataKeys = {};
    const {id} = ruleInfo;
    const trafficInfosUpdate = {};

    ruleInfo.namespaces.forEach((namespace) => {
        dataKeys[namespace] = [];
    });

    state.trafficInfos.forEach((trafficInfo, index) => {
        if (isMatchingTraffic(trafficInfo, ruleInfo)) {
            trafficIndexes.push(trafficInfo.index);

            Object.keys(trafficInfo.processed).forEach((namespace) => {
                Object.keys(trafficInfo.processed[namespace]).forEach((dataKey) => {
                    if (!dataKeys[namespace].includes(dataKey)) {
                        dataKeys[namespace].push(dataKey);
                    }
                });
            });

            // add rule id if not already matched
            if (trafficInfo.ruleIds.indexOf(id) === -1) {
                trafficInfosUpdate[index] = {
                    ruleIds: {
                        $push: [id]
                    }
                };
            }
        } else {
            const ruleIndex = trafficInfo.ruleIds.indexOf(id);
            // remove rule id if previously matched
            if (ruleIndex >= 0) {
                trafficInfosUpdate[index] = {
                    ruleIds: {
                        $splice: [[ruleIndex, 1]]
                    }
                };
            }
        }
    });

    Object.keys(dataKeys).forEach((namespace) => {
        dataKeys[namespace].sort();
    });

    state = update(state, {
        trafficInfos: trafficInfosUpdate,
        trafficGroups: {
            [id]: {
                $set: {
                    dataKeys,
                    trafficIndexes
                }
            }
        }
    });

    return state;
};

const processTraffics = (state, {rules}) => {
    const {ruleIds, ruleInfos} = rules;

    state = removeOldRules(state, {ruleInfos});

    ruleIds.forEach((ruleId) => {
        state = processRule(state, {
            ruleInfo: ruleInfos[ruleId]
        });
    });

    return state;
};

const handleNewTraffic = (state, {processors, rules, traffic}) => {
    const filters = state.filters;
    const index = state.trafficInfos.length;
    const parsedUrl = URL.parse(traffic.request.url);
    const trafficInfo = {
        index,
        traffic,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        processed: {},
        ruleIds: []
    };
    const trafficGroupsUpdate = {};
    const filtersUpdate = {};

    rules.ruleIds.forEach((ruleId) => {
        const ruleInfo = rules.ruleInfos[ruleId];

        if (isMatchingTraffic(trafficInfo, ruleInfo)) {
            trafficInfo.ruleIds.push(ruleInfo.id);
            trafficGroupsUpdate[ruleInfo.id] = {
                trafficIndexes: {
                    $push: [index]
                }
            };
        }
    });

    Object.keys(processors).forEach((key) => {
        const processor = processors[key];
        trafficInfo.processed[processor.namespace] = processor.process(traffic);
    });

    filtersUpdate.domain = getSetValueUpdate(filters.domain, trafficInfo.hostname);
    filtersUpdate['has-response-header'] = getSetValuesUpdate(filters['has-response-header'], trafficInfo.traffic.response.headers, 'name');
    filtersUpdate.method = getSetValueUpdate(filters.method, trafficInfo.traffic.request.method);
    filtersUpdate['mime-type'] = getSetValueUpdate(filters['mime-type'], trafficInfo.traffic.response.content.mimeType);
    filtersUpdate['status-code'] = getSetValueUpdate(filters['status-code'], trafficInfo.traffic.response.status + '');

    state = update(state, {
        filters: filtersUpdate,
        trafficInfos: {
            $push: [trafficInfo]
        },
        trafficGroups: trafficGroupsUpdate
    });

    return state;
};

const getSetValueUpdate = (set, value) => {
    const normalizedValue = value.trim().toLowerCase();

    if (!set.includes(normalizedValue)) {
        const newSet = set.concat();
        newSet.push(normalizedValue);
        newSet.sort();
        return {$set: newSet};
    }

    return {};
};

const getSetValuesUpdate = (set, values, attr) => {
    const newSet = set.concat();

    values.forEach((value) => {
        const normalizedValue = value[attr].trim().toLowerCase();
        if (!newSet.includes(normalizedValue)) {
            newSet.push(normalizedValue);
        }
    });
    if (newSet.length > set.length) {
        newSet.sort();
        return {$set: newSet};
    }

    return {};
};
