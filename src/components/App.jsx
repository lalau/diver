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

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            view: 'traffic'
        };
        this.resetRules = this.resetRules.bind(this);
        this.toggleRuleview = this.toggleView.bind(this, 'rule');
        this.toggleTrafficview = this.toggleView.bind(this, 'traffic');
        this.toggleProcessorview = this.toggleView.bind(this, 'processor');
    }

    resetRules() {
        if (window.confirm('Only reset rules if the extension is breaking. Proceed?')) {
            this.props.resetRulesAction();
        }
    }

    toggleView(view) {
        this.setState({view});
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
        const {view} = this.state;
        const {message} = this.props;
        const hasMessage = !!(message && messages[message.key]);

        return (
            <div className={classnames('diver-app', {'message-bar-shown': hasMessage})}>
                <div className='app-bar menu-bar'>
                    <button className={classnames('menu-button', {'selected': view === 'traffic'})} onClick={this.toggleTrafficview}>&#9783; Traffics</button>
                    <button className={classnames('menu-button', {'selected': view === 'rule'})} onClick={this.toggleRuleview}>&#10040; Rules</button>
                    <button className={classnames('menu-button', {'selected': view === 'processor'})} onClick={this.toggleProcessorview}>&#10148; Processors</button>
                    <button className='menu-button reset-button' onClick={this.resetRules}>Reset Rules</button>
                </div>
                {this.renderMessageBar()}
                {view === 'traffic' ? this.renderTrafficView() : null}
                {view === 'rule' ? this.renderRuleView() : null}
                {view === 'processor' ? this.renderProcessorView() : null}
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
        selectedRuleId: state.app.selectedRuleId,
        selectedTrafficIndex: state.app.selectedTrafficIndex,
        message: state.app.state.page.message
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        resetRulesAction: bindActionCreators(resetRulesActionCreator, dispatch)
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(App);
