(() => {
  const revealItems = document.querySelectorAll('.reveal');

  if (!revealItems.length) return;

  revealItems.forEach((item, index) => {
    item.style.setProperty('--delay', `${Math.min(index * 55, 280)}ms`);
  });

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealItems.forEach((item) => observer.observe(item));
})();
