chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;

  const url = tab.url || "";
  if (!/^https?:\/\/(www\.|web\.|m\.)?facebook\.com\//i.test(url)) {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => alert("Abra uma página do Facebook para executar o raspador.")
    });
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content_script.js"]
    });
  } catch (err) {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (msg) => alert("Não foi possível executar o raspador nesta página: " + msg),
      args: [String(err && err.message ? err.message : err)]
    });
  }
});
