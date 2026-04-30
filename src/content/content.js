(() => {
  const BUTTON_ID = 'gx-enhance-btn';
  const BODY_CLASS = 'gx-enhanced';
  const STORAGE_KEY = 'gx-enabled';
  const NAV_BUTTONS_KEY = 'gx-navbar-buttons';

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

  function createCustomNavLink(def) {
    const a = GX.createNavLink({ label: def.label, href: def.url });
    a.classList.add('gx-navbar-custom-link');

    if (def.openMode === 'newTab') {
      a.target = '_blank';
      a.rel = 'noopener';
    } else if (def.openMode === 'newWindow') {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(def.url, '_blank', 'noopener,width=1200,height=800');
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
    urlInput.type = 'url';
    urlInput.placeholder = 'https://...';
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
      urlIn.type = 'url';
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
