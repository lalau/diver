const removeRuleProcessorActionCreator = ({ruleId, namespace}) => {
    return {
        type: 'REMOVE_RULE_PROCESSOR',
        payload: {
            ruleId,
            namespace
        }
    };
};

export default removeRuleProcessorActionCreator;
