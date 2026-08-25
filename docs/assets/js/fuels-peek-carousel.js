(() => {
  const carousel = document.querySelector('[data-fuels-peek-carousel]');
  if (!carousel) return;

  const viewport = carousel.querySelector('[data-fuels-peek-viewport]');
  const track = carousel.querySelector('[data-fuels-peek-track]');
  const slides = [...carousel.querySelectorAll('[data-fuels-peek-slide]')];
  const dotsWrap = carousel.querySelector('[data-fuels-peek-dots]');
  const nextButton = carousel.querySelector('[data-fuels-peek-next]');
  const prevButton = carousel.querySelector('[data-fuels-peek-prev]');

  if (!viewport || !track || slides.length < 2) return;

  let startIndex = 0;
  let isAnimating = false;
  let timer;

  const getBaseShift = () => 0;

  const dots = slides.map((slide, index) => {
    const dot = document.createElement('button');
    dot.className = 'fuels-peek-carousel__dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `Ir para ${slide.querySelector('h3')?.textContent || `combustivel ${index + 1}`}`);
    dot.addEventListener('click', () => {
      goTo(index);
      restartTimer();
    });
    dotsWrap?.append(dot);
    return dot;
  });

  const getStep = () => {
    const firstSlide = track.children[0];
    if (!firstSlide) return 0;
    const gap = Number.parseFloat(window.getComputedStyle(track).columnGap || window.getComputedStyle(track).gap || '0');
    return firstSlide.getBoundingClientRect().width + gap;
  };

  const getVisibleCenterOffset = () => 0;

  const updateActiveState = () => {
    const orderedSlides = [...track.children];
    orderedSlides.forEach((slide) => {
      slide.classList.remove('is-active');
      slide.setAttribute('aria-hidden', 'false');
    });

    const centerOffset = Math.min(getVisibleCenterOffset(), orderedSlides.length - 1);
    orderedSlides[centerOffset]?.classList.add('is-active');

    const activeLogicalIndex = (startIndex + centerOffset) % slides.length;
    dots.forEach((dot, index) => {
      const isActive = index === activeLogicalIndex;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  };

  const rotateNext = () => {
    if (isAnimating) return Promise.resolve();
    isAnimating = true;
    const step = getStep();
    if (!step) {
      isAnimating = false;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const baseShift = getBaseShift();
      const onEnd = () => {
        track.removeEventListener('transitionend', onEnd);
        track.append(track.firstElementChild);
        track.style.transition = 'none';
        track.style.transform = `translateX(-${baseShift}px)`;
        track.getBoundingClientRect();
        track.style.transition = '';
        startIndex = (startIndex + 1) % slides.length;
        updateActiveState();
        isAnimating = false;
        resolve();
      };

      track.addEventListener('transitionend', onEnd, { once: true });
      track.style.transform = `translateX(-${step + baseShift}px)`;
    });
  };

  const rotatePrev = () => {
    if (isAnimating) return Promise.resolve();
    isAnimating = true;
    const step = getStep();
    if (!step) {
      isAnimating = false;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const baseShift = getBaseShift();
      track.style.transition = 'none';
      track.prepend(track.lastElementChild);
      track.style.transform = `translateX(-${step + baseShift}px)`;
      track.getBoundingClientRect();
      track.style.transition = '';

      const onEnd = () => {
        track.removeEventListener('transitionend', onEnd);
        track.style.transition = 'none';
        track.style.transform = `translateX(-${baseShift}px)`;
        track.getBoundingClientRect();
        track.style.transition = '';
        startIndex = (startIndex - 1 + slides.length) % slides.length;
        updateActiveState();
        isAnimating = false;
        resolve();
      };

      track.addEventListener('transitionend', onEnd, { once: true });
      track.style.transform = `translateX(-${baseShift}px)`;
    });
  };

  const goTo = async (targetCenterIndex) => {
    const centerOffset = getVisibleCenterOffset();
    const targetStart = (targetCenterIndex - centerOffset + slides.length) % slides.length;
    if (targetStart === startIndex) return;

    const forward = (targetStart - startIndex + slides.length) % slides.length;
    const backward = (startIndex - targetStart + slides.length) % slides.length;

    if (forward <= backward) {
      for (let i = 0; i < forward; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await rotateNext();
      }
    } else {
      for (let i = 0; i < backward; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await rotatePrev();
      }
    }
  };

  const restartTimer = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => {
      rotateNext();
    }, 2600);
  };

  nextButton?.addEventListener('click', () => {
    rotateNext();
    restartTimer();
  });

  prevButton?.addEventListener('click', () => {
    rotatePrev();
    restartTimer();
  });

  carousel.addEventListener('mouseenter', () => window.clearInterval(timer));
  carousel.addEventListener('mouseleave', restartTimer);
  carousel.addEventListener('focusin', () => window.clearInterval(timer));
  carousel.addEventListener('focusout', (event) => {
    if (!carousel.contains(event.relatedTarget)) restartTimer();
  });

  window.addEventListener('resize', () => {
    track.style.transition = 'none';
    track.style.transform = `translateX(-${getBaseShift()}px)`;
    track.getBoundingClientRect();
    track.style.transition = '';
    updateActiveState();
  });

  track.style.transform = `translateX(-${getBaseShift()}px)`;
  updateActiveState();
  restartTimer();
})();
