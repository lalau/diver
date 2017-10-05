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

        this.state = {
            filterText: '',
            order: 'oldest',
            paginate: 'trimmed',
            showTraffics: Object.keys(props.ruleInfos).length === 0,
            tablePage: 0
        };
        this.filterTraffics = this.filterTraffics.bind(this);
        this.handleDive = this.handleDive.bind(this);
        this.handleTrafficInfo = this.handleTrafficInfo.bind(this);
        this.toggleOrder = this.toggleOrder.bind(this);
        this.togglePaginate = this.togglePaginate.bind(this);
        this.toggleShowTraffics = this.toggleState.bind(this, 'showTraffics');
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.navigateTimestamp !== this.props.navigateTimestamp) {
            this.setState({
                paginate: 'trimmed',
                tablePage: 0
            });
        }
    }

    filterTraffics({target}) {
        this.setState({
            filterText: target.value,
            tablePage: 0
        });
    }

    handleDive({trafficIndex}) {
        const {newTrafficRuleAction, trafficInfos} = this.props;
        const trafficInfo = trafficInfos[trafficIndex];

        newTrafficRuleAction(trafficInfo);
    }

    handleTrafficInfo({trafficIndex}) {
        const {selectTrafficAction} = this.props;

        selectTrafficAction(trafficIndex);
    }

    toggleOrder({target}) {
        this.setState({
            order: target.value,
            tablePage: 0
        });
    }

    togglePaginate({target}) {
        const {paginate} = this.state;
        const newState = {
            paginate: target.value
        };

        if (paginate === 'paginate' && newState.paginate !== 'paginate') {
            newState.tablePage = 0;
        }

        this.setState(newState);
    }

    toggleState(key) {
        this.setState({
            [key]: !this.state[key]
        });
    }

    getFilteredTrafficInfos() {
        const {trafficInfos} = this.props;
        const {filterText, order} = this.state;

        if (filterText) {
            const filteredTrafficInfos = trafficInfos.filter((trafficInfo) => {
                return trafficInfo.traffic.request.url.indexOf(filterText) >= 0;
            });
            return order === 'newest' ? filteredTrafficInfos.reverse() : filteredTrafficInfos;
        } else {
            return order === 'newest' ? trafficInfos.slice(0).reverse() : trafficInfos;
        }
    }

    render() {
        const {ruleInfos, selectedTrafficIndex} = this.props;
        const {filterText, order, paginate, showTraffics, tablePage} = this.state;
        const columns = [
            {
                accessor: 'index',
                Cell: props => <SimpleButton className='diver-button' handleClick={this.handleTrafficInfo} params={{trafficIndex: props.value}}>&#9776;</SimpleButton>,
                width: 32
            },
            {
                accessor: 'index',
                Cell: props => {
                    const {ruleIds} = props.original;
                    const disabled = !!(ruleIds && ruleIds.length > 0 && ruleInfos[ruleIds[0]]);

                    return <SimpleButton className='diver-button' handleClick={this.handleDive} params={{trafficIndex: props.value}} disabled={disabled}>Dive</SimpleButton>;
                },
                width: 46
            },
            {
                Header: 'URL',
                accessor: 'traffic.request.url'
            }
        ];
        const getTrProps = (state, rowInfo) => {
            if (!rowInfo) {
                return {};
            }

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
        const filteredTrafficInfos = this.getFilteredTrafficInfos();
        const needPagination = filteredTrafficInfos.length > 30;
        const pageSize = paginate === 'all' ? filteredTrafficInfos.length : Math.min(filteredTrafficInfos.length, 30);

        return (
            <div className='raw-traffics'>
                <div className='traffic-group-header raw-traffics-header'>
                    <input className='traffic-group-check' type='checkbox' defaultChecked={showTraffics} onChange={this.toggleShowTraffics}></input>
                    <h2 className='traffic-group-title'>Traffics</h2>
                    <div className='traffic-counts'>({filteredTrafficInfos.length})</div>
                </div>
                {showTraffics ? (
                    <div className='traffic-group-controls'>
                        <input className='traffic-group-filter' placeholder='Filter' defaultValue={filterText} onInput={this.filterTraffics}></input>
                        <select className='traffic-group-order traffic-group-item' defaultValue={order} onChange={this.toggleOrder}>
                            <option value='oldest'>Oldest First</option>
                            <option value='newest'>Newest First</option>
                        </select>
                        {needPagination ? (
                            <select className='traffic-group-paginate traffic-group-item' defaultValue={paginate} onChange={this.togglePaginate}>
                                <option value='trimmed'>Trimmed</option>
                                <option value='paginate'>Paginate</option>
                                <option value='all'>All</option>
                            </select>
                        ) : null}
                    </div>
                ) : null}
                {showTraffics ? (
                    <ReactTable
                        data={filteredTrafficInfos}
                        page={tablePage}
                        pageSize={pageSize}
                        columns={columns}
                        getTrProps={getTrProps}
                        onPageChange={tablePage => {this.setState({tablePage});}}
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
}

RawTraffics.propTypes = {
    navigateTimestamp: PropTypes.number,
    ruleInfos: PropTypes.object,
    trafficInfos: PropTypes.array,
    selectedTrafficIndex: PropTypes.oneOfType([PropTypes.number, PropTypes.object])
};

const mapStateToProps = (state) => {
    return {
        navigateTimestamp: state.app.navigateTimestamp,
        ruleInfos: state.rules.ruleInfos,
        trafficInfos: state.traffics.trafficInfos,
        selectedTrafficIndex: state.app.selectedTrafficIndex
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
