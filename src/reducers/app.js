import update from 'immutability-helper';

const DEFAULT_STATE = {
    selectedRuleId: null,
    selectedTrafficIndex: null,
    state: {
        app: {
            processors: {
                query: {
                    url: 'https://cdn.jsdelivr.net/gh/lalau/diver-processor@0.3/query.js'
                }
            }
        },
        page: {}
    }
};

/*
{
    selectedRuleId: uuid,
    selectedTrafficIndex: 3,
    state: {
        app: <persistent state>,
        page: <state reset on navigate>
    }
}
*/

export default (state, {type, payload}) => {
    switch (type) {
    case 'INIT':
        return init(state, payload);
    case 'REMOVE_PROCESSOR':
        return removeProcessor(state, payload);
    case 'SELECT_RULE':
        return selectRule(state, payload);
    case 'SELECT_TRAFFIC':
        return selectTraffic(state, payload);
    case 'UPDATE_PROCESSOR':
        return updateProcessor(state, payload);
    case 'UPDATE_APP_STATE':
        return updateAppState(state, payload);
    default:
        return state || DEFAULT_STATE;
    }
};

const init = (state) => {
    return update(state, {
        selectedRuleId: {
            $set: null
        },
        selectedTrafficIndex: {
            $set: null
        },
        state: {
            page: {
                $set: {}
            }
        }
    });
};

const updateAppState = (state, {scope, key, value}) => {
    return update(state, {
        state: {
            [scope]: {
                [key]: {
                    $set: value
                }
            }
        }
    });
};

const removeProcessor = (state, {namespace}) => {
    return update(state, {
        state: {
            app: {
                processors: {
                    $unset: [namespace]
                }
            },
            page: {
                processorsUpdated: {
                    $set: true
                }
            }
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

const updateProcessor = (state, {namespace, url}) => {
    return update(state, {
        state: {
            app: {
                processors: {
                    [namespace]: {
                        $set: {url}
                    }
                }
            },
            page: {
                processorsUpdated: {
                    $set: true
                }
            }
        }
    });
};
