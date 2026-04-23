// Popup entry point. Communicates with the active tab's content script
// to read page context, and opens common GitHub destinations.

const QUICK_LINKS = {
  'open-prs': 'https://github.com/pulls',
  'open-issues': 'https://github.com/issues',
  'open-notifications': 'https://github.com/notifications'
};

/** @returns {Promise<chrome.tabs.Tab | undefined>} */
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function isGitHubUrl(url) {
  try {
    return new URL(url).hostname === 'github.com';
  } catch {
    return false;
  }
}

async function requestPageContext(tabId) {
  try {
    return await chrome.tabs.sendMessage(tabId, { type: 'GX_GET_CONTEXT' });
  } catch {
    // Content script may not be injected (e.g., not on github.com).
    return null;
  }
}

function renderContext(ctx) {
  const el = document.getElementById('gx-context');
  if (!ctx) {
    el.textContent = 'Not on github.com';
    return;
  }
  el.textContent = ctx.repo ? `${ctx.repo} · ${ctx.page}` : ctx.page;
}

function renderItems(items) {
  const tbody = document.querySelector('#gx-items tbody');
  tbody.replaceChildren();
  if (!items || items.length === 0) {
    const tr = document.createElement('tr');
    tr.className = 'gx-empty';
    const td = document.createElement('td');
    td.colSpan = 3;
    td.textContent = 'No items detected on this page.';
    tr.append(td);
    tbody.append(tr);
    return;
  }
  for (const item of items) {
    const tr = document.createElement('tr');

    const tdName = document.createElement('td');
    tdName.textContent = item.label;

    const tdType = document.createElement('td');
    tdType.textContent = item.type;

    const tdAction = document.createElement('td');
    if (item.url) {
      const a = document.createElement('a');
      a.href = item.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'Open';
      tdAction.append(a);
    }

    tr.append(tdName, tdType, tdAction);
    tbody.append(tr);
  }
}

async function refresh() {
  const tab = await getActiveTab();
  if (!tab || !tab.url || !isGitHubUrl(tab.url)) {
    renderContext(null);
    renderItems([]);
    return;
  }
  const ctx = await requestPageContext(tab.id);
  renderContext(ctx);
  renderItems(ctx?.items ?? []);
}

document.addEventListener('click', async (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;

  if (action in QUICK_LINKS) {
    await chrome.tabs.create({ url: QUICK_LINKS[action] });
    return;
  }

  if (action === 'reload-tab') {
    const tab = await getActiveTab();
    if (tab?.id != null) await chrome.tabs.reload(tab.id);
    return;
  }

  if (action === 'refresh') {
    await refresh();
    return;
  }
});

refresh();
