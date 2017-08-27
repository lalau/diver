const selectRuleActionCreator = (ruleId) => {
    return {
        type: 'SELECT_RULE',
        payload: {
            ruleId
        }
    };
};

export default selectRuleActionCreator;
