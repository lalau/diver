const updateRuleDataActionCreator = ({ruleId, updateType, type, name, value}) => {
    return {
        type: 'UPDATE_RULE_DATA',
        payload: {
            ruleId,
            updateType,
            type,
            name,
            value
        }
    };
};

export default updateRuleDataActionCreator;
