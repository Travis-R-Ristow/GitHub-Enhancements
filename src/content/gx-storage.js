(() => {
  function isAlive() {
    try {
      return Boolean(chrome?.runtime?.id);
    } catch {
      return false;
    }
  }

  async function get(key, fallback = null) {
    if (!isAlive()) {
      return fallback;
    }
    try {
      const result = await chrome.storage.local.get(key);
      return result[key] === undefined ? fallback : result[key];
    } catch {
      return fallback;
    }
  }

  async function set(key, value) {
    if (!isAlive()) {
      return;
    }
    try {
      await chrome.storage.local.set({ [key]: value });
    } catch {}
  }

  function onChange(key, handler) {
    if (!isAlive()) {
      return () => {};
    }
    const listener = (changes, area) => {
      if (area === 'local' && key in changes) {
        handler(changes[key].newValue, changes[key].oldValue);
      }
    };
    try {
      chrome.storage.onChanged.addListener(listener);
    } catch {
      return () => {};
    }
    return () => {
      try {
        chrome.storage.onChanged.removeListener(listener);
      } catch {}
    };
  }

  globalThis.GX = globalThis.GX || {};
  GX.storage = { get, set, onChange };
})();
