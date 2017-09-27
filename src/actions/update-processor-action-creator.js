const updateProcessorActionCreator = ({namespace, url}) => {
    return {
        type: 'UPDATE_PROCESSOR',
        payload: {
            namespace,
            url
        }
    };
};

export default updateProcessorActionCreator;
