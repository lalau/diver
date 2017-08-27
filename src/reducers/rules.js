import update from 'immutability-helper';
import uuidv1 from 'uuid/v1';
import {getRandomColor, isMatchingTraffic} from '../lib/util';

const DEFAULT_STATE = {
    ruleInfos: {},
    ruleIds: []
};

/*
{
    ruleInfos: {
        [uuid]: {
            id: uuid,
            color: 'AABBCC',
            name: 'bats.video.yahoo.com',
            filters: [
                {
                    name: domain,
                    value: 'bats.video.yahoo.com'
                },
                {
                    name: has-response-header,
                    value: 'connection',
                    valueMatch: '*'
                }
            ],
            data: [
                {
                    query: 's',
                    name: 'Spaceid'
                }
            ]
        }
    },
    ruleIds: [uuid, ...],
    selectedRuleId: uuid
}
*/

export default (state, {type, payload}) => {
    switch (type) {
    case 'NEW_TRAFFIC_RULE':
        return newTrafficRule(state, payload);
    case 'REMOVE_RULE':
        return removeRule(state, payload);
    case 'SELECT_RULE':
        return selectRule(state, payload);
    case 'UPDATE_RULE_FILTER':
        return updateRuleFilter(state, payload);
    default:
        return state || DEFAULT_STATE;
    }
};

const updateRuleFilter = (state, {ruleId, type, filterIndex, value, valueMatch}) => {

    if (type === 'update') {
        return update(state, {
            ruleInfos: {
                [ruleId]: {
                    filters: {
                        [filterIndex]: {
                            value: value ? {$set: value} : {},
                            valueMatch: valueMatch ? {$set: valueMatch} : {}
                        }
                    }
                }
            }
        });
    }

    return state;
};

const selectRule = (state, {ruleId}) => {
    return update(state, {
        selectedRuleId: {
            $set: ruleId
        }
    });
};

const removeRule = (state, {ruleId}) => {
    const stateChange = {
        ruleInfos: {
            [ruleId]: {
                $set: undefined
            }
        }
    };
    const ruleIdIndex = state.ruleIds.indexOf(ruleId);

    if (ruleIdIndex >= 0) {
        stateChange.ruleIds = {
            $splice: [[ruleIdIndex, 1]]
        };
    }

    state = update(state, stateChange);

    return state;
};

const createRule = (id, trafficInfo) => {
    const hostname = trafficInfo.parsed.hostname;

    return {
        id,
        color: getRandomColor(),
        name: hostname,
        filters: [
            {
                name: 'domain',
                value: hostname
            }
        ]
    };
};

const matchRules = (state, trafficInfo) => {
    const {ruleIds, ruleInfos} = state;
    const matchedRules = [];

    ruleIds.forEach((ruleId) => {
        const ruleInfo = ruleInfos[ruleId];

        if (isMatchingTraffic(trafficInfo, ruleInfo)) {
            matchedRules.push(ruleInfo);
        }
    });

    return matchedRules;
};

const newTrafficRule = (state, {trafficInfo}) => {
    const matchedRules = matchRules(state, trafficInfo);

    if (matchedRules && matchedRules.length > 0) {
        return state;
    }

    const ruleId = uuidv1();

    state = update(state, {
        ruleInfos: {
            [ruleId]: {
                $set: createRule(ruleId, trafficInfo)
            }
        },
        ruleIds: {
            $push: [ruleId]
        }
    });

    return state;
};
