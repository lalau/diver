const reorderRuleDataActionCreator = ({ruleId, dataIndex, dir}) => {
    return {
        type: 'REORDER_RULE_DATA',
        payload: {
            ruleId,
            dataIndex,
            dir
        }
    };
};

export default reorderRuleDataActionCreator;
