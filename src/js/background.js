chrome.runtime.onMessage.addListener(function(request, sender) {
    console.log(sender.tab.id, request.redirect);
    chrome.tabs.update(sender.tab.id, {url: request.redirect});
});