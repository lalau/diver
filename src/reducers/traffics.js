import URL from 'url';
import update from 'immutability-helper';
import {isMatchingTraffic} from '../lib/util';

const DEFAULT_STATE = {
    trafficInfos: [],
    trafficGroups: {}
};

/*
{
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
    selectedTraffic: 3
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
    case 'CLEAR_TRAFFICS':
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
                        $splice: [[index, 1]]
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
    const index = state.trafficInfos.length;
    const trafficInfo = {
        index,
        traffic,
        parsed: URL.parse(traffic.request.url, true),
        ruleIds: []
    };
    const trafficGroupsUpdate = {};

    rules.ruleIds.forEach((ruleId) => {
        const ruleInfo = rules.ruleInfos[ruleId];

        if (isMatchingTraffic(trafficInfo, ruleInfo)) {
            trafficInfo.ruleIds.push(ruleInfo.id);
            trafficGroupsUpdate[ruleInfo.id] = {
                $push: [index]
            };
        }
    });

    state = update(state, {
        trafficInfos: {
            $push: [trafficInfo]
        },
        trafficGroups: trafficGroupsUpdate
    });

    return state;
};
