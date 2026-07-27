(() => {
  const mapElement = document.getElementById('map');
  const listElement = document.querySelector('[data-units-list]');
  const cityFilterInput = document.querySelector('[data-city-filter]');
  const serviceFilterSelect = document.querySelector('[data-service-filter]');

  const isInnerPage = document.body.classList.contains('inner-page');
  const pathPrefix = isInnerPage ? '..' : '.';

  let map;
  const markerMap = new Map();
  let unitsCache = [];

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
    const cityTerm = cityFilterInput ? cityFilterInput.value.trim().toLowerCase() : '';
    const serviceTerm = serviceFilterSelect ? serviceFilterSelect.value : '';

    const filtered = unitsCache.filter((unit) => {
      const cityMatch = !cityTerm || unit.cidade.toLowerCase().includes(cityTerm);
      const serviceMatch = !serviceTerm || unit.servicos.includes(serviceTerm);
      return cityMatch && serviceMatch;
    });

    renderUnitList(filtered);
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
      marker.bindPopup(`
        <strong>${unit.nome}</strong><br>
        ${unit.endereco}<br>
        ${unit.telefone}<br><br>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          `${unit.lat},${unit.lng}`
        )}" target="_blank" rel="noopener noreferrer">Como chegar</a>
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

      cityFilterInput?.addEventListener('input', applyFilters);
      serviceFilterSelect?.addEventListener('change', applyFilters);
    })
    .catch(() => {
      if (listElement) {
        listElement.innerHTML = '<article class="unit-item"><p>Não foi possível carregar as unidades agora.</p></article>';
      }
    });
})();
