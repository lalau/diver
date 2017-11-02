import update from 'immutability-helper';
import merge from 'lodash/merge';

const QUERY_PROCESSOR_URL = 'https://cdn.jsdelivr.net/gh/lalau/diver-processor@0.10/query.js';

const DEFAULT_STATE = {
    navigateTimestamp: null,
    selectedRuleId: null,
    selectedTrafficIndex: null,
    state: {
        app: {},
        page: {}
    },
    utility: {}
};

const INIT_APP_STATE = {
    viewHints: {
        traffic: true,
        rule: true,
        processor: true
    },
    processors: {
        query: {
            url: QUERY_PROCESSOR_URL
        }
    }
};

/*
{
    navigateTimestamp: 123456,
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
    case 'IMPORT_APP_STATE':
        return importAppState(state, payload);
    case 'IMPORT_UTILITY':
        return importUtility(state, payload);
    case 'INIT':
        return init(state, payload);
    case 'INIT_APP_STATE':
        return initAppState(state, payload);
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

const importAppState = (state, {appState}) => {
    const newAppState = merge({}, INIT_APP_STATE, appState);

    // make sure to use the fixed query processor url
    newAppState.processors.query.url = QUERY_PROCESSOR_URL;

    return update(state, {
        state: {
            app: {
                $set: newAppState
            }
        }
    });
};

const importUtility = (state, {utility}) => {
    return update(state, {
        utility: {
            $set: utility
        }
    });
};

const initAppState = (state) => {
    return importAppState(state, {
        appState: INIT_APP_STATE
    });
};

const init = (state) => {
    return update(state, {
        navigateTimestamp: {
            $set: Date.now()
        },
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
