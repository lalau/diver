import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import classnames from 'classnames';
import Traffics from './Traffics.jsx';
import RawTraffics from './RawTraffics.jsx';
import RuleInfo from './RuleInfo.jsx';
import TrafficInfo from './TrafficInfo.jsx';
import Rules from './Rules.jsx';
import Processors from './Processors.jsx';
import messages from '../strings/messages';
import {bindActionCreators} from 'redux';
import resetRulesActionCreator from '../actions/reset-rules-action-creator';
import updateAppStateActionCreator from '../actions/update-app-state-action-creator';
import tutorials from '../lib/tutorials';
import update from 'immutability-helper';
import SimpleButton from './partials/SimpleButton.jsx';

class App extends React.Component {
    constructor(props) {
        super(props);

        this.dismissHint = this.dismissHint.bind(this);
        this.resetRules = this.resetRules.bind(this);
        this.toggleRuleView = this.toggleView.bind(this, 'rule');
        this.toggleTrafficView = this.toggleView.bind(this, 'traffic');
        this.toggleProcessorView = this.toggleView.bind(this, 'processor');
    }

    resetRules() {
        if (window.confirm('Only reset rules if the extension is breaking. Proceed?')) {
            this.props.resetRulesAction();
        }
    }

    dismissHint({hintKey}) {
        const {viewHints} = this.props;

        this.props.updateAppStateAction({
            scope: 'app',
            key: 'viewHints',
            value: update(viewHints, {
                [hintKey]: {
                    $set: false
                }
            })
        });
    }

    toggleView(appView) {
        this.props.updateAppStateAction({
            scope: 'session',
            key: 'appView',
            value: appView
        });
    }

    renderTrafficView() {
        const {selectedRuleId, selectedTrafficIndex} = this.props;

        return (
            <div className={classnames('traffic-view', {'info-pane-opened': selectedRuleId !== null || selectedTrafficIndex !== null})}>
                <div className='traffic-pane'>
                    <Traffics/>
                    <RawTraffics/>
                </div>
                <div className='info-pane'>
                    {selectedRuleId !== null ? <RuleInfo key={selectedRuleId}/> : null}
                    {selectedTrafficIndex !== null ? <TrafficInfo key={selectedTrafficIndex}/> : null}
                </div>
            </div>
        );
    }

    renderRuleView() {
        return (
            <div className='rule-view config-view'>
                <Rules/>
            </div>
        );
    }

    renderProcessorView() {
        return (
            <div className='processor-view config-view'>
                <Processors/>
            </div>
        );
    }

    renderHintBar(hintMessage, hintKey) {
        if (!hintMessage || !hintKey) {
            return null;
        }

        return (
            <div className='app-bar hint-bar'>
                <p className='message hint'>&#8252; {hintMessage} {this.renderTutorials(hintKey)}
                    <SimpleButton className='menu-button side-button' handleClick={this.dismissHint} params={{hintKey}}>Dismiss</SimpleButton>
                </p>
            </div>
        );
    }

    renderTutorials(hintKey) {
        const hintTutorials = tutorials[hintKey];

        return hintTutorials.map(({name = 'Tutorial', url}) => {
            return <a key={name} href={url} target='_blank' className='tutorial-link'>{name}</a>;
        });
    }

    renderMessageBar() {
        const {message} = this.props;
        const string = message && messages[message.key];

        if (!string) {
            return null;
        }

        return (
            <div className='app-bar message-bar'>
                <p className={classnames('message', message.type)}>&#8252; {string}</p>
            </div>
        );
    }

    render() {
        const {appView, message, viewHints} = this.props;
        const hasMessage = !!(message && messages[message.key]);
        const hintKey = viewHints && ((viewHints.v2 && 'v2') || (viewHints[appView] && appView));
        const messageKey = hintKey && (hintKey === 'v2' ? 'UPDATED_TO_V2' : ('FIRST_TIME_VIEW_' + hintKey.toUpperCase()));
        const hintMessage = messages[messageKey];

        return (
            <div className={classnames('diver-app', {'message-bar-shown': hasMessage, 'hint-bar-shown': hintMessage})}>
                <div className='app-bar menu-bar'>
                    <button className={classnames('menu-button', {'selected': appView === 'traffic'})} onClick={this.toggleTrafficView}>&#9783; Traffics</button>
                    <button className={classnames('menu-button', {'selected': appView === 'rule'})} onClick={this.toggleRuleView}>&#10040; Rules</button>
                    <button className={classnames('menu-button', {'selected': appView === 'processor'})} onClick={this.toggleProcessorView}>&#10148; Processors</button>
                    <button className='menu-button side-button' onClick={this.resetRules}>Reset Rules</button>
                    <a href={tutorials.index} target='_blank' className='menu-button side-button'>Tutorials</a>
                </div>
                {this.renderHintBar(hintMessage, hintKey)}
                {this.renderMessageBar()}
                {appView === 'traffic' ? this.renderTrafficView() : null}
                {appView === 'rule' ? this.renderRuleView() : null}
                {appView === 'processor' ? this.renderProcessorView() : null}
            </div>
        );
    }
}

App.propTypes = {
    selectedRuleId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    selectedTrafficIndex: PropTypes.oneOfType([PropTypes.number, PropTypes.object])
};

const mapStateToProps = (state) => {
    return {
        appView: state.app.state.session.appView,
        message: state.app.state.page.message,
        selectedRuleId: state.app.selectedRuleId,
        selectedTrafficIndex: state.app.selectedTrafficIndex,
        viewHints: state.app.state.app.viewHints
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        resetRulesAction: bindActionCreators(resetRulesActionCreator, dispatch),
        updateAppStateAction: bindActionCreators(updateAppStateActionCreator, dispatch)
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(App);
