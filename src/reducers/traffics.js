import URL from 'url';
import update from 'immutability-helper';
import {isMatchingTraffic} from '../lib/util';

const DEFAULT_STATE = {
    filters: {
        domain: [],
        'has-response-header': [],
        method: [],
        'mime-type': [],
        'status-code': []
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
        [<rule id>]: [traffic index, ...]
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
    const trafficGroup = [];
    const {id} = ruleInfo;
    const trafficInfosUpdate = {};

    state.trafficInfos.forEach((trafficInfo, index) => {
        if (isMatchingTraffic(trafficInfo, ruleInfo)) {
            trafficGroup.push(trafficInfo.index);
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

    state = update(state, {
        trafficInfos: trafficInfosUpdate,
        trafficGroups: {
            [id]: {
                $set: trafficGroup
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
                $push: [index]
            };
        }
    });

    filtersUpdate.domain = getSingleFilterUpdate(filters.domain, trafficInfo.parsed.hostname);
    filtersUpdate['has-response-header'] = getArrayFilterUpdate(filters['has-response-header'], trafficInfo.traffic.response.headers, 'name');
    filtersUpdate.method = getSingleFilterUpdate(filters.method, trafficInfo.traffic.request.method);
    filtersUpdate['mime-type'] = getSingleFilterUpdate(filters['mime-type'], trafficInfo.traffic.response.content.mimeType);
    filtersUpdate['status-code'] = getSingleFilterUpdate(filters['status-code'], trafficInfo.traffic.response.status);

    state = update(state, {
        filters: filtersUpdate,
        trafficInfos: {
            $push: [trafficInfo]
        },
        trafficGroups: trafficGroupsUpdate
    });

    return state;
};

const getSingleFilterUpdate = (filterValues, value) => {
    if (!filterValues.includes(value)) {
        const newValues = filterValues.concat();
        newValues.push(value);
        newValues.sort();
        return {$set: newValues};
    }

    return {};
};

const getArrayFilterUpdate = (filterValues, arrayValue, path) => {
    const newValues = filterValues.concat();
    arrayValue.forEach((value) => {
        if (newValues.includes(value[path])) {
            newValues.push(value[path]);
        }
    });
    if (newValues.length > filterValues.length) {
        newValues.sort();
        return {$set: newValues};
    }

    return {};
};
