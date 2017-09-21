import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import classnames from 'classnames';
import SimpleInput from './partials/SimpleInput.jsx';
import selectTrafficActionCreator from '../actions/select-traffic-action-creator';
import updateRuleDataActionCreator from '../actions/update-rule-data-action-creator';
import {getRuleDataIndex, getTrafficLabel} from '../lib/util';

class TrafficInfo extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedDataRuleId: this.getFirstMatchingRuleId(),
            urlExpanded: false
        };
        this.collapseUrl = this.toggleUrlExpand.bind(this, false);
        this.deselectTraffic = this.deselectTraffic.bind(this);
        this.expandUrl = this.toggleUrlExpand.bind(this, true);
        this.selectDataRuleId = this.selectDataRuleId.bind(this);
        this.toggleQueryData = this.toggleQueryData.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (!this.state.selectedDataRuleId && this.props.ruleIds !== nextProps.ruleIds) {
            const selectedDataRuleId = this.getFirstMatchingRuleId(nextProps);
            if (selectedDataRuleId) {
                this.setState({selectedDataRuleId});
            }
        }
    }

    deselectTraffic() {
        this.props.selectTrafficAction(null);
    }

    toggleUrlExpand(urlExpanded) {
        this.setState({urlExpanded});
    }

    toggleQueryData(target, params) {
        const {updateRuleDataAction} = this.props;
        const {name, ruleId} = params;
        const updateType = target.checked ? 'add' : 'remove';

        updateRuleDataAction({
            ruleId,
            updateType,
            type: 'query',
            name
        });
    }

    selectDataRuleId() {
        this.setState({
            selectedDataRuleId: this.dataRuleIdInput.value
        });
    }

    getFirstMatchingRuleId(props) {
        const {ruleIds, trafficInfo} = props || this.props;
        let firstMatchingRuleId = null;

        if (trafficInfo) {
            ruleIds.some((ruleId) => {
                if (this.isMatchingRule(ruleId, props)) {
                    firstMatchingRuleId = ruleId;
                    return true;
                }
            });
        }

        return firstMatchingRuleId;
    }

    isMatchingRule(ruleId, props) {
        const {trafficGroups, trafficInfo} = props || this.props;
        return trafficGroups[ruleId].trafficIndexes.indexOf(trafficInfo.index) >= 0;
    }

    renderUrl() {
        const {trafficInfo} = this.props;
        const {urlExpanded} = this.state;

        return (
            <div className='section'>
                <h4 className='section-header'>URL
                    {
                        urlExpanded ?
                            <button className='info-header-button diver-button' onClick={this.collapseUrl}>&#9650; Collapse</button> :
                            <button className='info-header-button diver-button' onClick={this.expandUrl}>&#9660; Expand</button>
                    }
                </h4>
                <div className={classnames('info-value url-value', {collapsed: !urlExpanded})}>{trafficInfo.traffic.request.url}</div>
            </div>
        );
    }

    renderLabels() {
        const {ruleIds, ruleInfos, trafficInfo} = this.props;

        return (
            <div className='section'>
                <h4 className='section-header'>Labels</h4>
                {ruleIds.map((ruleId, ruleIndex) => {
                    const ruleInfo = ruleInfos[ruleId];
                    const label = this.isMatchingRule(ruleId) && getTrafficLabel(trafficInfo, ruleInfo.labels);

                    if (label) {
                        return <div className='info-value' key={ruleIndex}>{label}</div>;
                    } else {
                        return null;
                    }
                })}
            </div>
        );
    }

    renderData() {
        const {ruleIds, ruleInfos} = this.props;
        const {selectedDataRuleId} = this.state;

        if (!selectedDataRuleId) {
            return null;
        }

        return (
            <div className='section' key={selectedDataRuleId}>
                <h4 className='section-header'>Data</h4>
                <select className='section-select query-select' defaultValue={selectedDataRuleId} onChange={this.selectDataRuleId} ref={(input) => {this.dataRuleIdInput = input;}}>
                    {ruleIds.map((ruleId, ruleIndex) => {
                        const ruleInfo = ruleInfos[ruleId];

                        if (this.isMatchingRule(ruleId)) {
                            return <option value={ruleId} key={ruleIndex}>{ruleInfo.name}</option>;
                        } else {
                            return null;
                        }
                    })}
                </select>
                {this.renderQuery(ruleInfos[selectedDataRuleId])}
            </div>
        );
    }

    renderQuery(ruleInfo) {
        const {trafficInfo} = this.props;
        const parsedQuery = trafficInfo.parsed.query;
        const sortedQueryNames = Object.keys(parsedQuery).sort();

        return (
            <ul className='section-list'>
                {sortedQueryNames.map((name) => {
                    const querySelected = getRuleDataIndex(ruleInfo, 'query', name) >= 0;

                    return (
                        <li className='section-flex-row' key={name}>
                            <SimpleInput className='diver-check' type='checkbox' defaultChecked={querySelected} handleChange={this.toggleQueryData} params={{name, ruleId: ruleInfo.id}}/>
                            <h5 className='section-label query-label'>{name}</h5>
                            <div className='section-label query-value-label'>{parsedQuery[name]}</div>
                        </li>
                    );
                })}
            </ul>
        );
    }

    render() {
        const {trafficInfo} = this.props;

        if (!trafficInfo) {
            return null;
        }

        return (
            <div>
                <div className='info-pane-menu'>
                    <button className='info-pane-menu-button diver-button' onClick={this.deselectTraffic}>&#10132; Close</button>
                </div>
                <div className='traffic-info info-pane-content'>
                    {this.renderUrl()}
                    {this.renderLabels()}
                    {this.renderData()}
                </div>
            </div>
        );
    }
}

TrafficInfo.propTypes = {
    ruleIds: PropTypes.array,
    ruleInfos: PropTypes.object,
    trafficGroups: PropTypes.object,
    trafficInfo: PropTypes.object
};

const mapStateToProps = (state) => {
    return {
        ruleIds: state.rules.ruleIds,
        ruleInfos: state.rules.ruleInfos,
        trafficGroups: state.traffics.trafficGroups,
        trafficInfo: state.traffics.trafficInfos[state.app.selectedTrafficIndex]
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        selectTrafficAction: bindActionCreators(selectTrafficActionCreator, dispatch),
        updateRuleDataAction: bindActionCreators(updateRuleDataActionCreator, dispatch)
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(TrafficInfo);
