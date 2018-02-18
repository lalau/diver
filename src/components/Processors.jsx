import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import removeProcessorActionCreator from '../actions/remove-processor-action-creator';
import updateProcessorActionCreator from '../actions/update-processor-action-creator';
import updateAppStateActionCreator from '../actions/update-app-state-action-creator';
import messages from '../strings/messages';
import {mergeProcessorsState} from '../lib/util';
import classnames from 'classnames';
import update from 'immutability-helper';

const defaultProcessorCode = `function getProcessor() {
    return {
        name: 'Name',
        namespace: 'namespace',
        process: function process(traffic) {
            return {};
        }
    };
}`;

class Processors extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            addLocalProcessor: false,
            editProcessor: false,
            editInspectingTraffic: false,
            errorKey: null,
            inspectTextError: null,
            selectedNamespace: this.getFirstProcessorNamespace(),
            showInspectHint: false,
            wrapInspectingTraffic: false
        };

        this.addProcessor = this.addProcessor.bind(this);
        this.cancelAdd = this.cancelAdd.bind(this);
        this.closeInspectingTraffic = this.closeInspectingTraffic.bind(this);
        this.processInspectTraffic = this.processInspectTraffic.bind(this);
        this.removeProcessor = this.removeProcessor.bind(this);
        this.selectNamespace = this.selectNamespace.bind(this);
        this.setupAddProcessor = this.setupAddProcessor.bind(this);
        this.toggleAddLocalProcessor = this.toggleAddLocalProcessor.bind(this);
        this.toggleEditInspectingTraffic = this.toggleEditInspectingTraffic.bind(this);
        this.toggleEditProcessor = this.toggleEditProcessor.bind(this);
        this.toggleInspectHint = this.toggleInspectHint.bind(this);
        this.toggleInspectResultWrap = this.toggleInspectResultWrap.bind(this);
        this.toggleInspectTrafficWrap = this.toggleInspectTrafficWrap.bind(this);
        this.updateProcessor = this.updateProcessor.bind(this);
    }

    getFirstProcessorNamespace(notNamespace) {
        return Object.keys(this.props.processors).filter(namespace => namespace != notNamespace)[0];
    }

    validateUrl(url) {
        try {
            return (new URL(url).protocol).indexOf('http') === 0;
        } catch (e) {
            return false;
        }
    }

    addProcessor() {
        const {addLocalProcessor} = this.state;
        const {processors, updateProcessorAction} = this.props;
        const namespace = this.processorNsInput && this.processorNsInput.value.trim();
        const url = this.processorUrlInput && this.processorUrlInput.value.trim();
        const code = this.processorCodeInput && this.processorCodeInput.value.trim();
        let addProcessorError;

        if (!namespace) {
            addProcessorError = 'PROCESSOR_NAMESPACE_REQUIRED';
        } else if (processors[namespace]) {
            addProcessorError = 'PROCESSOR_NAMESPACE_EXISTED';
        }

        if (!addProcessorError) {
            if (addLocalProcessor) {
                if (!code) {
                    addProcessorError = 'PROCESSOR_CODE_REQUIRED';
                }
            } else {
                if (!url) {
                    addProcessorError = 'PROCESSOR_URL_REQUIRED';
                } else if (!this.validateUrl(url)) {
                    addProcessorError = 'PROCESSOR_URL_INVALID';
                }
            }
        }

        if (addProcessorError) {
            return this.setState({
                errorKey: addProcessorError
            });
        }

        updateProcessorAction({namespace, url, code, isLocal: addLocalProcessor});
        this.showReloadMessage();
        this.setState({
            errorKey: null,
            selectedNamespace: namespace
        });
    }

    removeProcessor() {
        const {selectedNamespace} = this.state;
        const {removeProcessorAction} = this.props;

        removeProcessorAction({
            namespace: selectedNamespace
        });
        this.showReloadMessage();
        this.setState({
            editProcessor: false,
            errorKey: null,
            selectedNamespace: this.getFirstProcessorNamespace(selectedNamespace)
        });
    }

    selectNamespace({target}) {
        const {inspectingTraffic, updateAppStateAction} = this.props;
        const selectedNamespace = target.getAttribute('data-namespace');

        if (selectedNamespace !== this.state.selectedNamespace) {
            this.setState({
                editProcessor: false,
                errorKey: null,
                selectedNamespace
            });

            if (inspectingTraffic) {
                updateAppStateAction({
                    scope: 'page',
                    key: 'inspectingTraffic',
                    value: update(inspectingTraffic, {
                        $unset: ['processed', 'error']
                    })
                });
            }
        }
    }

    setupAddProcessor() {
        this.setState({
            editProcessor: false,
            errorKey: null,
            selectedNamespace: null
        });
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

    cancelAdd() {
        this.setState({
            errorKey: null,
            selectedNamespace: this.getFirstProcessorNamespace()
        });
    }

    toggleEditProcessor() {
        this.setState({
            editProcessor: !this.state.editProcessor,
            errorKey: null
        });
    }

    updateProcessor() {
        const {selectedNamespace} = this.state;
        const {updateProcessorAction} = this.props;
        const processor = this.props.processors[selectedNamespace];
        const processorIsLocal = processor.isLocal;
        const oldValue = processorIsLocal ? processor.code : processor.url;
        const newValue = processorIsLocal ? this.processorCodeInput.value.trim() : this.processorUrlInput.value.trim();
        const valueKey = processorIsLocal ? 'code' : 'url';

        if (!processorIsLocal && !this.validateUrl(newValue)) {
            return this.setState({
                errorKey: 'PROCESSOR_URL_INVALID'
            });
        }

        if (oldValue !== newValue) {
            updateProcessorAction({
                namespace: selectedNamespace,
                [valueKey]: newValue,
                isLocal: processorIsLocal
            });
            this.showReloadMessage();
        }

        this.toggleEditProcessor();
    }

    toggleInspectTrafficWrap() {
        this.setState({
            wrapInspectingTraffic: !this.state.wrapInspectingTraffic
        });
    }

    toggleInspectResultWrap() {
        this.setState({
            wrapInspectResult: !this.state.wrapInspectResult
        });
    }

    toggleEditInspectingTraffic() {
        const {inspectingTraffic, updateAppStateAction} = this.props;
        const {editInspectingTraffic} = this.state;
        const inspectText = this.inspectText;

        if (editInspectingTraffic) {
            let newTraffic;

            try {
                newTraffic = JSON.parse(inspectText.value);
            } catch (e) {
                this.setState({
                    inspectTextError: e.message
                });
                return;
            }

            this.setState({
                inspectTextError: null
            });

            updateAppStateAction({
                scope: 'page',
                key: 'inspectingTraffic',
                value: update(inspectingTraffic, {
                    $unset: ['processed', 'error'],
                    traffic: {
                        $set: newTraffic
                    }
                })
            });
        } else {
            inspectText.selectionStart = 0;
            inspectText.selectionEnd = 0;
            inspectText.focus();
        }

        this.setState({
            editInspectingTraffic: !editInspectingTraffic
        });
    }

    closeInspectingTraffic() {
        this.props.updateAppStateAction({
            scope: 'page',
            key: 'inspectingTraffic',
            value: null
        });

        this.setState({
            editInspectingTraffic: false
        });
    }

    processInspectTraffic() {
        const {inspectingTraffic, updateAppStateAction} = this.props;
        const {selectedNamespace} = this.state;

        updateAppStateAction({
            scope: 'page',
            key: 'inspectingTraffic',
            value: update(inspectingTraffic, {
                $unset: ['processed', 'error'],
                processingNamespace: {
                    $set: selectedNamespace
                }
            })
        });
    }

    toggleAddLocalProcessor() {
        this.setState({
            addLocalProcessor: !this.state.addLocalProcessor
        });
    }

    toggleInspectHint() {
        this.setState({
            showInspectHint: !this.state.showInspectHint
        });
    }

    getProcessedResult() {
        const {inspectingTraffic} = this.props;
        const {processed, error} = inspectingTraffic;

        if (error) {
            return error;
        }

        if (processed) {
            return JSON.stringify(inspectingTraffic.processed, null, 4);
        }

        return '';
    }

    renderMenuPane() {
        const {processors} = this.props;
        const {selectedNamespace} = this.state;

        return (
            <div className='menu-pane'>
                <div>
                    <div className='pane-section pane-top-menu pane-top-menu-left'>
                        <button className='pane-top-menu-button diver-button' onClick={this.setupAddProcessor}>Add</button>
                    </div>
                    <div className='pane-section'>
                        <ul className='menu-list' onClick={this.selectNamespace}>
                            {Object.keys(processors).map((namespace) => {
                                const processor = processors[namespace];
                                const isValidProcessor = processor && processor.valid;

                                return (
                                    <li key={namespace} className={classnames('menu-item', {selected: namespace === selectedNamespace})} data-namespace={namespace}>
                                        {isValidProcessor ? processor.name : <span className='invalid'>{namespace}</span>}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    renderProcessorPane() {
        const {addLocalProcessor, editInspectingTraffic, editProcessor, errorKey, inspectTextError, selectedNamespace, showInspectHint, wrapInspectResult, wrapInspectingTraffic} = this.state;
        const {inspectingTraffic, processors} = this.props;
        const processor = selectedNamespace && processors[selectedNamespace];
        const processorUrl = processor && processor.url || '';
        const processorCode = processor && processor.code || '';
        const processorIsLocal = processor && processor.isLocal || false;
        const editable = selectedNamespace !== 'query';
        const newProcessor = !selectedNamespace;
        const editMode = editProcessor || newProcessor;
        const isValidProcessor = processor && processor.valid;
        const messageKey = errorKey || (!isValidProcessor && !newProcessor && 'PROCESSOR_ERROR');

        return (
            <div className='content-pane'>
                <div className='traffic-group-header'>
                    <h2 className='traffic-group-title'>
                        {newProcessor ?
                            <input className='processor-ns-input' placeholder='Processor Namespace' ref={(input) => {this.processorNsInput = input;}}/> :
                            (processor && processor.name && (processor.name + ' (' + selectedNamespace + ')') || <span className='invalid'>{selectedNamespace}</span>)}
                    </h2>
                    {editable ? (
                        <div className='traffic-group-buttons'>
                            {!selectedNamespace ? (
                                <div className='traffic-group-local-button'>
                                    <input type='checkbox' id='processor-local-checkbox' defaultChecked={addLocalProcessor} onChange={this.toggleAddLocalProcessor} ref={(input) => {this.localProcessorToggle = input;}}/>
                                    <label htmlFor='processor-local-checkbox'>Local</label>
                                </div>
                            ) : null}
                            <div className='traffic-group-buttons-group'>
                                {newProcessor ? <button className='diver-button' onClick={this.addProcessor}>Add</button> : null}
                                {newProcessor ? <button className='diver-button' onClick={this.cancelAdd}>Cancel</button> : null}
                                {editProcessor ? <button className='diver-button' onClick={this.updateProcessor}>Save</button> : null}
                                {editProcessor ? <button className='diver-button' onClick={this.toggleEditProcessor}>Cancel</button> : null}
                                {!editMode ? <button className='diver-button' onClick={this.toggleEditProcessor}>Edit</button> : null}
                                {!newProcessor ? <button className='diver-button' onClick={this.removeProcessor}>Remove</button> : null}
                            </div>
                        </div>
                    ) : null}
                </div>
                {messageKey ? <div className='processor-error'>{messages[messageKey] + (messageKey === 'PROCESSOR_ERROR' && processor.error ? (': ' + processor.error) : '')}</div> : null}
                <div className={classnames('processor-config', {local: processor ? processor.isLocal : (editMode && addLocalProcessor)})}>
                    {editMode ?
                        ((processor ? processor.isLocal : addLocalProcessor) ?
                            <textarea key={selectedNamespace || ''} className='processor-code-input' defaultValue={newProcessor ? defaultProcessorCode : processorCode} placeholder='Processor Function' ref={(input) => {this.processorCodeInput = input;}}></textarea> :
                            <input className='processor-url-input' defaultValue={processorUrl} placeholder='Processor URL' ref={(input) => {this.processorUrlInput = input;}}/>
                        ) :
                        (processorIsLocal ?
                            <textarea className='processor-code-input' defaultValue={processorCode} readOnly='true'></textarea> :
                            <a href={processorUrl} target='_blank' className='processor-url'>{processorUrl}</a>
                        )
                    }
                </div>
                {selectedNamespace ? (
                    inspectingTraffic ? (
                        <div className='inspect-traffic'>
                            <div className='inspect-column'>
                                <div className='inspect-column-head'>
                                    <h3 className='inspect-header'>Inspecting</h3>
                                    <div>
                                        <button className='diver-button inspect-text-button' onClick={this.closeInspectingTraffic}>Close</button>
                                        <button className='diver-button inspect-text-button' onClick={this.toggleEditInspectingTraffic}>{editInspectingTraffic ? 'Update' : 'Edit'}</button>
                                        <button className='diver-button inspect-text-button' onClick={this.toggleInspectTrafficWrap}>{wrapInspectingTraffic ? 'Unwrap' : 'Wrap'}</button>
                                        <button className='diver-button inspect-text-button' onClick={this.processInspectTraffic}>Process</button>
                                    </div>
                                </div>
                                {inspectTextError ? <div className='inspect-text-error'>JSON parse error: {inspectTextError}</div> : null}
                                <textarea className='inspect-text' defaultValue={JSON.stringify(inspectingTraffic.traffic, null, 4)} readOnly={editInspectingTraffic ? false : true} wrap={wrapInspectingTraffic ? 'soft' : 'off'} ref={(input) => {this.inspectText = input;}}/>
                            </div>
                            <div className='inspect-column'>
                                <div className='inspect-column-head'>
                                    <h3 className='inspect-header'>Processed</h3>
                                    <div>
                                        <button className='diver-button inspect-text-button' onClick={this.toggleInspectResultWrap}>{wrapInspectResult ? 'Unwrap' : 'Wrap'}</button>
                                    </div>
                                </div>
                                <textarea key={inspectingTraffic.processed} className='inspect-text' defaultValue={this.getProcessedResult()} readOnly={true} wrap={wrapInspectResult ? 'soft' : 'off'}/>
                            </div>
                        </div>
                        ) : (
                            <div className='inspect-hint'>
                                <h3 className='inspect-hint-title'>Inspect traffic to test this processor <button className='diver-button' onClick={this.toggleInspectHint}>&#8943;</button></h3>
                                <ol className={classnames('inspect-steps', {'inspect-steps-shown': showInspectHint})}>
                                    <li><p className='inspect-step-desc'>Go to Traffics pane</p><img src='images/inspect-1.png' width='252px'/></li>
                                    <li><p className='inspect-step-desc'>Get into traffic detail</p><img src='images/inspect-2.png' width='117px'/></li>
                                    <li><p className='inspect-step-desc'>Click the Inspect button</p><img src='images/inspect-3.png' width='300px'/></li>
                                    <li><p className='inspect-step-desc'>Inspecting traffic will be shown here</p><img src='images/inspect-4.png' width='399px'/></li>
                                </ol>
                            </div>
                        )
                    ) : null
                }
            </div>
        );
    }

    render() {
        return (
            <div className='config-view-wrapper'>
                {this.renderMenuPane()}
                {this.renderProcessorPane()}
            </div>
        );
    }
}

Processors.propTypes = {
    processors: PropTypes.object
};

const mapStateToProps = (state) => {
    return {
        inspectingTraffic: state.app.state.page.inspectingTraffic,
        processors: mergeProcessorsState(state.app.state.app.processors, state.app.state.session.processors)
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        removeProcessorAction: bindActionCreators(removeProcessorActionCreator, dispatch),
        updateProcessorAction: bindActionCreators(updateProcessorActionCreator, dispatch),
        updateAppStateAction: bindActionCreators(updateAppStateActionCreator, dispatch)
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Processors);
