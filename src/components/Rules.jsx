import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
// import {bindActionCreators} from 'redux';

class Rules extends React.Component {
    constructor(props) {
        super(props);

        this.reorderRule = this.reorderRule.bind(this);
    }

    reorderRule() {
    }

    renderRule(ruleInfo) {
        return (
            <div key={ruleInfo.id}>
                <h2>{ruleInfo.name}</h2>
                <pre className='rule-config'>{JSON.stringify(ruleInfo, null, 4)}</pre>
            </div>
        );
    }

    render() {
        const {ruleIds, ruleInfos} = this.props;

        return (
            <div>
                {ruleIds.map((ruleId) => {
                    return this.renderRule(ruleInfos[ruleId]);
                })}
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

const mapDispatchToProps = (/*dispatch*/) => {
    return {
        // reorderRuleAction: bindActionCreators(reorderRuleActionCreator, dispatch),
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Rules);
