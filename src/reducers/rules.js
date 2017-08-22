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
        {
            id: uuid,
            color: 'AABBCC',
            match: {
                host: 'bats.video.yahoo.com',
                path: '/p',
                query: {
                    'evt': 'v_request'
                }
            },
            data: [
                {
                    query: 's',
                    name: 'Spaceid'
                }
            ]
        }
    },
    ruleIds: [uuid, ...]
}
*/

export default (state, {type, payload}) => {
    switch (type) {
    case 'NEW_TRAFFIC_RULE':
        return newTrafficRule(state, payload);
    case 'REMOVE_RULE':
        return removeRule(state, payload);
    default:
        return state || DEFAULT_STATE;
    }
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
        }
    }

    state = update(state, stateChange);

    return state;
};

const createRule = (id, trafficInfo) => {
    return {
        id,
        color: getRandomColor(),
        match: {
            host: trafficInfo.parsed.host
        }
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
