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
import SimpleInput from './partials/SimpleInput.jsx';
import SimpleSelect from './partials/SimpleSelect.jsx';
import DataHeader from './partials/DataHeader.jsx';
import {getColumnWidth, getTrafficLabel} from '../lib/util';

const maxDataColumnWidth = 300;
const dataHeaderPadding = 46;
const dataColumnPadding = 15;

class Traffics extends React.Component {
    constructor(props) {
        super(props);

        const {ruleIds} = this.props;
        const rules = {};
        ruleIds.forEach((ruleId) => {
            rules[ruleId] = this.getInitRuleState();
        });

        this.state = {rules};
        this.selectRule = this.selectRule.bind(this);
        this.filterTraffics = this.filterTraffics.bind(this);
        this.handleTrafficInfo = this.handleTrafficInfo.bind(this);
        this.handleViewChange = this.handleViewChange.bind(this);
        this.reorderData = this.reorderData.bind(this);
        this.toggleOrder = this.toggleOrder.bind(this);
        this.togglePaginate = this.togglePaginate.bind(this);
        this.toggleShowTraffics = this.toggleShowTraffics.bind(this);
    }

    getInitRuleState() {
        return {
            filterText: '',
            order: 'oldest',
            paginate: 'trimmed',
            showTraffics: true,
            tablePage: 0,
            view: 'raw'
        };
    }

    componentWillReceiveProps(nextProps) {
        const {ruleIds, ruleInfos} = this.props;
        let newRules = this.state.rules;

        ruleIds.forEach((ruleId) => {
            const ruleInfo = ruleInfos[ruleId];
            const nextRuleInfo = nextProps.ruleInfos[ruleId];

            if (!nextRuleInfo) {
                // rule removed
                newRules = update(newRules, {
                    $unset: [ruleId]
                });
            } else if (nextRuleInfo.dataOrder.length === 0 && ruleInfo.dataOrder.length > 0) {
                // all data removed
                newRules = update(newRules, {
                    [ruleId]: {
                        view: {
                            $set: 'raw'
                        }
                    }
                });
            }
        });

        nextProps.ruleIds.forEach((ruleId) => {
            if (!ruleInfos[ruleId]) {
                // new rule
                newRules = update(newRules, {
                    [ruleId]: {
                        $set: this.getInitRuleState()
                    }
                });
            }
        });

        if (newRules !== this.state.rules) {
            this.setState({
                rules: newRules
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
            rules: update(this.state.rules, {
                [ruleId]: {
                    view: {
                        $set: view
                    }
                }
            })
        });
    }

    reorderData({ruleId, dataIndex}, dir) {
        const {reorderRuleDataAction} = this.props;

        reorderRuleDataAction({ruleId, dataIndex, dir});
    }

    toggleOrder(target, {ruleId}) {
        this.setState({
            rules: update(this.state.rules, {
                [ruleId]: {
                    order: {
                        $set: target.value
                    },
                    tablePage: {
                        $set: 0
                    }
                }
            })
        });
    }

    togglePaginate(target, {ruleId}) {
        const {paginate} = this.state.rules[ruleId];
        const ruleUpdate = {
            paginate: {
                $set: target.value
            }
        };

        if (paginate === 'paginate' && target.value !== 'paginate') {
            ruleUpdate.tablePage = {
                $set: 0
            };
        }

        this.setState({
            rules: update(this.state.rules, {
                [ruleId]: ruleUpdate
            })
        });
    }

    toggleShowTraffics(target, {ruleId}) {
        this.setState({
            rules: update(this.state.rules, {
                [ruleId]: {
                    showTraffics: {
                        $set: !this.state.rules[ruleId].showTraffics
                    }
                }
            })
        });
    }

    filterTraffics(target, {ruleId}) {
        this.setState({
            rules: update(this.state.rules, {
                [ruleId]: {
                    filterText: {
                        $set: target.value
                    },
                    tablePage: {
                        $set: 0
                    }
                }
            })
        });
    }

    setTablePage(ruleId, tablePage) {
        this.setState({
            rules: update(this.state.rules, {
                [ruleId]: {
                    tablePage: {
                        $set: tablePage
                    }
                }
            })
        });
    }

    getRawColumns() {
        return [
            {
                Header: 'URL',
                accessor: 'trafficInfo.traffic.request.url'
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

        dataOrder.forEach(({namespace, name}, dataIndex) => {
            const dataMeta = ruleInfo.data[namespace][name];
            const desc = dataMeta.desc || name;
            const accessor = 'trafficInfo.processed.' + namespace + '.' + name;
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

    getFilteredTrafficInfos(ruleId) {
        const {filterText, order} = this.state.rules[ruleId];
        const {trafficInfos, trafficGroups} = this.props;
        const groupTrafficInfos = trafficGroups[ruleId] && trafficGroups[ruleId].trafficIndexes.map((trafficIndex) => {
            return {
                trafficInfo: trafficInfos[trafficIndex]
            };
        }) || [];

        if (groupTrafficInfos.length === 0) {
            return groupTrafficInfos;
        }

        const filteredTrafficInfos = !filterText ? groupTrafficInfos : groupTrafficInfos.filter(({trafficInfo}) => {
            return trafficInfo.traffic.request.url.indexOf(filterText) >= 0;
        });

        return order === 'newest' ? filteredTrafficInfos.reverse() : filteredTrafficInfos;
    }

    renderTrafficGroup(ruleInfo) {
        const ruleId = ruleInfo.id;
        const {selectedRuleId, selectedTrafficIndex, trafficGroups} = this.props;
        const {filterText, order, paginate, showTraffics, tablePage, view} = this.state.rules[ruleId];
        const trafficIndexes = trafficGroups[ruleId] && trafficGroups[ruleId].trafficIndexes || [];
        const filteredTrafficInfos = this.getFilteredTrafficInfos(ruleId);
        const hasTable = filteredTrafficInfos.length > 0 && showTraffics;
        const columns = view === 'data' ? this.getDataColumns(ruleInfo, filteredTrafficInfos) : this.getRawColumns();
        const hasData = ruleInfo.dataOrder.length > 0 || ruleInfo.labels.length > 0;
        const needPagination = filteredTrafficInfos.length > 30;
        const pageSize = paginate === 'all' ? filteredTrafficInfos.length : Math.min(filteredTrafficInfos.length, 30);
        const getTrProps = (state, rowInfo) => {
            if (!rowInfo) {
                return {};
            }

            const {index} = rowInfo.original.trafficInfo;
            const trProps = {};

            if (index === selectedTrafficIndex) {
                trProps.className = 'selected-traffic';
            }

            return trProps;
        };
        const onPageChange = (tablePage) => {
            this.setTablePage(ruleId, tablePage);
        };

        columns.unshift({
            accessor: 'trafficInfo.index',
            Cell: props => <SimpleButton className='diver-button' handleClick={this.handleTrafficInfo} params={{trafficIndex: props.value}}>&#9776;</SimpleButton>,
            width: 32
        });

        return (
            <div key={ruleId} className={classnames('traffic-group', {'empty-traffic-group': !hasTable})}>
                <div className='traffic-group-header' style={{backgroundColor: '#' + ruleInfo.color}}>
                    <SimpleInput className='traffic-group-check' type='checkbox' defaultChecked={showTraffics} handleChange={this.toggleShowTraffics} params={{ruleId}}></SimpleInput>
                    <h2 className='traffic-group-title'>{ruleInfo.name}</h2>
                    <div className='traffic-counts'>({filteredTrafficInfos.length})</div>
                    <div className='edit-buttons'>
                        <div className='edit-buttons-group'>
                            {hasTable && hasData ? <SimpleButton className={classnames('diver-button', {selected: view === 'raw'})} handleClick={this.handleViewChange} params={{ruleId, view: 'raw'}}>Raw</SimpleButton> : null}
                            {hasTable && hasData ? <SimpleButton className={classnames('diver-button', {selected: view === 'data'})} handleClick={this.handleViewChange} params={{ruleId, view: 'data'}}>Data</SimpleButton> : null}
                            {selectedRuleId !== ruleId ?
                                <SimpleButton className='diver-button' handleClick={this.selectRule} params={{ruleId}}>&#10000; Edit</SimpleButton> :
                                <SimpleButton className='diver-button' handleClick={this.selectRule} params={{ruleId: null}}>&#10132; Close</SimpleButton>}
                        </div>
                    </div>
                </div>
                {showTraffics && trafficIndexes.length > 0 ? (
                    <div className='traffic-group-controls'>
                        <SimpleInput className='traffic-group-filter' placeholder='Filter' defaultValue={filterText} handleInput={this.filterTraffics} params={{ruleId}}></SimpleInput>
                        <SimpleSelect className='traffic-group-order traffic-group-item' defaultValue={order} handleChange={this.toggleOrder} params={{ruleId}}>
                            <option value='oldest'>Oldest First</option>
                            <option value='newest'>Newest First</option>
                        </SimpleSelect>
                        {needPagination ? (
                            <SimpleSelect className='traffic-group-paginate traffic-group-item' defaultValue={paginate} handleChange={this.togglePaginate} params={{ruleId}}>
                                <option value='trimmed'>Trimmed</option>
                                <option value='paginate'>Paginate</option>
                                <option value='all'>All</option>
                            </SimpleSelect>
                        ) : null}
                    </div>
                ) : null}
                {hasTable ? (
                    <ReactTable
                        data={filteredTrafficInfos}
                        page={tablePage}
                        pageSize={pageSize}
                        columns={columns}
                        getTrProps={getTrProps}
                        onPageChange={onPageChange}
                        showPagination={paginate === 'paginate' && needPagination}
                        showPaginationTop={true}
                        showPaginationBottom={true}
                        showPageSizeOptions={false}
                        sortable={false}
                        resizable={false}
                    />
                ) : null}
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
