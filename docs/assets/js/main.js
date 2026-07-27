(() => {
  const isInnerPage = document.body.classList.contains('inner-page');
  const pathPrefix = isInnerPage ? '..' : '.';

  const preloader = document.querySelector('[data-preloader]');
  const backToTopBtn = document.querySelector('[data-back-to-top]');
  const yearEl = document.querySelector('[data-current-year]');
  const counterEls = document.querySelectorAll('[data-counter]');
  const promoSlides = document.querySelectorAll('[data-promo-slide]');

  window.addEventListener('load', () => {
    if (preloader) preloader.classList.add('hidden');
  });

  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const toggleBackToTop = () => {
    if (!backToTopBtn) return;
    backToTopBtn.classList.toggle('visible', window.scrollY > 430);
  };

  toggleBackToTop();
  window.addEventListener('scroll', toggleBackToTop, { passive: true });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (counterEls.length) {
    const animateCounter = (counter) => {
      const target = Number(counter.dataset.counter || 0);
      if (!target) return;
      const duration = 1400;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const value = Math.floor(progress * target);
        counter.textContent = value.toLocaleString('pt-BR');
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    };

    const counterObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counterEls.forEach((counter) => counterObserver.observe(counter));
  }

  if (promoSlides.length) {
    let active = 0;
    setInterval(() => {
      promoSlides[active].classList.remove('active');
      active = (active + 1) % promoSlides.length;
      promoSlides[active].classList.add('active');
    }, 5000);
  }

  const lazyImages = document.querySelectorAll('img[data-src]');

  if ('IntersectionObserver' in window && lazyImages.length) {
    const imageObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        obs.unobserve(img);
      });
    });

    lazyImages.forEach((img) => imageObserver.observe(img));
  }

  const quickCityInput = document.querySelector('[data-quick-city]');
  const quickResults = document.querySelector('[data-quick-results]');

  if (quickCityInput && quickResults) {
    fetch(`${pathPrefix}/data/postos.json`)
      .then((response) => response.json())
      .then((units) => {
        const calculateDistanceKm = (fromLat, fromLng, toLat, toLng) => {
          const toRad = (value) => (value * Math.PI) / 180;
          const earthRadiusKm = 6371;
          const deltaLat = toRad(toLat - fromLat);
          const deltaLng = toRad(toLng - fromLng);

          const a =
            Math.sin(deltaLat / 2) ** 2 +
            Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(deltaLng / 2) ** 2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return earthRadiusKm * c;
        };

        const geocodeAddress = (term) => {
          const query = encodeURIComponent(`${term}, Rio de Janeiro, Brasil`);
          return fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${query}`)
            .then((geoResponse) => geoResponse.json())
            .then((results) => {
              if (!results.length) return null;
              return {
                lat: Number(results[0].lat),
                lng: Number(results[0].lon)
              };
            })
            .catch(() => null);
        };

        const render = (items, nearestDistanceKm = null) => {
          quickResults.innerHTML = items
            .slice(0, 6)
            .map(
              (unit, index) =>
                `<li><span><strong>${unit.nome}</strong><br>${unit.endereco}${nearestDistanceKm !== null && index === 0 ? `<br><small>Mais próximo: ${nearestDistanceKm.toFixed(1)} km</small>` : ''}</span><a class="btn btn-secondary" href="${pathPrefix}/pages/unidades.html">Ver</a></li>`
            )
            .join('');

          if (!items.length) {
            quickResults.innerHTML = '<li>Nenhuma unidade encontrada para este bairro.</li>';
          }
        };

        render(units);

        let searchTimer = null;
        let searchToken = 0;

        quickCityInput.addEventListener('input', () => {
          const term = quickCityInput.value.trim().toLowerCase();

          if (searchTimer) clearTimeout(searchTimer);

          if (!term) {
            render(units);
            return;
          }

          searchTimer = setTimeout(async () => {
            const currentToken = ++searchToken;

            const origin = await geocodeAddress(term);

            if (currentToken !== searchToken) return;

            if (!origin) {
              const fallback = units.filter(
                (unit) =>
                  unit.endereco.toLowerCase().includes(term) ||
                  unit.cidade.toLowerCase().includes(term)
              );
              render(fallback);
              return;
            }

            let nearest = units[0];
            let shortestDistance = calculateDistanceKm(origin.lat, origin.lng, nearest.lat, nearest.lng);

            units.slice(1).forEach((unit) => {
              const distance = calculateDistanceKm(origin.lat, origin.lng, unit.lat, unit.lng);
              if (distance < shortestDistance) {
                shortestDistance = distance;
                nearest = unit;
              }
            });

            render([nearest], shortestDistance);
          }, 450);
        });
      })
      .catch(() => {
        quickResults.innerHTML = '<li>Não foi possível carregar as unidades agora.</li>';
      });
  }
})();
