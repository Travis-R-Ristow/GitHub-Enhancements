(() => {
  const PR_PATH = /^\/[^/]+\/[^/]+\/(pull|issues)\/\d+/;
  const CONVERSATION_PATH = /^\/[^/]+\/[^/]+\/pull\/\d+\/?$/;
  const CHANGES_PATH = /^\/[^/]+\/[^/]+\/pull\/\d+\/changes/;
  const COMMITS_PATH = /^\/[^/]+\/[^/]+\/pull\/\d+\/commits/;
  const HOVER_TRIGGER_MS = 5000;
  const HIDE_DURATION_MS = 12000;
  const FILTER_BAR_ID = 'gx-pr-filter-bar';

  const COLLAPSE_TOGGLE_CLASS = 'gx-collapse-toggle';

  const CHEVRON_DOWN =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M12.78 5.22a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L3.22 6.28a.75.75 0 0 1 1.06-1.06L8 8.94l3.72-3.72a.75.75 0 0 1 1.06 0Z"/></svg>';
  const CHEVRON_RIGHT =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"/></svg>';

  const ARROW_UP =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5a.75.75 0 0 1 .53.22l5 5a.75.75 0 0 1-1.06 1.06L8.75 5.06V13a.75.75 0 0 1-1.5 0V5.06L3.53 8.78a.75.75 0 1 1-1.06-1.06l5-5A.75.75 0 0 1 8 2.5Z"/></svg>';
  const ARROW_DOWN =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13.5a.75.75 0 0 1-.53-.22l-5-5a.75.75 0 1 1 1.06-1.06l3.72 3.72V3a.75.75 0 0 1 1.5 0v7.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-5 5a.75.75 0 0 1-.53.22Z"/></svg>';

  function match(url) {
    return PR_PATH.test(new URL(url).pathname);
  }

  function isConversationTab() {
    return CONVERSATION_PATH.test(location.pathname);
  }

  function getDiscussionContainer() {
    return (
      document.querySelector('.js-discussion') ||
      document.querySelector('[data-target="pull-request.timeline"]') ||
      document.querySelector('.pull-discussion-timeline')
    );
  }

  function getTimelineItems() {
    const container = getDiscussionContainer();
    if (!container) {
      return [];
    }
    return Array.from(container.querySelectorAll('.js-timeline-item'));
  }

  function getAuthorsFromItem(item) {
    const authors = new Set();
    item.querySelectorAll('.author').forEach((el) => {
      const name = el.textContent.trim();
      if (name) {
        authors.add(name.toLowerCase());
      }
    });
    return authors;
  }

  function getTextFromItem(item) {
    const bodies = item.querySelectorAll('.comment-body');
    let text = '';
    bodies.forEach((body) => {
      text += ' ' + body.textContent;
    });
    const authors = item.querySelectorAll('.author');
    authors.forEach((a) => {
      text += ' ' + a.textContent;
    });
    return text.toLowerCase();
  }

  function getAllAuthors() {
    const authors = new Set();
    getTimelineItems().forEach((item) => {
      getAuthorsFromItem(item).forEach((a) => authors.add(a));
    });
    return Array.from(authors).sort();
  }

  function itemMatches(item, selectedAuthors, searchText) {
    const itemAuthors = getAuthorsFromItem(item);
    const itemText = getTextFromItem(item);

    let authorMatch = true;
    if (selectedAuthors.size > 0) {
      authorMatch = [...itemAuthors].some((a) => selectedAuthors.has(a));
    }

    let searchMatch = true;
    if (searchText) {
      searchMatch = itemText.includes(searchText.toLowerCase());
    }

    return authorMatch && searchMatch;
  }

  function getDescriptionItem() {
    const discussion = getDiscussionContainer();
    if (!discussion) {
      return null;
    }
    return (
      discussion.querySelector('.js-command-palette-pull-body') ||
      discussion.querySelector('.timeline-comment--caret')
    );
  }

  function getDescriptionBody() {
    const item = getDescriptionItem();
    if (!item) {
      return null;
    }
    return item.querySelector('.comment-body');
  }

  function isDescriptionCollapsed() {
    const body = getDescriptionBody();
    return body ? body.classList.contains('gx-desc-collapsed') : false;
  }

  function setDescriptionCollapsed(collapsed) {
    const body = getDescriptionBody();
    if (!body) {
      return;
    }
    body.classList.toggle('gx-desc-collapsed', collapsed);
  }

  function applyFilters(selectedAuthors, searchText) {
    const items = getTimelineItems();
    const hasFilters = selectedAuthors.size > 0 || searchText;

    const groups = new Map();

    items.forEach((item) => {
      const parent = item.parentNode;
      if (!groups.has(parent)) {
        groups.set(parent, { matching: [], nonMatching: [] });
      }
      const group = groups.get(parent);

      if (!hasFilters || itemMatches(item, selectedAuthors, searchText)) {
        item.classList.remove('gx-dimmed');
        group.matching.push(item);
      } else {
        item.classList.add('gx-dimmed');
        group.nonMatching.push(item);
      }
    });

    groups.forEach(({ matching, nonMatching }, parent) => {
      matching.forEach((item) => parent.appendChild(item));
      nonMatching.forEach((item) => parent.appendChild(item));
    });

    setDescriptionCollapsed(hasFilters);
  }

  function createAuthorDropdown(pillsContainer, onFilter) {
    const wrapper = document.createElement('div');
    wrapper.className = 'gx-author-dropdown';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'gx-author-dropdown__toggle';
    toggle.textContent = 'All authors';

    const menu = document.createElement('div');
    menu.className = 'gx-author-dropdown__menu';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'gx-author-dropdown__search';
    searchInput.placeholder = 'Filter authors...';
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase();
      items.forEach(({ label, author }) => {
        label.style.display = author.includes(query) ? '' : 'none';
      });
    });
    searchInput.addEventListener('click', (e) => e.stopPropagation());
    menu.appendChild(searchInput);

    const list = document.createElement('div');
    list.className = 'gx-author-dropdown__list';
    menu.appendChild(list);

    const selected = new Set();
    const checkboxes = new Map();
    const items = [];
    const authors = getAllAuthors();

    function updateToggleLabel() {
      if (selected.size === 0) {
        toggle.textContent = 'All authors';
      } else if (selected.size === 1) {
        toggle.textContent = [...selected][0];
      } else {
        toggle.textContent = `${selected.size} authors`;
      }
    }

    function renderPills() {
      pillsContainer.textContent = '';
      selected.forEach((author) => {
        const pill = document.createElement('span');
        pill.className = 'gx-author-pill';

        const name = document.createElement('span');
        name.textContent = author;

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'gx-author-pill__remove';
        remove.textContent = '×';
        remove.setAttribute('aria-label', `Remove ${author}`);
        remove.addEventListener('click', () => {
          selected.delete(author);
          const cb = checkboxes.get(author);
          if (cb) {
            cb.checked = false;
          }
          updateToggleLabel();
          renderPills();
          onFilter();
        });

        pill.append(name, remove);
        pillsContainer.appendChild(pill);
      });
    }

    authors.forEach((author) => {
      const label = document.createElement('label');
      label.className = 'gx-author-dropdown__item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = author;
      checkboxes.set(author, checkbox);

      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          selected.add(author);
        } else {
          selected.delete(author);
        }
        updateToggleLabel();
        renderPills();
        onFilter();
      });

      const span = document.createElement('span');
      span.textContent = author;

      label.append(checkbox, span);
      list.appendChild(label);
      items.push({ label, author });
    });

    toggle.addEventListener('click', () => {
      const opening = !wrapper.classList.contains('gx-author-dropdown--open');
      wrapper.classList.toggle('gx-author-dropdown--open');
      if (opening) {
        searchInput.value = '';
        items.forEach(({ label }) => {
          label.style.display = '';
        });
        requestAnimationFrame(() => searchInput.focus());
      }
    });

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        wrapper.classList.remove('gx-author-dropdown--open');
      }
    });

    wrapper.append(toggle, menu);
    wrapper.getSelected = () => selected;
    wrapper.clear = () => {
      selected.clear();
      updateToggleLabel();
      renderPills();
      checkboxes.forEach((cb) => {
        cb.checked = false;
      });
    };

    return wrapper;
  }

  function mountCollapseToggle() {
    const desc = getDescriptionItem();
    if (!desc) {
      return null;
    }
    const actions = desc.querySelector('.timeline-comment-actions');
    if (!actions) {
      return null;
    }
    if (actions.querySelector('.' + COLLAPSE_TOGGLE_CLASS)) {
      return null;
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = COLLAPSE_TOGGLE_CLASS;
    btn.title = 'Collapse description';

    const icon = document.createElement('span');
    icon.className = 'gx-collapse-toggle__icon';
    icon.innerHTML = CHEVRON_DOWN;

    btn.appendChild(icon);
    btn.addEventListener('click', () => {
      setDescriptionCollapsed(!isDescriptionCollapsed());
      updateCollapseToggle();
    });

    actions.prepend(btn);

    return () => {
      btn.remove();
    };
  }

  function updateCollapseToggle() {
    const desc = getDescriptionItem();
    if (!desc) {
      return;
    }
    const btn = desc.querySelector('.' + COLLAPSE_TOGGLE_CLASS);
    if (!btn) {
      return;
    }
    const icon = btn.querySelector('.gx-collapse-toggle__icon');
    const collapsed = isDescriptionCollapsed();
    icon.innerHTML = collapsed ? CHEVRON_RIGHT : CHEVRON_DOWN;
    btn.title = collapsed ? 'Expand description' : 'Collapse description';
  }

  function createFilterBar() {
    if (document.getElementById(FILTER_BAR_ID)) {
      return null;
    }

    const bar = document.createElement('div');
    bar.id = FILTER_BAR_ID;
    bar.className = 'gx-pr-filter-bar';
    bar.setAttribute('data-gx-sparkle', 'around:8');

    const topRow = document.createElement('div');
    topRow.className = 'gx-pr-filter-bar__row';

    const pillsContainer = document.createElement('div');
    pillsContainer.className = 'gx-author-pills';

    let authorDropdown;

    function onFilter() {
      applyFilters(authorDropdown.getSelected(), searchInput.value);
      updateCollapseToggle();
    }

    authorDropdown = createAuthorDropdown(pillsContainer, onFilter);

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'gx-pr-filter-search';
    searchInput.placeholder = 'Search comments...';

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'gx-pr-filter-clear';
    clearBtn.textContent = 'Clear';

    searchInput.addEventListener('input', onFilter);
    clearBtn.addEventListener('click', () => {
      authorDropdown.clear();
      searchInput.value = '';
      applyFilters(new Set(), '');
      updateCollapseToggle();
    });

    topRow.append(authorDropdown, searchInput, clearBtn);
    bar.append(topRow, pillsContainer);
    return bar;
  }

  function mountFilterBar() {
    if (!isConversationTab()) {
      return null;
    }

    const discussion = getDiscussionContainer();
    if (!discussion) {
      return null;
    }

    const bar = createFilterBar();
    if (!bar) {
      return null;
    }

    discussion.insertAdjacentElement('beforebegin', bar);

    return () => {
      const existing = document.getElementById(FILTER_BAR_ID);
      if (existing) {
        existing.remove();
      }
      getTimelineItems().forEach((item) => {
        item.classList.remove('gx-dimmed');
      });
    };
  }

  function isChangesTab() {
    return CHANGES_PATH.test(location.pathname);
  }

  function isCommitsTab() {
    return COMMITS_PATH.test(location.pathname);
  }

  function reverseChildren(parent, children) {
    if (children.length <= 1) {
      return;
    }
    const ref = children[0];
    for (let i = children.length - 1; i >= 0; i--) {
      parent.insertBefore(children[i], ref);
    }
  }

  function reverseTimelineOrder() {
    const items = getTimelineItems();
    if (items.length <= 1) {
      return false;
    }

    const groups = new Map();
    items.forEach((item) => {
      const parent = item.parentNode;
      if (!groups.has(parent)) {
        groups.set(parent, []);
      }
      groups.get(parent).push(item);
    });

    groups.forEach((groupItems, parent) => {
      reverseChildren(parent, groupItems);
    });

    return true;
  }

  function reverseCommitsOrder() {
    const commitsList = document.querySelector('[data-testid="commits-list"]');
    if (!commitsList) {
      return false;
    }

    const timeline = commitsList.firstElementChild;
    if (!timeline || timeline.children.length <= 1) {
      return false;
    }

    reverseChildren(timeline, Array.from(timeline.children));

    timeline
      .querySelectorAll('[data-listview-component="items-list"]')
      .forEach((ul) => {
        reverseChildren(ul, Array.from(ul.children));
      });

    return true;
  }

  function mountReverseOrder() {
    if (!isConversationTab() && !isCommitsTab()) {
      return null;
    }

    let done = false;
    let observer = null;

    function tryReverse() {
      if (done) {
        return;
      }
      if (isConversationTab()) {
        done = reverseTimelineOrder();
      } else if (isCommitsTab()) {
        done = reverseCommitsOrder();
      }
      if (done && observer) {
        observer.disconnect();
        observer = null;
      }
    }

    tryReverse();

    if (!done) {
      observer = new MutationObserver(tryReverse);
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
      if (done) {
        if (isConversationTab()) {
          reverseTimelineOrder();
        } else if (isCommitsTab()) {
          reverseCommitsOrder();
        }
      }
    };
  }

  function getPanelScrollArea() {
    const panel = document.querySelector('#docked-side-panel-content');
    if (!panel) {
      return null;
    }
    return panel.querySelector('.flex-1.overflow-auto');
  }

  function getPanelCommentCards() {
    const scrollArea = getPanelScrollArea();
    if (!scrollArea) {
      return [];
    }
    const container = scrollArea.querySelector(
      '.d-flex.flex-column.position-relative'
    );
    if (!container) {
      return [];
    }
    return Array.from(container.children);
  }

  function getPanelCardAuthor(card) {
    const link = card.querySelector('[data-testid="avatar-link"]');
    if (link) {
      const name = link.textContent.trim();
      if (name) {
        return name.toLowerCase();
      }
    }
    const authorEl = card.querySelector('[data-hovercard-type="user"]');
    if (authorEl) {
      const name = authorEl.textContent.trim();
      if (name) {
        return name.toLowerCase();
      }
    }
    return null;
  }

  function getAllPanelAuthors() {
    const authors = new Set();
    getPanelCommentCards().forEach((card) => {
      const author = getPanelCardAuthor(card);
      if (author) {
        authors.add(author);
      }
    });
    return Array.from(authors).sort();
  }

  function applyPanelFilters(selectedAuthors) {
    getPanelCommentCards().forEach((card) => {
      if (selectedAuthors.size === 0) {
        card.style.display = '';
        return;
      }
      const author = getPanelCardAuthor(card);
      if (author && selectedAuthors.has(author)) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  }

  function createPanelAuthorDropdown(pillsContainer, onFilter, initialSelection) {
    const wrapper = document.createElement('div');
    wrapper.className = 'gx-author-dropdown';
    wrapper.setAttribute('data-gx-panel-filter', '');

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'gx-author-dropdown__toggle';
    toggle.textContent = 'All authors';

    const menu = document.createElement('div');
    menu.className = 'gx-author-dropdown__menu';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'gx-author-dropdown__search';
    searchInput.placeholder = 'Filter authors...';
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase();
      items.forEach(({ label, author }) => {
        label.style.display = author.includes(query) ? '' : 'none';
      });
    });
    searchInput.addEventListener('click', (e) => e.stopPropagation());
    menu.appendChild(searchInput);

    const list = document.createElement('div');
    list.className = 'gx-author-dropdown__list';
    menu.appendChild(list);

    const selected = new Set(initialSelection || []);
    let checkboxes = new Map();
    let items = [];

    function updateToggleLabel() {
      if (selected.size === 0) {
        toggle.textContent = 'All authors';
      } else if (selected.size === 1) {
        toggle.textContent = [...selected][0];
      } else {
        toggle.textContent = `${selected.size} authors`;
      }
    }

    function renderPills() {
      pillsContainer.textContent = '';
      selected.forEach((author) => {
        const pill = document.createElement('span');
        pill.className = 'gx-author-pill';

        const name = document.createElement('span');
        name.textContent = author;

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'gx-author-pill__remove';
        remove.textContent = '×';
        remove.setAttribute('aria-label', `Remove ${author}`);
        remove.addEventListener('click', () => {
          selected.delete(author);
          const cb = checkboxes.get(author);
          if (cb) {
            cb.checked = false;
          }
          updateToggleLabel();
          renderPills();
          onFilter();
        });

        pill.append(name, remove);
        pillsContainer.appendChild(pill);
      });
    }

    function rebuildList() {
      list.textContent = '';
      checkboxes = new Map();
      items = [];
      const authors = getAllPanelAuthors();

      authors.forEach((author) => {
        const label = document.createElement('label');
        label.className = 'gx-author-dropdown__item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = author;
        checkbox.checked = selected.has(author);
        checkboxes.set(author, checkbox);

        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            selected.add(author);
          } else {
            selected.delete(author);
          }
          updateToggleLabel();
          renderPills();
          onFilter();
        });

        const span = document.createElement('span');
        span.textContent = author;

        label.append(checkbox, span);
        list.appendChild(label);
        items.push({ label, author });
      });
    }

    toggle.addEventListener('click', () => {
      const opening = !wrapper.classList.contains('gx-author-dropdown--open');
      wrapper.classList.toggle('gx-author-dropdown--open');
      if (opening) {
        rebuildList();
        searchInput.value = '';
        requestAnimationFrame(() => searchInput.focus());
      }
    });

    function onDocumentClick(e) {
      if (!wrapper.contains(e.target)) {
        wrapper.classList.remove('gx-author-dropdown--open');
      }
    }

    document.addEventListener('click', onDocumentClick);

    if (selected.size > 0) {
      updateToggleLabel();
      renderPills();
    }

    wrapper.append(toggle, menu);
    wrapper.getSelected = () => selected;
    wrapper.clear = () => {
      selected.clear();
      updateToggleLabel();
      renderPills();
      checkboxes.forEach((cb) => {
        cb.checked = false;
      });
    };
    wrapper.destroy = () => {
      document.removeEventListener('click', onDocumentClick);
    };

    return wrapper;
  }

  function mountPanelAuthorFilter(previousSelection) {
    const panel = document.querySelector('#docked-side-panel-content');
    if (!panel) {
      return null;
    }

    const nativeFilterBtn = panel.querySelector(
      'button[aria-label="Additional comment filters"]'
    );
    if (!nativeFilterBtn) {
      return null;
    }

    const filterRow = nativeFilterBtn.parentElement;
    if (!filterRow) {
      return null;
    }

    if (filterRow.querySelector('[data-gx-panel-filter]')) {
      return null;
    }

    nativeFilterBtn.style.display = 'none';

    const pillsContainer = document.createElement('div');
    pillsContainer.className = 'gx-author-pills';

    let dropdown;

    function onFilter() {
      applyPanelFilters(dropdown.getSelected());
    }

    dropdown = createPanelAuthorDropdown(
      pillsContainer,
      onFilter,
      previousSelection
    );

    filterRow.appendChild(dropdown);

    const headerDiv = filterRow.closest(
      '.Panel-module__Header__xEN9c, [class*="Panel-module__Header"]'
    );
    if (headerDiv) {
      headerDiv.appendChild(pillsContainer);
    } else {
      filterRow.parentElement.appendChild(pillsContainer);
    }

    if (previousSelection && previousSelection.size > 0) {
      applyPanelFilters(dropdown.getSelected());
    }

    return () => {
      dropdown.destroy();
      dropdown.remove();
      pillsContainer.remove();
      nativeFilterBtn.style.display = '';
      getPanelCommentCards().forEach((card) => {
        card.style.display = '';
      });
    };
  }

  function watchForPanelFilter() {
    if (!isChangesTab()) {
      return null;
    }

    let lastNativeBtn = null;
    let cleanupMount = null;
    let savedSelection = new Set();

    function tryMount() {
      const panel = document.querySelector('#docked-side-panel-content');
      if (!panel) {
        if (cleanupMount) {
          cleanupMount();
          cleanupMount = null;
        }
        lastNativeBtn = null;
        return;
      }

      const nativeBtn = panel.querySelector(
        'button[aria-label="Additional comment filters"]'
      );
      if (!nativeBtn) {
        if (cleanupMount) {
          cleanupMount();
          cleanupMount = null;
        }
        lastNativeBtn = null;
        return;
      }

      if (nativeBtn === lastNativeBtn) {
        return;
      }

      if (cleanupMount) {
        const dropdown = panel.querySelector('[data-gx-panel-filter]');
        if (dropdown && dropdown.getSelected) {
          savedSelection = new Set(dropdown.getSelected());
        }
        cleanupMount();
        cleanupMount = null;
      }

      lastNativeBtn = nativeBtn;
      cleanupMount = mountPanelAuthorFilter(savedSelection);
    }

    tryMount();
    const observer = new MutationObserver(tryMount);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (cleanupMount) {
        cleanupMount();
        cleanupMount = null;
      }
    };
  }

  function watchForCommentViewMode() {
    if (!isChangesTab()) {
      return null;
    }

    let lastControl = null;

    function trySwitch() {
      const control = document.querySelector(
        '[aria-label="Comment view mode"]'
      );
      if (!control) {
        lastControl = null;
        return;
      }
      if (control === lastControl) {
        return;
      }
      lastControl = control;
      const btn = control
        .querySelector('[data-text="Conversation"]')
        ?.closest('button');
      if (btn && btn.getAttribute('aria-current') !== 'true') {
        btn.click();
      }
    }

    trySwitch();
    const observer = new MutationObserver(trySwitch);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }

  function scrollTo(y) {
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  function attachHoverHide(btn) {
    let hoverTimer = null;
    let hideTimer = null;

    function clearHover() {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
    }

    function hideForCooldown() {
      btn.classList.add('gx-floating-btn--hidden');
      hideTimer = setTimeout(() => {
        btn.classList.remove('gx-floating-btn--hidden');
        hideTimer = null;
      }, HIDE_DURATION_MS);
    }

    btn.addEventListener('mouseenter', () => {
      if (hideTimer) {
        return;
      }
      clearHover();
      hoverTimer = setTimeout(hideForCooldown, HOVER_TRIGGER_MS);
    });

    btn.addEventListener('mouseleave', clearHover);

    return () => {
      clearHover();
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      btn.classList.remove('gx-floating-btn--hidden');
    };
  }

  function makeFloatingButton(position, icon, title, onClick) {
    const btn = GX.createButton({
      title,
      label: title,
      icon,
      onClick,
      className: `gx-floating-btn gx-floating-btn--${position}`
    });
    btn.setAttribute('data-gx-sparkle', 'around:12');
    return btn;
  }

  function mount() {
    const top = makeFloatingButton('top', ARROW_UP, 'Scroll to top', () =>
      scrollTo(0)
    );
    const bottom = makeFloatingButton(
      'bottom',
      ARROW_DOWN,
      'Scroll to bottom',
      () => scrollTo(document.documentElement.scrollHeight)
    );

    document.body.append(top, bottom);
    const cleanupTop = attachHoverHide(top);
    const cleanupBottom = attachHoverHide(bottom);
    const cleanupFilter = mountFilterBar();
    const cleanupCollapse = mountCollapseToggle();
    const cleanupConversation = watchForCommentViewMode();
    const cleanupPanelFilter = watchForPanelFilter();
    const cleanupReverse = mountReverseOrder();

    return () => {
      cleanupTop();
      cleanupBottom();
      top.remove();
      bottom.remove();
      if (cleanupFilter) {
        cleanupFilter();
      }
      if (cleanupCollapse) {
        cleanupCollapse();
      }
      if (cleanupConversation) {
        cleanupConversation();
      }
      if (cleanupPanelFilter) {
        cleanupPanelFilter();
      }
      if (cleanupReverse) {
        cleanupReverse();
      }
      setDescriptionCollapsed(false);
    };
  }

  GX.pages.register({ name: 'pull-request', match, mount });
})();
