// MV3 service worker. Kept minimal; add cross-tab orchestration here later.

chrome.runtime.onInstalled.addListener((details) => {
  console.info('[GitHub Enhancements] installed:', details.reason);
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'GX_PING') {
    sendResponse({ ok: true, ts: Date.now() });
    return; // sync
  }
});
