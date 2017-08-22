const newTrafficRuleActionCreator = (trafficInfo) => {
    return {
        type: 'NEW_TRAFFIC_RULE',
        payload: {
            trafficInfo
        }
    };
};

export default newTrafficRuleActionCreator;
