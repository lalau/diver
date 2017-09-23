import 'react-table/react-table.css';
import '../../styles/diver.scss';

import React from 'react';
import {render} from 'react-dom';
import {createStore} from 'redux';
import {Provider} from 'react-redux';
import App from '../../src/components/App.jsx';
import reducer from '../../src/reducers/';

const store = createStore(reducer, {});

window.diver = {
    processors: {}
};

chrome.storage.sync.get('diverRules', ({diverRules}) => {
    if (diverRules) {
        store.dispatch({
            type: 'IMPORT_RULES',
            payload: {
                rules: diverRules
            }
        });
    }
});

chrome.devtools.network.onRequestFinished.addListener((traffic) => {
    const state = store.getState();

    store.dispatch({
        type: 'NEW_TRAFFIC',
        payload: {
            processors: window.diver.processors,
            rules: state.rules,
            traffic
        }
    });
});

chrome.devtools.network.onNavigated.addListener(() => {
    store.dispatch({
        type: 'NAVIGATE'
    });
});

const storeState = {
    rules: {},
    traffics: {}
};

store.subscribe(() => {
    const newState = store.getState();

    if (newState.rules !== storeState.rules) {
        chrome.storage.sync.set({'diverRules': newState.rules});
    }

    if (newState.rules.ruleInfos !== storeState.rules.ruleInfos || newState.traffics.trafficInfos !== storeState.traffics.trafficInfos) {
        storeState.rules = newState.rules;
        storeState.traffics = newState.traffics;

        store.dispatch({
            type: 'PROCESS_TRAFFICS',
            payload: {
                rules: newState.rules
            }
        });
    }
});

Object.keys(store.getState().app.processors).forEach((key) => {
    const processorUrl = store.getState().app.processors[key];
    const script = document.createElement('script');
    script.setAttribute('src', processorUrl);
    document.head.appendChild(script);
});

render(
    <Provider store={store}>
        <App/>
    </Provider>,
    document.getElementById('root')
);
