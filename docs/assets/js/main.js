(() => {
  const isInnerPage = document.body.classList.contains('inner-page');
  const pathPrefix = isInnerPage ? '..' : '.';

  const preloader = document.querySelector('[data-preloader]');
  const backToTopBtn = document.querySelector('[data-back-to-top]');
  const heroSection = document.querySelector('.hero');
  const yearEl = document.querySelector('[data-current-year]');
  const counterEls = document.querySelectorAll('[data-counter]');
  const promoSlides = document.querySelectorAll('[data-promo-slide]');
  const homeUnitsList = document.querySelector('[data-home-units-list]');
  const unitModal = document.querySelector('[data-unit-modal]');
  const unitModalTitle = document.querySelector('[data-unit-modal-title]');
  const unitModalCity = document.querySelector('[data-unit-modal-city]');
  const unitModalDescription = document.querySelector('[data-unit-modal-description]');
  const unitModalAddress = document.querySelector('[data-unit-modal-address]');
  const unitModalPhone = document.querySelector('[data-unit-modal-phone]');
  const unitModalHours = document.querySelector('[data-unit-modal-hours]');
  const unitModalGallery = document.querySelector('[data-unit-modal-gallery]');
  const unitModalServices = document.querySelector('[data-unit-modal-services]');
  const unitModalMainImage = document.querySelector('[data-unit-modal-main-image]');
  const unitModalPrevButton = document.querySelector('[data-unit-modal-prev]');
  const unitModalNextButton = document.querySelector('[data-unit-modal-next]');
  const unitModalCounter = document.querySelector('[data-unit-modal-counter]');
  const unitModalFocusMapButton = document.querySelector('[data-unit-modal-focus-map]');
  const unitModalCloseTriggers = document.querySelectorAll('[data-close-unit-modal]');
  let unitsCache = [];
  let activeModalUnit = null;
  let activeModalImages = [];
  let activeModalImageIndex = 0;

  const hideBackToTopOnPage = /\/pages\/(trabalhe-conosco|contato)\.html$/i.test(window.location.pathname);

  if (backToTopBtn && hideBackToTopOnPage) {
    backToTopBtn.dataset.disabled = 'true';
    backToTopBtn.classList.remove('visible');
  }

  if (backToTopBtn && heroSection) {
    const heroVisibilityObserver = new IntersectionObserver(
      (entries) => {
        const heroVisible = entries.some((entry) => entry.isIntersecting);
        backToTopBtn.classList.toggle('hidden-in-hero', heroVisible);
      },
      { threshold: 0.15 }
    );

    heroVisibilityObserver.observe(heroSection);
  }

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

  const updateScrollBackground = () => {
    document.body.classList.toggle('is-scrolled', window.scrollY > 60);
  };

  const toggleBackToTop = () => {
    if (!backToTopBtn) return;
    const isDisabled = backToTopBtn.dataset.disabled === 'true';
    const hiddenInHero = backToTopBtn.classList.contains('hidden-in-hero');
    const shouldShow = window.scrollY > 430 && !isDisabled && !hiddenInHero;
    backToTopBtn.classList.toggle('visible', shouldShow);
  };

  updateScrollBackground();
  toggleBackToTop();
  window.addEventListener('scroll', () => {
    updateScrollBackground();
    toggleBackToTop();
  }, { passive: true });

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

    promoSlides.forEach((slide, index) => {
      slide.classList.toggle('active', index === active);
    });

    setInterval(() => {
      promoSlides[active].classList.remove('active');
      active = (active + 1) % promoSlides.length;
      promoSlides[active].classList.add('active');
    }, 5000);
  }

  const resolveAssetPath = (assetPath) => {
    if (!assetPath) return '';
    if (/^(https?:)?\/\//i.test(assetPath) || assetPath.startsWith('/')) return assetPath;
    return `${pathPrefix}/${assetPath.replace(/^\.\/?/, '')}`;
  };

  const applyImageFallback = (imageElement) => {
    if (!imageElement) return;
    imageElement.addEventListener(
      'error',
      () => {
        if (imageElement.dataset.fallbackApplied === 'true') return;
        imageElement.dataset.fallbackApplied = 'true';
        imageElement.src = `${pathPrefix}/assets/images/banners/hero-fallback.svg`;
      },
      { once: true }
    );
  };

  const formatPublicAddress = (address) => {
    if (!address) return 'Endereço não informado';

    const cleanAddress = String(address).replace(/\s+/g, ' ').trim();

    const withoutState = cleanAddress.replace(/\s*-\s*RJ$/i, '').trim();
    const withoutCity = withoutState.replace(/,\s*[^,]+$/i, '').trim();
    const neighborhood = withoutCity.split(' - ').pop()?.trim();

    if (neighborhood) {
      return `${neighborhood} - RJ`;
    }

    return cleanAddress;
  };

  const getUnitImages = (unit) => {
    const unitImages = [
      unit.imagemPrincipal,
      ...(Array.isArray(unit.galeria) ? unit.galeria : [])
    ]
      .filter(Boolean)
      .map((imagePath) => resolveAssetPath(imagePath));
    return [...new Set(unitImages)];
  };

  const updateUnitCarousel = () => {
    if (!unitModalMainImage || !activeModalImages.length) return;

    const imagePath = activeModalImages[activeModalImageIndex];
    unitModalMainImage.dataset.fallbackApplied = 'false';
    unitModalMainImage.src = imagePath || `${pathPrefix}/assets/images/banners/hero-fallback.svg`;
    unitModalMainImage.alt = activeModalUnit
      ? `Foto ${activeModalImageIndex + 1} de ${activeModalUnit.nome}`
      : 'Imagem da unidade';
    applyImageFallback(unitModalMainImage);

    if (unitModalCounter) {
      unitModalCounter.textContent = `${activeModalImageIndex + 1} / ${activeModalImages.length}`;
    }

    if (unitModalGallery) {
      unitModalGallery.querySelectorAll('[data-unit-modal-thumb]').forEach((thumb, index) => {
        thumb.classList.toggle('is-active', index === activeModalImageIndex);
      });
    }

    if (unitModalPrevButton) unitModalPrevButton.disabled = activeModalImages.length <= 1;
    if (unitModalNextButton) unitModalNextButton.disabled = activeModalImages.length <= 1;
  };

  const moveUnitCarousel = (direction) => {
    if (!activeModalImages.length) return;
    activeModalImageIndex = (activeModalImageIndex + direction + activeModalImages.length) % activeModalImages.length;
    updateUnitCarousel();
  };

  const closeUnitModal = () => {
    if (!unitModal) return;
    unitModal.classList.remove('is-open');
    unitModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    activeModalUnit = null;
  };

  const openUnitModal = (unit) => {
    if (!unitModal) return;

    activeModalUnit = unit;
    const unitImages = getUnitImages(unit);
    activeModalImages = unitImages.length ? unitImages : [`${pathPrefix}/assets/images/banners/hero-fallback.svg`];
    activeModalImageIndex = 0;

    if (unitModalTitle) unitModalTitle.textContent = unit.nome;
    if (unitModalCity) unitModalCity.textContent = unit.cidade || 'Unidade';
    if (unitModalDescription) unitModalDescription.textContent = unit.descricao || 'Adicione aqui a descrição desta unidade.';
    if (unitModalAddress) unitModalAddress.textContent = unit.endereco || 'Endereço não informado';
    if (unitModalPhone) unitModalPhone.textContent = unit.telefone || 'Não informado';
    if (unitModalHours) unitModalHours.textContent = unit.horario || 'Funcionamento 24h';

    if (unitModalMainImage) {
      unitModalMainImage.dataset.fallbackApplied = 'false';
      unitModalMainImage.src = activeModalImages[0];
      unitModalMainImage.alt = `Foto 1 de ${unit.nome}`;
      applyImageFallback(unitModalMainImage);
    }

    if (unitModalGallery) {
      unitModalGallery.innerHTML = activeModalImages
        .map((imagePath, index) => {
          return `
            <button class="unit-modal__gallery-item" type="button" data-unit-modal-thumb data-index="${index}" aria-label="Mostrar foto ${index + 1}">
              <img src="${imagePath}" alt="Foto ${index + 1} de ${unit.nome}">
            </button>
          `;
        })
        .join('');
      unitModalGallery.querySelectorAll('img').forEach((img) => applyImageFallback(img));
      unitModalGallery.querySelectorAll('[data-unit-modal-thumb]').forEach((thumb) => {
        thumb.addEventListener('click', () => {
          activeModalImageIndex = Number(thumb.dataset.index || 0);
          updateUnitCarousel();
        });
      });
    }

    if (unitModalServices) {
      const services = Array.isArray(unit.servicos) ? unit.servicos : [];
      unitModalServices.innerHTML = services.length
        ? services.map((service) => `<span class="unit-modal__chip">${service}</span>`).join('')
        : '<span class="unit-modal__chip unit-modal__chip--empty">Serviços a cadastrar</span>';
    }

    if (unitModalFocusMapButton) {
      unitModalFocusMapButton.style.display = 'none';
    }

    updateUnitCarousel();

    unitModal.classList.add('is-open');
    unitModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    unitModal.querySelector('.unit-modal__close')?.focus();
  };

  const renderHomeUnits = (units) => {
    if (!homeUnitsList) return;

    homeUnitsList.innerHTML = units
      .map(
        (unit) => `
          <article class="unit-item" data-home-unit-id="${unit.id}">
            <img class="unit-thumb" loading="lazy" decoding="async" fetchpriority="low" src="${resolveAssetPath(unit.imagemPrincipal) || `${pathPrefix}/assets/images/banners/hero-fallback.svg`}" alt="Foto principal de ${unit.nome}">
            <div class="unit-item__body">
              <h3>${unit.nome}</h3>
              <p>${formatPublicAddress(unit.endereco)}</p>
              <div class="unit-item__actions">
                <button class="btn btn-secondary" data-open-unit-modal="${unit.id}">Ver mais</button>
                <a class="btn btn-primary" href="pages/unidades.html">Ver no mapa</a>
              </div>
            </div>
          </article>
        `
      )
      .join('');

    homeUnitsList.querySelectorAll('[data-open-unit-modal]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = Number(button.dataset.openUnitModal);
        const unit = unitsCache.find((item) => item.id === id);
        if (!unit) return;
        openUnitModal(unit);
      });
    });
  };

  const syncHomeUnitsLayout = () => {
    if (!homeUnitsList) return;

    if (window.matchMedia('(max-width: 760px)').matches) {
      homeUnitsList.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
      homeUnitsList.style.gap = '0.8rem';
    } else {
      homeUnitsList.style.removeProperty('grid-template-columns');
      homeUnitsList.style.removeProperty('gap');
    }
  };

  if (homeUnitsList || unitModal) {
    if (homeUnitsList) {
      homeUnitsList.innerHTML = '<article class="unit-item"><p>Carregando postos em destaque...</p></article>';
    }

    fetch(`${pathPrefix}/data/postos.json`)
      .then((response) => response.json())
      .then((units) => {
        unitsCache = units;
        try {
          renderHomeUnits(units);
          syncHomeUnitsLayout();
          setupQuickCitySearch(units);
        } catch (error) {
          if (homeUnitsList) {
            homeUnitsList.innerHTML = '<article class="unit-item"><p>Não foi possível montar a vitrine dos postos agora.</p></article>';
          }
        }
      })
      .catch(() => {
        if (homeUnitsList) {
          homeUnitsList.innerHTML = '<article class="unit-item"><p>Não foi possível carregar os postos agora.</p></article>';
        }
      });
  }

  unitModalCloseTriggers.forEach((trigger) => {
    trigger.addEventListener('click', closeUnitModal);
  });

  if (unitModalPrevButton) {
    unitModalPrevButton.addEventListener('click', () => moveUnitCarousel(-1));
  }

  if (unitModalNextButton) {
    unitModalNextButton.addEventListener('click', () => moveUnitCarousel(1));
  }

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && unitModal?.classList.contains('is-open')) {
      closeUnitModal();
    }
  });

  window.addEventListener('resize', syncHomeUnitsLayout, { passive: true });

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

  const setupQuickCitySearch = (units) => {
    if (!quickCityInput || !quickResults) return;

    quickResults.hidden = true;

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

    const normalizeText = (value) =>
      String(value ?? '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    const extractNeighborhood = (address) => {
      if (!address) return '';

      const cleanAddress = String(address).replace(/\s+/g, ' ').trim();
      const parts = cleanAddress.split('-').map((part) => part.trim());
      const lastPart = parts[parts.length - 1] || '';
      const match = lastPart.match(/^(.*?)(?:,\s*Rio de Janeiro\b|,\s*[^,]+)$/i);

      return match ? match[1].trim() : lastPart;
    };

    const matchesUnitTerm = (unit, term) => {
      const normalizedTerm = normalizeText(term);

      if (!normalizedTerm) return true;

      const searchableFields = [unit.nome, unit.endereco, unit.cidade, extractNeighborhood(unit.endereco)]
        .filter(Boolean)
        .map(normalizeText);

      return searchableFields.some((field) => field.includes(normalizedTerm));
    };

    const render = (items, nearestDistanceKm = null) => {
      quickResults.hidden = false;

      if (!items.length) {
        quickResults.innerHTML = '<li>Nenhuma unidade encontrada para este bairro.</li>';
        return;
      }

      const html = items
        .slice(0, 6)
        .map((unit, index) => {
          const address = formatPublicAddress(unit.endereco);
          const distanceMarkup = nearestDistanceKm !== null && index === 0 ? `<br><small>Mais próximo: ${nearestDistanceKm.toFixed(1)} km</small>` : '';
          return `<li><span><strong>${unit.nome}</strong><br>${address}${distanceMarkup}</span><a class="btn btn-secondary" href="${pathPrefix}/pages/unidades.html">Ver</a></li>`;
        })
        .join('');

      quickResults.innerHTML = html;
    };

    let searchTimer = null;
    let searchToken = 0;

    quickCityInput.addEventListener('input', () => {
      const term = quickCityInput.value.trim();

      if (searchTimer) clearTimeout(searchTimer);

      if (!term) {
        quickResults.innerHTML = '';
        quickResults.hidden = true;
        return;
      }

      const localMatches = units.filter((unit) => matchesUnitTerm(unit, term));
      render(localMatches.length ? localMatches : units.slice(0, 3));

      searchTimer = setTimeout(async () => {
        const currentToken = ++searchToken;

        const origin = await geocodeAddress(term);

        if (currentToken !== searchToken) return;

        if (!origin) {
          const fallback = units.filter((unit) => matchesUnitTerm(unit, term));
          render(fallback.length ? fallback : units.slice(0, 3));
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
  };
})();
