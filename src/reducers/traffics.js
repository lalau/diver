import URL from 'url';
import update from 'immutability-helper';
import {isMatchingTraffic} from '../lib/util';

const DEFAULT_STATE = {
    filters: {
        domain: [],
        'has-response-header': [],
        method: [],
        'mime-type': [],
        path: [],
        'status-code': [],
        'larger-than': ['100', '10k', '1M']
    },
    trafficInfos: [],
    trafficGroups: {}
};

export const PROCESS_STATE = {
    NOT_PROCESSED: 'NOT_PROCESSED',
    PROCESSING: 'PROCESSING',
    PROCESSED: 'PROCESSED'
};

/*
{
    filters: {
        domain: [a.com, b.com],
        method: ['GET', 'POST']
    },
    trafficInfos: [
        {
            index: 0,
            traffic: <raw traffic object>,
            hostname: 'www.yahoo.com',
            port: '',
            ruleIds: [rule id, ...],
            processed: {
                <namespace>: {
                    'evt': 'v_api',
                    's': '123'
                }
            },
            processState: 'processing'
        }
    ],
    trafficGroups: {
        [<rule id>]: {
            dataKeys: {
                <namespace>: ['evt', 's']
            },
            trafficIndexes: [traffic index, ...]
        }
    }
}
*/

export default (state, {type, payload}) => {
    switch (type) {
    case 'INIT_SESSION':
    case 'INIT_PAGE':
        return initPage(state, payload);
    case 'NEW_TRAFFIC':
        return handleNewTraffic(state, payload);
    case 'PROCESS_RULE':
        return processRule(state, payload);
    case 'PROCESS_TRAFFICS':
        return processTraffics(state, payload);
    case 'PROCESSED_TRAFFIC':
        return processedTraffic(state, payload);
    case 'PROCESSING_TRAFFIC':
        return processingTraffic(state, payload);
    case 'REMOVE_RULE':
        return removeRule(state, payload);
    default:
        return state || DEFAULT_STATE;
    }
};

const removeRule = (state, {ruleId}) => {
    const trafficInfosUpdate = {};

    state.trafficInfos.forEach((trafficInfo, trafficInfoIndex) => {
        const ruleIdIndex = trafficInfo.ruleIds.indexOf(ruleId);

        if (ruleIdIndex >= 0) {
            trafficInfosUpdate[trafficInfoIndex] = {
                ruleIds: {
                    $splice: [[ruleIdIndex, 1]]
                }
            };
        }
    });

    return update(state, {
        trafficInfos: trafficInfosUpdate,
        trafficGroups: {
            $unset: [ruleId]
        }
    });
};

const initPage = (state, payload) => {
    if (!payload) {
        return state;
    }

    return processTraffics(DEFAULT_STATE, payload);
};

const processRule = (state, {ruleInfo}) => {
    const trafficIndexes = [];
    const dataKeys = {};
    const {id} = ruleInfo;
    const trafficInfosUpdate = {};

    ruleInfo.namespaces.forEach((namespace) => {
        dataKeys[namespace] = [];
    });

    state.trafficInfos.forEach((trafficInfo, index) => {
        if (isMatchingTraffic(trafficInfo, ruleInfo)) {
            trafficIndexes.push(trafficInfo.index);

            ruleInfo.namespaces.forEach((namespace) => {
                Object.keys(trafficInfo.processed[namespace] || {}).forEach((dataKey) => {
                    if (!dataKeys[namespace].includes(dataKey)) {
                        dataKeys[namespace].push(dataKey);
                    }
                });
            });

            // add rule id if not already matched
            if (trafficInfo.ruleIds.indexOf(id) === -1) {
                trafficInfosUpdate[index] = {
                    ruleIds: {
                        $push: [id]
                    }
                };
            }
        } else {
            const ruleIndex = trafficInfo.ruleIds.indexOf(id);
            // remove rule id if previously matched
            if (ruleIndex >= 0) {
                trafficInfosUpdate[index] = {
                    ruleIds: {
                        $splice: [[ruleIndex, 1]]
                    }
                };
            }
        }
    });

    Object.keys(dataKeys).forEach((namespace) => {
        dataKeys[namespace].sort();
    });

    state = update(state, {
        trafficInfos: trafficInfosUpdate,
        trafficGroups: {
            [id]: {
                $set: {
                    dataKeys,
                    trafficIndexes
                }
            }
        }
    });

    return state;
};

const processTraffics = (state, {rules}) => {
    const {ruleIds, ruleInfos} = rules;

    ruleIds.forEach((ruleId) => {
        state = processRule(state, {
            ruleInfo: ruleInfos[ruleId]
        });
    });

    return state;
};

const processedTraffic = (state, {rules, trafficIndex, processed}) => {
    const trafficGroups = state.trafficGroups;
    const trafficInfo = state.trafficInfos[trafficIndex];
    const trafficInfoUpdate = {};
    const trafficGroupsUpdate = {};

    trafficInfoUpdate.processed = {
        $set: processed
    };

    trafficInfoUpdate.processState = {
        $set: PROCESS_STATE.PROCESSED
    };

    rules.ruleIds.forEach((ruleId) => {
        const ruleInfo = rules.ruleInfos[ruleId];

        if (!isMatchingTraffic(trafficInfo, ruleInfo)) {
            return;
        }

        const dataKeys = trafficGroups[ruleInfo.id].dataKeys;
        const dataKeysUpdate = {};

        ruleInfo.namespaces.forEach((namespace) => {
            // skip if it's a new namespace
            if (!dataKeys[namespace]) {
                return;
            }

            const newNamespaceDataKeys = [];

            Object.keys(trafficInfo.processed[namespace] || {}).forEach((dataKey) => {
                if (!dataKeys[namespace].includes(dataKey)) {
                    newNamespaceDataKeys.push(dataKey);
                }
            });

            if (newNamespaceDataKeys.length > 0) {
                dataKeysUpdate[namespace] = {
                    $set: dataKeys[namespace].concat(newNamespaceDataKeys).sort()
                };
            }
        });

        trafficGroupsUpdate[ruleInfo.id] = {
            dataKeys: dataKeysUpdate
        };
    });

    state = update(state, {
        trafficInfos: {
            [trafficIndex]: trafficInfoUpdate
        },
        trafficGroups: trafficGroupsUpdate
    });

    return state;
};

const processingTraffic = (state, {trafficIndex}) => {
    state = update(state, {
        trafficInfos: {
            [trafficIndex]: {
                processState: {
                    $set: PROCESS_STATE.PROCESSING
                }
            }
        }
    });

    return state;
};

const handleNewTraffic = (state, {rules, traffic}) => {
    const filters = state.filters;
    const trafficGroups = state.trafficGroups;
    const index = state.trafficInfos.length;
    const parsedUrl = URL.parse(traffic.request.url);
    const trafficInfo = {
        index,
        traffic,
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname,
        port: parsedUrl.port,
        processed: {},
        processState: PROCESS_STATE.NOT_PROCESSED,
        ruleIds: []
    };
    const trafficGroupsUpdate = {};
    const filtersUpdate = {};

    // process query for all traffic because it's the default processor for new rules
    // will have to ask for user to reload when we do not process query by default
    trafficInfo.processed.query = {};

    rules.ruleIds.forEach((ruleId) => {
        const ruleInfo = rules.ruleInfos[ruleId];
        const dataKeys = trafficGroups[ruleInfo.id].dataKeys;

        if (!isMatchingTraffic(trafficInfo, ruleInfo)) {
            return;
        }

        trafficInfo.ruleIds.push(ruleInfo.id);

        ruleInfo.namespaces.forEach((namespace) => {
            // skip if it's a new namespace
            if (!dataKeys[namespace]) {
                return;
            }

            // setup a placeholder for async processing
            if (!trafficInfo.processed[namespace]) {
                trafficInfo.processed[namespace] = {};
            }
        });

        trafficGroupsUpdate[ruleInfo.id] = {
            trafficIndexes: {
                $push: [index]
            }
        };
    });

    filtersUpdate.domain = getSetValueUpdate(filters.domain, trafficInfo.hostname);
    filtersUpdate['has-response-header'] = getSetValuesUpdate(filters['has-response-header'], trafficInfo.traffic.response.headers, 'name');
    filtersUpdate.method = getSetValueUpdate(filters.method, trafficInfo.traffic.request.method);
    filtersUpdate['mime-type'] = getSetValueUpdate(filters['mime-type'], trafficInfo.traffic.response.content.mimeType);
    filtersUpdate['status-code'] = getSetValueUpdate(filters['status-code'], trafficInfo.traffic.response.status + '');

    state = update(state, {
        filters: filtersUpdate,
        trafficInfos: {
            $push: [trafficInfo]
        },
        trafficGroups: trafficGroupsUpdate
    });

    return state;
};

const getSetValueUpdate = (set, value) => {
    const normalizedValue = value.trim().toLowerCase();

    if (!set.includes(normalizedValue)) {
        const newSet = set.slice(0);
        newSet.push(normalizedValue);
        newSet.sort();
        return {$set: newSet};
    }

    return {};
};

const getSetValuesUpdate = (set, values, attr) => {
    const newSet = set.slice(0);

    values.forEach((value) => {
        const normalizedValue = value[attr].trim().toLowerCase();
        if (!newSet.includes(normalizedValue)) {
            newSet.push(normalizedValue);
        }
    });
    if (newSet.length > set.length) {
        newSet.sort();
        return {$set: newSet};
    }

    return {};
};
