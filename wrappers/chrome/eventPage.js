import manifest from './manifest';

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
