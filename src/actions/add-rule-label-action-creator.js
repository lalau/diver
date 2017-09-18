const addRuleLabelActionCreator = ({ruleId, label}) => {
    return {
        type: 'ADD_RULE_LABEL',
        payload: {
            ruleId,
            label
        }
    };
};

export default addRuleLabelActionCreator;
