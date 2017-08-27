const updateRuleFilterActionCreator = ({ruleId, type, filterIndex, value, valueMatch}) => {
    return {
        type: 'UPDATE_RULE_FILTER',
        payload: {
            ruleId,
            type,
            filterIndex,
            value,
            valueMatch
        }
    };
};

export default updateRuleFilterActionCreator;
