(() => {
  const TAB_ID = 'gx-releases-tab';
  const RELEASES_PATH = /^\/[^/]+\/[^/]+\/releases/;

  const TAG_ICON =
    '<svg data-component="Octicon" aria-hidden="true" focusable="false" class="octicon octicon-tag" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" display="inline-block" overflow="visible" style="vertical-align:text-bottom"><path d="M1 7.775V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 0 1 0 2.474l-5.026 5.026a1.75 1.75 0 0 1-2.474 0l-6.25-6.25A1.752 1.752 0 0 1 1 7.775Zm1.5 0c0 .066.026.13.073.177l6.25 6.25a.25.25 0 0 0 .354 0l5.025-5.025a.25.25 0 0 0 0-.354l-6.25-6.25a.25.25 0 0 0-.177-.073H2.75a.25.25 0 0 0-.25.25ZM6 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"/></svg>';

  function getRepoNav() {
    const nav = document.querySelector('nav[aria-label="Repository"]');
    if (!nav) {
      return null;
    }
    return nav.querySelector('ul[role="list"]') || nav.querySelector('ul');
  }

  function getActionsTab() {
    return document.querySelector('[data-tab-item="actions"]');
  }

  function getRepoBase() {
    const codeTab = document.querySelector('[data-tab-item="code"]');
    if (codeTab) {
      return new URL(codeTab.href, location.origin).pathname.replace(/\/$/, '');
    }
    const match = location.pathname.match(/^\/[^/]+\/[^/]+/);
    return match ? match[0] : null;
  }

  function isReleasesPage() {
    return RELEASES_PATH.test(location.pathname);
  }

  function injectTab() {
    if (document.getElementById(TAB_ID)) {
      return null;
    }

    const nav = getRepoNav();
    if (!nav) {
      return null;
    }

    const repoBase = getRepoBase();
    if (!repoBase) {
      return null;
    }

    const actionsTab = getActionsTab();
    const refTab = actionsTab || nav.querySelector('a');
    if (!refTab) {
      return null;
    }

    const refLi = refTab.closest('li');
    const li = document.createElement('li');
    if (refLi) {
      li.className = refLi.className;
    }

    const a = document.createElement('a');
    a.id = TAB_ID;
    a.href = `${repoBase}/releases`;
    a.className = refTab.className;
    a.setAttribute('data-discover', 'true');
    a.setAttribute('data-tab-item', 'gx-releases');
    a.removeAttribute('aria-current');

    if (isReleasesPage()) {
      a.setAttribute('aria-current', 'page');
      nav.querySelectorAll('a[aria-current]').forEach((tab) => {
        tab.removeAttribute('aria-current');
      });
    }

    const iconSpan = document.createElement('span');
    iconSpan.setAttribute('data-component', 'icon');
    iconSpan.innerHTML = TAG_ICON;

    const label = document.createElement('span');
    label.setAttribute('data-component', 'text');
    label.setAttribute('data-content', 'Releases');
    label.textContent = 'Releases';

    a.append(iconSpan, label);
    li.appendChild(a);

    const actionsLi = actionsTab ? actionsTab.closest('li') : null;
    if (actionsLi) {
      actionsLi.after(li);
    } else {
      nav.appendChild(li);
    }

    return () => {
      li.remove();
    };
  }

  let cleanup = null;

  function mount() {
    if (!cleanup) {
      cleanup = injectTab();
    }
  }

  function unmount() {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  }

  function remount() {
    unmount();
    mount();
  }

  globalThis.GX = globalThis.GX || {};
  GX.repoNav = { mount, unmount, remount };
})();
