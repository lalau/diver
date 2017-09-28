import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import SimpleButton from './partials/SimpleButton.jsx';
import {bindActionCreators} from 'redux';
import importRuleInfoActionCreator from '../actions/import-rule-info-action-creator';

class Rules extends React.Component {
    constructor(props) {
        super(props);

        this.exportRule = this.exportRule.bind(this);
        this.importRule = this.importRule.bind(this);
    }

    exportRule({ruleId}) {
        chrome.runtime.sendMessage({
            type: 'EXPORT_RULE',
            payload: {
                ruleInfo: this.props.ruleInfos[ruleId]
            }
        });
    }

    importRule({target}) {
        const {importRuleInfoAction} = this.props;
        const file = target.files[0];
        target.value = '';

        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = ({target}) => {
            try {
                importRuleInfoAction({
                    ruleInfo: JSON.parse(target.result)
                });
            } catch (e) {
                // ignore error reading file
            }
        };
        reader.readAsText(file);
    }

    renderImport() {
        return (
            <div>
                <label htmlFor='import-rule' className='rule-button'>Import</label>
                <input type='file' id='import-rule' accept='.json' onChange={this.importRule}/>
            </div>
        );
    }

    renderRule(ruleInfo) {
        const ruleId = ruleInfo.id;

        return (
            <div key={ruleId}>
                <div className='rule-header'>
                    <h2 className='rule-title'>{ruleInfo.name}</h2>
                    <SimpleButton className='rule-button' handleClick={this.exportRule} params={{ruleId}}>&#8682; Export</SimpleButton>
                </div>
                <pre className='rule-config'>{JSON.stringify(ruleInfo, null, 4)}</pre>
            </div>
        );
    }

    render() {
        const {ruleIds, ruleInfos} = this.props;

        return (
            <div>
                {this.renderImport()}
                {ruleIds.map((ruleId) => {
                    return this.renderRule(ruleInfos[ruleId]);
                })}
            </div>
        );
    }
}

Rules.propTypes = {
    ruleIds: PropTypes.array,
    ruleInfos: PropTypes.object
};

const mapStateToProps = (state) => {
    return {
        ruleIds: state.rules.ruleIds,
        ruleInfos: state.rules.ruleInfos
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        importRuleInfoAction: bindActionCreators(importRuleInfoActionCreator, dispatch),
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Rules);
