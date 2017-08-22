const removeRuleActionCreator = (ruleId) => {
    return {
        type: 'REMOVE_RULE',
        payload: {
            ruleId
        }
    };
};

export default removeRuleActionCreator;
