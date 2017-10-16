import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import importRuleInfoActionCreator from '../actions/import-rule-info-action-creator';
import classnames from 'classnames';

class Rules extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            importErrors: null,
            selectedRuleId: this.getFirstRuleId(props)
        };
        this.dismissImportError = this.dismissImportError.bind(this);
        this.exportRule = this.exportRule.bind(this);
        this.importRule = this.importRule.bind(this);
        this.selectRule = this.selectRule.bind(this);
    }

    getFirstRuleId({ruleIds}) {
        return ruleIds.length > 0 ? ruleIds[0] : null;
    }

    componentWillReceiveProps(nextProps) {
        if (!this.state.selectedRuleId && this.props.ruleIds !== nextProps.ruleIds) {
            this.setState({
                selectedRuleId: this.getFirstRuleId(nextProps)
            });
        }
    }

    dismissImportError() {
        this.setState({
            importErrors: null
        });
    }

    exportRule() {
        const {selectedRuleId} = this.state;
        const ruleInfo = this.props.ruleInfos[selectedRuleId];

        chrome.runtime.sendMessage({
            type: 'EXPORT_CONTENT',
            payload: {
                content: ruleInfo,
                name: selectedRuleId
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
                            this.dismissImportError();
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

    selectRule({target}) {
        const selectedRuleId = target.getAttribute('data-rule-id');

        if (selectedRuleId) {
            this.setState({selectedRuleId});
        }
    }

    renderMenuPane() {
        const {ruleIds, ruleInfos} = this.props;
        const {importErrors, selectedRuleId} = this.state;

        return (
            <div className='menu-pane'>
                <div>
                    <div className='pane-section pane-top-menu pane-top-menu-left'>
                        <label htmlFor='import-rule' className='pane-top-menu-button diver-button'>&#8681; Import</label>
                        <input type='file' id='import-rule' accept='.json' onChange={this.importRule}/>
                    </div>
                    {importErrors && importErrors[0] ? (
                        <div className='pane-section'>
                            <p className='import-error-message'>Import Error: Data path '{importErrors[0].dataPath}' {importErrors[0].message}</p>
                            <button className='diver-button' onClick={this.dismissImportError}>Dismiss</button>
                        </div>
                    ) : null}
                    <div className='pane-section'>
                        <ul className='menu-list' onClick={this.selectRule}>
                            {ruleIds.map((ruleId) => {
                                return (
                                    <li key={ruleId} className={classnames('menu-item', {selected: ruleId === selectedRuleId})} data-rule-id={ruleId}>{ruleInfos[ruleId].name}</li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    renderRulePane() {
        const ruleInfo = this.props.ruleInfos[this.state.selectedRuleId];

        if (!ruleInfo) {
            return null;
        }

        return (
            <div className='content-pane'>
                <div className='traffic-group-header' style={{backgroundColor: '#' + ruleInfo.color}}>
                    <h2 className='traffic-group-title'>{ruleInfo.name}</h2>
                    <div className='traffic-group-buttons'>
                        <div className='traffic-group-buttons-group'>
                            <button className='diver-button' onClick={this.exportRule}>&#8682; Export</button>
                        </div>
                    </div>
                </div>
                <div className='rule-config'>
                    <pre className='rule-config-json'>{JSON.stringify(ruleInfo, null, 4)}</pre>
                </div>
            </div>
        );
    }

    render() {
        return (
            <div className='config-view-wrapper'>
                {this.renderMenuPane()}
                {this.renderRulePane()}
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
