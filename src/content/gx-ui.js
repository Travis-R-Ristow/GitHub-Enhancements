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

  function spawnSparkle(layer, originX, originY) {
    const el = document.createElement('span');
    el.className = 'gx-sparkle';
    el.textContent = pickRandom(SPARKLE_GLYPHS);
    el.style.color = pickRandom(SPARKLE_COLORS);

    const size = randomBetween(10, 22);
    el.style.fontSize = `${size}px`;
    el.style.left = `${originX}px`;
    el.style.top = `${originY}px`;
    layer.append(el);

    const driftX = randomBetween(-120, 120);
    const fallY = randomBetween(160, 320);
    const rotation = randomBetween(-220, 220);
    const duration = randomBetween(1800, 2800);
    const delay = randomBetween(0, 400);

    const animation = el.animate(
      [
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
      ],
      {
        duration,
        delay,
        easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        fill: 'forwards'
      }
    );

    animation.onfinish = () => el.remove();
  }

  function sparkle(target, options = {}) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const { count = 18 } = options;
    const layer = ensureSparkleLayer(target);
    const rect = target.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    for (let i = 0; i < count; i += 1) {
      const jitterX = randomBetween(-rect.width / 2, rect.width / 2);
      spawnSparkle(layer, originX + jitterX, originY);
    }
  }

  globalThis.GX = globalThis.GX || {};
  Object.assign(globalThis.GX, {
    createButton,
    setLabel,
    setPressed,
    sparkle
  });
})();
