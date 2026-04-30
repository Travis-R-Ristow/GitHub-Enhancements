(() => {
  const STORAGE_KEY = 'gx-enabled';
  const SPARKLE_GLYPHS = ['✦', '✧', '★', '✩', '✺', '✸'];
  const SPARKLE_COLORS = ['#ffd33d', '#79c0ff', '#a371f7', '#f778ba', '#ffffff'];

  const btn = document.getElementById('gx-enhance');
  const label = btn.querySelector('.gx-popup-enhance-btn__label');
  const sparkleLayer = document.querySelector('.gx-popup-sparkle-layer');

  let enabled = false;

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function applyState() {
    btn.classList.toggle('gx-popup-enhance-btn--on', enabled);
    btn.setAttribute('aria-pressed', String(enabled));
    label.textContent = enabled ? 'Enhanced' : 'Enhance';
  }

  function spawnSparkle(originX, originY) {
    const el = document.createElement('span');
    el.className = 'gx-popup-sparkle';
    el.textContent = pickRandom(SPARKLE_GLYPHS);
    el.style.color = pickRandom(SPARKLE_COLORS);
    el.style.fontSize = `${randomBetween(12, 24)}px`;
    el.style.left = `${originX}px`;
    el.style.top = `${originY}px`;
    sparkleLayer.append(el);

    const angle = randomBetween(0, Math.PI * 2);
    const dist = randomBetween(50, 120);
    const bx = Math.cos(angle) * dist;
    const by = Math.sin(angle) * dist;
    const rotation = randomBetween(-220, 220);
    const gravity = randomBetween(60, 120);

    const anim = el.animate([
      { transform: 'translate(-50%, -50%) rotate(0deg) scale(0.3)', opacity: 0 },
      { transform: 'translate(-50%, -50%) rotate(0deg) scale(1)', opacity: 1, offset: 0.1 },
      { transform: `translate(calc(-50% + ${bx}px), calc(-50% + ${by}px)) rotate(${rotation * 0.5}deg) scale(1)`, opacity: 1, offset: 0.45 },
      { transform: `translate(calc(-50% + ${bx * 1.2}px), calc(-50% + ${by + gravity}px)) rotate(${rotation}deg) scale(0.5)`, opacity: 0 }
    ], {
      duration: randomBetween(1600, 2400),
      delay: randomBetween(0, 300),
      easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      fill: 'forwards'
    });

    anim.onfinish = () => el.remove();
  }

  function burstSparkles() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const btnRect = btn.getBoundingClientRect();
    const layerRect = sparkleLayer.getBoundingClientRect();
    const cx = btnRect.left + btnRect.width / 2 - layerRect.left;
    const cy = btnRect.top + btnRect.height / 2 - layerRect.top;
    for (let i = 0; i < 36; i++) {
      spawnSparkle(cx, cy);
    }
  }

  async function toggle() {
    enabled = !enabled;
    await chrome.storage.local.set({ [STORAGE_KEY]: enabled });
    applyState();
    btn.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(0.92)' },
      { transform: 'scale(1)' }
    ], { duration: 220, easing: 'ease-out' });
    if (enabled) {
      burstSparkles();
    }
  }

  async function init() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    enabled = Boolean(result[STORAGE_KEY]);
    applyState();
  }

  btn.addEventListener('click', toggle);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && STORAGE_KEY in changes) {
      enabled = Boolean(changes[STORAGE_KEY].newValue);
      applyState();
    }
  });

  const exportBtn = document.getElementById('gx-export');
  const importBtn = document.getElementById('gx-import');
  const importFile = document.getElementById('gx-import-file');
  const hardDeleteBtn = document.getElementById('gx-hard-delete');
  const confirmPanel = document.getElementById('gx-delete-confirm');
  const confirmYes = document.getElementById('gx-delete-yes');
  const confirmNo = document.getElementById('gx-delete-no');

  exportBtn.addEventListener('click', async () => {
    const data = await chrome.storage.local.get(null);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'github-enhancements-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener('click', () => importFile.click());

  importFile.addEventListener('change', async () => {
    const file = importFile.files?.[0];
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        throw new Error('invalid');
      }
      await chrome.storage.local.set(data);
      enabled = Boolean(data[STORAGE_KEY]);
      applyState();
    } catch {
      alert('Invalid backup file.');
    } finally {
      importFile.value = '';
    }
  });

  hardDeleteBtn.addEventListener('click', () => {
    confirmPanel.hidden = false;
  });

  confirmNo.addEventListener('click', () => {
    confirmPanel.hidden = true;
  });

  confirmYes.addEventListener('click', async () => {
    await chrome.storage.local.clear();
    enabled = false;
    applyState();
    confirmPanel.hidden = true;
  });

  document.querySelector('.gx-popup-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]');
    if (!tab) {
      return;
    }
    document.querySelectorAll('.gx-popup-tab').forEach((t) => {
      t.classList.remove('gx-popup-tab--active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('gx-popup-tab--active');
    tab.setAttribute('aria-selected', 'true');
    document.querySelectorAll('.gx-popup-panel').forEach((p) => {
      p.hidden = p.dataset.panel !== tab.dataset.tab;
    });
  });

  init();
})();