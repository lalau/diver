const updateRuleFilterActionCreator = ({ruleId, type, filterIndex, value}) => {
    return {
        type: 'UPDATE_RULE_FILTER',
        payload: {
            ruleId,
            type,
            filterIndex,
            value
        }
    };
};

export default updateRuleFilterActionCreator;
