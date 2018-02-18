const updateProcessorActionCreator = ({namespace, url, code, isLocal}) => {
    return {
        type: 'UPDATE_PROCESSOR',
        payload: {
            namespace,
            url,
            code,
            isLocal
        }
    };
};

export default updateProcessorActionCreator;
