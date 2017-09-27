const addRuleProcessorActionCreator = ({ruleId, namespace}) => {
    return {
        type: 'ADD_RULE_PROCESSOR',
        payload: {
            ruleId,
            namespace
        }
    };
};

export default addRuleProcessorActionCreator;
