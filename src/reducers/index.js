import {combineReducers} from 'redux';
import app from './app.js';
import rules from './rules.js';
import traffics from './traffics.js';

export default combineReducers({
    app,
    rules,
    traffics
});
