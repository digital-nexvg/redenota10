// Carrega/normaliza data/postos.json — reaproveita o mesmo cache usado por main.js / fuel-info-modal.js.
window.RN10_CHATBOT_DATA = (() => {
  const UNITS_CACHE_KEY = 'rn10_units_cache_v2';
  const UNITS_CACHE_TTL_MS = 1000 * 60 * 60 * 12;

  const isInnerPage = document.body.classList.contains('inner-page');
  const pathPrefix = isInnerPage ? '..' : '.';

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

  const writeUnitsCache = (units) => {
    try {
      localStorage.setItem(UNITS_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), units }));
    } catch {
      /* localStorage indisponível: segue sem cache */
    }
  };

  let unitsPromise = null;

  const getUnits = () => {
    const cached = readUnitsCache();
    if (cached.length) return Promise.resolve(cached);

    if (!unitsPromise) {
      unitsPromise = fetch(`${pathPrefix}/data/postos.json`, { cache: 'no-store' })
        .then((response) => response.json())
        .then((units) => {
          const list = Array.isArray(units) ? units : [];
          writeUnitsCache(list);
          return list;
        })
        .catch(() => []);
    }
    return unitsPromise;
  };

  const normalize = (value) => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // Reconhece variações de digitação (Grajau/Grajaú, Peninsula/Península, Sena/Senna...)
  // e apelidos curtos digitados em frases livres (ex.: "loja Mega" -> mega-engenho-novo).
  const findUnitByText = (units, text) => {
    const query = normalize(text);
    if (!query) return null;

    const exactMatch = units.find((unit) => {
      const slug = normalize(unit.slug);
      const nome = normalize(unit.nome);
      return query.includes(slug) || slug.includes(query) || query.includes(nome) || nome.includes(query);
    });
    if (exactMatch) return exactMatch;

    const queryWords = query.split(/\s+/).filter((word) => word.length >= 4);
    if (!queryWords.length) return null;

    return units.find((unit) => {
      const slugWords = normalize(unit.slug).split('-');
      const nomeWords = normalize(unit.nome).split(' ');
      const unitWords = [...slugWords, ...nomeWords];
      return queryWords.some((word) => unitWords.some((unitWord) => unitWord.length >= 4 && (unitWord.includes(word) || word.includes(unitWord))));
    }) || null;
  };

  return { getUnits, findUnitByText, pathPrefix };
})();
