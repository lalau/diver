chrome.runtime.onMessage.addListener(({type, payload}) => {
    if (type === 'EXPORT_RULE') {
        chrome.downloads.download({
            url: URL.createObjectURL(new Blob([JSON.stringify(payload.ruleInfo)], {type: 'application/json'})),
            filename: payload.ruleInfo.id + '.json'
        });
    }
});
