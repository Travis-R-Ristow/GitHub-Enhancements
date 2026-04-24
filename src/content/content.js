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
      GX.repoNav.mount();
    } else {
      GX.pages.unmount();
      GX.repoNav.unmount();
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

  const NAVBAR_ID = 'gx-navbar';

  function injectNavbar() {
    if (document.getElementById(NAVBAR_ID)) {
      return;
    }
    if (!document.body) {
      return;
    }

    const nav = document.createElement('nav');
    nav.id = NAVBAR_ID;
    nav.className = 'gx-navbar';

    const left = document.createElement('div');
    left.className = 'gx-navbar__left';

    const btn = GX.createButton({
      id: BUTTON_ID,
      label: enabled ? 'Enhanced' : 'Enhance',
      title: 'Toggle GitHub Enhancements',
      pressed: enabled,
      onClick: toggle
    });
    btn.setAttribute('data-gx-sparkle', 'drop:24');
    left.append(btn);

    const right = document.createElement('div');
    right.className = 'gx-navbar__right';

    right.append(
      GX.createNavLink({
        label: 'PR Inbox',
        href: 'https://github.com/pulls/involves',
        title: 'Pull requests involving you'
      })
    );

    nav.append(left, right);
    document.body.prepend(nav);
  }

  function handleNavigation() {
    if (location.href === lastUrl) {
      return;
    }
    lastUrl = location.href;
    if (enabled) {
      GX.pages.remount();
      GX.repoNav.remount();
    }
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && STORAGE_KEY in changes) {
      enabled = Boolean(changes[STORAGE_KEY].newValue);
      applyEnhancements();
    }
  });

  loadState();
  injectNavbar();

  const observer = new MutationObserver(() => {
    injectNavbar();
    handleNavigation();
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  window.addEventListener('turbo:load', () => {
    injectNavbar();
    handleNavigation();
  });
  window.addEventListener('pjax:end', () => {
    injectNavbar();
    handleNavigation();
  });
})();
