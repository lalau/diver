const addRuleFilterActionCreator = ({ruleId, filterName}) => {
    return {
        type: 'ADD_RULE_FILTER',
        payload: {
            ruleId,
            filterName
        }
    };
};

export default addRuleFilterActionCreator;
