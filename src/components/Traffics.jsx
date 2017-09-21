import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import ReactTable from 'react-table';
import update from 'immutability-helper';
import classnames from 'classnames';
import selectRuleActionCreator from '../actions/select-rule-action-creator';
import selectTrafficActionCreator from '../actions/select-traffic-action-creator';
import reorderRuleDataActionCreator from '../actions/reorder-rule-data-action-creator';
import SimpleButton from './partials/SimpleButton.jsx';
import DataHeader from './partials/DataHeader.jsx';
import {getColumnWidth, getTrafficLabel} from '../lib/util';

const maxDataColumnWidth = 300;
const dataHeaderPadding = 46;
const dataColumnPadding = 15;

class Traffics extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            view: {}
        };
        this.selectRule = this.selectRule.bind(this);
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

    selectRule({ruleId}) {
        const {selectRuleAction} = this.props;

        selectRuleAction(ruleId);
    }

    handleTrafficInfo({trafficIndex}) {
        const {selectTrafficAction} = this.props;

        selectTrafficAction(trafficIndex);
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
                accessor: 'trafficInfo.parsed.path'
            }
        ];
    }

    getDataColumns(ruleInfo, data) {
        const columns = [];
        const dataOrder = ruleInfo.dataOrder;

        if (ruleInfo.labels.length > 0) {
            data.forEach((wrapperEntry) => {
                wrapperEntry.label = getTrafficLabel(wrapperEntry.trafficInfo, ruleInfo.labels);
            });
            const accessor = 'label';
            const text = 'Label';

            columns.push({
                Header: text,
                headerClassName: 'label-header',
                accessor,
                width: Math.min(maxDataColumnWidth, getColumnWidth(data, accessor, text, dataColumnPadding, dataHeaderPadding))
            });
        }

        dataOrder.forEach(({type, name}, dataIndex) => {
            const query = ruleInfo.data[type][name];
            const desc = query.desc || name;
            const accessor = 'trafficInfo.parsed.query.' + name;
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
        const {trafficInfos, trafficGroups, selectedRuleId, selectedTrafficIndex} = this.props;
        const ruleView = this.state.view[ruleInfo.id] || 'raw';
        const trafficGroup = trafficGroups[ruleInfo.id];
        const filteredTrafficInfos = trafficGroup && trafficGroup.trafficIndexes.map((trafficIndex) => {
            return {
                trafficInfo: trafficInfos[trafficIndex]
            };
        }) || [];
        const getTrProps = (state, rowInfo) => {
            const {index} = rowInfo.original.trafficInfo;
            const trProps = {};

            if (index === selectedTrafficIndex) {
                trProps.className = 'selected-traffic';
            }

            return trProps;
        };
        const columns = ruleView === 'data' ? this.getDataColumns(ruleInfo, filteredTrafficInfos) : this.getRawColumns();
        const hasData = ruleInfo.dataOrder.length > 0 || ruleInfo.labels.length > 0;

        columns.unshift({
            accessor: 'trafficInfo.index',
            Cell: props => <SimpleButton className='diver-button' handleClick={this.handleTrafficInfo} params={{trafficIndex: props.value}}>&#9776;</SimpleButton>,
            width: 32
        });

        return (
            <div key={ruleInfo.id} className='traffic-group'>
                <div className='traffic-group-header' style={{backgroundColor: '#' + ruleInfo.color}}>
                    <h2 className='traffic-group-title'>{ruleInfo.name}</h2>
                    <div className='edit-buttons'>
                        {hasData ? <SimpleButton className={classnames('diver-button', {selected: ruleView === 'raw'})} handleClick={this.handleViewChange} params={{ruleId: ruleInfo.id, view: 'raw'}}>Raw</SimpleButton> : null}
                        {hasData ? <SimpleButton className={classnames('diver-button', {selected: ruleView === 'data'})} handleClick={this.handleViewChange} params={{ruleId: ruleInfo.id, view: 'data'}}>Data</SimpleButton> : null}
                        {selectedRuleId !== ruleInfo.id ?
                            <SimpleButton className='diver-button' handleClick={this.selectRule} params={{ruleId: ruleInfo.id}}>&#10000; Edit</SimpleButton> :
                            <SimpleButton className='diver-button' handleClick={this.selectRule} params={{ruleId: null}}>&#10132; Close</SimpleButton>}
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
    trafficGroups: PropTypes.object,
    trafficInfos: PropTypes.array,
    selectedRuleId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    selectedTrafficIndex: PropTypes.oneOfType([PropTypes.number, PropTypes.object])
};

const mapStateToProps = (state) => {
    return {
        ruleIds: state.rules.ruleIds,
        ruleInfos: state.rules.ruleInfos,
        selectedRuleId: state.app.selectedRuleId,
        selectedTrafficIndex: state.app.selectedTrafficIndex,
        trafficGroups: state.traffics.trafficGroups,
        trafficInfos: state.traffics.trafficInfos
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        selectRuleAction: bindActionCreators(selectRuleActionCreator, dispatch),
        selectTrafficAction: bindActionCreators(selectTrafficActionCreator, dispatch),
        reorderRuleDataAction: bindActionCreators(reorderRuleDataActionCreator, dispatch),
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Traffics);
