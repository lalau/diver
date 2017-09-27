import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import SimpleButton from './partials/SimpleButton.jsx';
import removeProcessorActionCreator from '../actions/remove-processor-action-creator';
import updateProcessorActionCreator from '../actions/update-processor-action-creator';
import updateAppStateActionCreator from '../actions/update-app-state-action-creator';
import update from 'immutability-helper';
import messages from '../strings/messages';

class Processors extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            edit: {}
        };
        Object.keys(this.props.processors).forEach((namespace) => {
            this.state.edit[namespace] = false;
        });

        this.processorUrlInputs = {};
        this.addProcessor = this.addProcessor.bind(this);
        this.removeProcessor = this.removeProcessor.bind(this);
        this.toggleProcessorEdit = this.toggleProcessorEdit.bind(this);
        this.updateProcessor = this.updateProcessor.bind(this);
    }

    addProcessor() {
        const {processors, updateProcessorAction} = this.props;
        const namespace = this.addProcessorNs.value.trim();
        const url = this.addProcessorUrl.value.trim();

        if (!namespace || !url || processors[namespace]) {
            return;
        }

        updateProcessorAction({namespace, url});
        this.showReloadMessage();

        this.addProcessorNs.value = '';
        this.addProcessorUrl.value = '';
    }

    removeProcessor({namespace}) {
        const {removeProcessorAction} = this.props;

        removeProcessorAction({namespace});
        this.showReloadMessage();
        this.setState({
            edit: update(this.state.edit, {
                $unset: [namespace]
            })
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

    toggleProcessorEdit({namespace, edit}) {
        this.setState({
            edit: update(this.state.edit, {
                $set: {
                    [namespace]: edit
                }
            })
        });
    }

    updateProcessor({namespace}) {
        const {updateProcessorAction} = this.props;
        const oldUrl = this.props.processors[namespace].url;
        const newUrl = this.processorUrlInputs[namespace].value.trim();

        if (oldUrl !== newUrl) {
            updateProcessorAction({namespace, url: newUrl});
            this.showReloadMessage();
        }

        this.toggleProcessorEdit({namespace, edit: false});
    }

    renderUrlDisplay(namespace) {
        const processorUrl = this.props.processors[namespace].url;
        const editable = namespace !== 'query';

        return (
            <div className='processor-row'>
                <a href={processorUrl} target='_blank' className='processor-url processor-url-display'>{processorUrl}</a>
                {editable ? <SimpleButton className='processor-button' handleClick={this.toggleProcessorEdit} params={{namespace, edit: true}}>Edit</SimpleButton> : null}
                {editable ? <SimpleButton className='processor-button' handleClick={this.removeProcessor} params={{namespace}}>Remove</SimpleButton> : null}
            </div>
        );
    }

    renderUrlEdit(namespace) {
        const processorUrl = this.props.processors[namespace].url;

        return (
            <div className='processor-row'>
                <input className='processor-url' defaultValue={processorUrl} placeholder='URL' ref={(input) => {this.processorUrlInputs[namespace] = input;}}/>
                <SimpleButton className='processor-button' handleClick={this.toggleProcessorEdit} params={{namespace, edit: false}}>Cancel</SimpleButton>
                <SimpleButton className='processor-button' handleClick={this.updateProcessor} params={{namespace}}>Save</SimpleButton>
            </div>
        );
    }

    renderProcessor(namespace) {
        const processor = this.props.processors[namespace];

        if (!processor) {
            return null;
        }

        return (
            <div key={namespace}>
                <h2 className='processor-name'>{processor.name || <p className='warning'>{messages.PROCESSOR_ERROR} "{namespace}"</p>}</h2>
                <h3 className='processor-ns'>Namespace: {namespace}</h3>
                {this.state.edit[namespace] ? this.renderUrlEdit(namespace) : this.renderUrlDisplay(namespace)}
            </div>
        );
    }

    render() {
        const {processors} = this.props;

        return (
            <div>
                {Object.keys(processors).map((namespace) => {
                    return this.renderProcessor(namespace);
                })}
                <div className='add-processor'>
                    <h3 className='processor-ns'>Namespace: <input className='add-processor-ns' placeholder='Namespace' ref={(input) => {this.addProcessorNs = input;}}></input></h3>
                    <div className='processor-row'>
                        <input className='processor-url' placeholder='URL' ref={(input) => {this.addProcessorUrl = input;}}/>
                        <button className='processor-button' onClick={this.addProcessor}>Add</button>
                    </div>
                </div>
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
