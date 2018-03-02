import 'react-table/react-table.css';
import '../../styles/diver.scss';

import React from 'react';
import {render} from 'react-dom';
import {createStore} from 'redux';
import {Provider} from 'react-redux';
import App from '../../src/components/App.jsx';
import reducer from '../../src/reducers/';
import update from 'immutability-helper';
import {PROCESS_STATE} from '../../src/reducers/traffics';
import get from 'lodash/get';

window.diver = {};

const store = createStore(reducer, {});

const loadProcessors = () => {
    const state = store.getState();
    const processors = state.app.state.app.processors;
    const processorsSession = state.app.state.session.processors;

    if (!processors || !processorsSession) {
        return;
    }

    const loadPromises = Object.keys(processors).map((namespace) => {
        const {url, code, isLocal} = processors[namespace];
        const {loaded} = processorsSession[namespace];

        if (loaded) {
            return null;
        }

        if (isLocal) {
            return new window.Promise((resolve) => {
                background.initProcessor({
                    namespace,
                    getProcessor: code,
                    callback: resolve
                });
            });
        }

        return new window.Promise((resolve) => {
            background.removeProcessor({namespace});

            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    background.initProcessor({
                        namespace,
                        getProcessor: xhr.responseText,
                        callback: resolve
                    });
                }
            };
            xhr.send();
        });
    });

    store.dispatch({
        type: 'UPDATE_APP_STATE',
        payload: {
            scope: 'session',
            key: 'processorsLoading',
            value: true
        }
    });

    window.Promise.all(loadPromises).then((results) => {
        store.dispatch({
            type: 'UPDATE_APP_STATE',
            payload: {
                scope: 'session',
                key: 'processorsUpdated',
                value: false
            }
        });

        const processorsUpdate = {};

        results.forEach((result) => {
            if (result && result.namespace) {
                processorsUpdate[result.namespace] = {
                    name: {
                        $set: result.name
                    },
                    valid: {
                        $set: result.valid
                    },
                    error: {
                        $set: result.error
                    },
                    loaded: {
                        $set: true
                    }
                };
            }
        });

        if (Object.keys(processorsUpdate).length > 0) {
            store.dispatch({
                type: 'UPDATE_APP_STATE',
                payload: {
                    scope: 'session',
                    key: 'processors',
                    value: update(processorsSession, processorsUpdate)
                }
            });
        }

        store.dispatch({
            type: 'UPDATE_APP_STATE',
            payload: {
                scope: 'session',
                key: 'processorsLoading',
                value: false
            }
        });
    });
};

const reloadProcessors = () => {
    const state = store.getState();
    const appSession = state.app.state.session;
    const processorsSession = appSession.processors;

    if (!processorsSession || appSession.processorsLoading) {
        return;
    }

    const processorsUpdate = {};

    Object.keys(processorsSession).forEach((namespace) => {
        processorsUpdate[namespace] = {
            loaded: {
                $set: false
            }
        };
    });

    store.dispatch({
        type: 'UPDATE_APP_STATE',
        payload: {
            scope: 'session',
            key: 'processors',
            value: update(processorsSession, processorsUpdate)
        }
    });

    store.dispatch({
        type: 'UPDATE_APP_STATE',
        payload: {
            scope: 'session',
            key: 'processorsUpdated',
            value: true
        }
    });
};

const validateAndProcessTraffic = ({namespace, navigateTimestamp, traffic, trafficIndex, callback}) => {
    background.validateNamespace({
        namespace,
        callback: ({valid}) => {
            if (valid) {
                background.processTraffic({namespace, navigateTimestamp, traffic, trafficIndex, callback});
            } else {
                reloadProcessors();
                setImmediate(() => {
                    callback({namespace, navigateTimestamp, trafficIndex});
                });
            }
        }
    });
};

const background = {
    exportContent: ({name, content}) => {
        chrome.runtime.sendMessage({
            type: 'EXPORT_CONTENT',
            payload: {name, content}
        });
    },
    validateRule: ({ruleInfo, callback}) => {
        chrome.runtime.sendMessage({
            type: 'VALIDATE_RULE',
            payload: {ruleInfo}
        }, ({type, result}) => {
            if (type === 'VALIDATE_RULE_RESULT') {
                callback(result);
            }
        });
    },
    initProcessor: ({namespace, getProcessor, callback}) => {
        chrome.runtime.sendMessage({
            type: 'INIT_PROCESSOR',
            payload: {namespace, getProcessor}
        }, ({type, result}) => {
            if (type === 'INIT_PROCESSOR_RESULT' && result.namespace === namespace) {
                callback(result);
            }
        });
    },
    removeProcessor: ({namespace}) => {
        chrome.runtime.sendMessage({
            type: 'REMOVE_PROCESSOR',
            payload: {namespace}
        });
    },
    processTraffic: ({namespace, navigateTimestamp, traffic, trafficIndex, callback}) => {
        chrome.runtime.sendMessage({
            type: 'PROCESS_TRAFFIC',
            payload: {namespace, navigateTimestamp, traffic, trafficIndex}
        }, ({type, result}) => {
            if (type === 'PROCESS_TRAFFIC_RESULT' && result.trafficIndex === trafficIndex && result.namespace === namespace && result.navigateTimestamp === navigateTimestamp) {
                callback(result);
            }
        });
    },
    validateNamespace: ({namespace, callback}) => {
        chrome.runtime.sendMessage({
            type: 'VALIDATE_NAMESPACE',
            payload: {namespace}
        }, ({type, result}) => {
            if (type === 'VALIDATE_NAMESPACE_RESULT' && result.namespace === namespace) {
                callback(result);
            }
        });
    },
    handleNavigated: () => {
        chrome.runtime.sendMessage({
            type: 'NAVIGATED'
        });
    }
};

store.dispatch({type: 'INIT_SESSION'});

chrome.storage.sync.get(['diverApp', 'diverRules'], ({diverApp, diverRules}) => {
    if (diverApp) {
        store.dispatch({
            type: 'IMPORT_APP_STATE',
            payload: {
                appState: diverApp
            }
        });
    } else {
        store.dispatch({
            type: 'INIT_APP_STATE'
        });
    }

    if (diverRules) {
        store.dispatch({
            type: 'IMPORT_RULES',
            payload: {
                rules: diverRules
            }
        });
    }

    store.dispatch({
        type: 'IMPORT_UTILITY',
        payload: {
            utility: background
        }
    });

    loadProcessors();
});

chrome.devtools.network.onRequestFinished.addListener((traffic) => {
    const state = store.getState();

    store.dispatch({
        type: 'NEW_TRAFFIC',
        payload: {
            rules: state.rules,
            traffic
        }
    });
});

chrome.devtools.network.onNavigated.addListener(() => {
    const state = store.getState();

    store.dispatch({
        type: 'INIT_PAGE',
        payload: {
            rules: state.rules
        }
    });

    background.handleNavigated();
});

const storeState = {
    app: {},
    rules: {},
    traffics: {}
};

const handleProcessTraffic = (trafficInfo) => {
    const {app, rules} = store.getState();
    const trafficIndex = trafficInfo.index;

    store.dispatch({
        type: 'PROCESSING_TRAFFIC',
        payload: {
            trafficIndex
        }
    });

    const processorResults = {};
    const processPromises = Object.keys(trafficInfo.processed).map((namespace) => {
        processorResults[namespace] = {};
        return new window.Promise((resolve) => {
            validateAndProcessTraffic({
                namespace,
                navigateTimestamp: app.navigateTimestamp,
                traffic: trafficInfo.traffic,
                trafficIndex,
                callback: ({navigateTimestamp, processed}) => {
                    resolve({
                        namespace,
                        navigateTimestamp,
                        processed
                    });
                }
            });
        });
    });

    window.Promise.all(processPromises).then((results) => {
        const currentNavigateTimestamp = store.getState().app.navigateTimestamp;
        const isCurrentPageProcess = results[0] && results[0].navigateTimestamp === currentNavigateTimestamp;
        const allProcessed = results.every(({processed}) => !!processed);

        // ignore process promises from the previous page
        if (!isCurrentPageProcess || !allProcessed) {
            return;
        }

        results.forEach(({namespace, processed}) => {
            processorResults[namespace] = processed;
        });

        store.dispatch({
            type: 'PROCESSED_TRAFFIC',
            payload: {
                trafficIndex,
                rules,
                processed: processorResults
            }
        });
    });
};

store.subscribe(() => {
    const newState = store.getState();

    // handle rules change
    const prevRules = storeState.rules;
    const nextRules = newState.rules;

    storeState.rules = newState.rules;

    if (prevRules !== nextRules) {
        chrome.storage.sync.set({diverRules: nextRules});
    }

    nextRules.ruleIds.forEach((nextRuleId) => {
        const nextRuleInfo = nextRules.ruleInfos[nextRuleId];
        const prevRuleInfo = prevRules && prevRules.ruleInfos && prevRules.ruleInfos[nextRuleId];

        // only re-process rule if the rule change is not due to adding/removing processor
        if (!prevRuleInfo && nextRuleInfo || (nextRuleInfo !== prevRuleInfo && nextRuleInfo.namespaces === prevRuleInfo.namespaces)) {
            store.dispatch({
                type: 'PROCESS_RULE',
                payload: {
                    ruleInfo: nextRuleInfo
                }
            });
        }
    });

    // handle traffics change
    const prevTraffics = storeState.traffics.trafficInfos || [];
    const nextTraffics = newState.traffics.trafficInfos;

    storeState.traffics = newState.traffics;

    if (nextTraffics.length > prevTraffics.length) {
        for (let i = prevTraffics.length; i < nextTraffics.length; i++) {
            const trafficInfo = nextTraffics[i];

            if (trafficInfo.processState !== PROCESS_STATE.NOT_PROCESSED) {
                continue;
            }

            handleProcessTraffic(trafficInfo);
        }
    }

    // handle app state change
    const prevState = storeState.app.state;
    const nextState = newState.app.state;

    storeState.app = newState.app;

    if (!(prevState && prevState.session && prevState.session.processorsUpdated) && nextState.session.processorsUpdated) {
        loadProcessors();
    }

    if (prevState && prevState.session && prevState.session.processorsLoading && !nextState.session.processorsLoading) {
        const processingTraffics = storeState.traffics.trafficInfos.filter(({processState}) => processState === PROCESS_STATE.PROCESSING);
        processingTraffics.forEach((trafficInfo) => {
            handleProcessTraffic(trafficInfo);
        });
    }

    if (!get(prevState, 'page.inspectingTraffic.processingNamespace')) {
        const inspectingTraffic = get(nextState, 'page.inspectingTraffic');
        const processingNamespace = inspectingTraffic && inspectingTraffic.processingNamespace;
        if (processingNamespace) {
            validateAndProcessTraffic({
                namespace: processingNamespace,
                navigateTimestamp: 1,
                traffic: inspectingTraffic.traffic,
                trafficIndex: 1,
                callback: ({processed, error}) => {
                    store.dispatch({
                        type: 'UPDATE_APP_STATE',
                        payload: {
                            scope: 'page',
                            key: 'inspectingTraffic',
                            value: update(inspectingTraffic, {
                                $unset: ['processingNamespace'],
                                processed: {
                                    $set: processed
                                },
                                error: {
                                    $set: error
                                }
                            })
                        }
                    });
                }
            });
        }
    }

    if ((prevState && prevState.app) !== nextState.app) {
        chrome.storage.sync.set({diverApp: nextState.app});
    }
});

render(
    <Provider store={store}>
        <App/>
    </Provider>,
    document.getElementById('root')
);
