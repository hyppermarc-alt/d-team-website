(() => {
  const root = document.documentElement;

  // Ladesequenz erst starten, wenn die Schablonenschrift da ist,
  // damit die Einschusslöcher auf dem richtigen "D" landen.
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const fallback = new Promise((resolve) => setTimeout(resolve, 1500));
  Promise.race([fontsReady, fallback]).then(() => root.classList.add('ready'));

  // Menü auf kleinen Bildschirmen
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('nav');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
})();
