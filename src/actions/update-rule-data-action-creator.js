const updateRuleDataActionCreator = ({ruleId, updateType, namespace, name, value}) => {
    return {
        type: 'UPDATE_RULE_DATA',
        payload: {
            ruleId,
            updateType,
            namespace,
            name,
            value
        }
    };
};

export default updateRuleDataActionCreator;
