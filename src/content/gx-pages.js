(() => {
  const pages = [];
  let active = null;

  function register(page) {
    pages.push(page);
  }

  function findPage(url) {
    return pages.find((p) => p.match(url)) || null;
  }

  function mount() {
    if (active) {
      return;
    }
    const page = findPage(location.href);
    if (!page) {
      return;
    }
    const cleanup = page.mount({ url: location.href });
    active = { page, cleanup };
  }

  function unmount() {
    if (!active) {
      return;
    }
    if (typeof active.cleanup === 'function') {
      active.cleanup();
    }
    active = null;
  }

  function remount() {
    unmount();
    mount();
  }

  globalThis.GX = globalThis.GX || {};
  GX.pages = {
    register,
    mount,
    unmount,
    remount,
    current: () => (active ? active.page.name : null)
  };
})();
