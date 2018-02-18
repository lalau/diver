import 'react-table/react-table.css';
import '../../styles/diver.scss';

import React from 'react';
import {render} from 'react-dom';
import {createStore} from 'redux';
import {Provider} from 'react-redux';
import App from '../../src/components/App.jsx';
import reducer from '../../src/reducers/';
import update from 'immutability-helper';

window.diver = {};

const store = createStore(reducer, {});

const loadProcessors = () => {
    const state = store.getState();
    const processors = state.app.state.app.processors;

    if (!processors) {
        return;
    }

    window.diver.processors = {};

    const loadPromises = Object.keys(processors).map((namespace) => {
        const {name, process, url} = processors[namespace];

        if (name && typeof process === 'function') {
            return null;
        }

        return new window.Promise((resolve) => {
            const script = document.createElement('script');
            script.setAttribute('src', url);
            script.onload = script.onerror = resolve;
            document.head.appendChild(script);
        });
    });

    window.Promise.all(loadPromises).then(() => {
        const processorsUpdate = {};

        Object.keys(processors).map((namespace) => {
            const processor = window.diver.processors[namespace];

            if (processor && processor.name && processor.namespace === namespace && processor.process) {
                processor.url = processors[namespace].url;
                processorsUpdate[namespace] = {
                    $set: processor
                };
            }
        });

        if (Object.keys(processorsUpdate).length > 0) {
            store.dispatch({
                type: 'UPDATE_APP_STATE',
                payload: {
                    scope: 'app',
                    key: 'processors',
                    value: update(processors, processorsUpdate)
                }
            });
        }

        store.dispatch({
            type: 'UPDATE_APP_STATE',
            payload: {
                scope: 'page',
                key: 'processorsUpdated',
                value: false
            }
        });
    });
};

const utility = {
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
    handleNavigated: () => {
        chrome.runtime.sendMessage({
            type: 'NAVIGATED'
        });
    }
};

store.dispatch({
    type: 'INIT',
    payload: {
        rules: store.getState().rules
    }
});

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
        payload: {utility}
    });

    loadProcessors();
});

chrome.devtools.network.onRequestFinished.addListener((traffic) => {
    const state = store.getState();

    store.dispatch({
        type: 'NEW_TRAFFIC',
        payload: {
            processors: state.app.state.app.processors,
            rules: state.rules,
            traffic
        }
    });
});

chrome.devtools.network.onNavigated.addListener(() => {
    const state = store.getState();

    store.dispatch({
        type: 'INIT',
        payload: {
            rules: state.rules
        }
    });

    utility.handleNavigated();
});

const storeState = {
    app: {},
    rules: {}
};

store.subscribe(() => {
    const newState = store.getState();
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

    const prevState = storeState.app.state;
    const nextState = newState.app.state;

    storeState.app = newState.app;

    if (!(prevState && prevState.page && prevState.page.processorsUpdated) && nextState.page.processorsUpdated) {
        loadProcessors();
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
