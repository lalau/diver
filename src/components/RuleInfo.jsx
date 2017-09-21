import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import FilterValue from './partials/FilterValue.jsx';
import addRuleFilterActionCreator from '../actions/add-rule-filter-action-creator';
import addRuleLabelActionCreator from '../actions/add-rule-label-action-creator';
import removeRuleActionCreator from '../actions/remove-rule-action-creator';
import removeRuleFilterActionCreator from '../actions/remove-rule-filter-action-creator';
import removeRuleLabelActionCreator from '../actions/remove-rule-label-action-creator';
import selectRuleActionCreator from '../actions/select-rule-action-creator';
import updateRuleActionCreator from '../actions/update-rule-action-creator';
import updateRuleDataActionCreator from '../actions/update-rule-data-action-creator';
import updateRuleFilterActionCreator from '../actions/update-rule-filter-action-creator';
import updateRuleLabelActionCreator from '../actions/update-rule-label-action-creator';
import SimpleButton from './partials/SimpleButton.jsx';
import SimpleInput from './partials/SimpleInput.jsx';
import {getRuleDataIndex} from '../lib/util';
import set from 'lodash/set';
import update from 'immutability-helper';

class RuleInfo extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            editingRuleName: false
        };
        this.addFilter = this.addFilter.bind(this);
        this.addLabel = this.addLabel.bind(this);
        this.addLabelAttrList = this.addLabelAttrList.bind(this);
        this.deselectRule = this.deselectRule.bind(this);
        this.onFilterValueChange = this.onFilterValueChange.bind(this);
        this.removeFilter = this.removeFilter.bind(this);
        this.removeLabel = this.removeLabel.bind(this);
        this.removeLabelAttrList = this.removeLabelAttrList.bind(this);
        this.removeRule = this.removeRule.bind(this);
        this.toggleEditRuleName = this.toggleEditRuleName.bind(this);
        this.toggleQueryData = this.toggleQueryData.bind(this);
        this.updateRuleName = this.updateRuleName.bind(this);
        this.updateLabelAttr = this.updateLabelAttr.bind(this);
        this.updateLabelAttrList = this.updateLabelAttrList.bind(this);
        this.updateQueryDesc = this.updateQueryDesc.bind(this);
    }

    componentDidUpdate(prevProps, prevState) {
        if (!prevState.editingRuleName && this.state.editingRuleName && this.ruleNameInput) {
            this.ruleNameInput.focus();
        }
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
    }

    removeFilter({filterIndex}) {
        const {ruleInfo, removeRuleFilterAction} = this.props;

        removeRuleFilterAction({
            ruleId: ruleInfo.id,
            filterIndex
        });
    }

    addFilter() {
        const {ruleInfo, addRuleFilterAction} = this.props;

        addRuleFilterAction({
            ruleId: ruleInfo.id,
            filterName: this.addFilterSelect.value
        });

        this.addFilterSelect.value = '';
    }

    toggleQueryData(target, params) {
        const {ruleInfo, updateRuleDataAction} = this.props;
        const updateType = target.checked ? 'add' : 'remove';

        updateRuleDataAction({
            ruleId: ruleInfo.id,
            updateType,
            type: 'query',
            name: params.name
        });
    }

    updateQueryDesc(target, params) {
        const {ruleInfo, updateRuleDataAction} = this.props;

        updateRuleDataAction({
            ruleId: ruleInfo.id,
            updateType: 'update',
            type: 'query',
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

    addLabelAttrList({labelIndex, attr, targetKey}) {
        const {ruleInfo, updateRuleLabelAction} = this.props;
        const selectTarget = this[targetKey][ruleInfo.id][labelIndex];
        const list = update(ruleInfo.labels[labelIndex][attr], {
            $push: [{
                type: 'query',
                name: selectTarget.value,
                value: ''
            }]
        });

        updateRuleLabelAction({
            ruleId: ruleInfo.id,
            labelIndex,
            label: {
                [attr]: list
            }
        });

        selectTarget.value = '';
    }

    removeLabelAttrList({labelIndex, attr, listIndex}) {
        const {ruleInfo, updateRuleLabelAction} = this.props;
        const list = update(ruleInfo.labels[labelIndex][attr], {
            $splice: [[listIndex, 1]]
        });

        updateRuleLabelAction({
            ruleId: ruleInfo.id,
            labelIndex,
            label: {
                [attr]: list
            }
        });
    }

    updateLabelAttrList(target, {labelIndex, attr, path, listIndex}) {
        const {ruleInfo, updateRuleLabelAction} = this.props;
        const listUpdate = {};

        path.forEach((part, partIndex) => {
            if (partIndex === path.length - 1) {
                listUpdate[part] = {
                    $set: target.value
                };
            } else {
                listUpdate[part] = {};
            }
        });

        const list = update(ruleInfo.labels[labelIndex][attr], {
            [listIndex]: listUpdate
        });

        updateRuleLabelAction({
            ruleId: ruleInfo.id,
            labelIndex,
            label: {
                [attr]: list
            }
        });
    }

    renderRuleName() {
        const {ruleInfo} = this.props;

        return (
            <div className='rule-info-header'>
                <h3 className='rule-name'>{ruleInfo.name}</h3>
                <SimpleButton className='rule-name-button diver-button' handleClick={this.toggleEditRuleName} params={{editing: true}}>&#10000; Edit</SimpleButton>
            </div>
        );
    }

    renderEditRuleName() {
        const {ruleInfo} = this.props;

        return (
            <div className='rule-info-header'>
                <input className='rule-name-input' defaultValue={ruleInfo.name} onBlur={this.updateRuleName} ref={(input) => {this.ruleNameInput = input;}}/>
            </div>
        );
    }

    renderFilters() {
        const {ruleInfo, trafficFilters} = this.props;

        return (
            <div className='filters section'>
                <h4 className='section-header'>Filters</h4>
                <ul className='section-list'>
                    {ruleInfo.filters.map((filter, filterIndex) => {
                        return (
                            <li className='section-flex-row' key={filterIndex}>
                                <SimpleButton className='section-button diver-button' handleClick={this.removeFilter} params={{filterIndex}}>-</SimpleButton>
                                <h5 className='filter-name'>{filter.name}</h5>
                                <FilterValue candidates={trafficFilters[filter.name]} value={filter.value} onChange={this.onFilterValueChange} onChangeParams={{changeTarget: 'value', filterIndex}}/>
                            </li>
                        );
                    })}
                </ul>
                <div className='section-flex-row'>
                    <SimpleButton className='section-button diver-button' handleClick={this.addFilter}>+</SimpleButton>
                    <select className='section-select buttoned' ref={(select) => {this.addFilterSelect = select;}}>
                        <option value=''>&#8213; Filter &#8213;</option>
                        <option value='domain'>domain</option>
                        <option value='has-response-header'>has-response-header</option>
                        <option value='method'>method</option>
                        <option value='mime-type'>mime-type</option>
                        <option value='status-code'>status-code</option>
                        <option value='larger-than'>larger-than</option>
                    </select>
                </div>
            </div>
        );
    }

    renderLabels() {
        const {ruleInfo, trafficGroup} = this.props;

        if (trafficGroup.query.length === 0) {
            return null;
        }

        return (
            <div className='labels section'>
                <h4 className='section-header'>Labels</h4>
                <ul className='section-list'>
                    {ruleInfo.labels.map((label, labelIndex) => {
                        return (
                            <li className='label-item' key={labelIndex}>
                                <div className='section-flex-row label-row'>
                                    <SimpleButton className='section-button diver-button' handleClick={this.removeLabel} params={{labelIndex}}>-</SimpleButton>
                                    <div className='section-label label-label'>Label</div>
                                    <SimpleInput className='section-input' type='text' defaultValue={label.name || ''} handleInput={this.updateLabelAttr} params={{labelIndex, attr: 'name'}} placeholder='Label'/>
                                </div>
                                {label.matches.map(({name, value}, matchIndex) => {
                                    return (
                                        <div className='section-flex-row' key={matchIndex}>
                                            <SimpleButton className='section-button diver-button' handleClick={this.removeLabelAttrList} params={{labelIndex, attr: 'matches', listIndex: matchIndex}}>-</SimpleButton>
                                            <div className='section-label'>{name}</div>
                                            <SimpleInput className='section-input' type='text' defaultValue={value || ''} handleInput={this.updateLabelAttrList} params={{labelIndex, attr: 'matches', path: ['value'], listIndex: matchIndex}} placeholder='value'/>
                                        </div>
                                    );
                                })}
                                <div className='section-flex-row'>
                                    <SimpleButton className='section-button diver-button' handleClick={this.addLabelAttrList} params={{labelIndex, attr: 'matches', targetKey: 'addLabelMatchSelects'}}>+</SimpleButton>
                                    <select className='section-select buttoned' ref={(select) => {set(this, ['addLabelMatchSelects', ruleInfo.id, labelIndex], select);}}>
                                        <option value=''>&#8213; Query &#8213;</option>
                                        {trafficGroup.query.map((name, queryIndex) => {
                                            return <option value={name} key={queryIndex}>{name}</option>;
                                        })}
                                    </select>
                                </div>
                            </li>
                        );
                    })}
                </ul>
                <div className='section-flex-row'>
                    <SimpleButton className='section-button diver-button' handleClick={this.addLabel}>+</SimpleButton>
                    <input className='section-input' placeholder='Label' ref={(input) => {this.addLabelInput = input;}}/>
                </div>
            </div>
        );
    }

    renderQueryData() {
        const {ruleInfo, trafficGroup} = this.props;
        const queryData = ruleInfo.data.query;

        if (trafficGroup.query.length === 0) {
            return null;
        }

        return (
            <div className='query section'>
                <h4 className='section-header'>Data - Query</h4>
                <ul className='section-list'>
                    {trafficGroup.query.map((name) => {
                        const ruleQuery = queryData[name] || {};
                        const querySelected = getRuleDataIndex(ruleInfo, 'query', name) >= 0;

                        return (
                            <li className='section-flex-row' key={name}>
                                <SimpleInput className='diver-check' type='checkbox' defaultChecked={querySelected} handleChange={this.toggleQueryData} params={{name}}/>
                                <h5 className='section-label'>{name}</h5>
                                {querySelected ? <SimpleInput className='section-input' type='text' defaultValue={ruleQuery.desc || ''} handleInput={this.updateQueryDesc} params={{name}} placeholder='Alt name'/> : null}
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }

    render() {
        const {editingRuleName} = this.state;

        return (
            <div>
                <div className='info-pane-menu'>
                    <button className='info-pane-menu-button diver-button' style={{display: 'none'}}>&#11014; Export</button>
                    <button className='info-pane-menu-button diver-button' onClick={this.removeRule}>&#10005; Delete</button>
                    <button className='info-pane-menu-button diver-button' onClick={this.deselectRule}>&#10132; Close</button>
                </div>
                <div className='rule-info info-pane-content'>
                    {editingRuleName ? this.renderEditRuleName() : this.renderRuleName()}
                    {this.renderFilters()}
                    {this.renderLabels()}
                    {this.renderQueryData()}
                </div>
            </div>
        );
    }
}

RuleInfo.propTypes = {
    ruleInfo: PropTypes.object,
    selectedRuleId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    trafficFilters: PropTypes.object,
    trafficGroup: PropTypes.object
};

const mapStateToProps = (state) => {
    return {
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
        removeRuleAction: bindActionCreators(removeRuleActionCreator, dispatch),
        removeRuleFilterAction: bindActionCreators(removeRuleFilterActionCreator, dispatch),
        removeRuleLabelAction: bindActionCreators(removeRuleLabelActionCreator, dispatch),
        selectRuleAction: bindActionCreators(selectRuleActionCreator, dispatch),
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
