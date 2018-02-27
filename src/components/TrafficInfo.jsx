import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import classnames from 'classnames';
import SimpleInput from './partials/SimpleInput.jsx';
import selectTrafficActionCreator from '../actions/select-traffic-action-creator';
import updateAppStateActionCreator from '../actions/update-app-state-action-creator';
import updateRuleDataActionCreator from '../actions/update-rule-data-action-creator';
import {formatDataValue, getRuleDataIndex, getTrafficLabel, mergeProcessorsState} from '../lib/util';

class TrafficInfo extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedRuleId: this.getFirstMatchingRuleId(),
            showUrlExpander: false,
            urlExpanded: false
        };
        this.collapseUrl = this.toggleUrlExpand.bind(this, false);
        this.deselectTraffic = this.deselectTraffic.bind(this);
        this.expandUrl = this.toggleUrlExpand.bind(this, true);
        this.exportTraffic = this.exportTraffic.bind(this);
        this.inspectTraffic = this.inspectTraffic.bind(this);
        this.selectRuleId = this.selectRuleId.bind(this);
        this.toggleData = this.toggleData.bind(this);
    }

    componentDidMount() {
        const {clientHeight, scrollHeight} = this.urlValue;

        if (scrollHeight > clientHeight) {
            this.setState({
                showUrlExpander: true
            });
        }
    }

    componentWillReceiveProps(nextProps) {
        if (!this.state.selectedRuleId && this.props.ruleIds !== nextProps.ruleIds) {
            const selectedRuleId = this.getFirstMatchingRuleId(nextProps);
            if (selectedRuleId) {
                this.setState({selectedRuleId});
            }
        }
    }

    deselectTraffic() {
        this.props.selectTrafficAction(null);
    }

    exportTraffic() {
        const {trafficInfo, utility} = this.props;

        utility.exportContent({
            name: trafficInfo.hostname + '-' + trafficInfo.index,
            content: trafficInfo.traffic
        });
    }

    inspectTraffic() {
        const {trafficInfo, updateAppStateAction} = this.props;

        updateAppStateAction({
            scope: 'page',
            key: 'inspectingTraffic',
            value: {
                traffic: trafficInfo.traffic
            }
        });

        updateAppStateAction({
            scope: 'session',
            key: 'appView',
            value: 'processor'
        });
    }

    toggleUrlExpand(urlExpanded) {
        this.setState({urlExpanded});
    }

    toggleData(target, params) {
        const {updateRuleDataAction} = this.props;
        const {name, namespace, ruleId} = params;
        const updateType = target.checked ? 'add' : 'remove';

        updateRuleDataAction({
            ruleId,
            updateType,
            namespace,
            name
        });
    }

    selectRuleId() {
        this.setState({
            selectedRuleId: this.ruleIdInput.value
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
        const {showUrlExpander, urlExpanded} = this.state;
        const {method, url} = trafficInfo.traffic.request;
        const showGo = method === 'GET' && url.indexOf('data:') !== 0;

        return (
            <div className='pane-section'>
                <h4 className='section-header'>URL ({method})
                    {showGo ? <a href={url} target='_blank' className='info-header-button diver-button'>&#10150; Go</a> : null}
                    {
                        showUrlExpander ? (
                            urlExpanded ?
                                <button className='info-header-button diver-button' onClick={this.collapseUrl}>&#9650; Collapse</button> :
                                <button className='info-header-button diver-button' onClick={this.expandUrl}>&#9660; Expand</button>
                        ) : null
                    }
                </h4>
                <div className={classnames('info-value url-value', {collapsed: !urlExpanded})} ref={(node) => {this.urlValue = node;}}>{url}</div>
            </div>
        );
    }

    renderLabels() {
        const {ruleIds, ruleInfos, trafficInfo} = this.props;

        return (
            <div className='pane-section'>
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

    renderRules() {
        const {ruleIds, ruleInfos} = this.props;
        const {selectedRuleId} = this.state;

        if (!selectedRuleId) {
            return null;
        }

        return (
            <div className='pane-section'>
                <h4 className='section-header'>Rule</h4>
                <select className='section-select rule-select' defaultValue={selectedRuleId} onChange={this.selectRuleId} ref={(input) => {this.ruleIdInput = input;}}>
                    {ruleIds.map((ruleId, ruleIndex) => {
                        const ruleInfo = ruleInfos[ruleId];

                        if (this.isMatchingRule(ruleId)) {
                            return <option value={ruleId} key={ruleIndex}>{ruleInfo.name}</option>;
                        } else {
                            return null;
                        }
                    })}
                </select>
            </div>
        );
    }

    renderData() {
        const {processors, ruleInfos, trafficInfo} = this.props;
        const {selectedRuleId} = this.state;
        const ruleInfo = ruleInfos[selectedRuleId];

        if (!ruleInfo) {
            return null;
        }

        return ruleInfos[selectedRuleId].namespaces.map((namespace) => {
            const processedData = trafficInfo.processed[namespace];
            const sortedNames = processedData && Object.keys(processedData).sort();

            if (!sortedNames || sortedNames.length === 0) {
                return null;
            }

            return (
                <div className='pane-section' key={selectedRuleId + '-' + namespace}>
                    <h4 className='section-header'>Data - {processors[namespace].name}</h4>
                    <ul className='section-list'>
                        {sortedNames.map((name) => {
                            const selected = getRuleDataIndex(ruleInfo, namespace, name) >= 0;

                            return (
                                <li className='section-flex-row' key={name}>
                                    <SimpleInput className='diver-check' type='checkbox' defaultChecked={selected} handleChange={this.toggleData} params={{name, namespace, ruleId: ruleInfo.id}}/>
                                    <h5 className='section-label data-name-label'>{name}</h5>
                                    <div className='section-label data-value-label'>{formatDataValue(processedData[name])}</div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            );
        });
    }

    render() {
        const {trafficInfo} = this.props;

        if (!trafficInfo) {
            return null;
        }

        return (
            <div className='traffic-info'>
                <div className='pane-section pane-top-menu pane-top-menu-right'>
                    <button className='pane-top-menu-button diver-button' onClick={this.exportTraffic}>&#8682; Export</button>
                    <button className='pane-top-menu-button diver-button' onClick={this.inspectTraffic}>&#9678; Inspect</button>
                    <button className='pane-top-menu-button diver-button' onClick={this.deselectTraffic}>&#10132; Close</button>
                </div>
                {this.renderUrl()}
                {this.renderLabels()}
                {this.renderRules()}
                {this.renderData()}
            </div>
        );
    }
}

TrafficInfo.propTypes = {
    processors: PropTypes.object,
    ruleIds: PropTypes.array,
    ruleInfos: PropTypes.object,
    trafficGroups: PropTypes.object,
    trafficInfo: PropTypes.object
};

const mapStateToProps = (state) => {
    return {
        processors: mergeProcessorsState(state.app.state.app.processors, state.app.state.session.processors),
        ruleIds: state.rules.ruleIds,
        ruleInfos: state.rules.ruleInfos,
        trafficGroups: state.traffics.trafficGroups,
        trafficInfo: state.traffics.trafficInfos[state.app.selectedTrafficIndex],
        utility: state.app.utility
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        selectTrafficAction: bindActionCreators(selectTrafficActionCreator, dispatch),
        updateAppStateAction: bindActionCreators(updateAppStateActionCreator, dispatch),
        updateRuleDataAction: bindActionCreators(updateRuleDataActionCreator, dispatch)
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(TrafficInfo);
