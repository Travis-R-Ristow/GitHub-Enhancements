(() => {
  const BUTTON_ID = 'gx-enhance-btn';
  const BODY_CLASS = 'gx-enhanced';
  const STORAGE_KEY = 'gx-enabled';

  let enabled = false;
  let lastUrl = location.href;

  function applyButtonState() {
    const btn = document.getElementById(BUTTON_ID);
    if (btn) {
      GX.setLabel(btn, enabled ? 'Enhanced' : 'Enhance');
      GX.setPressed(btn, enabled);
    }
  }

  function applyEnhancements() {
    document.body.classList.toggle(BODY_CLASS, enabled);
    if (enabled) {
      GX.pages.mount();
    } else {
      GX.pages.unmount();
    }
    applyButtonState();
  }

  async function loadState() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    enabled = Boolean(result[STORAGE_KEY]);
    applyEnhancements();
  }

  async function toggle() {
    enabled = !enabled;
    await chrome.storage.local.set({ [STORAGE_KEY]: enabled });
    applyEnhancements();
    if (enabled) {
      GX.sparkleAll({ stagger: 80, count: 18 });
    }
  }

  function findHost() {
    return (
      document.querySelector('.AppHeader-globalBar-end') ||
      document.querySelector('header')
    );
  }

  function injectButton() {
    if (document.getElementById(BUTTON_ID)) {
      return;
    }
    const host = findHost();
    if (!host) {
      return;
    }
    const btn = GX.createButton({
      id: BUTTON_ID,
      label: enabled ? 'Enhanced' : 'Enhance',
      title: 'Toggle GitHub Enhancements',
      pressed: enabled,
      onClick: toggle
    });
    btn.setAttribute('data-gx-sparkle', 'drop:24');
    host.prepend(btn);
  }

  function handleNavigation() {
    if (location.href === lastUrl) {
      return;
    }
    lastUrl = location.href;
    if (enabled) {
      GX.pages.remount();
    }
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && STORAGE_KEY in changes) {
      enabled = Boolean(changes[STORAGE_KEY].newValue);
      applyEnhancements();
    }
  });

  loadState();
  injectButton();

  const observer = new MutationObserver(() => {
    injectButton();
    handleNavigation();
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  window.addEventListener('turbo:load', () => {
    injectButton();
    handleNavigation();
  });
  window.addEventListener('pjax:end', () => {
    injectButton();
    handleNavigation();
  });
})();
