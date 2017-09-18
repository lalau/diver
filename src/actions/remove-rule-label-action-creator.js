const removeRuleLabelActionCreator = ({ruleId, labelIndex}) => {
    return {
        type: 'REMOVE_RULE_LABEL',
        payload: {
            ruleId,
            labelIndex
        }
    };
};

export default removeRuleLabelActionCreator;
