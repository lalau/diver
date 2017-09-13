import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import ReactTable from 'react-table';
import selectTrafficActionCreator from '../actions/select-traffic-action-creator';
import newTrafficRuleActionCreator from '../actions/new-traffic-rule-action-creator';
import SimpleButton from './partials/SimpleButton.jsx';

class RawTraffics extends React.Component {
    constructor(props) {
        super(props);

        this.handleDive = this.handleDive.bind(this);
        this.handleTrafficInfo = this.handleTrafficInfo.bind(this);
    }

    handleDive({trafficIndex}) {
        const {newTrafficRuleAction, trafficInfos} = this.props;
        const trafficInfo = trafficInfos[trafficIndex];

        newTrafficRuleAction(trafficInfo);
    }

    handleTrafficInfo({trafficIndex}) {
        const {onTrafficInfo, selectTrafficAction} = this.props;

        selectTrafficAction(trafficIndex);
        onTrafficInfo(trafficIndex);
    }

    render() {
        const {ruleInfos, trafficInfos, selectedTrafficIndex} = this.props;
        const columns = [
            {
                accessor: 'index',
                Cell: props => <SimpleButton className='diver-button' handleClick={this.handleDive} params={{trafficIndex: props.value}}>Dive</SimpleButton>,
                width: 46
            },
            {
                Header: 'URL',
                accessor: 'traffic.request.url'
            },
            {
                accessor: 'index',
                Cell: props => <SimpleButton className='diver-button' handleClick={this.handleTrafficInfo} params={{trafficIndex: props.value}}>...</SimpleButton>,
                width: 32
            }
        ];
        const getTrProps = (state, rowInfo) => {
            const {index, ruleIds} = rowInfo.original;
            const trProps = {};

            if (index === selectedTrafficIndex) {
                trProps.className = 'selected-traffic';
            } else if (ruleIds && ruleIds.length > 0 && ruleInfos[ruleIds[0]]) {
                trProps.style = {
                    backgroundColor: '#' + ruleInfos[ruleIds[0]].color
                };
            }

            return trProps;
        };

        return (
            <div className='raw-traffics'>
                <h2 className='raw-traffics-header'>Traffics</h2>
                <ReactTable
                    data={trafficInfos}
                    pageSize={trafficInfos.length}
                    columns={columns}
                    getTrProps={getTrProps}
                    showPagination={false}
                    sortable={false}
                    resizable={false}/>
            </div>
        );
    }
}

RawTraffics.propTypes = {
    ruleInfos: PropTypes.object,
    trafficInfos: PropTypes.array,
    selectedTrafficIndex: PropTypes.number,

    onTrafficInfo: PropTypes.func
};

const mapStateToProps = (state) => {
    return {
        ruleInfos: state.rules.ruleInfos,
        trafficInfos: state.traffics.trafficInfos,
        selectedTrafficIndex: state.traffics.selectedTrafficIndex
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        newTrafficRuleAction: bindActionCreators(newTrafficRuleActionCreator, dispatch),
        selectTrafficAction: bindActionCreators(selectTrafficActionCreator, dispatch)
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(RawTraffics);
