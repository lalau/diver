import React from 'react';
import PropTypes from 'prop-types';

class DataHeader extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            reorder: false
        };

        this.enableReorder = this.toggleReorder.bind(this, true);
        this.disableReorder = this.toggleReorder.bind(this, false);
        this.reorderDataLeft = this.reorderData.bind(this, -1);
        this.reorderDataRight = this.reorderData.bind(this, 1);
    }

    toggleReorder(reorder) {
        this.setState({reorder});
    }

    reorderData(dir) {
        const {onReorder, params} = this.props;

        onReorder(params, dir);
    }

    render() {
        const {reorderLeft, reorderRight, text} = this.props;
        const {reorder} = this.state;

        return (
            <div className='data-header' onMouseEnter={this.enableReorder} onMouseLeave={this.disableReorder}>
                {reorder && reorderLeft ? <button className='diver-button data-move data-move-left' onClick={this.reorderDataLeft}>&#9664;</button> : null}
                {text}
                {reorder && reorderRight ? <button className='diver-button data-move data-move-right' onClick={this.reorderDataRight}>&#9654;</button> : null}
            </div>
        );
    }
}

DataHeader.propTypes = {
    onReorder: PropTypes.func,
    params: PropTypes.object,
    reorderLeft: PropTypes.bool,
    reorderRight: PropTypes.bool,
    text: PropTypes.string
};

export default DataHeader;
