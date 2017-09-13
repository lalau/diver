import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import ReactTable from 'react-table';
import update from 'immutability-helper';
import classnames from 'classnames';
import selectRuleActionCreator from '../actions/select-rule-action-creator';
import selectTrafficActionCreator from '../actions/select-traffic-action-creator';
import removeRuleActionCreator from '../actions/remove-rule-action-creator';
import reorderRuleDataActionCreator from '../actions/reorder-rule-data-action-creator';
import SimpleButton from './partials/SimpleButton.jsx';
import DataHeader from './partials/DataHeader.jsx';
import {getColumnWidth} from '../lib/util';

const maxDataColumnWidth = 300;
const dataHeaderPadding = 46;
const dataColumnPadding = 15;

class Traffics extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            view: {}
        };
        this.handleRuleInfo = this.handleRuleInfo.bind(this);
        this.handleRemoveGroup = this.handleRemoveGroup.bind(this);
        this.handleTrafficInfo = this.handleTrafficInfo.bind(this);
        this.handleViewChange = this.handleViewChange.bind(this);
        this.reorderData = this.reorderData.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        const {ruleIds, ruleInfos} = this.props;
        let newView = this.state.view;

        ruleIds.forEach((ruleId) => {
            const ruleInfo = ruleInfos[ruleId];
            const nextRuleInfo = nextProps.ruleInfos[ruleId];

            if (!nextRuleInfo) {
                // rule removed
                newView = update(newView, {
                    $unset: [ruleId]
                });
            } else if (nextRuleInfo.dataOrder.length === 0 && ruleInfo.dataOrder.length > 0) {
                // all data removed
                newView = update(newView, {
                    [ruleId]: {
                        $set: 'raw'
                    }
                });
            }
        });

        if (newView !== this.state.view) {
            this.setState({
                view: newView
            });
        }
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

    handleViewChange({ruleId, view}) {
        this.setState({
            view: update(this.state.view, {
                [ruleId]: {
                    $set: view
                }
            })
        });
    }

    reorderData({ruleId, dataIndex}, dir) {
        const {reorderRuleDataAction} = this.props;

        reorderRuleDataAction({ruleId, dataIndex, dir});
    }

    getRawColumns() {
        return [
            {
                Header: 'Path',
                accessor: 'parsed.path'
            },
            {
                accessor: 'index',
                Cell: props => <SimpleButton className='diver-button' handleClick={this.handleTrafficInfo} params={{trafficIndex: props.value}}>...</SimpleButton>,
                width: 32
            }
        ];
    }

    getDataColumns(ruleInfo, data) {
        const columns = [];
        const dataOrder = ruleInfo.dataOrder;

        dataOrder.forEach(({type, name}, dataIndex) => {
            const query = ruleInfo.data[type][name];
            const desc = query.desc || name;
            const accessor = 'parsed.query.' + name;
            const reorderLeft = dataIndex > 0;
            const reorderRight = dataIndex < dataOrder.length - 1;

            columns.push({
                Header: <DataHeader text={desc} onReorder={this.reorderData} reorderLeft={reorderLeft} reorderRight={reorderRight} params={{ruleId: ruleInfo.id, dataIndex}}/>,
                headerClassName: 'data-header-wrapper',
                accessor,
                width: Math.min(maxDataColumnWidth, getColumnWidth(data, accessor, desc, dataColumnPadding, dataHeaderPadding))
            });
        });

        return columns;
    }

    renderTrafficGroup(ruleInfo) {
        const {trafficInfos, trafficGroups, selectedTrafficIndex} = this.props;
        const ruleView = this.state.view[ruleInfo.id] || 'raw';
        const trafficGroup = trafficGroups[ruleInfo.id];
        const filteredTrafficInfos = trafficGroup && trafficGroup.trafficIndexes.map((trafficIndex) => {
            return trafficInfos[trafficIndex];
        }) || [];
        const getTrProps = (state, rowInfo) => {
            const {index} = rowInfo.original;
            const trProps = {};

            if (index === selectedTrafficIndex) {
                trProps.className = 'selected-traffic';
            }

            return trProps;
        };
        const columns = ruleView === 'data' ? this.getDataColumns(ruleInfo, filteredTrafficInfos) : this.getRawColumns();
        const hasData = ruleInfo.dataOrder.length > 0;

        return (
            <div key={ruleInfo.id} className='traffic-group'>
                <div className='traffic-group-header' style={{backgroundColor: '#' + ruleInfo.color}}>
                    <h2 className='traffic-group-title'>{ruleInfo.name}</h2>
                    <div className='edit-buttons'>
                        <SimpleButton className={classnames('diver-button', {selected: ruleView === 'raw'})} handleClick={this.handleViewChange} params={{ruleId: ruleInfo.id, view: 'raw'}}>Raw</SimpleButton>
                        {hasData ? <SimpleButton className={classnames('diver-button', {selected: ruleView === 'data'})} handleClick={this.handleViewChange} params={{ruleId: ruleInfo.id, view: 'data'}}>Data</SimpleButton> : null}
                        <SimpleButton className='diver-button' handleClick={this.handleRuleInfo} params={{ruleId: ruleInfo.id}}>...</SimpleButton>
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
        removeRuleAction: bindActionCreators(removeRuleActionCreator, dispatch),
        reorderRuleDataAction: bindActionCreators(reorderRuleDataActionCreator, dispatch),
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Traffics);
