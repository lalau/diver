chrome.runtime.onMessage.addListener(({type, payload}, sender, sendResponse) => {
    if (type === 'EXPORT_RULE') {
        chrome.downloads.download({
            url: URL.createObjectURL(new Blob([JSON.stringify(payload.ruleInfo)], {type: 'application/json'})),
            filename: payload.ruleInfo.id + '.json'
        });
    } else if (type === 'VALIDATE_RULE') {
        const handleResult = (event) => {
            if (event.data.type === 'VALIDATE_RULE_RESULT') {
                sendResponse(event.data);
                window.removeEventListener('message', handleResult);
            }
        };
        window.addEventListener('message', handleResult);
        document.getElementById('sandboxFrame').contentWindow.postMessage({type, payload}, '*');
        return true;
    }
});
