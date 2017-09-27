const removeProcessorActionCreator = ({namespace}) => {
    return {
        type: 'REMOVE_PROCESSOR',
        payload: {
            namespace
        }
    };
};

export default removeProcessorActionCreator;
