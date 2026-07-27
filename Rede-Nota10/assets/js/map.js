(() => {
  const mapElement = document.getElementById('map');
  const listElement = document.querySelector('[data-units-list]');
  const addressInput = document.querySelector('[data-address-input]');
  const serviceFilterSelect = document.querySelector('[data-service-filter]');
  const findNearestButton = document.querySelector('[data-find-nearest]');
  const nearestResult = document.querySelector('[data-nearest-result]');

  const isInnerPage = document.body.classList.contains('inner-page');
  const pathPrefix = isInnerPage ? '..' : '.';

  let map;
  const markerMap = new Map();
  let unitsCache = [];
  let originMarker = null;

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
          <article class="unit-item reveal" data-unit-id="${unit.id}">
            <h3>${unit.nome}</h3>
            <p>${unit.endereco}</p>
            <p><strong>Telefone:</strong> ${unit.telefone}</p>
            <button class="btn btn-primary" data-focus-map="${unit.id}">Ver no mapa</button>
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
  };

  const applyFilters = () => {
    const serviceTerm = serviceFilterSelect ? serviceFilterSelect.value : '';

    const filtered = unitsCache.filter((unit) => {
      const serviceMatch = !serviceTerm || unit.servicos.includes(serviceTerm);
      return serviceMatch;
    });

    renderUnitList(filtered);
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
    if (nearestMarker && map) {
      map.setView(nearestMarker.getLatLng(), 14, { animate: true });
      nearestMarker.openPopup();
    }

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
        <strong>Endereço:</strong> ${nearest.endereco}<br>
        <a href="${googleRoute}" target="_blank" rel="noopener noreferrer">Traçar rota no Google Maps</a> |
        <a href="${wazeRoute}" target="_blank" rel="noopener noreferrer">Abrir no Waze</a>
      `;
    }
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
        ${unit.endereco}<br>
        ${unit.telefone}<br><br>
        <a href="${googleRoute}" target="_blank" rel="noopener noreferrer">Rota no Google Maps</a><br>
        <a href="${wazeRoute}" target="_blank" rel="noopener noreferrer">Abrir no Waze</a>
      `);
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
      addressInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          findNearestUnit();
        }
      });
      serviceFilterSelect?.addEventListener('change', applyFilters);
    })
    .catch(() => {
      if (listElement) {
        listElement.innerHTML = '<article class="unit-item"><p>Não foi possível carregar as unidades agora.</p></article>';
      }
    });
})();
