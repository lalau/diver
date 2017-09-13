import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import classnames from 'classnames';
import Traffics from './Traffics.jsx';
import RawTraffics from './RawTraffics.jsx';
import RuleInfo from './RuleInfo.jsx';
import TrafficInfo from './TrafficInfo.jsx';

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            ruleInfo: false,
            trafficInfo: false
        };
        this.openRuleInfo = this.toggleInfoPane.bind(this, true, 'ruleInfo');
        this.openTrafficInfo = this.toggleInfoPane.bind(this, true, 'trafficInfo');
        this.closeInfo = this.toggleInfoPane.bind(this, false);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.navigateTimestamp !== this.props.navigateTimestamp) {
            this.toggleInfoPane(false);
        }
    }

    toggleInfoPane(open, pane) {
        const newState = {
            ruleInfo: false,
            trafficInfo: false
        };

        if (open && pane) {
            newState[pane] = true;
        }

        this.setState(newState);
    }

    render() {
        const {ruleInfo, trafficInfo} = this.state;
        const {selectedRuleId} = this.props;

        return (
            <div className={classnames('diver', {'info-pane-opened': ruleInfo || trafficInfo})}>
                <div className='traffic-pane'>
                    <Traffics onTrafficInfo={this.openTrafficInfo} onRuleInfo={this.openRuleInfo} onDeselect={this.closeInfo}/>
                    <RawTraffics onTrafficInfo={this.openTrafficInfo}/>
                </div>
                <div className='info-pane'>
                    {ruleInfo ? <RuleInfo key={selectedRuleId} onClose={this.closeInfo}/> : null}
                    {trafficInfo ? <TrafficInfo onClose={this.closeInfo}/> : null}
                </div>
            </div>
        );
    }
}

App.propTypes = {
    navigateTimestamp: PropTypes.number
};

const mapStateToProps = (state) => {
    return {
        navigateTimestamp: state.app.navigateTimestamp,
        selectedRuleId: state.app.selectedRuleId
    };
};

export default connect(
    mapStateToProps
)(App);
