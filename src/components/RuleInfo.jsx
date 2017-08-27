import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import FilterValue from './partials/FilterValue.jsx';
import updateRuleFilterActionCreator from '../actions/update-rule-filter-action-creator';

class RuleInfo extends React.Component {
    constructor(props) {
        super(props);

        this.closePane = this.closePane.bind(this);
        this.onFilterValueChange = this.onFilterValueChange.bind(this);
    }

    closePane() {
        const {onClose} = this.props;

        onClose();
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

    renderFilter(filter, filterIndex) {
        return (
            <li className='filter-item' key={filterIndex}>
                <h5 className='filter-name'>{filter.name}</h5>
                {this.renderFilterInput(filter, filterIndex)}
            </li>
        );
    }

    renderFilterInput(filter, filterIndex) {
        const {name, value, valueMatch} = filter;
        const {trafficFilters} = this.props;

        if (!trafficFilters[name]) {
            return <input type='text' value={value} className='filter-value'/>;
        } else if (!valueMatch) {
            return (
                <FilterValue
                    candidates={trafficFilters[name]}
                    value={value}
                    onChange={this.onFilterValueChange}
                    onChangeParams={{changeTarget: 'value', filterIndex}}/>
            );
        } else {
            return (
                <div>
                    <FilterValue candidates={trafficFilters[name]} value={value}/>
                    <input type='text' value={valueMatch} className='filter-value-match'/>;
                </div>
            );
        }
    }

    render() {
        const {ruleInfo} = this.props;

        return (
            <div className='rule-info info-pane-content'>
                <h3 className='rule-name'>{ruleInfo.name}</h3>
                <div className='filters'>
                    <h4 className='filters-header'>Filters</h4>
                    <ul className='filters-list'>
                        {ruleInfo.filters.map((filter, filterIndex) => {
                            return this.renderFilter(filter, filterIndex);
                        })}
                    </ul>
                </div>
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
        ruleInfo: state.rules.ruleInfos[state.rules.selectedRuleId]
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        updateRuleFilterAction: bindActionCreators(updateRuleFilterActionCreator, dispatch),
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(RuleInfo);
