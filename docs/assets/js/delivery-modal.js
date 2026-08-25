(() => {
  const modal = document.querySelector('[data-delivery-modal]');
  if (!modal) return;

  const triggers = [...document.querySelectorAll('[data-open-delivery-modal]')];
  const closeTriggers = [...modal.querySelectorAll('[data-close-delivery-modal]')];

  const openModal = () => {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    modal.querySelector('.unit-modal__close')?.focus();
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openModal();
    });
  });

  closeTriggers.forEach((trigger) => {
    trigger.addEventListener('click', closeModal);
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });
})();
