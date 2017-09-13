import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import FilterValue from './partials/FilterValue.jsx';
import addRuleFilterActionCreator from '../actions/add-rule-filter-action-creator';
import removeRuleFilterActionCreator from '../actions/remove-rule-filter-action-creator';
import updateRuleActionCreator from '../actions/update-rule-action-creator';
import updateRuleDataActionCreator from '../actions/update-rule-data-action-creator';
import updateRuleFilterActionCreator from '../actions/update-rule-filter-action-creator';
import SimpleButton from './partials/SimpleButton.jsx';
import SimpleInput from './partials/SimpleInput.jsx';
import {getRuleDataIndex} from '../lib/util';

class RuleInfo extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            editingRuleName: false
        };
        this.addFilter = this.addFilter.bind(this);
        this.closePane = this.closePane.bind(this);
        this.onFilterValueChange = this.onFilterValueChange.bind(this);
        this.removeFilter = this.removeFilter.bind(this);
        this.toggleEditRuleName = this.toggleEditRuleName.bind(this);
        this.toggleQueryData = this.toggleQueryData.bind(this);
        this.updateRuleName = this.updateRuleName.bind(this);
        this.updateQueryDesc = this.updateQueryDesc.bind(this);
    }

    componentDidUpdate(prevProps, prevState) {
        if (!prevState.editingRuleName && this.state.editingRuleName && this.ruleNameInput) {
            this.ruleNameInput.focus();
        }
    }

    closePane() {
        const {onClose} = this.props;

        this.toggleEditRuleName({
            editing: false
        });
        onClose();
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

    renderRuleName() {
        const {ruleInfo} = this.props;

        return (
            <div className='rule-info-header'>
                <h3 className='rule-name'>{ruleInfo.name}</h3>
                <SimpleButton className='rule-name-button' handleClick={this.toggleEditRuleName} params={{editing: true}}>...</SimpleButton>
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
                            <li className='section-list-item' key={filterIndex}>
                                <SimpleButton className='filter-button' handleClick={this.removeFilter} params={{filterIndex}}>-</SimpleButton>
                                <h5 className='filter-name'>{filter.name}</h5>
                                <FilterValue candidates={trafficFilters[filter.name]} value={filter.value} onChange={this.onFilterValueChange} onChangeParams={{changeTarget: 'value', filterIndex}}/>
                            </li>
                        );
                    })}
                </ul>
                <div className='section-list-item'>
                    <SimpleButton className='filter-button' handleClick={this.addFilter}>+</SimpleButton>
                    <select className='select-filter' ref={(select) => {this.addFilterSelect = select;}}>
                        <option value=''></option>
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
                            <li className='section-list-item' key={name}>
                                <SimpleInput className='select-query' type='checkbox' defaultChecked={querySelected} handleChange={this.toggleQueryData} params={{name}}/>
                                <h5 className='query-name'>{name}</h5>
                                {querySelected ? <SimpleInput className='query-input' type='text' defaultValue={ruleQuery.desc || ''} handleInput={this.updateQueryDesc} params={{name}}/> : null}
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
            <div className='rule-info info-pane-content'>
                {editingRuleName ? this.renderEditRuleName() : this.renderRuleName()}
                {this.renderFilters()}
                {this.renderQueryData()}
            </div>
        );
    }
}

RuleInfo.propTypes = {
    ruleInfo: PropTypes.object,
    selectedRuleId: PropTypes.number,
    trafficFilters: PropTypes.object,

    onClose: PropTypes.func
};

const mapStateToProps = (state) => {
    return {
        trafficFilters: state.traffics.filters,
        ruleInfo: state.rules.ruleInfos[state.app.selectedRuleId],
        trafficGroup: state.traffics.trafficGroups[state.app.selectedRuleId]
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        addRuleFilterAction: bindActionCreators(addRuleFilterActionCreator, dispatch),
        removeRuleFilterAction: bindActionCreators(removeRuleFilterActionCreator, dispatch),
        updateRuleAction: bindActionCreators(updateRuleActionCreator, dispatch),
        updateRuleDataAction: bindActionCreators(updateRuleDataActionCreator, dispatch),
        updateRuleFilterAction: bindActionCreators(updateRuleFilterActionCreator, dispatch),
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(RuleInfo);
