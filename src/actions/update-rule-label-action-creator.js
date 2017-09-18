const updateRuleLabelActionCreator = ({ruleId, labelIndex, label}) => {
    return {
        type: 'UPDATE_RULE_LABEL',
        payload: {
            ruleId,
            labelIndex,
            label
        }
    };
};

export default updateRuleLabelActionCreator;
