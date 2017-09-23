import update from 'immutability-helper';

const DEFAULT_STATE = {
    processors: {
        query: 'https://cdn.jsdelivr.net/gh/lalau/diver-processor@0.3/query.js',
        rapid: 'https://cdn.jsdelivr.net/gh/lalau/diver-processor@0.3/rapid.js'
    },
    selectedRuleId: null,
    selectedTrafficIndex: null,
    ui: {}
};

/*
{
    processors: {
        query: 'https://cdn.jsdelivr.net/gh/lalau/diver-processor@0.1/query.js'
    },
    selectedRuleId: uuid,
    selectedTrafficIndex: 3,
    ui: {}
}
*/

export default (state, {type, payload}) => {
    switch (type) {
    case 'NAVIGATE':
        return handleNavigate(state, payload);
    case 'SELECT_RULE':
        return selectRule(state, payload);
    case 'SELECT_TRAFFIC':
        return selectTraffic(state, payload);
    default:
        return state || DEFAULT_STATE;
    }
};

const handleNavigate = (state) => {
    return update(state, {
        selectedRuleId: {
            $set: null
        },
        selectedTrafficIndex: {
            $set: null
        }
    });
};

const selectRule = (state, {ruleId}) => {
    return update(state, {
        selectedRuleId: {
            $set: ruleId
        },
        selectedTrafficIndex: {
            $set: null
        }
    });
};

const selectTraffic = (state, {trafficIndex}) => {
    return update(state, {
        selectedRuleId: {
            $set: null
        },
        selectedTrafficIndex: {
            $set: trafficIndex
        }
    });
};
