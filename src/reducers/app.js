import update from 'immutability-helper';

const DEFAULT_STATE = {
    navigateTimestamp: null,
    ui: {}
};

/*
{
    navigateTimestamp: 123456,
    ui: {}
}
*/

export default (state, {type, payload}) => {
    switch (type) {
    case 'NAVIGATE':
        return handleNavigate(state, payload);
    default:
        return state || DEFAULT_STATE;
    }
};

const handleNavigate = (state) => {
    return update(state, {
        navigateTimestamp: {
            $set: Date.now()
        }
    });
};
