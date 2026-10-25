/* Opening the panel must run directly in the user-gesture handler. */
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId }).catch(console.error);
  chrome.storage.session.set({ [`target:${tab.windowId}`]: tab.id }).catch(console.error);
  chrome.runtime.sendMessage({ channel: "aff-ui", type: "target", tabId: tab.id, windowId: tab.windowId }).catch(() => {});
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.session.get(null).then((items) => {
    const keys = Object.keys(items).filter((key) => key.startsWith("target:") && items[key] === tabId);
    if (keys.length) return chrome.storage.session.remove(keys);
  }).catch(() => {});
});
