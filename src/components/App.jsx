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
            view: 'traffic'
        };
        this.toggleRuleview = this.toggleView.bind(this, 'rule');
        this.toggleTrafficview = this.toggleView.bind(this, 'traffic');
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
            <div className='rule-view'></div>
        );
    }

    render() {
        const {view} = this.state;

        return (
            <div>
                <div className='menu-bar'>
                    <button className='menu-button' onClick={this.toggleTrafficview}>&#9783; Traffics</button>
                    <button className='menu-button' onClick={this.toggleRuleview}>&#10040; Rules</button>
                </div>
                {view === 'traffic' ? this.renderTrafficView() : null}
                {view === 'rule' ? this.renderRuleView() : null}
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
        selectedTrafficIndex: state.app.selectedTrafficIndex
    };
};

export default connect(
    mapStateToProps
)(App);
