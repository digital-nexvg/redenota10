(() => {
  const header = document.querySelector('[data-header]');
  const toggle = document.querySelector('[data-menu-toggle]');
  const navLinks = document.querySelectorAll('[data-nav-link]');

  if (!header) return;

  const updateHeaderState = () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
      header.classList.remove('is-transparent');
    } else if (!document.body.classList.contains('inner-page')) {
      header.classList.remove('scrolled');
      header.classList.add('is-transparent');
    }
  };

  updateHeaderState();
  window.addEventListener('scroll', updateHeaderState, { passive: true });

  if (!toggle) return;

  const closeMenu = () => {
    header.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    header.classList.toggle('nav-open', !expanded);
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 960) closeMenu();
  });
})();
