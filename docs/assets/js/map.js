(() => {
  const mapElement = document.getElementById('map');
  const listElement = document.querySelector('[data-units-list]');
  const addressInput = document.querySelector('[data-address-input]');
  const serviceFilterSelect = document.querySelector('[data-service-filter]');
  const findNearestButton = document.querySelector('[data-find-nearest]');
  const useLocationButton = document.querySelector('[data-use-location]');
  const filterToggle = document.querySelector('[data-filter-toggle]');
  const unitFilters = document.querySelector('[data-unit-filters]');
  const nearestResult = document.querySelector('[data-nearest-result]');
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
  const unitModalFocusMapButton = document.querySelector('[data-unit-modal-focus-map]');
  const unitModalCloseTriggers = document.querySelectorAll('[data-close-unit-modal]');

  const isInnerPage = document.body.classList.contains('inner-page');
  const pathPrefix = isInnerPage ? '..' : '.';

  let map;
  const markerMap = new Map();
  let unitsCache = [];
  let originMarker = null;
  let activeModalUnit = null;

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
        const fallback = `${pathPrefix}/assets/images/banners/hero-fallback.svg`;
        if (imageElement.dataset.fallbackApplied === 'true') return;
        imageElement.dataset.fallbackApplied = 'true';
        imageElement.src = fallback;
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
    const unitImages = [
      unit.imagemPrincipal,
      ...(Array.isArray(unit.galeria) ? unit.galeria : [])
    ]
      .filter(Boolean)
      .map((imagePath) => resolveAssetPath(imagePath));

    if (unitModalTitle) unitModalTitle.textContent = unit.nome;
    if (unitModalCity) unitModalCity.textContent = unit.cidade || 'Unidade';
    if (unitModalDescription) unitModalDescription.textContent = unit.descricao || 'Adicione aqui a descrição desta unidade.';
    if (unitModalAddress) unitModalAddress.textContent = unit.endereco || 'Endereço não informado';
    if (unitModalPhone) unitModalPhone.textContent = unit.telefone || 'Não informado';
    if (unitModalHours) unitModalHours.textContent = unit.horario || 'Funcionamento 24h';

    if (unitModalMainImage) {
      unitModalMainImage.dataset.fallbackApplied = 'false';
      unitModalMainImage.alt = `Foto principal de ${unit.nome}`;
      unitModalMainImage.src = unitImages[0] || `${pathPrefix}/assets/images/banners/hero-fallback.svg`;
      applyImageFallback(unitModalMainImage);
    }

    if (unitModalGallery) {
      unitModalGallery.innerHTML = unitImages
        .map((imagePath, index) => {
          return `
            <button class="unit-modal__gallery-item" type="button" data-gallery-index="${index}">
              <img src="${imagePath}" alt="Foto ${index + 1} de ${unit.nome}">
            </button>
          `;
        })
        .join('');

      unitModalGallery.querySelectorAll('img').forEach((img) => applyImageFallback(img));
    }

    if (unitModalServices) {
      const services = Array.isArray(unit.servicos) ? unit.servicos : [];
      unitModalServices.innerHTML = services.length
        ? services.map((service) => `<span class="unit-modal__chip">${service}</span>`).join('')
        : '<span class="unit-modal__chip unit-modal__chip--empty">Serviços a cadastrar</span>';
    }

    if (unitModalFocusMapButton) {
      unitModalFocusMapButton.onclick = () => {
        const marker = markerMap.get(unit.id);
        if (!marker || !map) return;
        map.setView(marker.getLatLng(), 14, { animate: true });
        marker.openPopup();
        closeUnitModal();
      };
    }

    unitModal.classList.add('is-open');
    unitModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    unitModal.querySelector('.unit-modal__close')?.focus();
  };

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

  const geocodeAddress = (address) => {
    const query = encodeURIComponent(`${address}, Rio de Janeiro, Brasil`);
    return fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${query}`)
      .then((response) => response.json())
      .then((results) => {
        if (!results.length) return null;
        return {
          lat: Number(results[0].lat),
          lng: Number(results[0].lon),
          displayName: results[0].display_name
        };
      })
      .catch(() => null);
  };

  const renderUnitList = (units) => {
    if (!listElement) return;

    listElement.innerHTML = units
      .map(
        (unit, index) => `
          <article class="unit-item" data-unit-id="${unit.id}">
            <img class="unit-thumb" src="${resolveAssetPath(unit.imagemPrincipal) || `${pathPrefix}/assets/images/banners/hero-fallback.svg`}" alt="Foto principal de ${unit.nome}">
            <div class="unit-item__body">
              <h3>${unit.nome}</h3>
              <p>${formatPublicAddress(unit.endereco)}</p>
              <p><strong>Telefone:</strong> ${unit.telefone}</p>
              <div class="unit-item__actions">
                <button class="btn btn-secondary" data-open-unit-modal="${unit.id}">Ver mais</button>
                <button class="btn btn-primary" data-focus-map="${unit.id}">Ver no mapa</button>
              </div>
            </div>
          </article>
        `
      )
      .join('');

    if (!units.length) {
      listElement.innerHTML = '<article class="unit-item"><p>Nenhuma unidade encontrada com os filtros atuais.</p></article>';
    }

    listElement.querySelectorAll('[data-focus-map]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = Number(button.dataset.focusMap);
        const marker = markerMap.get(id);
        if (!marker || !map) return;
        map.setView(marker.getLatLng(), 14, { animate: true });
        marker.openPopup();
      });
    });

    listElement.querySelectorAll('[data-open-unit-modal]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = Number(button.dataset.openUnitModal);
        const unit = unitsCache.find((item) => item.id === id);
        if (!unit) return;
        openUnitModal(unit);
      });
    });
  };

  const applyFilters = () => {
    const serviceTerm = serviceFilterSelect ? serviceFilterSelect.value : '';

    const filtered = unitsCache.filter((unit) => {
      const serviceMatch = !serviceTerm || unit.servicos.includes(serviceTerm);
      return serviceMatch;
    });

    renderUnitList(filtered);
  };

  const focusNearestMarker = (marker) => {
    if (!marker || !map) return;

    const isMobile = window.matchMedia('(max-width: 959px)').matches;
    map.setView(marker.getLatLng(), isMobile ? 11 : 12, { animate: !isMobile });
    marker.openPopup();
    if (isMobile) {
      window.setTimeout(() => map.panBy([0, -100], { animate: true }), 80);
    }
  };

  const findNearestUnit = async () => {
    const rawAddress = addressInput ? addressInput.value.trim() : '';

    if (!rawAddress) {
      if (nearestResult) nearestResult.textContent = 'Digite um endereço para localizar o posto mais próximo.';
      return;
    }

    const serviceTerm = serviceFilterSelect ? serviceFilterSelect.value : '';
    const pool = unitsCache.filter((unit) => !serviceTerm || unit.servicos.includes(serviceTerm));

    if (!pool.length) {
      renderUnitList([]);
      if (nearestResult) nearestResult.textContent = 'Nenhuma unidade disponível para o filtro de serviço selecionado.';
      return;
    }

    findNearestButton?.setAttribute('disabled', 'disabled');
    if (nearestResult) nearestResult.textContent = 'Buscando o posto mais próximo...';

    const origin = await geocodeAddress(rawAddress);

    findNearestButton?.removeAttribute('disabled');

    if (!origin) {
      if (nearestResult) nearestResult.textContent = 'Não foi possível localizar este endereço. Tente digitar com bairro e cidade.';
      return;
    }

    let nearest = pool[0];
    let shortestDistance = calculateDistanceKm(origin.lat, origin.lng, nearest.lat, nearest.lng);

    pool.slice(1).forEach((unit) => {
      const distance = calculateDistanceKm(origin.lat, origin.lng, unit.lat, unit.lng);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearest = unit;
      }
    });

    renderUnitList([nearest]);

    const nearestMarker = markerMap.get(nearest.id);
    focusNearestMarker(nearestMarker);

    if (map) {
      if (originMarker) map.removeLayer(originMarker);
      originMarker = L.marker([origin.lat, origin.lng]).addTo(map);
      originMarker.bindPopup(`
        <strong>Seu endereço informado</strong><br>
        ${origin.displayName || rawAddress}
      `);
    }

    const destination = `${nearest.lat},${nearest.lng}`;
    const originPoint = `${origin.lat},${origin.lng}`;
    const googleRoute = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originPoint)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    const wazeRoute = `https://www.waze.com/ul?ll=${nearest.lat}%2C${nearest.lng}&navigate=yes`;

    if (nearestResult) {
      nearestResult.innerHTML = `
        <strong>Posto mais próximo:</strong> ${nearest.nome} (aprox. ${shortestDistance.toFixed(1)} km).<br>
        <strong>Endereço:</strong> ${formatPublicAddress(nearest.endereco)}<br>
        <a href="${googleRoute}" target="_blank" rel="noopener noreferrer">Traçar rota no Google Maps</a> |
        <a href="${wazeRoute}" target="_blank" rel="noopener noreferrer">Abrir no Waze</a>
      `;
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      if (nearestResult) nearestResult.textContent = 'Seu navegador não permite usar a localização automática.';
      return;
    }

    useLocationButton?.setAttribute('disabled', 'disabled');
    if (nearestResult) nearestResult.textContent = 'Solicitando sua localização...';

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        useLocationButton?.removeAttribute('disabled');

        const serviceTerm = serviceFilterSelect ? serviceFilterSelect.value : '';
        const pool = unitsCache.filter((unit) => !serviceTerm || unit.servicos.includes(serviceTerm));

        if (!pool.length) {
          renderUnitList([]);
          if (nearestResult) nearestResult.textContent = 'Nenhuma unidade disponível para o filtro de serviço selecionado.';
          return;
        }

        const origin = { lat: coords.latitude, lng: coords.longitude };
        let nearest = pool[0];
        let shortestDistance = calculateDistanceKm(origin.lat, origin.lng, nearest.lat, nearest.lng);

        pool.slice(1).forEach((unit) => {
          const distance = calculateDistanceKm(origin.lat, origin.lng, unit.lat, unit.lng);
          if (distance < shortestDistance) {
            shortestDistance = distance;
            nearest = unit;
          }
        });

        renderUnitList([nearest]);

        const nearestMarker = markerMap.get(nearest.id);
        focusNearestMarker(nearestMarker);

        if (map) {
          if (originMarker) map.removeLayer(originMarker);
          originMarker = L.marker([origin.lat, origin.lng]).addTo(map);
          originMarker.bindPopup('<strong>Sua localização atual</strong>');
        }

        const destination = `${nearest.lat},${nearest.lng}`;
        const originPoint = `${origin.lat},${origin.lng}`;
        const googleRoute = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originPoint)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
        const wazeRoute = `https://www.waze.com/ul?ll=${nearest.lat}%2C${nearest.lng}&navigate=yes`;

        if (nearestResult) {
          nearestResult.innerHTML = `
            <strong>Posto mais próximo:</strong> ${nearest.nome} (aprox. ${shortestDistance.toFixed(1)} km).<br>
            <strong>Endereço:</strong> ${formatPublicAddress(nearest.endereco)}<br>
            <a href="${googleRoute}" target="_blank" rel="noopener noreferrer">Traçar rota no Google Maps</a> |
            <a href="${wazeRoute}" target="_blank" rel="noopener noreferrer">Abrir no Waze</a>
          `;
        }
      },
      () => {
        useLocationButton?.removeAttribute('disabled');
        if (nearestResult) nearestResult.textContent = 'Não foi possível acessar sua localização. Verifique a permissão do navegador.';
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const setupMap = (units) => {
    if (!mapElement || typeof window.L === 'undefined') return;

    map = L.map(mapElement, { scrollWheelZoom: false }).setView([-22.9068, -43.1729], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    units.forEach((unit) => {
      const marker = L.marker([unit.lat, unit.lng]).addTo(map);
      const googleRoute = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${unit.lat},${unit.lng}`)}`;
      const wazeRoute = `https://www.waze.com/ul?ll=${unit.lat}%2C${unit.lng}&navigate=yes`;
      marker.bindPopup(`
        <strong>${unit.nome}</strong><br>
        ${formatPublicAddress(unit.endereco)}<br>
        ${unit.telefone}<br><br>
        <a href="${googleRoute}" target="_blank" rel="noopener noreferrer">Rota no Google Maps</a><br>
        <a href="${wazeRoute}" target="_blank" rel="noopener noreferrer">Abrir no Waze</a>
      `, { autoPan: false });
      markerMap.set(unit.id, marker);
    });
  };

  fetch(`${pathPrefix}/data/postos.json`)
    .then((response) => response.json())
    .then((units) => {
      unitsCache = units;
      setupMap(units);
      renderUnitList(units);

      findNearestButton?.addEventListener('click', findNearestUnit);
      useLocationButton?.addEventListener('click', useCurrentLocation);
      filterToggle?.addEventListener('click', () => {
        if (!unitFilters) return;
        const isExpanded = filterToggle.getAttribute('aria-expanded') === 'true';
        filterToggle.setAttribute('aria-expanded', String(!isExpanded));
        unitFilters.hidden = isExpanded;
      });
      addressInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          findNearestUnit();
        }
      });
      serviceFilterSelect?.addEventListener('change', applyFilters);

      const shouldLocateUser = new URLSearchParams(window.location.search).get('localizar') === '1';
      if (shouldLocateUser) {
        document.querySelector('.units-finder-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        useCurrentLocation();
      }
    })
    .catch(() => {
      if (listElement) {
        listElement.innerHTML = '<article class="unit-item"><p>Não foi possível carregar as unidades agora.</p></article>';
      }
    });

  unitModalCloseTriggers.forEach((trigger) => {
    trigger.addEventListener('click', closeUnitModal);
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && unitModal?.classList.contains('is-open')) {
      closeUnitModal();
    }
  });
})();
