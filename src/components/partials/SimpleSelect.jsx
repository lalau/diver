import React from 'react';
import PropTypes from 'prop-types';

class SimpleSelect extends React.Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange() {
        const {handleChange, params} = this.props;

        if (handleChange) {
            handleChange(params);
        }
    }

    render() {
        const {children, className, selectRef} = this.props;
        return (<select ref={selectRef} className={className} onChange={this.handleChange}>{children}</select>);
    }
}

SimpleSelect.defaultProps ={
    disabled: false
};

SimpleSelect.propTypes = {
    className: PropTypes.string,
    handleChange: PropTypes.func,
    params: PropTypes.object,
    selectRef: PropTypes.func
};

export default SimpleSelect;
