import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import removeProcessorActionCreator from '../actions/remove-processor-action-creator';
import updateProcessorActionCreator from '../actions/update-processor-action-creator';
import updateAppStateActionCreator from '../actions/update-app-state-action-creator';
import messages from '../strings/messages';
import classnames from 'classnames';

class Processors extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            edit: false,
            errorKey: null,
            selectedNamespace: this.getFirstProcessorNamespace()
        };

        this.addProcessor = this.addProcessor.bind(this);
        this.cancelAdd = this.cancelAdd.bind(this);
        this.removeProcessor = this.removeProcessor.bind(this);
        this.selectNamespace = this.selectNamespace.bind(this);
        this.setupAddProcessor = this.setupAddProcessor.bind(this);
        this.toggleEdit = this.toggleEdit.bind(this);
        this.updateProcessor = this.updateProcessor.bind(this);
    }

    getFirstProcessorNamespace() {
        return Object.keys(this.props.processors)[0];
    }

    validateUrl(url) {
        try {
            return (new URL(url).protocol).indexOf('http') === 0;
        } catch (e) {
            return false;
        }
    }

    addProcessor() {
        const {processors, updateProcessorAction} = this.props;
        const namespace = this.processorNsInput.value.trim();
        const url = this.processorUrlInput.value.trim();
        let addProcessorError;

        if (!namespace) {
            addProcessorError = 'PROCESSOR_NAMESPACE_REQUIRED';
        } else if (!url) {
            addProcessorError = 'PROCESSOR_URL_REQUIRED';
        } else if (!this.validateUrl(url)) {
            addProcessorError = 'PROCESSOR_URL_INVALID';
        } else if (processors[namespace]) {
            addProcessorError = 'PROCESSOR_NAMESPACE_EXISTED';
        }

        if (addProcessorError) {
            return this.setState({
                errorKey: addProcessorError
            });
        }

        updateProcessorAction({namespace, url});
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
            edit: false,
            errorKey: null,
            selectedNamespace: this.getFirstProcessorNamespace()
        });
    }

    selectNamespace({target}) {
        const selectedNamespace = target.getAttribute('data-namespace');

        if (selectedNamespace) {
            this.setState({
                edit: false,
                errorKey: null,
                selectedNamespace
            });
        }
    }

    setupAddProcessor() {
        this.setState({
            edit: false,
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
                key: 'RELOAD_FOR_PROCESSORS'
            }
        });
    }

    cancelAdd() {
        this.setState({
            errorKey: null,
            selectedNamespace: this.getFirstProcessorNamespace()
        });
    }

    toggleEdit() {
        this.setState({
            edit: !this.state.edit,
            errorKey: null
        });
    }

    updateProcessor() {
        const {selectedNamespace} = this.state;
        const {updateProcessorAction} = this.props;
        const oldUrl = this.props.processors[selectedNamespace].url;
        const newUrl = this.processorUrlInput.value.trim();

        if (!this.validateUrl(newUrl)) {
            return this.setState({
                errorKey: 'PROCESSOR_URL_INVALID'
            });
        }

        if (oldUrl !== newUrl) {
            updateProcessorAction({
                namespace: selectedNamespace,
                url: newUrl
            });
            this.showReloadMessage();
        }

        this.toggleEdit();
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
                                const isValidProcessor = processor && !!processor.name && typeof processor.process === 'function';

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
        const {errorKey, edit, selectedNamespace} = this.state;
        const processor = selectedNamespace && this.props.processors[selectedNamespace];
        const processorUrl = processor && processor.url || '';
        const editable = selectedNamespace !== 'query';
        const newProcessor = !selectedNamespace;
        const editMode = edit || newProcessor;
        const isValidProcessor = processor && !!processor.name && typeof processor.process === 'function';
        const messageKey = errorKey || (!isValidProcessor && !newProcessor && 'PROCESSOR_ERROR');

        return (
            <div className='content-pane'>
                <div className='traffic-group-header'>
                    <h2 className='traffic-group-title'>
                        {newProcessor ?
                            <input className='processor-ns-input' placeholder='Processor Namespace' ref={(input) => {this.processorNsInput = input;}}/> :
                            (processor && processor.name || <span className='invalid'>{selectedNamespace}</span>)}
                    </h2>
                    {editable ? (
                        <div className='traffic-group-buttons'>
                            <div className='traffic-group-buttons-group'>
                                {newProcessor ? <button className='diver-button' onClick={this.addProcessor}>Add</button> : null}
                                {newProcessor ? <button className='diver-button' onClick={this.cancelAdd}>Cancel</button> : null}
                                {edit ? <button className='diver-button' onClick={this.updateProcessor}>Save</button> : null}
                                {edit ? <button className='diver-button' onClick={this.toggleEdit}>Cancel</button> : null}
                                {!editMode ? <button className='diver-button' onClick={this.toggleEdit}>Edit</button> : null}
                                {!newProcessor ? <button className='diver-button' onClick={this.removeProcessor}>Remove</button> : null}
                            </div>
                        </div>
                    ) : null}
                </div>
                <div className='processor-config'>
                    {editMode ?
                        <input className='processor-url-input' defaultValue={processorUrl} placeholder='Processor URL' ref={(input) => {this.processorUrlInput = input;}}/> :
                        <a href={processorUrl} target='_blank' className='processor-url'>{processorUrl}</a>
                    }
                </div>
                {messageKey ? <div className='processor-error'>{messages[messageKey]}</div> : null}
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
        processors: state.app.state.app.processors
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
