import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

class TrafficInfo extends React.Component {
    constructor(props) {
        super(props);

        this.closePane = this.closePane.bind(this);
    }

    closePane() {
        const {onClose} = this.props;

        onClose();
    }

    render() {
        return (
            <div onClick={this.closePane} style={{height: '100%'}}>
            </div>
        );
    }
}

TrafficInfo.propTypes = {
    selectedTrafficIndex: PropTypes.number,

    onClose: PropTypes.func
};

const mapStateToProps = (state) => {
    return {
        selectedTrafficIndex: state.traffics.selectedTrafficIndex
    };
};

const mapDispatchToProps = (/*dispatch*/) => {
    return {};
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(TrafficInfo);
