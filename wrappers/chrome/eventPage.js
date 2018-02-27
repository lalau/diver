import manifest from './manifest';

const handleMessage = (event, sender, sendResponse) => {
    switch (event.type) {
    case 'EXPORT_CONTENT':
        return exportContent(event);
    case 'INIT_PROCESSOR':
        return initProcessor(event, sender, sendResponse);
    case 'NAVIGATED':
        return handleNavigated(event);
    case 'PROCESS_TRAFFIC':
        return processTraffic(event, sender, sendResponse);
    case 'REMOVE_PROCESSOR':
        return removeProcessor(event);
    case 'VALIDATE_RULE':
        return validateRule(event, sender, sendResponse);
    case 'VALIDATE_NAMESPACE':
        return validateNamespace(event, sender, sendResponse);
    }
};

const handleSandboxMessage = (handler) => {
    window.addEventListener('message', handler);
    setTimeout(() => {
        window.removeEventListener('message', handler);
    }, 5000);
};

const exportContent = ({payload}) => {
    chrome.downloads.download({
        url: URL.createObjectURL(new Blob([JSON.stringify(payload.content, null, 4)], {type: 'application/json'})),
        filename: payload.name + '.json'
    });
};

const validateNamespace = ({type, payload}, sender, sendResponse) => {
    const {namespace} = payload;

    setImmediate(() => {
        sendResponse({
            type: 'VALIDATE_NAMESPACE_RESULT',
            result: {
                namespace,
                valid: !!document.getElementById('processor-' + namespace)
            }
        });
    });
    return true;
};

const validateRule = ({type, payload}, sender, sendResponse) => {
    const handleResult = (event) => {
        if (event.data.type === 'VALIDATE_RULE_RESULT') {
            sendResponse(event.data);
            window.removeEventListener('message', handleResult);
        }
    };

    handleSandboxMessage(handleResult);
    document.getElementById('sandbox-frame').contentWindow.postMessage({type, payload}, '*');
    return true;
};

const initProcessor = ({type, payload}, sender, sendResponse) => {
    const {namespace, getProcessor} = payload;

    if (!namespace || !getProcessor) {
        setImmediate(() => {
            sendResponse({
                type: 'INIT_PROCESSOR_RESULT',
                result: {
                    namespace,
                    valid: false
                }
            });
        });
        return true;
    }

    const processorIframe = document.createElement('iframe');
    const handleInitProcessor = (event) => {
        if (event.data.type === 'INIT_PROCESSOR_RESULT' && event.data.result.namespace === namespace) {
            sendResponse(event.data);
            window.removeEventListener('message', handleInitProcessor);
        }
    };

    handleSandboxMessage(handleInitProcessor);

    processorIframe.src = 'processor.html';
    processorIframe.id = 'processor-' + namespace;
    processorIframe.addEventListener('load', () => {
        processorIframe.contentWindow.postMessage({type, payload}, '*');
    });
    removeProcessor({
        payload: {namespace}
    });
    document.body.appendChild(processorIframe);
    return true;
};

const removeProcessor = ({payload}) => {
    const processorIframe = document.getElementById('processor-' + payload.namespace);
    if (processorIframe) {
        document.body.removeChild(processorIframe);
    }
};

const processTraffic = ({type, payload}, sender, sendResponse) => {
    const {namespace, navigateTimestamp, traffic, trafficIndex} = payload;
    const processorIframe = namespace && document.getElementById('processor-' + namespace);

    if (!processorIframe || !namespace || !navigateTimestamp || !traffic || typeof trafficIndex !== 'number') {
        setImmediate(() => {
            sendResponse({
                type: 'PROCESS_TRAFFIC_RESULT',
                result: {
                    namespace,
                    navigateTimestamp,
                    trafficIndex,
                    processed: {}
                }
            });
        });
        return true;
    }

    const handleProcessTraffic = (event) => {
        const result = event.data.result;
        if (event.data.type === 'PROCESS_TRAFFIC_RESULT' && result.namespace === namespace && result.navigateTimestamp === navigateTimestamp && result.trafficIndex === trafficIndex) {
            sendResponse(event.data);
            window.removeEventListener('message', handleProcessTraffic);
        }
    };

    handleSandboxMessage(handleProcessTraffic);
    processorIframe.contentWindow.postMessage({type, payload}, '*');
    return true;
};

const handleNavigated = () => {
    ga('send', 'pageview', '/eventpage.html');
};

chrome.runtime.onMessage.addListener(handleMessage);

chrome.browserAction.onClicked.addListener(() => {
    chrome.tabs.create({url: 'https://github.com/lalau/diver-docs/blob/master/diver.md'});
});

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments);},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m);})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-114277505-1', 'auto');
ga('set', 'checkProtocolTask', function(){});
ga('require', 'displayfeatures');
ga('set', 'dimension1', manifest.version);
