import React from 'react';
import PropTypes from 'prop-types';

class SimpleButton extends React.Component {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        const {handleClick, params} = this.props;

        if (handleClick) {
            handleClick(params);
        }
    }

    render() {
        const {className, children, disabled} = this.props;
        return (<button className={className} onClick={this.handleClick} disabled={disabled}>{children}</button>);
    }
}

SimpleButton.defaultProps ={
    disabled: false
};

SimpleButton.propTypes = {
    className: PropTypes.string,
    disabled: PropTypes.bool,
    handleClick: PropTypes.func,
    params: PropTypes.object
};

export default SimpleButton;
