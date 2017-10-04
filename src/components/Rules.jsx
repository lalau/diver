import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import SimpleButton from './partials/SimpleButton.jsx';
import {bindActionCreators} from 'redux';
import importRuleInfoActionCreator from '../actions/import-rule-info-action-creator';

class Rules extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            importErrors: null
        };
        this.dismissImportError = this.dismissImportError.bind(this);
        this.exportRule = this.exportRule.bind(this);
        this.importRule = this.importRule.bind(this);
    }

    dismissImportError() {
        this.setState({
            importErrors: null
        });
    }

    exportRule({ruleId}) {
        const ruleInfo = this.props.ruleInfos[ruleId];

        chrome.runtime.sendMessage({
            type: 'EXPORT_CONTENT',
            payload: {
                content: ruleInfo,
                name: ruleInfo.id
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
                const ruleInfo = JSON.parse(target.result);
                chrome.runtime.sendMessage({
                    type: 'VALIDATE_RULE',
                    payload: {ruleInfo}
                }, ({type, result}) => {
                    if (type === 'VALIDATE_RULE_RESULT') {
                        if (result.errors) {
                            this.setState({importErrors: result.errors});
                        } else {
                            importRuleInfoAction({ruleInfo});
                        }
                    }
                });
            } catch (e) {
                // ignore error reading file
            }
        };
        reader.readAsText(file);
    }

    renderImport() {
        const {importErrors} = this.state;

        return (
            <div>
                <label htmlFor='import-rule' className='rule-button'>&#8681; Import</label>
                <input type='file' id='import-rule' accept='.json' onChange={this.importRule}/>
                {importErrors && importErrors[0] ? (
                    <div className='import-error'>
                        <p className='import-error-message'>Import Error: Data path '{importErrors[0].dataPath}' {importErrors[0].message}</p>
                        <button className='import-error-dismiss' onClick={this.dismissImportError}>Dismiss</button>
                    </div>
                ) : null}
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
