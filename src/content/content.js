// Content script: runs on github.com pages.
// - Responds to popup requests for page context.
// - Injects a small "Enhance" button as a scaffold for in-page actions.

(() => {
  const PAGE_TYPES = [
    { test: /^\/[^/]+\/[^/]+\/pull\/\d+/, name: 'pull-request' },
    { test: /^\/[^/]+\/[^/]+\/issues\/\d+/, name: 'issue' },
    { test: /^\/[^/]+\/[^/]+\/pulls\/?$/, name: 'pulls-list' },
    { test: /^\/[^/]+\/[^/]+\/issues\/?$/, name: 'issues-list' },
    { test: /^\/[^/]+\/[^/]+\/?$/, name: 'repo-home' },
    { test: /^\/notifications/, name: 'notifications' },
    { test: /^\/?$/, name: 'dashboard' }
  ];

  function detectPage() {
    const path = location.pathname;
    const match = PAGE_TYPES.find((p) => p.test.test(path));
    return match ? match.name : 'other';
  }

  function detectRepo() {
    const m = location.pathname.match(/^\/([^/]+)\/([^/]+)(?:\/|$)/);
    if (!m) return null;
    const [, owner, repo] = m;
    // Ignore reserved owner-less paths.
    if (
      ['notifications', 'pulls', 'issues', 'settings', 'marketplace'].includes(
        owner
      )
    ) {
      return null;
    }
    return `${owner}/${repo}`;
  }

  /** Collect a few useful items currently visible on the page. */
  function collectItems() {
    const items = [];

    // PR / Issue list rows.
    const rows = document.querySelectorAll(
      'div[aria-label="Issues"] a[data-hovercard-type="issue"], ' +
        'div[aria-label="Issues"] a[data-hovercard-type="pull_request"], ' +
        '.js-issue-row a.Link--primary'
    );
    for (const a of rows) {
      items.push({
        label: a.textContent.trim().slice(0, 80),
        type: a.dataset.hovercardType === 'pull_request' ? 'PR' : 'Issue',
        url: a.href
      });
      if (items.length >= 25) break;
    }

    // Files in a PR diff.
    if (items.length === 0) {
      const files = document.querySelectorAll('.file-header [data-path]');
      for (const f of files) {
        items.push({
          label: f.getAttribute('data-path'),
          type: 'File',
          url:
            f.closest('.file')?.querySelector('a.Link--primary')?.href ?? null
        });
        if (items.length >= 25) break;
      }
    }

    return items;
  }

  function getContext() {
    return {
      page: detectPage(),
      repo: detectRepo(),
      url: location.href,
      items: collectItems()
    };
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'GX_GET_CONTEXT') {
      sendResponse(getContext());
      return; // sync response
    }
  });

  // ---- In-page button scaffold -------------------------------------------------

  const BUTTON_ID = 'gx-enhance-btn';

  function injectButton() {
    if (document.getElementById(BUTTON_ID)) return;

    // Anchor next to the repo nav header when available, otherwise body.
    const host =
      document.querySelector('.AppHeader-globalBar-end') ||
      document.querySelector('header');
    if (!host) return;

    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.type = 'button';
    btn.className = 'gx-enhance-btn';
    btn.textContent = '✦ Enhance';
    btn.title = 'GitHub Enhancements';
    btn.addEventListener('click', () => {
      const ctx = getContext();
      // Placeholder action; real enhancements will hook in here.
      console.info('[GitHub Enhancements] context:', ctx);
      btn.animate(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(0.96)' },
          { transform: 'scale(1)' }
        ],
        { duration: 180 }
      );
    });

    host.prepend(btn);
  }

  // GitHub uses Turbo/pjax navigation. Re-inject on SPA navigations.
  injectButton();
  const observer = new MutationObserver(() => injectButton());
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  window.addEventListener('turbo:load', injectButton);
  window.addEventListener('pjax:end', injectButton);
})();
