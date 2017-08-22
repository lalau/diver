import React from 'react';
import {render} from 'react-dom';
import {createStore} from 'redux';
import {Provider} from 'react-redux';
import App from '../../src/components/App.jsx';
import reducer from '../../src/reducers/';

const store = createStore(reducer, {});

// store.dispatch({
//     type: 'NEW_RULE',
//     payload: {
//         rule: {
//             id: 'yahoo-video-player-beacons',
//             name: 'Yahoo Video Player Beacons',
//             pattern: '^https?:\/\/bats.video.yahoo.com\/',
//             params: {
//                 query: {
//                     s: {
//                         name: 'Spaceid'
//                     },
//                     evt: {
//                         name: 'Event'
//                     },
//                     pt: {
//                         name: 'Page type'
//                     },
//                     vid: {
//                         name: 'Video id'
//                     }
//                 }
//             }
//         }
//     }
// });

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
    store.dispatch({
        type: 'CLEAR_TRAFFICS'
    });
});

const storeState = {
    rules: {},
    traffics: {}
};

store.subscribe(() => {
    const newState = store.getState();

    if (newState.rules.ruleInfos === storeState.rules.ruleInfos && newState.traffics.trafficInfos === storeState.traffics.trafficInfos) {
        return;
    }

    storeState.rules = newState.rules;
    storeState.traffics = newState.traffics;

    store.dispatch({
        type: 'PROCESS_TRAFFICS',
        payload: {
            rules: newState.rules
        }
    });
});

render(
    <Provider store={store}>
        <App/>
    </Provider>,
    document.getElementById('root')
);
