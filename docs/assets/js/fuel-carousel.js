(() => {
  const carousel = document.querySelector('[data-fuel-carousel]');
  if (!carousel) return;

  const track = carousel.querySelector('[data-fuel-track]');
  const slides = [...carousel.querySelectorAll('[data-fuel-slide]')];
  const dotsWrap = carousel.querySelector('[data-fuel-dots]');
  const nextButton = carousel.querySelector('[data-fuel-next]');
  const prevButton = carousel.querySelector('[data-fuel-prev]');

  if (!track || slides.length < 2) return;

  let current = 0;
  let timer;

  const dots = slides.map((slide, index) => {
    const dot = document.createElement('button');
    dot.className = 'fuel-carousel__dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `Ir para ${slide.querySelector('h3')?.textContent || `produto ${index + 1}`}`);
    dot.addEventListener('click', () => {
      goTo(index);
      restartTimer();
    });
    dotsWrap?.append(dot);
    return dot;
  });

  const update = () => {
    track.style.transform = `translateX(-${current * 100}%)`;
    slides.forEach((slide, index) => {
      slide.setAttribute('aria-hidden', String(index !== current));
    });
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === current);
      dot.setAttribute('aria-current', index === current ? 'true' : 'false');
    });
  };

  const goTo = (index) => {
    current = (index + slides.length) % slides.length;
    update();
  };

  const restartTimer = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => goTo(current + 1), 6000);
  };

  nextButton?.addEventListener('click', () => {
    goTo(current + 1);
    restartTimer();
  });

  prevButton?.addEventListener('click', () => {
    goTo(current - 1);
    restartTimer();
  });

  let touchStartX = 0;
  let touchStartY = 0;

  carousel.addEventListener('touchstart', (event) => {
    if (window.innerWidth > 959) return;
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });

  carousel.addEventListener('touchend', (event) => {
    if (window.innerWidth > 959) return;
    const touch = event.changedTouches[0];
    const horizontalDistance = touchStartX - touch.clientX;
    const verticalDistance = touchStartY - touch.clientY;

    if (Math.abs(horizontalDistance) < 48 || Math.abs(horizontalDistance) <= Math.abs(verticalDistance)) return;

    goTo(current + (horizontalDistance > 0 ? 1 : -1));
    restartTimer();
  }, { passive: true });

  carousel.addEventListener('mouseenter', () => window.clearInterval(timer));
  carousel.addEventListener('mouseleave', restartTimer);
  carousel.addEventListener('focusin', () => window.clearInterval(timer));
  carousel.addEventListener('focusout', (event) => {
    if (!carousel.contains(event.relatedTarget)) restartTimer();
  });

  update();
  restartTimer();
})();