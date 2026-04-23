(() => {
  let openModal = null;

  function close() {
    if (!openModal) {
      return;
    }
    const { backdrop, onClose, keyHandler } = openModal;
    document.removeEventListener('keydown', keyHandler);
    backdrop.remove();
    openModal = null;
    if (typeof onClose === 'function') {
      onClose();
    }
  }

  function open(options = {}) {
    const { title = '', onClose } = options;
    close();

    const backdrop = document.createElement('div');
    backdrop.className = 'gx-modal-backdrop';
    let pressedOnBackdrop = false;
    backdrop.addEventListener('mousedown', (e) => {
      pressedOnBackdrop = e.target === backdrop;
    });
    backdrop.addEventListener('mouseup', (e) => {
      if (pressedOnBackdrop && e.target === backdrop) {
        close();
      }
      pressedOnBackdrop = false;
    });

    const card = document.createElement('div');
    card.className = 'gx-modal';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');

    const header = document.createElement('div');
    header.className = 'gx-modal__header';

    const titleEl = document.createElement('h2');
    titleEl.className = 'gx-modal__title';
    titleEl.textContent = title;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'gx-modal__close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', close);

    header.append(titleEl, closeBtn);

    const body = document.createElement('div');
    body.className = 'gx-modal__body';

    card.append(header, body);
    backdrop.append(card);
    document.body.append(backdrop);

    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        close();
      }
    };
    document.addEventListener('keydown', keyHandler);

    openModal = { backdrop, onClose, keyHandler };

    return { body, close };
  }

  globalThis.GX = globalThis.GX || {};
  GX.modal = { open, close };
})();
