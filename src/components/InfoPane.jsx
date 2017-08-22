import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import selectTrafficActionCreator from '../actions/select-traffic-action-creator';

class InfoPane extends React.Component {
    constructor(props) {
        super(props);

        this.closePane = this.closePane.bind(this);
    }

    closePane() {
        const {onClose, selectTrafficAction} = this.props;

        selectTrafficAction();
        onClose();
    }

    render() {
        return (
            <div onClick={this.closePane} style={{height: '100%'}}>
            </div>
        );
    }
}

InfoPane.propTypes = {
    selectedTrafficIndex: PropTypes.number,

    onClose: PropTypes.func
};

const mapStateToProps = (state) => {
    return {
        selectedTrafficIndex: state.traffics.selectedTrafficIndex
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        selectTrafficAction: bindActionCreators(selectTrafficActionCreator, dispatch)
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(InfoPane);
