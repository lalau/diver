const handleMessage = (event, sender, sendResponse) => {
    switch (event.type) {
    case 'EXPORT_CONTENT':
        return exportContent(event, sender, sendResponse);
    case 'VALIDATE_RULE':
        return validateRule(event, sender, sendResponse);
    case 'NAVIGATED':
        return handleNavigated(event);
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

const handleNavigated = () => {
    _gaq.push(['_trackPageview']);
};

chrome.runtime.onMessage.addListener(handleMessage);

chrome.browserAction.onClicked.addListener(() => {
    chrome.tabs.create({url: 'https://github.com/lalau/diver-docs/blob/master/diver.md'});
});


var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-114277505-1']);

(function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
