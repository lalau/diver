import update from 'immutability-helper';
import uuidv1 from 'uuid/v1';
import {getRuleDataIndex, getRandomColor, isMatchingTraffic} from '../lib/util';

const DEFAULT_STATE = {
    ruleInfos: {},
    ruleIds: []
};

/*
{
    ruleInfos: {
        [uuid]: {
            id: uuid,
            color: 'AABBCC',
            name: 'bats.video.yahoo.com',
            filters: [
                {
                    id: <id>,
                    name: 'domain',
                    value: 'bats.video.yahoo.com'
                },
                {
                    id: <id>,
                    name: 'has-response-header',
                    value: 'connection'
                }
            ],
            data: {
                <namespace>: {
                    s: {
                        desc: 'Spaceid'
                    }
                }
            },
            dataOrder: [
                {
                    namespace: <namespace>,
                    name: 's'
                }
            ],
            labels: [
                {
                    id: <id>,
                    name: 'Video request',
                    matches: [
                        {
                            id: <id>,
                            namespace: <namespace>,
                            name: 'evt',
                            value: 'v_request'
                        }
                    ]
                }
            ],
            namespaces: ['query']
        }
    },
    ruleIds: [uuid, ...]
}
*/

export default (state, {type, payload}) => {
    switch (type) {
    case 'ADD_RULE_FILTER':
        return addRuleFilter(state, payload);
    case 'ADD_RULE_LABEL':
        return addRuleLabel(state, payload);
    case 'ADD_RULE_PROCESSOR':
        return addRuleProcessor(state, payload);
    case 'IMPORT_RULE_INFO':
        return importRuleInfo(state, payload);
    case 'IMPORT_RULES':
        return importRules(state, payload);
    case 'NEW_TRAFFIC_RULE':
        return newTrafficRule(state, payload);
    case 'REMOVE_PROCESSOR':
        return removeProcessor(state, payload);
    case 'REMOVE_RULE':
        return removeRule(state, payload);
    case 'REMOVE_RULE_FILTER':
        return removeRuleFilter(state, payload);
    case 'REMOVE_RULE_LABEL':
        return removeRuleLabel(state, payload);
    case 'REMOVE_RULE_PROCESSOR':
        return removeRuleProcessor(state, payload);
    case 'REORDER_RULE_DATA':
        return reorderRuleData(state, payload);
    case 'RESET_RULES':
        return DEFAULT_STATE;
    case 'UPDATE_RULE_LABEL':
        return updateRuleLabel(state, payload);
    case 'UPDATE_RULE_DATA':
        return updateRuleData(state, payload);
    case 'UPDATE_RULE':
        return updateRule(state, payload);
    case 'UPDATE_RULE_FILTER':
        return updateRuleFilter(state, payload);
    default:
        return state || DEFAULT_STATE;
    }
};

const addRuleProcessor = (state, {ruleId, namespace}) => {
    const ruleInfo = state.ruleInfos[ruleId];

    if (ruleInfo.namespaces.indexOf(namespace) >= 0) {
        return state;
    }

    return update(state, {
        ruleInfos: {
            [ruleId]: {
                data: {
                    [namespace]: {
                        $set: {}
                    }
                },
                namespaces: {
                    $push: [namespace]
                }
            }
        }
    });
};

const removeRuleProcessor = (state, {ruleId, namespace}) => {
    const ruleInfo = state.ruleInfos[ruleId];

    if (ruleInfo.namespaces.indexOf(namespace) === -1) {
        return state;
    }

    return update(state, {
        ruleInfos: {
            [ruleId]: {
                data: {
                    $unset: [namespace]
                },
                dataOrder: {
                    $set: ruleInfo.dataOrder.filter((dataOrderItem) => {
                        return dataOrderItem.namespace !== namespace;
                    })
                },
                namespaces: {
                    $splice: [[ruleInfo.namespaces.indexOf(namespace), 1]]
                },
                labels: ruleInfo.labels.map(({matches}) => {
                    return matches.every(match => match.namespace !== namespace) ? {} : {
                        matches: {
                            $set: matches.filter(match => match.namespace !== namespace)
                        }
                    };
                })
            }
        }
    });
};

const removeProcessor = (state, {namespace}) => {
    const {ruleIds} = state;

    ruleIds.forEach((ruleId) => {
        state = removeRuleProcessor(state, {ruleId, namespace});
    });

    return state;
};

const importRuleInfo = (state, {ruleInfo}) => {
    const {ruleInfos} = state;

    if (ruleInfos[ruleInfo.id]) {
        ruleInfo.id = uuidv1();
    }

    return update(state, {
        ruleInfos: {
            [ruleInfo.id]: {
                $set: ruleInfo
            }
        },
        ruleIds: {
            $push: [ruleInfo.id]
        }
    });
};

const importRules = (state, {rules}) => {
    return rules;
};

const addRuleLabel = (state, {ruleId, label}) => {
    return update(state, {
        ruleInfos: {
            [ruleId]: {
                labels: {
                    $push: [
                        {
                            id: uuidv1(),
                            name: label.name,
                            matches: []
                        }
                    ]
                }
            }
        }
    });
};

const removeRuleLabel = (state, {ruleId, labelIndex}) => {
    return update(state, {
        ruleInfos: {
            [ruleId]: {
                labels: {
                    $splice: [[labelIndex, 1]]
                }
            }
        }
    });
};

const updateRuleLabel = (state, {ruleId, labelIndex, label}) => {
    return update(state, {
        ruleInfos: {
            [ruleId]: {
                labels: {
                    [labelIndex]: {
                        $merge: label
                    }
                }
            }
        }
    });
};

const reorderRuleData = (state, {ruleId, dataIndex, dir}) => {
    const dataOrder = state.ruleInfos[ruleId].dataOrder;
    let dataOrderUpdate;

    if (dir === -1) {
        if (dataIndex > 0) {
            dataOrderUpdate = {
                $splice: [[dataIndex - 1, 2, dataOrder[dataIndex], dataOrder[dataIndex - 1]]]
            };
        }
    } else if (dir === 1) {
        if (dataIndex < dataOrder.length - 1) {
            dataOrderUpdate = {
                $splice: [[dataIndex, 2, dataOrder[dataIndex + 1], dataOrder[dataIndex]]]
            };
        }
    }

    if (dataOrderUpdate) {
        return update(state, {
            ruleInfos: {
                [ruleId]: {
                    dataOrder: dataOrderUpdate
                }
            }
        });
    }

    return state;
};

const updateRuleData = (state, {ruleId, updateType, namespace, name, value}) => {
    const ruleInfo = state.ruleInfos[ruleId];
    const dataUpdate = {};
    const dataOrderUpdate = {};

    if (updateType === 'remove') {
        const dataIndex = getRuleDataIndex(ruleInfo, namespace, name);
        if (dataIndex >= 0) {
            dataOrderUpdate.$splice = [[dataIndex, 1]];
        }
    } else if (updateType === 'add') {
        if (!ruleInfo.data[namespace][name]) {
            dataUpdate[name] = {$set: {}};
        }
        dataOrderUpdate.$push = [{namespace, name}];
    } else if (updateType === 'update') {
        dataUpdate[name] = {$merge: value};
    }

    if (Object.keys(dataUpdate).length > 0 || Object.keys(dataOrderUpdate).length > 0) {
        return update(state, {
            ruleInfos: {
                [ruleId]: {
                    data: {
                        [namespace]: dataUpdate
                    },
                    dataOrder: dataOrderUpdate
                }
            }
        });
    }

    return state;
};

const addRuleFilter = (state, {ruleId, filterName}) => {
    return update(state, {
        ruleInfos: {
            [ruleId]: {
                filters: {$push: [{id: uuidv1(), name: filterName, value: ''}]}
            }
        }
    });
};

const updateRule = (state, {ruleId, key, value}) => {
    return update(state, {
        ruleInfos: {
            [ruleId]: {
                [key]: {$set: value}
            }
        }
    });
};

const updateRuleFilter = (state, {ruleId, type, filterIndex, value}) => {
    if (type === 'update') {
        return update(state, {
            ruleInfos: {
                [ruleId]: {
                    filters: {
                        [filterIndex]: {
                            value: value !== undefined ? {$set: value} : {}
                        }
                    }
                }
            }
        });
    }

    return state;
};

const removeRule = (state, {ruleId}) => {
    const stateChange = {
        ruleInfos: {
            [ruleId]: {
                $set: undefined
            }
        }
    };
    const ruleIdIndex = state.ruleIds.indexOf(ruleId);

    if (ruleIdIndex >= 0) {
        stateChange.ruleIds = {
            $splice: [[ruleIdIndex, 1]]
        };
    }

    state = update(state, stateChange);

    return state;
};

const removeRuleFilter = (state, {ruleId, filterIndex}) => {
    return update(state, {
        ruleInfos: {
            [ruleId]: {
                filters: {
                    $splice: [[filterIndex, 1]]
                }
            }
        }
    });
};

const createRule = (id, trafficInfo) => {
    const hostname = trafficInfo.hostname;

    return {
        id,
        color: getRandomColor(),
        name: hostname,
        filters: [
            {
                id: uuidv1(),
                name: 'domain',
                value: hostname
            }
        ],
        data: {
            query: {}
        },
        dataOrder: [],
        labels: [],
        namespaces: ['query']
    };
};

const matchRules = (state, trafficInfo) => {
    const {ruleIds, ruleInfos} = state;
    const matchedRules = [];

    ruleIds.forEach((ruleId) => {
        const ruleInfo = ruleInfos[ruleId];

        if (isMatchingTraffic(trafficInfo, ruleInfo)) {
            matchedRules.push(ruleInfo);
        }
    });

    return matchedRules;
};

const newTrafficRule = (state, {trafficInfo}) => {
    const matchedRules = matchRules(state, trafficInfo);

    if (matchedRules && matchedRules.length > 0) {
        return state;
    }

    const ruleId = uuidv1();

    state = update(state, {
        ruleInfos: {
            [ruleId]: {
                $set: createRule(ruleId, trafficInfo)
            }
        },
        ruleIds: {
            $push: [ruleId]
        }
    });

    return state;
};
