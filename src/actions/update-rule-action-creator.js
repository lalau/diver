const updateRuleActionCreator = ({ruleId, key, value}) => {
    return {
        type: 'UPDATE_RULE',
        payload: {
            ruleId,
            key,
            value
        }
    };
};

export default updateRuleActionCreator;
