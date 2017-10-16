const handleMessage = (event, sender, sendResponse) => {
    switch (event.type) {
    case 'EXPORT_CONTENT':
        return exportContent(event, sender, sendResponse);
    case 'VALIDATE_RULE':
        return validateRule(event, sender, sendResponse);
    }
};

const exportContent = ({payload}) => {
    chrome.downloads.download({
        url: URL.createObjectURL(new Blob([JSON.stringify(payload.content, null, 4)], {type: 'application/json'})),
        filename: payload.name + '.json'
    });
};

const validateRule = ({type, payload}, sender, sendResponse) => {
    const handleResult = (event) => {
        if (event.data.type === 'VALIDATE_RULE_RESULT') {
            sendResponse(event.data);
            window.removeEventListener('message', handleResult);
        }
    };
    window.addEventListener('message', handleResult);
    document.getElementById('sandboxFrame').contentWindow.postMessage({type, payload}, '*');
    return true;
};

chrome.runtime.onMessage.addListener(handleMessage);

chrome.browserAction.onClicked.addListener(() => {
    chrome.tabs.create({url: 'https://github.com/lalau/diver-docs/blob/master/diver.md'});
});
