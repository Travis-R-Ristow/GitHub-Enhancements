(() => {
  const PR_PATH = /^\/[^/]+\/[^/]+\/(pull|issues)\/\d+/;
  const HOVER_TRIGGER_MS = 5000;
  const HIDE_DURATION_MS = 20000;

  const ARROW_UP =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5a.75.75 0 0 1 .53.22l5 5a.75.75 0 0 1-1.06 1.06L8.75 5.06V13a.75.75 0 0 1-1.5 0V5.06L3.53 8.78a.75.75 0 1 1-1.06-1.06l5-5A.75.75 0 0 1 8 2.5Z"/></svg>';
  const ARROW_DOWN =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13.5a.75.75 0 0 1-.53-.22l-5-5a.75.75 0 1 1 1.06-1.06l3.72 3.72V3a.75.75 0 0 1 1.5 0v7.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-5 5a.75.75 0 0 1-.53.22Z"/></svg>';

  function match(url) {
    return PR_PATH.test(new URL(url).pathname);
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
    return GX.createButton({
      title,
      label: title,
      icon,
      onClick,
      className: `gx-floating-btn gx-floating-btn--${position}`
    });
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

    return () => {
      cleanupTop();
      cleanupBottom();
      top.remove();
      bottom.remove();
    };
  }

  GX.pages.register({ name: 'pull-request', match, mount });
})();
