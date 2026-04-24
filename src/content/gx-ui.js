(() => {
  const PRESS_ANIMATION = [
    { transform: 'scale(1)' },
    { transform: 'scale(0.96)' },
    { transform: 'scale(1)' }
  ];
  const PRESS_TIMING = { duration: 180, easing: 'ease-out' };

  function createButton(options = {}) {
    const {
      label = '',
      title = '',
      variant = 'default',
      pressed = false,
      onClick,
      id,
      className,
      icon
    } = options;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.classList.add('gx-btn', `gx-btn--${variant}`);
    if (className) {
      for (const c of String(className).split(/\s+/).filter(Boolean)) {
        btn.classList.add(c);
      }
    }
    if (id) {
      btn.id = id;
    }
    if (title) {
      btn.title = title;
    }

    if (icon) {
      setIcon(btn, icon, label);
    } else {
      setLabel(btn, label);
    }
    setPressed(btn, pressed);

    btn.addEventListener('click', (event) => {
      btn.animate(PRESS_ANIMATION, PRESS_TIMING);
      if (typeof onClick === 'function') {
        onClick(event, btn);
      }
    });

    return btn;
  }

  function setLabel(btn, label) {
    btn.textContent = '';
    const mark = document.createElement('span');
    mark.className = 'gx-btn__mark';
    mark.textContent = '✦';
    mark.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.className = 'gx-btn__label';
    text.textContent = label;
    btn.append(mark, text);
  }

  function setPressed(btn, pressed) {
    const on = Boolean(pressed);
    btn.classList.toggle('gx-btn--on', on);
    btn.setAttribute('aria-pressed', String(on));
  }

  function setIcon(btn, svg, label) {
    btn.classList.add('gx-btn--icon');
    btn.textContent = '';
    const wrap = document.createElement('span');
    wrap.className = 'gx-btn__icon';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = svg;
    btn.append(wrap);
    if (label) {
      btn.setAttribute('aria-label', label);
    }
  }

  const SPARKLE_GLYPHS = ['✦', '✧', '★', '✩', '✺', '✸'];
  const SPARKLE_COLORS = [
    '#ffd33d',
    '#79c0ff',
    '#a371f7',
    '#f778ba',
    '#ffffff'
  ];

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function ensureSparkleLayer(target) {
    const parent = target.parentElement || document.body;
    let layer = parent.querySelector(':scope > #gx-sparkle-layer');
    if (layer) {
      return layer;
    }
    layer = document.createElement('div');
    layer.id = 'gx-sparkle-layer';
    layer.className = 'gx-sparkle-layer';
    layer.setAttribute('aria-hidden', 'true');
    parent.insertBefore(layer, target);
    return layer;
  }

  function spawnSparkle(layer, originX, originY, mode = 'drop') {
    const el = document.createElement('span');
    el.className = 'gx-sparkle';
    el.textContent = pickRandom(SPARKLE_GLYPHS);
    el.style.color = pickRandom(SPARKLE_COLORS);

    const size = randomBetween(10, 22);
    el.style.fontSize = `${size}px`;
    el.style.left = `${originX}px`;
    el.style.top = `${originY}px`;
    layer.append(el);

    const rotation = randomBetween(-220, 220);
    const duration = randomBetween(1800, 2800);
    const delay = randomBetween(0, 400);

    let keyframes;
    if (mode === 'around') {
      const angle = randomBetween(0, Math.PI * 2);
      const burstDist = randomBetween(60, 140);
      const burstX = Math.cos(angle) * burstDist;
      const burstY = Math.sin(angle) * burstDist;
      const gravityY = randomBetween(80, 160);
      keyframes = [
        {
          transform: 'translate(-50%, -50%) rotate(0deg) scale(0.4)',
          opacity: 0
        },
        {
          transform: 'translate(-50%, -50%) rotate(0deg) scale(1)',
          opacity: 1,
          offset: 0.1
        },
        {
          transform: `translate(calc(-50% + ${burstX}px), calc(-50% + ${burstY}px)) rotate(${rotation * 0.5}deg) scale(1)`,
          opacity: 1,
          offset: 0.4
        },
        {
          transform: `translate(calc(-50% + ${burstX * 1.2}px), calc(-50% + ${burstY + gravityY}px)) rotate(${rotation}deg) scale(0.6)`,
          opacity: 0
        }
      ];
    } else {
      const driftX = randomBetween(-120, 120);
      const fallY = randomBetween(160, 320);
      keyframes = [
        {
          transform: 'translate(-50%, -50%) rotate(0deg) scale(0.4)',
          opacity: 0
        },
        {
          transform: 'translate(-50%, -50%) rotate(0deg) scale(1)',
          opacity: 1,
          offset: 0.15
        },
        {
          transform: `translate(calc(-50% + ${driftX}px), calc(-50% + ${fallY}px)) rotate(${rotation}deg) scale(0.7)`,
          opacity: 0
        }
      ];
    }

    const animation = el.animate(keyframes, {
      duration,
      delay,
      easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      fill: 'forwards'
    });

    animation.onfinish = () => el.remove();
  }

  function sparkle(target, options = {}) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const { count = 18, mode = 'drop' } = options;
    const layer = ensureSparkleLayer(target);
    const rect = target.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    for (let i = 0; i < count; i += 1) {
      const jitterX = randomBetween(-rect.width / 2, rect.width / 2);
      spawnSparkle(layer, originX + jitterX, originY, mode);
    }
  }

  function parseSparkleAttr(value) {
    if (!value) {
      return { mode: 'drop', count: null };
    }
    const parts = value.split(':');
    const first = parts[0];
    if (first === 'drop' || first === 'around') {
      return {
        mode: first,
        count: parts[1] ? parseInt(parts[1], 10) : null
      };
    }
    const num = parseInt(first, 10);
    if (!isNaN(num)) {
      return { mode: 'drop', count: num };
    }
    return { mode: 'drop', count: null };
  }

  function sparkleAll(options = {}) {
    const { stagger = 80, count = 18 } = options;
    const targets = document.querySelectorAll('[data-gx-sparkle]');
    targets.forEach((el, i) => {
      const parsed = parseSparkleAttr(el.dataset.gxSparkle);
      const elCount = parsed.count || count;
      const elMode = parsed.mode;
      setTimeout(() => sparkle(el, { count: elCount, mode: elMode }), i * stagger);
    });
  }

  function createNavLink(options = {}) {
    const { label = '', href = '#', title = '', className } = options;
    const a = document.createElement('a');
    a.className = 'gx-nav-link';
    if (className) {
      for (const c of String(className).split(/\s+/).filter(Boolean)) {
        a.classList.add(c);
      }
    }
    a.href = href;
    a.textContent = label;
    if (title) {
      a.title = title;
    }
    return a;
  }

  globalThis.GX = globalThis.GX || {};
  Object.assign(globalThis.GX, {
    createButton,
    createNavLink,
    setLabel,
    setPressed,
    sparkle,
    sparkleAll
  });
})();
