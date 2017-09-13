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
        const {className, children} = this.props;
        return (<button className={className} onClick={this.handleClick}>{children}</button>);
    }
}

SimpleButton.propTypes = {
    className: PropTypes.string,
    handleClick: PropTypes.func,
    params: PropTypes.object
};

export default SimpleButton;
