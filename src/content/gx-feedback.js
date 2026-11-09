(() => {
  const PUBLIC_KEY = 'pk_31194f21a913db368ded4a3773d05816c3dcb64a6146fa30';
  const API_BASE = 'https://lt3.onrender.com';
  const CONFIG_ID = 'gx-lt3-config';
  const ROOT_SELECTOR = '[data-lt3-root]';

  let host = null;

  function injectConfig() {
    if (document.getElementById(CONFIG_ID)) {
      return;
    }
    const config = document.createElement('script');
    config.id = CONFIG_ID;
    config.type = 'application/json';
    config.setAttribute('src', 'lt3-config');
    config.setAttribute('data-key', PUBLIC_KEY);
    config.setAttribute('data-api', API_BASE);
    document.documentElement.append(config);
  }

  function mount() {
    if (!host) {
      host = document.querySelector(ROOT_SELECTOR);
    }
  }

  function ensureHostAttached() {
    mount();
    if (host && !host.isConnected && document.body) {
      document.body.append(host);
    }
  }

  function open(options = {}) {
    if (!globalThis.LT3) {
      return;
    }
    ensureHostAttached();
    globalThis.LT3.open(options);
  }

  injectConfig();

  globalThis.GX = globalThis.GX || {};
  GX.feedback = { mount, open };
})();
