const selectTrafficActionCreator = (trafficIndex) => {
    return {
        type: 'SELECT_TRAFFIC',
        payload: {
            trafficIndex
        }
    };
};

export default selectTrafficActionCreator;
