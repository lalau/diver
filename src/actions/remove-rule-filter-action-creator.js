const removeRuleFilterActionCreator = ({ruleId, filterIndex}) => {
    return {
        type: 'REMOVE_RULE_FILTER',
        payload: {
            ruleId,
            filterIndex
        }
    };
};

export default removeRuleFilterActionCreator;
