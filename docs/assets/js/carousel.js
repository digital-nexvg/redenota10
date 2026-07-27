(() => {
  const track = document.querySelector('[data-reviews-track]');
  const dotsWrap = document.querySelector('[data-reviews-dots]');
  const nextBtn = document.querySelector('[data-carousel-next]');
  const prevBtn = document.querySelector('[data-carousel-prev]');

  if (!track) return;

  const isInnerPage = document.body.classList.contains('inner-page');
  const pathPrefix = isInnerPage ? '..' : '.';

  fetch(`${pathPrefix}/data/avaliacoes.json`)
    .then((response) => response.json())
    .then((reviews) => {
      if (!reviews.length) return;

      track.innerHTML = reviews
        .map(
          (review) => `
            <article class="review-card" role="group" aria-label="Avaliação de ${review.nome}">
              <div class="review-user">
                <img loading="lazy" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='58' height='58'%3E%3Crect width='58' height='58' fill='%23eef1f8'/%3E%3C/svg%3E" data-src="${pathPrefix}/${review.foto}" alt="Foto de ${review.nome}">
                <div>
                  <strong>${review.nome}</strong>
                  <div>${review.cidade}</div>
                </div>
              </div>
              <div class="review-stars" aria-label="5 estrelas">★★★★★</div>
              <p>${review.comentario}</p>
            </article>
          `
        )
        .join('');

      let current = 0;
      const total = reviews.length;

      if (dotsWrap) {
        dotsWrap.innerHTML = reviews
          .map((_, index) => `<button aria-label="Ir para avaliação ${index + 1}" data-dot="${index}"></button>`)
          .join('');
      }

      const dots = dotsWrap ? dotsWrap.querySelectorAll('[data-dot]') : [];

      const update = () => {
        track.style.transform = `translateX(-${current * 100}%)`;
        dots.forEach((dot, index) => {
          dot.classList.toggle('active', index === current);
        });
      };

      const next = () => {
        current = (current + 1) % total;
        update();
      };

      const prev = () => {
        current = (current - 1 + total) % total;
        update();
      };

      nextBtn?.addEventListener('click', next);
      prevBtn?.addEventListener('click', prev);
      dots.forEach((dot) => {
        dot.addEventListener('click', () => {
          current = Number(dot.dataset.dot);
          update();
        });
      });

      update();
      setInterval(next, 5500);
    })
    .catch(() => {
      track.innerHTML = '<article class="review-card"><p>Não foi possível carregar as avaliações no momento.</p></article>';
    });
})();
