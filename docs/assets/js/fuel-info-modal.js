(() => {
  const modal = document.querySelector('[data-fuel-modal]');
  if (!modal) return;

  const titleEl = modal.querySelector('[data-fuel-modal-title]');
  const subtitleEl = modal.querySelector('[data-fuel-modal-subtitle]');
  const filtersEl = modal.querySelector('[data-fuel-modal-filters]');
  const unitsEl = modal.querySelector('[data-fuel-modal-units]');
  const cards = [...document.querySelectorAll('[data-fuel-name]')];
  const openButtons = [...document.querySelectorAll('[data-open-fuel-modal]')];
  const closeTriggers = [...modal.querySelectorAll('[data-close-fuel-modal]')];
  const UNITS_CACHE_KEY = 'rn10_units_cache_v2';
  const UNITS_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
  const isInnerPage = document.body.classList.contains('inner-page');
  const pathPrefix = isInnerPage ? '..' : '.';

  let unitsCache = [];

  const readUnitsCache = () => {
    try {
      const rawCache = localStorage.getItem(UNITS_CACHE_KEY);
      if (!rawCache) return [];

      const parsed = JSON.parse(rawCache);
      const isExpired = !parsed?.timestamp || Date.now() - parsed.timestamp > UNITS_CACHE_TTL_MS;
      if (isExpired || !Array.isArray(parsed?.units)) return [];

      return parsed.units;
    } catch {
      return [];
    }
  };

  const normalize = (value) => String(value || '').trim();

  const extractFilters = (card) => {
    const filters = normalize(card.dataset.fuelFilters)
      .split('|')
      .map((item) => normalize(item))
      .filter(Boolean);
    const mode = normalize(card.dataset.fuelMode) || 'all';
    return { mode, filters };
  };

  const formatAddress = (address) => {
    if (!address) return 'Endereco nao informado';
    return String(address).replace(/\s+/g, ' ').trim();
  };

  const matchByFilters = (unit, filters) => {
    const services = Array.isArray(unit?.servicos) ? unit.servicos : [];
    return filters.some((filterTerm) => services.includes(filterTerm));
  };

  const getMatchingUnits = (mode, filters) => {
    if (!unitsCache.length) return [];
    if (mode === 'all' || !filters.length) return unitsCache;
    return unitsCache.filter((unit) => matchByFilters(unit, filters));
  };

  const buildUnitsMarkup = (units, filters) => {
    if (!units.length) {
      return '<li class="fuel-info-modal__empty">Nenhuma unidade encontrada com os filtros selecionados.</li>';
    }

    return units
      .map((unit) => {
        const services = Array.isArray(unit?.servicos) ? unit.servicos : [];
        const relatedServices = filters.length ? services.filter((service) => filters.includes(service)) : services;
        const servicesMarkup = relatedServices.length
          ? relatedServices.map((service) => `<span class="unit-modal__chip">${service}</span>`).join('')
          : '<span class="unit-modal__chip unit-modal__chip--empty">Consulte disponibilidade na unidade</span>';

        return `
          <li class="fuel-info-modal__item">
            <div class="fuel-info-modal__top">
              <h3>${unit.nome}</h3>
              <div class="unit-modal__chips fuel-info-modal__chips-inline">${servicesMarkup}</div>
            </div>
            <div class="fuel-info-modal__bottom">
              <p>${formatAddress(unit.endereco)}</p>
              <div class="fuel-info-modal__actions">
                <button class="fuel-info-modal__details" type="button" data-fuel-unit-id="${unit.id}">Ver detalhes</button>
              </div>
            </div>
          </li>
        `;
      })
      .join('');
  };

  const openModal = (card) => {
    const fuelName = normalize(card.dataset.fuelName) || 'Combustivel';
    const { mode, filters } = extractFilters(card);
    const matchingUnits = getMatchingUnits(mode, filters);

    if (titleEl) titleEl.textContent = `Unidades com ${fuelName}`;

    if (subtitleEl) {
      subtitleEl.textContent = 'Confira as unidades e toque em Ver detalhes para abrir o posto completo.';
    }

    if (filtersEl) {
      filtersEl.innerHTML = mode === 'all'
        ? '<span class="unit-modal__chip">Todos os postos da rede</span>'
        : filters.map((filter) => `<span class="unit-modal__chip">${filter}</span>`).join('');
    }

    if (unitsEl) {
      unitsEl.innerHTML = buildUnitsMarkup(matchingUnits, filters);
    }

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

  const ensureUnitsLoaded = () => {
    const cached = readUnitsCache();
    if (cached.length) {
      unitsCache = cached;
      return Promise.resolve();
    }

    return fetch(`${pathPrefix}/data/postos.json`, { cache: 'no-store' })
      .then((response) => response.json())
      .then((units) => {
        unitsCache = Array.isArray(units) ? units : [];
      })
      .catch(() => {
        unitsCache = [];
      });
  };

  closeTriggers.forEach((trigger) => {
    trigger.addEventListener('click', closeModal);
  });

  unitsEl?.addEventListener('click', (event) => {
    const detailsButton = event.target.closest('[data-fuel-unit-id]');
    if (!detailsButton) return;

    event.preventDefault();
    event.stopPropagation();

    const unitId = Number(detailsButton.dataset.fuelUnitId);
    if (!unitId) return;

    const selectedUnit = unitsCache.find((unit) => Number(unit.id) === unitId);

    window.setTimeout(() => {
      let opened = false;

      if (selectedUnit && typeof window.rn10OpenUnitModalData === 'function') {
        opened = window.rn10OpenUnitModalData(selectedUnit) === true;
      } else if (typeof window.rn10OpenUnitModal === 'function') {
        opened = window.rn10OpenUnitModal(unitId) === true;
      }

      if (opened) {
        closeModal();
      }
    }, 0);
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  openButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    button.addEventListener('click', () => {
      const card = button.closest('[data-fuel-name]');
      if (!card) return;

      ensureUnitsLoaded().then(() => {
        openModal(card);
      });
    });
  });

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      ensureUnitsLoaded().then(() => {
        openModal(card);
      });
    });
  });
})();
