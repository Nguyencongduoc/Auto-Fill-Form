importScripts("core.js", "library.js", "bundled.js");

/* Serialize read/modify/write operations across all side panels. */
let libraryQueue = Promise.resolve();
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id || message.channel !== "aff-library") return false;
  const operation = libraryQueue.then(async () => {
    const stored = await chrome.storage.local.get(["answerLibrary", "answerBank"]);
    const initialized = AutoFillLibrary.initialize(stored.answerLibrary, stored.answerBank);
    let library = initialized.library;
    if (initialized.migrated) {
      await chrome.storage.local.set({ answerLibrary: library });
      if (stored.answerBank && !initialized.warning) await chrome.storage.local.remove("answerBank");
    }
    if (message.op === "list") return { library, warning: initialized.warning };
    const result = AutoFillLibrary.mutate(library, message, { newId: crypto.randomUUID(), bundledFormId: AutoFillBundled.formId });
    await chrome.storage.local.set({ answerLibrary: result.library });
    return { ...result, warning: initialized.warning };
  });
  libraryQueue = operation.catch(() => {});
  operation.then((data) => respond({ ok: true, data }), (error) => respond({ ok: false, error: error.message }));
  return true;
});

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
