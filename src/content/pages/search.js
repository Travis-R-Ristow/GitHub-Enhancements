(() => {
  const FORCE_CODE_KEY = 'gx-force-code-search';
  const STORAGE_KEY = 'gx-search-buttons';

  function match(url) {
    const u = new URL(url);
    return u.pathname === '/search' || u.pathname.startsWith('/search/');
  }

  function findHost() {
    return document.querySelector('.application-main') || document.body;
  }

  function currentType() {
    return new URL(location.href).searchParams.get('type') || 'repositories';
  }

  function currentQuery() {
    return new URL(location.href).searchParams.get('q') || '';
  }

  function isForceCodeOn() {
    return sessionStorage.getItem(FORCE_CODE_KEY) === '1';
  }

  function setForceCode(on) {
    if (on) {
      sessionStorage.setItem(FORCE_CODE_KEY, '1');
    } else {
      sessionStorage.removeItem(FORCE_CODE_KEY);
    }
  }

  function ensureCodeType() {
    if (currentType() === 'code') {
      return;
    }
    const url = new URL(location.href);
    url.searchParams.set('type', 'code');
    location.replace(url.toString());
  }

  function tokensIn(query) {
    return query.trim().split(/\s+/).filter(Boolean);
  }

  function fragmentTokens(fragment) {
    return tokensIn(fragment);
  }

  function queryHasFragment(query, fragment) {
    const have = new Set(tokensIn(query));
    return fragmentTokens(fragment).every((t) => have.has(t));
  }

  function addFragment(query, fragment) {
    const tokens = tokensIn(query);
    const have = new Set(tokens);
    for (const t of fragmentTokens(fragment)) {
      if (!have.has(t)) {
        tokens.push(t);
        have.add(t);
      }
    }
    return tokens.join(' ');
  }

  function removeFragment(query, fragment) {
    const remove = new Set(fragmentTokens(fragment));
    return tokensIn(query)
      .filter((t) => !remove.has(t))
      .join(' ');
  }

  function applyQuery(newQuery) {
    const url = new URL(location.href);
    if (newQuery) {
      url.searchParams.set('q', newQuery);
    } else {
      url.searchParams.delete('q');
    }
    location.assign(url.toString());
  }

  async function loadButtons() {
    const list = await GX.storage.get(STORAGE_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  async function saveButtons(list) {
    await GX.storage.set(STORAGE_KEY, list);
  }

  function makeId() {
    return 'b_' + Math.random().toString(36).slice(2, 10);
  }

  const KNOWN_PREFIXES = new Set([
    'repo',
    'org',
    'user',
    'language',
    'path',
    'filename',
    'extension',
    'in',
    'size',
    'fork',
    'archived',
    'is',
    'created',
    'pushed',
    'stars',
    'topic',
    'license',
    'author',
    'committer',
    'commenter',
    'assignee',
    'mentions',
    'team',
    'state',
    'type',
    'label',
    'milestone',
    'project',
    'head',
    'base',
    'status',
    'review',
    'reviewed-by'
  ]);

  function renderTokens(text) {
    const frag = document.createDocumentFragment();
    const tokens = String(text || '').split(/(\s+)/);
    for (const t of tokens) {
      if (!t) {
        continue;
      }
      if (/^\s+$/.test(t)) {
        frag.append(document.createTextNode(t));
        continue;
      }
      const colon = t.indexOf(':');
      if (colon > 0 && KNOWN_PREFIXES.has(t.slice(0, colon).toLowerCase())) {
        const wrap = document.createElement('span');
        wrap.className = 'gx-token';
        const key = document.createElement('span');
        key.className = 'gx-token__key';
        key.textContent = t.slice(0, colon + 1);
        const val = document.createElement('span');
        val.className = 'gx-token__val';
        val.textContent = t.slice(colon + 1);
        wrap.append(key, val);
        frag.append(wrap);
      } else {
        const plain = document.createElement('span');
        plain.className = 'gx-token gx-token--plain';
        plain.textContent = t;
        frag.append(plain);
      }
    }
    return frag;
  }

  function makePreviewedInput(initialValue) {
    const wrap = document.createElement('div');
    wrap.className = 'gx-previewed';
    const mirror = document.createElement('div');
    mirror.className = 'gx-token-mirror';
    mirror.setAttribute('aria-hidden', 'true');
    const input = document.createElement('input');
    input.className = 'gx-input gx-input--styled';
    input.type = 'text';
    input.spellcheck = false;
    input.autocomplete = 'off';
    input.value = initialValue || '';
    function refresh() {
      mirror.textContent = '';
      if (input.value) {
        mirror.classList.remove('gx-token-mirror--placeholder');
        mirror.append(renderTokens(input.value));
      } else if (input.placeholder) {
        mirror.classList.add('gx-token-mirror--placeholder');
        mirror.textContent = input.placeholder;
      }
    }
    input.addEventListener('input', refresh);
    input.addEventListener('scroll', () => {
      mirror.scrollLeft = input.scrollLeft;
    });
    refresh();
    wrap.append(mirror, input);
    return { wrap, input, refresh };
  }

  function pulse(el, mode) {
    el.classList.remove('gx-pulse-add', 'gx-pulse-remove');
    void el.offsetWidth;
    el.classList.add(mode === 'add' ? 'gx-pulse-add' : 'gx-pulse-remove');
  }

  function makeCustomButton(def) {
    const active = queryHasFragment(currentQuery(), def.fragment);
    return GX.createButton({
      label: def.label,
      title: def.fragment,
      pressed: active,
      onClick: (_event, btn) => {
        const isActive = queryHasFragment(currentQuery(), def.fragment);
        const next = isActive
          ? removeFragment(currentQuery(), def.fragment)
          : addFragment(currentQuery(), def.fragment);
        GX.setPressed(btn, !isActive);
        pulse(btn, isActive ? 'remove' : 'add');
        if (def.autoSearch !== false) {
          setTimeout(() => applyQuery(next), 220);
        }
      },
      className: 'gx-page-btn'
    });
  }

  function renderManageModal(refreshToolbar) {
    const { body } = GX.modal.open({ title: 'Manage search buttons' });

    const limits = document.createElement('details');
    limits.className = 'gx-collapsible';
    const summary = document.createElement('summary');
    summary.className = 'gx-collapsible__summary';
    summary.textContent = 'Search limits';
    const limitsContent = document.createElement('div');
    limitsContent.className = 'gx-collapsible__content';
    const intro = document.createElement('p');
    intro.textContent = 'GitHub search has a few hard limits worth knowing:';
    const ul = document.createElement('ul');
    [
      'Up to 1,000 results per query (regardless of total matches).',
      'Code search query length is capped (~256 chars on legacy code search).',
      'per_page max is 100; pagination caps around page 34 with per_page=30.',
      'Code search only indexes default branches; files >384 KB are skipped.',
      'Forks are not searched unless they have more stars than the parent.'
    ].forEach((t) => {
      const li = document.createElement('li');
      li.textContent = t;
      ul.append(li);
    });
    const docs = document.createElement('p');
    const a = document.createElement('a');
    a.href = 'https://docs.github.com/en/search-github/searching-on-github';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = 'GitHub search docs ↗';
    docs.append(a);
    limitsContent.append(intro, ul, docs);
    limits.append(summary, limitsContent);
    body.append(limits);

    const form = document.createElement('form');
    form.className = 'gx-form';
    const labelInput = document.createElement('input');
    labelInput.className = 'gx-input';
    labelInput.placeholder = 'Label (e.g. My Org)';
    labelInput.required = true;
    const fragField = makePreviewedInput('');
    const fragInput = fragField.input;
    fragInput.placeholder = 'Query fragment (e.g. org:my-org)';
    fragInput.required = true;
    fragField.refresh();
    const autoLabel = document.createElement('label');
    autoLabel.className = 'gx-checkbox';
    const autoInput = document.createElement('input');
    autoInput.type = 'checkbox';
    autoInput.checked = true;
    autoLabel.append(autoInput, document.createTextNode('Auto-search'));
    const addBtn = document.createElement('button');
    addBtn.type = 'submit';
    addBtn.className = 'gx-btn gx-btn--default';
    addBtn.textContent = 'Add';
    form.append(labelInput, fragField.wrap, autoLabel, addBtn);

    const prefixRow = document.createElement('div');
    prefixRow.className = 'gx-prefix-row';
    const prefixLabel = document.createElement('span');
    prefixLabel.className = 'gx-prefix-row__label';
    prefixLabel.textContent = 'Insert:';
    prefixRow.append(prefixLabel);
    const PREFIXES = [
      'repo:',
      'org:',
      'user:',
      'language:',
      'path:',
      'filename:',
      'extension:',
      'in:file'
    ];
    for (const p of PREFIXES) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'gx-chip';
      chip.textContent = p;
      chip.addEventListener('click', () => {
        const cur = fragInput.value;
        const sep = cur && !cur.endsWith(' ') ? ' ' : '';
        const insertStart = cur.length + sep.length;
        fragInput.value = cur + sep + p;
        fragField.refresh();
        fragInput.focus();
        const colon = p.indexOf(':');
        const valueAfterColon = colon >= 0 ? p.slice(colon + 1) : '';
        if (valueAfterColon) {
          const selStart = insertStart + colon + 1;
          fragInput.setSelectionRange(
            selStart,
            selStart + valueAfterColon.length
          );
        } else {
          const end = fragInput.value.length;
          fragInput.setSelectionRange(end, end);
        }
      });
      prefixRow.append(chip);
    }
    body.append(prefixRow);
    body.append(form);

    const list = document.createElement('ul');
    list.className = 'gx-list';
    body.append(list);

    async function refresh() {
      const items = await loadButtons();
      list.textContent = '';
      if (items.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'gx-empty';
        empty.textContent = 'No saved buttons yet.';
        list.append(empty);
        return;
      }
      for (const item of items) {
        list.append(renderRow(item, refresh));
      }
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const label = labelInput.value.trim();
      const fragment = fragInput.value.trim();
      if (!label || !fragment) {
        return;
      }
      const items = await loadButtons();
      items.push({
        id: makeId(),
        label,
        fragment,
        autoSearch: autoInput.checked
      });
      await saveButtons(items);
      labelInput.value = '';
      fragInput.value = '';
      fragField.refresh();
      autoInput.checked = true;
      labelInput.focus();
      refresh();
      refreshToolbar();
    });

    const footer = document.createElement('div');
    footer.className = 'gx-modal__footer';
    const exportBtn = document.createElement('button');
    exportBtn.type = 'button';
    exportBtn.className = 'gx-btn gx-btn--ghost';
    exportBtn.textContent = 'Export';
    exportBtn.addEventListener('click', async () => {
      const items = await loadButtons();
      const blob = new Blob([JSON.stringify(items, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'github-enhancements-buttons.json';
      link.click();
      URL.revokeObjectURL(url);
    });
    const importBtn = document.createElement('button');
    importBtn.type = 'button';
    importBtn.className = 'gx-btn gx-btn--ghost';
    importBtn.textContent = 'Import';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';
    fileInput.style.display = 'none';
    importBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) {
        return;
      }
      try {
        const text = await file.text();
        const incoming = JSON.parse(text);
        if (!Array.isArray(incoming)) {
          throw new Error('expected array');
        }
        const existing = await loadButtons();
        const merged = existing.concat(
          incoming
            .filter((b) => b && b.label && b.fragment)
            .map((b) => ({
              id: makeId(),
              label: String(b.label),
              fragment: String(b.fragment),
              autoSearch: b.autoSearch !== false
            }))
        );
        await saveButtons(merged);
        refresh();
        refreshToolbar();
      } catch (err) {
        alert('Invalid JSON file');
      } finally {
        fileInput.value = '';
      }
    });
    footer.append(fileInput, importBtn, exportBtn);
    body.append(footer);

    refresh();
  }

  function renderRow(item, refresh) {
    const li = document.createElement('li');
    li.className = 'gx-list__item';

    const labelInput = document.createElement('input');
    labelInput.className = 'gx-input';
    labelInput.value = item.label;

    const fragField = makePreviewedInput(item.fragment);
    const fragInput = fragField.input;

    const autoLabel = document.createElement('label');
    autoLabel.className = 'gx-checkbox';
    const autoInput = document.createElement('input');
    autoInput.type = 'checkbox';
    autoInput.checked = item.autoSearch !== false;
    autoLabel.append(autoInput, document.createTextNode('Auto'));

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'gx-btn gx-btn--default';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', async () => {
      const items = await loadButtons();
      const idx = items.findIndex((b) => b.id === item.id);
      if (idx === -1) {
        return;
      }
      items[idx] = {
        ...items[idx],
        label: labelInput.value.trim() || items[idx].label,
        fragment: fragInput.value.trim() || items[idx].fragment,
        autoSearch: autoInput.checked
      };
      await saveButtons(items);
      refresh();
    });

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'gx-btn gx-btn--ghost';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', async () => {
      const items = await loadButtons();
      await saveButtons(items.filter((b) => b.id !== item.id));
      refresh();
    });

    li.append(labelInput, fragField.wrap, autoLabel, saveBtn, delBtn);
    return li;
  }

  function mount() {
    const explicitType = new URL(location.href).searchParams.get('type');
    if (isForceCodeOn() && explicitType && explicitType !== 'code') {
      setForceCode(false);
    } else if (isForceCodeOn()) {
      ensureCodeType();
    }

    const host = findHost();
    if (!host) {
      return () => {};
    }

    const bar = document.createElement('div');
    bar.className = 'gx-page-toolbar';

    const codeSearch = GX.createButton({
      label: 'Code Search',
      title: 'Force all searches in this tab to Code search',
      pressed: isForceCodeOn(),
      onClick: (_event, btn) => {
        const turningOn = !isForceCodeOn();
        setForceCode(turningOn);
        GX.setPressed(btn, turningOn);
        if (turningOn) {
          ensureCodeType();
        }
      },
      className: 'gx-page-btn'
    });
    bar.append(codeSearch);

    const customGroup = document.createElement('span');
    customGroup.className = 'gx-toolbar-group';
    bar.append(customGroup);

    async function refreshCustom() {
      const items = await loadButtons();
      customGroup.textContent = '';
      for (const item of items) {
        customGroup.append(makeCustomButton(item));
      }
    }

    const manageBtn = GX.createButton({
      label: 'Add / Manage',
      title: 'Manage search buttons',
      onClick: () => renderManageModal(refreshCustom),
      className: 'gx-page-btn gx-page-btn--manage'
    });
    bar.append(manageBtn);

    host.prepend(bar);

    refreshCustom();
    const unsub = GX.storage.onChange(STORAGE_KEY, refreshCustom);

    return () => {
      unsub();
      bar.remove();
      GX.modal.close();
    };
  }

  GX.pages.register({ name: 'search', match, mount });
})();
