const validateProcessedData = (obj) => {
    if (!obj || typeof obj !== 'object') {
        return {};
    }

    Object.keys(obj).forEach((key) => {
        const value = obj[key];

        if (typeof key === 'string' && (typeof value === 'string' || (Array.isArray(value) && value.every(v => typeof v === 'string')))) {
            return;
        }

        delete obj[key];
    });

    return obj;
};

window.addEventListener('message', function(event) {
    const type = event.data.type;
    const payload = event.data.payload;

    if (type === 'INIT_PROCESSOR') {
        let error;
        try {
            eval('window.processor = (' + payload.getProcessor + ')()');
        } catch (e) {
            error = e.message;
            window.processor = null;
        }
        const processor = window.processor;
        if (processor) {
            if (!processor.name) {
                error = 'Processor \'name\' not returned';
            } else if (processor.namespace !== payload.namespace) {
                error = 'Processor \'namespace\' does not match';
            } else if (processor.process) {
                error = 'Processor \'process\' function not found';
            }
        }
        event.source.postMessage({
            type: 'INIT_PROCESSOR_RESULT',
            result: {
                name: processor && processor.name,
                namespace: payload.namespace,
                valid: processor && processor.name && processor.namespace === payload.namespace && typeof processor.process === 'function',
                error
            }
        }, event.origin);
    } else if (type === 'PROCESS_TRAFFIC') {
        const processor = window.processor;
        let error;

        if (!processor || typeof processor.process !== 'function') {
            return;
        }

        let processed;

        try {
            processed = validateProcessedData(processor.process(payload.traffic));
        } catch (e) {
            error = e.toString();
            processed = {};
        }

        event.source.postMessage({
            type: 'PROCESS_TRAFFIC_RESULT',
            result: {
                namespace: payload.namespace,
                navigateTimestamp: payload.navigateTimestamp,
                trafficIndex: payload.trafficIndex,
                processed,
                error
            }
        }, event.origin);
    }
});
