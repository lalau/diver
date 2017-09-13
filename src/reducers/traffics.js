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
            parsed: <parsed url object>,
            ruleIds: [rule id, ...]
        }
    ],
    trafficGroups: {
        [<rule id>]: {
            query: ['evt', 's'],
            trafficIndexes: [traffic index, ...]
        }
    },
    selectedTrafficIndex: 3
}
*/

export default (state, {type, payload}) => {
    switch (type) {
    case 'NEW_TRAFFIC':
        return handleNewTraffic(state, payload);
    case 'PROCESS_TRAFFICS':
        return processTraffics(state, payload);
    case 'SELECT_TRAFFIC':
        return selectTraffic(state, payload);
    case 'NAVIGATE':
        return DEFAULT_STATE;
    default:
        return state || DEFAULT_STATE;
    }
};

const selectTraffic = (state, {trafficIndex}) => {
    return update(state, {
        selectedTrafficIndex: {
            $set: trafficIndex
        }
    });
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
    const query = [];
    const {id} = ruleInfo;
    const trafficInfosUpdate = {};

    state.trafficInfos.forEach((trafficInfo, index) => {
        if (isMatchingTraffic(trafficInfo, ruleInfo)) {
            trafficIndexes.push(trafficInfo.index);
            Object.keys(trafficInfo.parsed.query).forEach((queryName) => {
                if (!query.includes(queryName)) {
                    query.push(queryName);
                }
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

    query.sort();

    state = update(state, {
        trafficInfos: trafficInfosUpdate,
        trafficGroups: {
            [id]: {
                $set: {
                    query,
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

const handleNewTraffic = (state, {rules, traffic}) => {
    const filters = state.filters;
    const index = state.trafficInfos.length;
    const trafficInfo = {
        index,
        traffic,
        parsed: URL.parse(traffic.request.url, true),
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

    filtersUpdate.domain = getSetValueUpdate(filters.domain, trafficInfo.parsed.hostname);
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
