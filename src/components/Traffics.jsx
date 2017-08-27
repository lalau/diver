import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import ReactTable from 'react-table';
import selectRuleActionCreator from '../actions/select-rule-action-creator';
import selectTrafficActionCreator from '../actions/select-traffic-action-creator';
import removeRuleActionCreator from '../actions/remove-rule-action-creator';
import SimpleButton from './partials/SimpleButton.jsx';

class Traffics extends React.Component {
    constructor(props) {
        super(props);

        this.handleRuleInfo = this.handleRuleInfo.bind(this);
        this.handleTrafficInfo = this.handleTrafficInfo.bind(this);
        this.handleRemoveGroup = this.handleRemoveGroup.bind(this);
    }

    handleRuleInfo({ruleId}) {
        const {onRuleInfo, selectRuleAction} = this.props;

        selectRuleAction(ruleId);
        onRuleInfo();
    }

    handleTrafficInfo({trafficIndex}) {
        const {onTrafficInfo, selectTrafficAction} = this.props;

        selectTrafficAction(trafficIndex);
        onTrafficInfo();
    }

    handleRemoveGroup({ruleId}) {
        const {onDeselect, removeRuleAction} = this.props;

        removeRuleAction(ruleId);
        onDeselect();
    }

    renderTrafficGroup(ruleInfo) {
        const {trafficInfos, trafficGroups, selectedTrafficIndex} = this.props;
        const filteredTrafficInfos = trafficGroups[ruleInfo.id].map((trafficIndex) => {
            return trafficInfos[trafficIndex];
        });
        const columns = [
            {
                Header: 'Path',
                accessor: 'parsed.path'
            },
            {
                accessor: 'index',
                Cell: props => <SimpleButton className='info-button' handleClick={this.handleTrafficInfo} params={{trafficIndex: props.value}}>...</SimpleButton>,
                width: 32
            }
        ];
        const getTrProps = (state, rowInfo) => {
            const {index} = rowInfo.original;
            const trProps = {};

            if (index === selectedTrafficIndex) {
                trProps.className = 'selected-traffic';
            }

            return trProps;
        };

        return (
            <div key={ruleInfo.id} className='traffic-group'>
                <div className='traffic-group-header' style={{backgroundColor: '#' + ruleInfo.color}}>
                    <h2 className='traffic-group-title'>{ruleInfo.name}</h2>
                    <div className='edit-buttons'>
                        <SimpleButton className='info-button' handleClick={this.handleRuleInfo} params={{ruleId: ruleInfo.id}}>...</SimpleButton>
                    </div>
                </div>
                <ReactTable
                    data={filteredTrafficInfos}
                    pageSize={filteredTrafficInfos.length}
                    columns={columns}
                    getTrProps={getTrProps}
                    showPagination={false}
                    sortable={false}
                    resizable={false}/>
            </div>
        );
    }

    render() {
        const {ruleIds, ruleInfos} = this.props;

        return (
            <div className='traffic-groups'>
                {ruleIds.map((ruleId) => {
                    return this.renderTrafficGroup(ruleInfos[ruleId]);
                })}
            </div>
        );
    }
}

Traffics.propTypes = {
    ruleIds: PropTypes.array,
    ruleInfos: PropTypes.object,
    trafficInfos: PropTypes.array,
    trafficGroups: PropTypes.object,
    selectedTrafficIndex: PropTypes.number,

    onDeselect: PropTypes.func,
    onRuleInfo: PropTypes.func,
    onTrafficInfo: PropTypes.func
};

const mapStateToProps = (state) => {
    return {
        ruleIds: state.rules.ruleIds,
        ruleInfos: state.rules.ruleInfos,
        trafficInfos: state.traffics.trafficInfos,
        trafficGroups: state.traffics.trafficGroups,
        selectedTrafficIndex: state.traffics.selectedTrafficIndex
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        selectRuleAction: bindActionCreators(selectRuleActionCreator, dispatch),
        selectTrafficAction: bindActionCreators(selectTrafficActionCreator, dispatch),
        removeRuleAction: bindActionCreators(removeRuleActionCreator, dispatch)
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Traffics);
