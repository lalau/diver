import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import FilterValue from './partials/FilterValue.jsx';
import addRuleFilterActionCreator from '../actions/add-rule-filter-action-creator';
import addRuleLabelActionCreator from '../actions/add-rule-label-action-creator';
import addRuleProcessorActionCreator from '../actions/add-rule-processor-action-creator';
import removeRuleActionCreator from '../actions/remove-rule-action-creator';
import removeRuleFilterActionCreator from '../actions/remove-rule-filter-action-creator';
import removeRuleLabelActionCreator from '../actions/remove-rule-label-action-creator';
import removeRuleProcessorActionCreator from '../actions/remove-rule-processor-action-creator';
import selectRuleActionCreator from '../actions/select-rule-action-creator';
import updateAppStateActionCreator from '../actions/update-app-state-action-creator';
import updateRuleActionCreator from '../actions/update-rule-action-creator';
import updateRuleDataActionCreator from '../actions/update-rule-data-action-creator';
import updateRuleFilterActionCreator from '../actions/update-rule-filter-action-creator';
import updateRuleLabelActionCreator from '../actions/update-rule-label-action-creator';
import SimpleButton from './partials/SimpleButton.jsx';
import SimpleInput from './partials/SimpleInput.jsx';
import SimpleSelect from './partials/SimpleSelect.jsx';
import {getRuleDataIndex} from '../lib/util';
import set from 'lodash/set';
import update from 'immutability-helper';
import uuidv1 from 'uuid/v1';

class RuleInfo extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            editingRuleName: false,
            labelNamespace: {}
        };
        this.addFilter = this.addFilter.bind(this);
        this.addLabel = this.addLabel.bind(this);
        this.addLabelDataList = this.addLabelDataList.bind(this);
        this.addProcessor = this.addProcessor.bind(this);
        this.deselectRule = this.deselectRule.bind(this);
        this.onFilterValueChange = this.onFilterValueChange.bind(this);
        this.removeFilter = this.removeFilter.bind(this);
        this.removeLabel = this.removeLabel.bind(this);
        this.removeLabelDataList = this.removeLabelDataList.bind(this);
        this.removeProcessor = this.removeProcessor.bind(this);
        this.removeRule = this.removeRule.bind(this);
        this.selectNamespace = this.selectNamespace.bind(this);
        this.toggleEditRuleName = this.toggleEditRuleName.bind(this);
        this.toggleData = this.toggleData.bind(this);
        this.updateRuleName = this.updateRuleName.bind(this);
        this.updateLabelAttr = this.updateLabelAttr.bind(this);
        this.updateLabelDataList = this.updateLabelDataList.bind(this);
        this.updateDataDesc = this.updateDataDesc.bind(this);
    }

    componentDidUpdate(prevProps, prevState) {
        if (!prevState.editingRuleName && this.state.editingRuleName && this.ruleNameInput) {
            this.ruleNameInput.focus();
        }
    }

    addProcessor() {
        const {addRuleProcessorAction, ruleInfo} = this.props;
        const namespace = this.addProcessorSelect.value;

        if (!namespace) {
            return;
        }

        addRuleProcessorAction({
            ruleId: ruleInfo.id,
            namespace
        });
        this.showReloadMessage();
        this.addProcessorSelect.value = '';
    }

    removeProcessor({namespace}) {
        const {removeRuleProcessorAction, ruleInfo} = this.props;

        removeRuleProcessorAction({
            ruleId: ruleInfo.id,
            namespace
        });
        this.showReloadMessage();
    }

    showReloadMessage() {
        this.props.updateAppStateAction({
            scope: 'page',
            key: 'message',
            value: {
                type: 'warning',
                key: 'RELOAD'
            }
        });
    }

    deselectRule() {
        this.props.selectRuleAction(null);
    }

    removeRule() {
        const {removeRuleAction, selectedRuleId} = this.props;

        this.deselectRule();
        removeRuleAction(selectedRuleId);
    }

    toggleEditRuleName({editing}) {
        this.setState({
            editingRuleName: editing
        });
    }

    updateRuleName({target}) {
        const {ruleInfo, updateRuleAction} = this.props;

        updateRuleAction({
            ruleId: ruleInfo.id,
            key: 'name',
            value: target.value
        });
        this.toggleEditRuleName({
            editing: false
        });
    }

    onFilterValueChange(newValue, params) {
        const {ruleInfo, updateRuleFilterAction} = this.props;
        const {changeTarget, filterIndex} = params;

        updateRuleFilterAction({
            ruleId: ruleInfo.id,
            type: 'update',
            filterIndex: filterIndex,
            [changeTarget]: newValue
        });
        this.showReloadMessage();
    }

    removeFilter({filterIndex}) {
        const {ruleInfo, removeRuleFilterAction} = this.props;

        removeRuleFilterAction({
            ruleId: ruleInfo.id,
            filterIndex
        });
        this.showReloadMessage();
    }

    addFilter() {
        const {ruleInfo, addRuleFilterAction} = this.props;

        addRuleFilterAction({
            ruleId: ruleInfo.id,
            filterName: this.addFilterSelect.value
        });
        this.showReloadMessage();

        this.addFilterSelect.value = '';
    }

    toggleData(target, params) {
        const {ruleInfo, updateRuleDataAction} = this.props;
        const updateType = target.checked ? 'add' : 'remove';

        updateRuleDataAction({
            ruleId: ruleInfo.id,
            updateType,
            namespace: params.namespace,
            name: params.name
        });
    }

    updateDataDesc(target, params) {
        const {ruleInfo, updateRuleDataAction} = this.props;

        updateRuleDataAction({
            ruleId: ruleInfo.id,
            updateType: 'update',
            namespace: params.namespace,
            name: params.name,
            value: {
                desc: target.value
            }
        });
    }

    addLabel() {
        const {ruleInfo, addRuleLabelAction} = this.props;
        const name = this.addLabelInput.value;

        if (!name) {
            return;
        }

        addRuleLabelAction({
            ruleId: ruleInfo.id,
            label: {name}
        });

        this.addLabelInput.value = '';
    }

    removeLabel({labelIndex}) {
        const {ruleInfo, removeRuleLabelAction} = this.props;

        removeRuleLabelAction({
            ruleId: ruleInfo.id,
            labelIndex
        });
    }

    updateLabelAttr(target, {labelIndex, attr}) {
        const {ruleInfo, updateRuleLabelAction} = this.props;

        updateRuleLabelAction({
            ruleId: ruleInfo.id,
            labelIndex,
            label: {
                [attr]: target.value
            }
        });
    }

    addLabelDataList({labelIndex}) {
        const {ruleInfo, updateRuleLabelAction} = this.props;
        const labelId = ruleInfo.labels[labelIndex].id;
        const namespaceTarget = this.addLabelNamespaceSelects[labelId];
        const namespace = namespaceTarget.value;
        const dataNameTarget = this.addLabelDataNameSelects[labelId];
        const dataName = dataNameTarget.value;

        if (!namespace || !dataName) {
            return;
        }

        const list = update(ruleInfo.labels[labelIndex].matches, {
            $push: [{
                id: uuidv1(),
                namespace,
                name: dataName,
                value: ''
            }]
        });

        updateRuleLabelAction({
            ruleId: ruleInfo.id,
            labelIndex,
            label: {
                matches: list
            }
        });

        namespaceTarget.value = '';
        this.selectNamespace(namespaceTarget, {labelId});
    }

    removeLabelDataList({labelIndex, listIndex}) {
        const {ruleInfo, updateRuleLabelAction} = this.props;
        const matches = update(ruleInfo.labels[labelIndex].matches, {
            $splice: [[listIndex, 1]]
        });

        updateRuleLabelAction({
            ruleId: ruleInfo.id,
            labelIndex,
            label: {matches}
        });
    }

    updateLabelDataList(target, {labelIndex, listIndex}) {
        const {ruleInfo, updateRuleLabelAction} = this.props;
        const matches = update(ruleInfo.labels[labelIndex].matches, {
            [listIndex]: {
                value: {
                    $set: target.value
                }
            }
        });

        updateRuleLabelAction({
            ruleId: ruleInfo.id,
            labelIndex,
            label: {matches}
        });
    }

    selectNamespace(target, {labelId}) {
        this.setState({
            labelNamespace: update(this.state.labelNamespace, {
                [labelId]: {
                    $set: target.value
                }
            })
        });
    }

    renderRuleName() {
        const {ruleInfo} = this.props;

        return (
            <div className='pane-section rule-info-header'>
                <h3 className='rule-name'>{ruleInfo.name}</h3>
                <SimpleButton className='rule-name-button diver-button' handleClick={this.toggleEditRuleName} params={{editing: true}}>&#10000; Edit</SimpleButton>
            </div>
        );
    }

    renderEditRuleName() {
        const {ruleInfo} = this.props;

        return (
            <div className='pane-section rule-info-header'>
                <input className='rule-name-input' defaultValue={ruleInfo.name} onBlur={this.updateRuleName} ref={(input) => {this.ruleNameInput = input;}}/>
            </div>
        );
    }

    renderFilters() {
        const {ruleInfo, trafficFilters} = this.props;

        return (
            <div className='pane-section filters'>
                <h4 className='section-header'>Filters</h4>
                <ul className='section-list'>
                    {ruleInfo.filters.map((filter, filterIndex) => {
                        return (
                            <li className='section-flex-row' key={filter.id}>
                                <SimpleButton className='section-button diver-button' handleClick={this.removeFilter} params={{filterIndex}}>-</SimpleButton>
                                <h5 className='filter-name'>{filter.name}</h5>
                                <FilterValue candidates={trafficFilters[filter.name]} value={filter.value} onChange={this.onFilterValueChange} onChangeParams={{changeTarget: 'value', filterIndex}}/>
                            </li>
                        );
                    })}
                </ul>
                <div className='section-flex-row'>
                    <button className='section-button diver-button' onClick={this.addFilter}>+</button>
                    <select className='section-select buttoned' ref={(select) => {this.addFilterSelect = select;}}>
                        <option value=''>&#8213; Filter &#8213;</option>
                        <option value='domain'>domain</option>
                        <option value='has-response-header'>has-response-header</option>
                        <option value='method'>method</option>
                        <option value='mime-type'>mime-type</option>
                        <option value='path'>path</option>
                        <option value='status-code'>status-code</option>
                        <option value='larger-than'>larger-than</option>
                    </select>
                </div>
            </div>
        );
    }

    renderProcessors() {
        const {ruleInfo, processors} = this.props;

        return (
            <div className='pane-section processors'>
                <h4 className='section-header'>Processors</h4>
                <ul className='section-list'>
                    {ruleInfo.namespaces.map((namespace) => {
                        const processor = processors[namespace];
                        const processorName = processor && processor.name;

                        return (
                            <li className='section-flex-row' key={namespace}>
                                <SimpleButton className='section-button diver-button' handleClick={this.removeProcessor} params={{namespace}}>-</SimpleButton>
                                {processorName ? <h5 className='section-label'>{processorName}</h5> : <h5 className='section-label ns-label'>{namespace}</h5>}
                            </li>
                        );
                    })}
                </ul>
                <div className='section-flex-row'>
                    <button className='section-button diver-button' onClick={this.addProcessor}>+</button>
                    <select className='section-select buttoned' ref={(select) => {this.addProcessorSelect = select;}}>
                        <option value=''>&#8213; Processors &#8213;</option>
                        {Object.keys(processors).map((namespace) => {
                            const {name} = processors[namespace];

                            if (!name || ruleInfo.namespaces.indexOf(namespace) >= 0) {
                                return null;
                            }

                            return <option value={namespace} key={namespace}>{name}</option>;
                        })}
                    </select>
                </div>
            </div>
        );
    }

    renderLabels() {
        const {processors, ruleInfo, trafficGroup} = this.props;

        return (
            <div className='pane-section labels'>
                <h4 className='section-header'>Labels</h4>
                <ul className='section-list'>
                    {ruleInfo.labels.map((label, labelIndex) => {
                        const labelId = label.id;
                        const labelNamespace = this.state.labelNamespace[labelId] || '';
                        const dataKeys = trafficGroup.dataKeys[labelNamespace] || [];

                        return (
                            <li className='label-item' key={labelId}>
                                <div className='section-flex-row label-row'>
                                    <SimpleButton className='section-button diver-button' handleClick={this.removeLabel} params={{labelIndex}}>-</SimpleButton>
                                    <div className='section-label label-label'>Label</div>
                                    <SimpleInput className='section-input' type='text' defaultValue={label.name || ''} handleInput={this.updateLabelAttr} params={{labelIndex, attr: 'name'}} placeholder='Label'/>
                                </div>
                                {label.matches.map(({id, name, value, namespace}, listIndex) => {
                                    return (
                                        <div className='section-flex-row' key={id}>
                                            <SimpleButton className='section-button diver-button' handleClick={this.removeLabelDataList} params={{labelIndex, listIndex}}>-</SimpleButton>
                                            <div className='section-label'>{processors[namespace].name} - {name}</div>
                                            <SimpleInput className='section-input' type='text' defaultValue={value || ''} handleInput={this.updateLabelDataList} params={{labelIndex, listIndex}} placeholder='value'/>
                                        </div>
                                    );
                                })}
                                <div className='section-flex-row'>
                                    <SimpleButton className='section-button diver-button' handleClick={this.addLabelDataList} params={{labelIndex}}>+</SimpleButton>
                                    <SimpleSelect className='section-select namespace-select' selectRef={(select) => {set(this, ['addLabelNamespaceSelects', labelId], select);}} handleChange={this.selectNamespace} params={{labelId}}>
                                        <option value=''>&#8213; Data &#8213;</option>
                                        {ruleInfo.namespaces.map((namespace) => {
                                            const dataKeys = trafficGroup.dataKeys[namespace];
                                            if (dataKeys && dataKeys.length > 0) {
                                                return <option value={namespace} key={namespace}>{processors[namespace].name}</option>;
                                            } else {
                                                return null;
                                            }
                                        })}
                                    </SimpleSelect>
                                    {
                                        dataKeys.length > 0 ?
                                            <select className='section-select data-name-select' ref={(select) => {set(this, ['addLabelDataNameSelects', labelId], select);}} key={labelNamespace}>
                                                <option value=''>&#8213; Name &#8213;</option>
                                                {dataKeys.map((name) => {
                                                    return <option value={name} key={name}>{name}</option>;
                                                })}
                                            </select> : null
                                    }
                                </div>
                            </li>
                        );
                    })}
                </ul>
                <div className='section-flex-row'>
                    <button className='section-button diver-button' onClick={this.addLabel}>+</button>
                    <input className='section-input' placeholder='Label' ref={(input) => {this.addLabelInput = input;}}/>
                </div>
            </div>
        );
    }

    renderData(namespace) {
        const {processors, ruleInfo, trafficGroup} = this.props;
        const data = ruleInfo.data[namespace];
        const trafficDataKeys = trafficGroup.dataKeys[namespace] || [];
        const ruleDataKeys = ruleInfo.dataOrder.filter(({namespace: dataNamespace}) => dataNamespace === namespace).map(({name}) => name);

        if (trafficDataKeys.length === 0 && ruleDataKeys.length === 0) {
            return null;
        }

        // include data keys in rule but not in the traffic, only sort them when there are keys not present in the traffic keys since traffic keys are already sorted
        const dataKeys = ruleDataKeys.length > 0 ? [...new window.Set(trafficDataKeys.concat(ruleDataKeys))] : trafficDataKeys;

        if (dataKeys.length > trafficDataKeys.length) {
            dataKeys.sort();
        }

        return (
            <div className='pane-section data' key={namespace}>
                <h4 className='section-header'>Data - {processors[namespace].name}</h4>
                <ul className='section-list'>
                    {dataKeys.map((name) => {
                        const dataMeta = data[name] || {};
                        const dataSelected = getRuleDataIndex(ruleInfo, namespace, name) >= 0;

                        return (
                            <li className='section-flex-row' key={name}>
                                <SimpleInput className='diver-check' type='checkbox' defaultChecked={dataSelected} handleChange={this.toggleData} params={{name, namespace}}/>
                                <h5 className='section-label'>{name}</h5>
                                {dataSelected ? <SimpleInput className='section-input' type='text' defaultValue={dataMeta.desc || ''} handleInput={this.updateDataDesc} params={{name, namespace}} placeholder='Alt name'/> : null}
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }

    render() {
        const {editingRuleName} = this.state;
        const {ruleInfo} = this.props;

        return (
            <div className='rule-info'>
                <div className='pane-section pane-top-menu pane-top-menu-right'>
                    <button className='pane-top-menu-button diver-button' style={{display: 'none'}}>&#11014; Export</button>
                    <button className='pane-top-menu-button diver-button' onClick={this.removeRule}>&#10005; Delete</button>
                    <button className='pane-top-menu-button diver-button' onClick={this.deselectRule}>&#10132; Close</button>
                </div>
                {editingRuleName ? this.renderEditRuleName() : this.renderRuleName()}
                {this.renderFilters()}
                {this.renderProcessors()}
                {this.renderLabels()}
                {ruleInfo.namespaces.map((namespace) => {
                    return this.renderData(namespace);
                })}
            </div>
        );
    }
}

RuleInfo.propTypes = {
    processors: PropTypes.object,
    ruleInfo: PropTypes.object,
    selectedRuleId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    trafficFilters: PropTypes.object,
    trafficGroup: PropTypes.object
};

const mapStateToProps = (state) => {
    return {
        processors: state.app.state.app.processors,
        ruleInfo: state.rules.ruleInfos[state.app.selectedRuleId],
        selectedRuleId: state.app.selectedRuleId,
        trafficFilters: state.traffics.filters,
        trafficGroup: state.traffics.trafficGroups[state.app.selectedRuleId]
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        addRuleFilterAction: bindActionCreators(addRuleFilterActionCreator, dispatch),
        addRuleLabelAction: bindActionCreators(addRuleLabelActionCreator, dispatch),
        addRuleProcessorAction: bindActionCreators(addRuleProcessorActionCreator, dispatch),
        removeRuleAction: bindActionCreators(removeRuleActionCreator, dispatch),
        removeRuleFilterAction: bindActionCreators(removeRuleFilterActionCreator, dispatch),
        removeRuleLabelAction: bindActionCreators(removeRuleLabelActionCreator, dispatch),
        removeRuleProcessorAction: bindActionCreators(removeRuleProcessorActionCreator, dispatch),
        selectRuleAction: bindActionCreators(selectRuleActionCreator, dispatch),
        updateAppStateAction: bindActionCreators(updateAppStateActionCreator, dispatch),
        updateRuleAction: bindActionCreators(updateRuleActionCreator, dispatch),
        updateRuleDataAction: bindActionCreators(updateRuleDataActionCreator, dispatch),
        updateRuleFilterAction: bindActionCreators(updateRuleFilterActionCreator, dispatch),
        updateRuleLabelAction: bindActionCreators(updateRuleLabelActionCreator, dispatch)
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(RuleInfo);
