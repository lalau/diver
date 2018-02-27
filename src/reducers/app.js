import update from 'immutability-helper';
import merge from 'lodash/merge';

const QUERY_PROCESSOR_URL = 'https://raw.githubusercontent.com/lalau/diver-processor/master/query2.js';

const DEFAULT_STATE = {
    navigateTimestamp: null,
    selectedRuleId: null,
    selectedTrafficIndex: null,
    state: {
        app: {},
        page: {},
        session: {}
    },
    utility: {}
};

const INIT_APP_STATE = {
    viewHints: {
        traffic: true,
        rule: true,
        processor: true,
        v2: false
    },
    processors: {
        query: {
            url: QUERY_PROCESSOR_URL
        }
    },
    rulesUI: {},
    version: 2
};

const INIT_SESSION_STATE = {
    appView: 'traffic',
    processors: {},
    processorsLoading: false,
    processorsUpdated: false
};

/*
{
    navigateTimestamp: 123456,
    selectedRuleId: uuid,
    selectedTrafficIndex: 3,
    state: {
        app: <persistent state>,
        page: <state reset on navigate>,
        session: <state persistent to extension session>
    }
}
*/

export default (state, {type, payload}) => {
    switch (type) {
    case 'IMPORT_APP_STATE':
        return importAppState(state, payload);
    case 'IMPORT_UTILITY':
        return importUtility(state, payload);
    case 'INIT_SESSION':
        return initSession(state, payload);
    case 'INIT_PAGE':
        return initPage(state, payload);
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
    const loaded = false;
    const newAppState = merge({}, INIT_APP_STATE, appState);
    const sessionProcessors = Object.keys(newAppState.processors).reduce((accumulator, namespace) => {
        accumulator[namespace] = {loaded};
        return accumulator;
    }, {});

    // make sure to use the fixed query processor url
    newAppState.processors.query.url = QUERY_PROCESSOR_URL;

    if (appState.version !== 2) {
        newAppState.viewHints.v2 = true;
    }

    return update(state, {
        state: {
            app: {
                $set: newAppState
            },
            session: {
                processors: {
                    $set: sessionProcessors
                }
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

const initSession = (state) => {
    return initPage(update(state, {
        state: {
            session: {
                $set: INIT_SESSION_STATE
            }
        }
    }));
};

const initPage = (state) => {
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
            session: {
                processors: {
                    $unset: [namespace]
                },
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

const updateProcessor = (state, {namespace, url, code, isLocal}) => {
    return update(state, {
        state: {
            app: {
                processors: {
                    [namespace]: {
                        $set: {url, code, isLocal}
                    }
                }
            },
            session: {
                processors: {
                    [namespace]: {
                        $set: {
                            loaded: false
                        }
                    }
                },
                processorsUpdated: {
                    $set: true
                }
            }
        }
    });
};
