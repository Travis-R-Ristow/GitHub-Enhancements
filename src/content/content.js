(() => {
  const BUTTON_ID = 'gx-enhance-btn';
  const BODY_CLASS = 'gx-enhanced';
  const STORAGE_KEY = 'gx-enabled';
  const NAV_BUTTONS_KEY = 'gx-navbar-buttons';
  const CUSTOM_VARS_KEY = 'gx-custom-variables';
  let cachedCustomVars = [];

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

  function makeId() {
    return 'nb_' + Math.random().toString(36).slice(2, 10);
  }

  async function loadNavButtons() {
    const list = await GX.storage.get(NAV_BUTTONS_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  async function saveNavButtons(list) {
    await GX.storage.set(NAV_BUTTONS_KEY, list);
  }

  async function loadCustomVars() {
    const list = await GX.storage.get(CUSTOM_VARS_KEY, []);
    cachedCustomVars = Array.isArray(list) ? list : [];
    return cachedCustomVars;
  }

  async function saveCustomVars(list) {
    cachedCustomVars = list;
    await GX.storage.set(CUSTOM_VARS_KEY, list);
  }

  function resolveCustomVar(v) {
    try {
      if (v.source === 'static') {
        return v.value || '';
      }
      if (v.source === 'selector') {
        const el = document.querySelector(v.value);
        return el ? el.textContent.trim() : '';
      }
      if (v.source === 'meta') {
        const el = document.querySelector('meta[name="' + CSS.escape(v.value) + '"]');
        return el ? el.getAttribute('content') || '' : '';
      }
      if (v.source === 'url') {
        const m = location.href.match(new RegExp(v.value));
        return m ? (m[1] || m[0]) : '';
      }
    } catch {
      return '';
    }
    return '';
  }

  function createVariablesSection(refreshLinks) {
    const BUILTIN_VARS = [
      { name: 'repo', desc: 'Repository name from URL' },
      { name: 'prNumber', desc: 'PR or issue number from URL' },
      { name: 'workflow_id', desc: 'Workflow file name from URL' },
      { name: 'run_id', desc: 'Action run ID from URL' }
    ];
    const BUILTIN_NAMES = new Set(BUILTIN_VARS.map((b) => b.name));
    const SOURCE_LABELS = {
      static: 'Static',
      selector: 'Selector',
      meta: 'Meta Tag',
      url: 'URL Regex'
    };
    const SOURCE_PLACEHOLDERS = {
      static: 'Value (e.g. my-team)',
      selector: 'CSS selector (e.g. .org-name)',
      meta: 'Meta tag name',
      url: 'Regex with capture group'
    };

    const section = document.createElement('details');
    section.className = 'gx-collapsible gx-vars-section';

    const summaryEl = document.createElement('summary');
    summaryEl.className = 'gx-collapsible__summary';
    summaryEl.textContent = 'Variables';
    section.append(summaryEl);

    const contentEl = document.createElement('div');
    contentEl.className = 'gx-collapsible__content';

    const biHeading = document.createElement('div');
    biHeading.className = 'gx-vars-heading';
    biHeading.textContent = 'Built-in';
    contentEl.append(biHeading);

    const biList = document.createElement('div');
    biList.className = 'gx-vars-builtin';
    for (const bi of BUILTIN_VARS) {
      const chip = document.createElement('span');
      chip.className = 'gx-vars-chip gx-vars-chip--builtin';
      chip.textContent = '{' + bi.name + '}';
      chip.title = bi.desc;
      biList.append(chip);
    }
    contentEl.append(biList);

    const custHeading = document.createElement('div');
    custHeading.className = 'gx-vars-heading';
    custHeading.textContent = 'Custom';
    contentEl.append(custHeading);

    const varsForm = document.createElement('form');
    varsForm.className = 'gx-vars-form';

    const nameIn = document.createElement('input');
    nameIn.className = 'gx-input';
    nameIn.placeholder = 'Name';
    nameIn.required = true;

    const sourceIn = document.createElement('select');
    sourceIn.className = 'gx-select';
    for (const [val, text] of Object.entries(SOURCE_LABELS)) {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = text;
      sourceIn.append(opt);
    }

    const valueIn = document.createElement('input');
    valueIn.className = 'gx-input';
    valueIn.placeholder = SOURCE_PLACEHOLDERS.static;
    valueIn.required = true;

    sourceIn.addEventListener('change', () => {
      valueIn.placeholder = SOURCE_PLACEHOLDERS[sourceIn.value] || 'Value';
    });

    const varsAddBtn = document.createElement('button');
    varsAddBtn.type = 'submit';
    varsAddBtn.className = 'gx-btn gx-btn--default';
    varsAddBtn.textContent = 'Add';

    varsForm.append(nameIn, sourceIn, valueIn, varsAddBtn);
    contentEl.append(varsForm);

    const errorEl = document.createElement('div');
    errorEl.className = 'gx-vars-error';
    errorEl.hidden = true;
    contentEl.append(errorEl);

    const varsList = document.createElement('ul');
    varsList.className = 'gx-vars-list';
    contentEl.append(varsList);

    function showError(msg) {
      errorEl.textContent = msg;
      errorEl.hidden = false;
      clearTimeout(errorEl._timer);
      errorEl._timer = setTimeout(() => {
        errorEl.hidden = true;
      }, 3000);
    }

    function renderItem(v) {
      const li = document.createElement('li');
      li.className = 'gx-vars-item';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'gx-vars-item__name';
      nameSpan.textContent = '{' + v.name + '}';

      const badge = document.createElement('span');
      badge.className = 'gx-vars-item__badge';
      badge.dataset.source = v.source;
      badge.textContent = SOURCE_LABELS[v.source] || v.source;

      const valSpan = document.createElement('span');
      valSpan.className = 'gx-vars-item__value';
      valSpan.textContent = v.value;
      valSpan.title = v.value;

      const actions = document.createElement('div');
      actions.className = 'gx-navbar-modal-actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'gx-btn gx-btn--ghost';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => {
        li.replaceWith(renderEditItem(v));
      });

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'gx-btn gx-btn--ghost gx-navbar-modal-delete';
      delBtn.textContent = '🗑';
      delBtn.title = 'Delete';
      delBtn.addEventListener('click', async () => {
        const current = await loadCustomVars();
        await saveCustomVars(current.filter((cv) => cv.id !== v.id));
        refreshVarsList();
        refreshLinks();
      });

      actions.append(editBtn, delBtn);
      li.append(nameSpan, badge, valSpan, actions);
      return li;
    }

    function renderEditItem(v) {
      const li = document.createElement('li');
      li.className = 'gx-vars-item gx-vars-item--editing';

      const nameEdit = document.createElement('input');
      nameEdit.className = 'gx-input';
      nameEdit.value = v.name;

      const sourceEdit = document.createElement('select');
      sourceEdit.className = 'gx-select';
      for (const [val, text] of Object.entries(SOURCE_LABELS)) {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = text;
        if (val === v.source) {
          opt.selected = true;
        }
        sourceEdit.append(opt);
      }

      const valueEdit = document.createElement('input');
      valueEdit.className = 'gx-input';
      valueEdit.value = v.value;

      const actions = document.createElement('div');
      actions.className = 'gx-navbar-modal-actions';

      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'gx-btn gx-btn--default';
      saveBtn.textContent = 'Save';
      saveBtn.addEventListener('click', async () => {
        const newName = nameEdit.value.trim();
        if (!newName || !/^\w+$/.test(newName)) {
          showError('Name must be letters, numbers, or underscores.');
          return;
        }
        if (BUILTIN_NAMES.has(newName)) {
          showError('"' + newName + '" is a built-in variable.');
          return;
        }
        const current = await loadCustomVars();
        const dupe = current.find((cv) => cv.name === newName && cv.id !== v.id);
        if (dupe) {
          showError('"' + newName + '" already exists.');
          return;
        }
        const idx = current.findIndex((cv) => cv.id === v.id);
        if (idx === -1) {
          return;
        }
        current[idx] = {
          ...current[idx],
          name: newName,
          source: sourceEdit.value,
          value: valueEdit.value.trim() || current[idx].value
        };
        await saveCustomVars(current);
        refreshVarsList();
        refreshLinks();
      });

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'gx-btn gx-btn--ghost';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', () => {
        li.replaceWith(renderItem(v));
      });

      actions.append(saveBtn, cancelBtn);
      li.append(nameEdit, sourceEdit, valueEdit, actions);
      return li;
    }

    async function refreshVarsList() {
      const items = await loadCustomVars();
      varsList.textContent = '';
      if (items.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'gx-navbar-modal-empty';
        empty.textContent = 'No custom variables yet.';
        varsList.append(empty);
        return;
      }
      for (const v of items) {
        varsList.append(renderItem(v));
      }
    }

    varsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = nameIn.value.trim();
      const value = valueIn.value.trim();
      if (!name || !value) {
        return;
      }
      if (!/^\w+$/.test(name)) {
        showError('Name must be letters, numbers, or underscores.');
        return;
      }
      if (BUILTIN_NAMES.has(name)) {
        showError('"' + name + '" is a built-in variable.');
        return;
      }
      const items = await loadCustomVars();
      if (items.some((cv) => cv.name === name)) {
        showError('"' + name + '" already exists.');
        return;
      }
      items.push({ id: makeId(), name, source: sourceIn.value, value });
      await saveCustomVars(items);
      nameIn.value = '';
      valueIn.value = '';
      sourceIn.value = 'static';
      valueIn.placeholder = SOURCE_PLACEHOLDERS.static;
      nameIn.focus();
      refreshVarsList();
      refreshLinks();
    });

    refreshVarsList();

    section.append(contentEl);
    return section;
  }

  const TOKEN_RE = /\{(\w+)\}/g;
  const RESERVED_OWNERS = new Set([
    'settings', 'notifications', 'marketplace', 'explore', 'search', 'pulls',
    'issues', 'new', 'organizations', 'sponsors', 'about', 'contact',
    'features', 'topics', 'collections', 'trending', 'codespaces', 'dashboard'
  ]);

  function pageContext() {
    const ctx = { repo: '', prNumber: '', workflow_id: '', run_id: '' };
    const parts = location.pathname.split('/').filter(Boolean);
    const nwo = document.querySelector('meta[name="octolytics-dimension-repository_nwo"]');

    if (nwo && nwo.content.includes('/')) {
      ctx.repo = nwo.content.split('/')[1];
    } else if (parts.length >= 2 && !RESERVED_OWNERS.has(parts[0])) {
      ctx.repo = parts[1];
    }

    if (parts.length >= 4 && (parts[2] === 'pull' || parts[2] === 'issues') && /^\d+$/.test(parts[3])) {
      ctx.prNumber = parts[3];
    }

    if (parts.length >= 5 && parts[2] === 'actions') {
      if (parts[3] === 'runs' && /^\d+$/.test(parts[4])) {
        ctx.run_id = parts[4];
      }
      if (parts[3] === 'workflows' && parts[4]) {
        ctx.workflow_id = parts[4];
      }
    }

    if (ctx.run_id && !ctx.workflow_id) {
      const wfLink = document.querySelector('a[href*="/actions/workflows/"]');
      if (wfLink) {
        const m = wfLink.href.match(/\/actions\/workflows\/([^/?#]+)/);
        if (m) {
          ctx.workflow_id = m[1];
        }
      }
    }

    for (const v of cachedCustomVars) {
      if (!(v.name in ctx)) {
        ctx[v.name] = resolveCustomVar(v);
      }
    }

    return ctx;
  }

  function resolveTemplate(template, ctx) {
    const missing = [];
    const resolved = template.replace(TOKEN_RE, (match, key) => {
      const value = ctx[key];
      if (value === undefined || value === '') {
        if (!missing.includes(key)) {
          missing.push(key);
        }
        return match;
      }
      return encodeURIComponent(value);
    });
    return { resolved, missing };
  }

  function createCustomNavLink(def) {
    const { resolved, missing } = resolveTemplate(def.url, pageContext());

    if (missing.length > 0) {
      const span = document.createElement('span');
      span.className = 'gx-nav-link gx-nav-link--disabled gx-navbar-custom-link';
      span.textContent = def.label;
      span.setAttribute('aria-disabled', 'true');
      span.title = `Unavailable here — needs: ${missing.map((k) => `{${k}}`).join(', ')}`;
      return span;
    }

    const a = GX.createNavLink({ label: def.label, href: resolved });
    a.classList.add('gx-navbar-custom-link');

    if (def.openMode === 'newTab') {
      a.target = '_blank';
      a.rel = 'noopener';
    } else if (def.openMode === 'newWindow') {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(resolved, '_blank', 'noopener,width=1200,height=800');
      });
    }

    return a;
  }

  async function renderCustomLinks(container) {
    const buttons = await loadNavButtons();
    container.textContent = '';
    for (const def of buttons) {
      container.append(createCustomNavLink(def));
    }
  }

  function openManageModal(refreshLinks) {
    const { body } = GX.modal.open({ title: 'Manage navbar buttons' });

    const form = document.createElement('form');
    form.className = 'gx-navbar-modal-form';

    const labelInput = document.createElement('input');
    labelInput.className = 'gx-input';
    labelInput.placeholder = 'Label';
    labelInput.required = true;

    const urlInput = document.createElement('input');
    urlInput.className = 'gx-input';
    urlInput.placeholder = 'https://... or use {token} placeholders';
    urlInput.required = true;

    const modeSelect = document.createElement('select');
    modeSelect.className = 'gx-select';
    for (const [value, text] of [['tab', 'In Tab'], ['newTab', 'New Tab'], ['newWindow', 'New Window']]) {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = text;
      modeSelect.append(opt);
    }

    const addBtn = document.createElement('button');
    addBtn.type = 'submit';
    addBtn.className = 'gx-btn gx-btn--default';
    addBtn.textContent = 'Add';

    form.append(labelInput, urlInput, modeSelect, addBtn);
    body.append(form);

    const hint = document.createElement('small');
    hint.className = 'gx-navbar-modal-hint';
    hint.textContent = 'Use {variableName} tokens in URLs. Buttons disable when a token is unavailable.';
    body.append(hint);

    body.append(createVariablesSection(refreshLinks));

    const list = document.createElement('ul');
    list.className = 'gx-navbar-modal-list';
    body.append(list);

    const MODE_LABELS = { tab: 'In Tab', newTab: 'New Tab', newWindow: 'New Window' };
    let dragId = null;

    function createModeSelect(selected) {
      const select = document.createElement('select');
      select.className = 'gx-select';
      for (const [value, text] of Object.entries(MODE_LABELS)) {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = text;
        if (value === selected) {
          opt.selected = true;
        }
        select.append(opt);
      }
      return select;
    }

    function renderViewRow(item) {
      const li = document.createElement('li');
      li.className = 'gx-navbar-modal-item';
      li.draggable = true;
      li.dataset.id = item.id;

      const grip = document.createElement('span');
      grip.className = 'gx-navbar-modal-grip';
      grip.textContent = '⠿';
      grip.title = 'Drag to reorder';

      const label = document.createElement('span');
      label.className = 'gx-navbar-modal-item__label';
      label.textContent = item.label;

      const url = document.createElement('span');
      url.className = 'gx-navbar-modal-item__url';
      url.textContent = item.url;

      const badge = document.createElement('span');
      badge.className = 'gx-navbar-modal-item__badge';
      badge.dataset.mode = item.openMode || 'tab';
      badge.textContent = MODE_LABELS[item.openMode] || MODE_LABELS.tab;

      const actions = document.createElement('div');
      actions.className = 'gx-navbar-modal-actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'gx-btn gx-btn--ghost';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => {
        const editRow = renderEditRow(item);
        li.replaceWith(editRow);
      });

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'gx-btn gx-btn--ghost gx-navbar-modal-delete';
      delBtn.textContent = '🗑';
      delBtn.title = 'Delete';
      delBtn.addEventListener('click', async () => {
        const current = await loadNavButtons();
        await saveNavButtons(current.filter((b) => b.id !== item.id));
        refreshList();
        refreshLinks();
      });

      actions.append(editBtn, delBtn);
      li.append(grip, label, url, badge, actions);

      li.addEventListener('dragstart', (e) => {
        dragId = item.id;
        li.classList.add('gx-navbar-modal-item--dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      li.addEventListener('dragend', () => {
        dragId = null;
        li.classList.remove('gx-navbar-modal-item--dragging');
        list.querySelectorAll('.gx-navbar-modal-item--dragover').forEach((el) => {
          el.classList.remove('gx-navbar-modal-item--dragover');
        });
      });

      li.addEventListener('dragover', (e) => {
        if (!dragId || dragId === item.id) {
          return;
        }
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        list.querySelectorAll('.gx-navbar-modal-item--dragover').forEach((el) => {
          el.classList.remove('gx-navbar-modal-item--dragover');
        });
        li.classList.add('gx-navbar-modal-item--dragover');
      });

      li.addEventListener('drop', async (e) => {
        e.preventDefault();
        li.classList.remove('gx-navbar-modal-item--dragover');
        if (!dragId || dragId === item.id) {
          return;
        }
        const items = await loadNavButtons();
        const fromIdx = items.findIndex((b) => b.id === dragId);
        const toIdx = items.findIndex((b) => b.id === item.id);
        if (fromIdx === -1 || toIdx === -1) {
          return;
        }
        const [moved] = items.splice(fromIdx, 1);
        items.splice(toIdx, 0, moved);
        await saveNavButtons(items);
        dragId = null;
        refreshList();
        refreshLinks();
      });

      return li;
    }

    function renderEditRow(item) {
      const li = document.createElement('li');
      li.className = 'gx-navbar-modal-item gx-navbar-modal-item--editing';

      const labelIn = document.createElement('input');
      labelIn.className = 'gx-input';
      labelIn.value = item.label;

      const urlIn = document.createElement('input');
      urlIn.className = 'gx-input';
      urlIn.value = item.url;

      const modeIn = createModeSelect(item.openMode || 'tab');

      const actions = document.createElement('div');
      actions.className = 'gx-navbar-modal-actions';

      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'gx-btn gx-btn--default';
      saveBtn.textContent = 'Save';
      saveBtn.addEventListener('click', async () => {
        const current = await loadNavButtons();
        const idx = current.findIndex((b) => b.id === item.id);
        if (idx === -1) {
          return;
        }
        current[idx] = {
          ...current[idx],
          label: labelIn.value.trim() || current[idx].label,
          url: urlIn.value.trim() || current[idx].url,
          openMode: modeIn.value
        };
        await saveNavButtons(current);
        refreshList();
        refreshLinks();
      });

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'gx-btn gx-btn--ghost';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', () => {
        const viewRow = renderViewRow(item);
        li.replaceWith(viewRow);
      });

      actions.append(saveBtn, cancelBtn);
      li.append(labelIn, urlIn, modeIn, actions);
      return li;
    }

    async function refreshList() {
      const items = await loadNavButtons();
      list.textContent = '';
      if (items.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'gx-navbar-modal-empty';
        empty.textContent = 'No saved buttons yet.';
        list.append(empty);
        return;
      }
      for (const item of items) {
        list.append(renderViewRow(item));
      }
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const label = labelInput.value.trim();
      const url = urlInput.value.trim();
      if (!label || !url) {
        return;
      }
      const items = await loadNavButtons();
      items.push({ id: makeId(), label, url, openMode: modeSelect.value });
      await saveNavButtons(items);
      labelInput.value = '';
      urlInput.value = '';
      modeSelect.value = 'tab';
      labelInput.focus();
      refreshList();
      refreshLinks();
    });

    refreshList();
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

    const customLinksContainer = document.createElement('div');
    customLinksContainer.className = 'gx-navbar__custom-links';

    const refreshLinks = () => renderCustomLinks(customLinksContainer);

    right.append(customLinksContainer);

    const manageBtn = GX.createButton({
      label: 'Add Buttons',
      title: 'Manage navbar buttons',
      variant: 'ghost',
      onClick: () => openManageModal(refreshLinks),
      className: 'gx-navbar-manage-btn'
    });
    right.append(manageBtn);

    const feedbackBtn = GX.createButton({
      label: 'Feedback',
      title: 'Report a bug, share an idea, or send praise',
      variant: 'ghost',
      onClick: () => GX.feedback.open({ label: 'navbar' }),
      className: 'gx-navbar-feedback-btn'
    });
    right.append(feedbackBtn);

    nav.append(left, right);
    document.body.prepend(nav);

    refreshLinks();
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
    const container = document.querySelector('.gx-navbar__custom-links');
    if (container) {
      renderCustomLinks(container);
    }
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && STORAGE_KEY in changes) {
      enabled = Boolean(changes[STORAGE_KEY].newValue);
      applyEnhancements();
    }
    if (area === 'local' && NAV_BUTTONS_KEY in changes) {
      const container = document.querySelector('.gx-navbar__custom-links');
      if (container) {
        renderCustomLinks(container);
      }
    }
    if (area === 'local' && CUSTOM_VARS_KEY in changes) {
      const val = changes[CUSTOM_VARS_KEY].newValue;
      cachedCustomVars = Array.isArray(val) ? val : [];
      const container = document.querySelector('.gx-navbar__custom-links');
      if (container) {
        renderCustomLinks(container);
      }
    }
  });

  loadCustomVars();
  loadState();
  GX.feedback.mount();
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
  window.addEventListener('turbo:render', () => {
    handleNavigation();
  });
  window.addEventListener('popstate', () => {
    handleNavigation();
  });
  window.addEventListener('pjax:end', () => {
    injectNavbar();
    handleNavigation();
  });
})();
