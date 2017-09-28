const importRuleInfoActionCreator = ({ruleInfo}) => {
    return {
        type: 'IMPORT_RULE_INFO',
        payload: {
            ruleInfo
        }
    };
};

export default importRuleInfoActionCreator;
