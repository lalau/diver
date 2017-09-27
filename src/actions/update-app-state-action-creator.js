const updateAppStateActionCreator = ({scope, key, value}) => {
    return {
        type: 'UPDATE_APP_STATE',
        payload: {
            scope,
            key,
            value
        }
    };
};

export default updateAppStateActionCreator;
