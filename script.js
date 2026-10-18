(() => {
  const root = document.documentElement;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  /* ---------- Menü auf kleinen Bildschirmen ---------- */

  const toggle = $('.nav-toggle');
  const nav = document.getElementById('nav');
  if (toggle && nav) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* ---------- Werkzeuge ---------- */

  // Text in einzelne Buchstaben bzw. Wörter zerlegen; Screenreader lesen das aria-label
  const splitChars = (el, label = true) => {
    const text = el.textContent.trim();
    if (label) el.setAttribute('aria-label', text);
    el.textContent = '';
    return [...text].map((ch) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = ch === ' ' ? ' ' : ch;
      el.appendChild(span);
      return span;
    });
  };

  const splitWords = (el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', words.join(' '));
    el.textContent = '';
    return words.map((word, i) => {
      const span = document.createElement('span');
      span.className = 'word';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = word;
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      return span;
    });
  };

  // Mittelpunkt eines Elements relativ zu einem Bezugselement
  const centerIn = (el, host) => {
    const r = el.getBoundingClientRect();
    const h = host.getBoundingClientRect();
    return { x: r.left - h.left + r.width / 2, y: r.top - h.top + r.height / 2, w: r.width, h: r.height };
  };

  const shake = (el, power = 6) => {
    if (!el) return;
    gsap.fromTo(el, { x: 0, y: 0 }, {
      keyframes: {
        x: [0, -power, power * 0.8, -power * 0.5, power * 0.3, 0],
        y: [0, power * 0.5, -power * 0.4, power * 0.3, -power * 0.1, 0],
      },
      duration: 0.38,
      ease: 'none',
      overwrite: 'auto',
    });
  };

  const spawn = (layer, className, x, y) => {
    const el = document.createElement('span');
    el.className = className;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    layer.appendChild(el);
    return el;
  };

  // Mündungsfeuer mit Funkenflug
  const burst = (layer, x, y, size = 1) => {
    const flash = spawn(layer, 'muzzle', x, y);
    gsap.fromTo(flash, { scale: 0.2 * size, autoAlpha: 1, rotation: gsap.utils.random(0, 90) }, {
      scale: 1.4 * size, autoAlpha: 0, duration: 0.3, ease: 'power2.out', onComplete: () => flash.remove(),
    });
    for (let i = 0; i < 8; i += 1) {
      const spark = spawn(layer, 'spark', x, y);
      const angle = Math.random() * Math.PI * 2;
      const distance = gsap.utils.random(30, 100) * size;
      gsap.fromTo(spark, { x: 0, y: 0, rotation: (angle * 180) / Math.PI, autoAlpha: 1 }, {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance + 24,
        autoAlpha: 0,
        duration: gsap.utils.random(0.35, 0.65),
        ease: 'power2.out',
        onComplete: () => spark.remove(),
      });
    }
  };

  // Staubwolke, z. B. beim Bremsen oder wenn eine Kiste aufschlägt
  const dust = (layer, x, y, { count = 7, direction = 1, className = 'dust', spread = 110 } = {}) => {
    for (let i = 0; i < count; i += 1) {
      const puff = spawn(layer, className, x, y);
      gsap.fromTo(puff, { scale: 0.3, autoAlpha: 0.95, x: 0, y: 0 }, {
        scale: gsap.utils.random(1.4, 3),
        autoAlpha: 0,
        x: direction * gsap.utils.random(10, spread),
        y: gsap.utils.random(-46, -4),
        duration: gsap.utils.random(0.7, 1.3),
        ease: 'power2.out',
        onComplete: () => puff.remove(),
      });
    }
  };

  /* ---------- Vorspann: D schlägt ein, Schüsse, der Van rast herein ---------- */

  const intro = (hero) => {
    const fx = document.createElement('div');
    fx.className = 'fx';
    fx.setAttribute('aria-hidden', 'true');
    const flash = document.createElement('div');
    flash.className = 'flash';
    flash.setAttribute('aria-hidden', 'true');
    hero.append(fx, flash);

    const grid = $('.hero-grid', hero);
    const logoRow = $('.logo-row', hero);
    const logoD = $('.logo-d', hero);
    const team = $('.logo-team', hero);
    const by = $('.logo-by', hero);
    const holes = $$('.hole', hero);
    const copy = $$('.hero-copy > *', hero);
    const van = $('.van-drive', hero);
    const vanArt = $('.van-art', hero);
    const wheels = $$('.spin', hero);
    const stripe = $('.van-side .stripe', hero);
    const headlight = $('.headlight', hero);
    const teamChars = splitChars(team, false);

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(logoD,
      { autoAlpha: 0, scale: 3.4, rotation: -14, filter: 'blur(10px)' },
      { autoAlpha: 1, scale: 1, rotation: 0, filter: 'blur(0px)', duration: 0.5, ease: 'power4.in' })
      .addLabel('impact')
      .fromTo(flash, { autoAlpha: 0.75 }, { autoAlpha: 0, duration: 0.5, ease: 'power2.out' }, 'impact')
      .add(() => {
        shake(grid, 12);
        const p = centerIn(logoD, hero);
        burst(fx, p.x, p.y, 1.9);
      }, 'impact')
      .set(team, { autoAlpha: 1 }, 'impact')
      .fromTo(teamChars,
        { autoAlpha: 0, x: 160, skewX: -35 },
        { autoAlpha: 1, x: 0, skewX: 0, duration: 0.42, stagger: 0.055, ease: 'back.out(2.2)' }, 'impact+=0.05')
      .fromTo(by, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.45 }, 'impact+=0.4')
      .fromTo(copy, { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.1 }, 'impact+=0.25')
      .addLabel('shots', 'impact+=0.75');

    holes.forEach((hole, i) => {
      const at = `shots+=${i * 0.15}`;
      tl.fromTo(hole, { autoAlpha: 0, scale: 2.8 }, { autoAlpha: 1, scale: 1, duration: 0.14, ease: 'power4.out' }, at)
        .add(() => {
          const p = centerIn(hole, hero);
          burst(fx, p.x, p.y, 0.8);
          shake(logoRow, 5);
        }, at);
    });

    const brake = () => {
      wheels.forEach((wheel) => {
        const p = centerIn(wheel, hero);
        dust(fx, p.x, p.y + p.h * 0.45, { count: 8, direction: 1, spread: 140 });
      });
      shake(grid, 3);
    };

    tl.addLabel('van', `shots+=${holes.length * 0.15 + 0.1}`)
      .fromTo(van, { autoAlpha: 1, x: () => window.innerWidth * 1.15 }, { x: 0, duration: 1.35, ease: 'power3.out' }, 'van')
      .fromTo(wheels, { rotation: -1440, transformOrigin: '50% 50%' }, { rotation: 0, duration: 1.35, ease: 'power3.out' }, 'van')
      .fromTo(stripe, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.15, ease: 'power3.inOut' }, 'van')
      .add(brake, 'van+=0.8')
      .to(vanArt, { rotation: -2.4, transformOrigin: '80% 100%', duration: 0.16, yoyo: true, repeat: 1, ease: 'power1.inOut' }, 'van+=0.95')
      .fromTo(headlight, { opacity: 1 }, { opacity: 0.25, duration: 0.07, repeat: 5, yoyo: true, ease: 'none' }, 'van+=1.25');

    return fx;
  };

  /* ---------- Mitmachen: Klick ins Bild hinterlässt ein Einschussloch ---------- */

  const shooting = (hero, fx) => {
    const layer = document.createElement('div');
    layer.className = 'shots';
    layer.setAttribute('aria-hidden', 'true');
    hero.appendChild(layer);
    const shots = [];
    root.classList.add('armed');

    hero.addEventListener('click', (event) => {
      if (event.target.closest('a, button, input, summary')) return;
      const h = hero.getBoundingClientRect();
      const x = event.clientX - h.left;
      const y = event.clientY - h.top;
      const hole = spawn(layer, 'shot', x, y);
      hole.style.setProperty('--r', `${gsap.utils.random(-80, 80)}deg`);
      shots.push(hole);
      gsap.fromTo(hole, { autoAlpha: 0, scale: 2.6 }, { autoAlpha: 1, scale: 1, duration: 0.14, ease: 'power4.out' });
      burst(fx, x, y, 0.9);
      shake($('.hero-grid', hero), 4);
      if (shots.length > 14) {
        const oldest = shots.shift();
        gsap.to(oldest, { autoAlpha: 0, duration: 0.4, onComplete: () => oldest.remove() });
      }
    });
  };

  /* ---------- Szenen beim Scrollen ---------- */

  const scenes = (hero) => {
    // Fortschritt als roter Streifen unter der Kopfleiste
    gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

    // Der Van fährt davon, das Logo steigt langsamer
    if (hero) {
      gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 } })
        .to('.van-exit', { x: () => -window.innerWidth * 1.25, ease: 'power2.in' }, 0)
        .to('.spin2', { rotation: 1080, transformOrigin: '50% 50%', ease: 'power2.in' }, 0)
        .to('.logo', { y: -90, ease: 'none' }, 0);
    }

    // Laufband: läuft immer, dreht beim schnellen Scrollen auf und folgt der Richtung
    const track = $('.ticker-track');
    if (track) {
      const loop = gsap.to(track, { xPercent: -50, duration: 30, ease: 'none', repeat: -1 });
      loop.totalTime(loop.duration() * 200);
      let settle;
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          const boost = Math.min(Math.abs(self.getVelocity()) / 220, 7);
          gsap.to(loop, { timeScale: self.direction * (1 + boost), duration: 0.2, overwrite: true });
          if (settle) settle.kill();
          settle = gsap.to(loop, { timeScale: self.direction, duration: 1.2, delay: 0.25 });
        },
      });
    }

    // Überschriften: Schablonenbuchstaben springen einzeln herein
    $$('main section:not(.hero):not(.contact) h2').forEach((h2) => {
      gsap.fromTo(splitChars(h2),
        { autoAlpha: 0, yPercent: 120, rotation: 14 },
        { autoAlpha: 1, yPercent: 0, rotation: 0, duration: 0.7, stagger: 0.035, ease: 'back.out(1.8)', scrollTrigger: { trigger: h2, start: 'top 88%' } });
    });
    $$('.section-intro').forEach((p) => {
      gsap.fromTo(p, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8, scrollTrigger: { trigger: p, start: 'top 90%' } });
    });

    // Leistungen: Kisten fallen herunter, schlagen auf, Staub fliegt
    const crates = $('.crates');
    if (crates) {
      const thud = (crate) => {
        gsap.fromTo(crate, { scaleY: 0.93, scaleX: 1.03, transformOrigin: '50% 100%' }, { scaleY: 1, scaleX: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
        shake(crates, 5);
        const c = crate.getBoundingClientRect();
        const h = crates.getBoundingClientRect();
        const bottom = c.bottom - h.top;
        dust(crates, c.left - h.left + 10, bottom, { count: 5, direction: -1, className: 'dust dust--sand', spread: 70 });
        dust(crates, c.right - h.left - 10, bottom, { count: 5, direction: 1, className: 'dust dust--sand', spread: 70 });
      };
      gsap.set('.crate', { autoAlpha: 0 });
      ScrollTrigger.batch('.crate', {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => {
          gsap.fromTo(batch,
            { autoAlpha: 1, y: -240, rotation: () => gsap.utils.random(-8, 8) },
            { y: 0, rotation: 0, duration: 0.55, ease: 'power3.in', stagger: { each: 0.2, onComplete() { thud(this.targets()[0]); } } });
        },
      });
      $$('.crate-photo img').forEach((img) => {
        gsap.fromTo(img, { clipPath: 'inset(0% 100% 0% 0%)', scale: 1.3 }, {
          clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.1, delay: 0.55, ease: 'power3.inOut',
          scrollTrigger: { trigger: img, start: 'top 88%' },
        });
      });
      $$('.crate .stars').forEach((list) => {
        gsap.fromTo(list.children, { autoAlpha: 0, x: -26 }, {
          autoAlpha: 1, x: 0, duration: 0.45, stagger: 0.07, delay: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: list, start: 'top 90%' },
        });
      });
      gsap.fromTo('.plate', { scale: 0, rotation: -30 }, {
        scale: 1, rotation: 0, duration: 0.5, stagger: 0.07, delay: 0.9, ease: 'back.out(3)',
        scrollTrigger: { trigger: '.plates', start: 'top 92%' },
      });
    }

    // Werdegang: Akte rutscht herein, Zähler läuft hoch, Stempel knallt drauf
    if ($('.folder')) {
      gsap.fromTo('.folder', { autoAlpha: 0, y: 160, rotation: 4 }, {
        autoAlpha: 1, y: 0, rotation: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.folder', start: 'top 88%' },
      });
      gsap.fromTo('.facts > div', { autoAlpha: 0, x: -30 }, {
        autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.1, delay: 0.5, scrollTrigger: { trigger: '.facts', start: 'top 88%' },
      });
      const num = $('.tally-num');
      if (num) {
        const target = parseInt(num.textContent, 10);
        const counter = { value: 0 };
        num.textContent = '0';
        gsap.to(counter, {
          value: target, duration: 2, ease: 'power2.out', snap: { value: 1 },
          onUpdate: () => { num.textContent = counter.value; },
          scrollTrigger: { trigger: num, start: 'top 90%' },
        });
      }
      const stamp = $('.stamp');
      if (stamp) {
        gsap.timeline({ scrollTrigger: { trigger: stamp, start: 'top 92%' }, delay: 0.5 })
          .fromTo(stamp, { autoAlpha: 0, scale: 4.5, rotation: -32 }, { autoAlpha: 0.85, scale: 1, rotation: -7, duration: 0.3, ease: 'power4.in' })
          .add(() => shake($('.folder-sheet'), 7));
      }
      gsap.fromTo('.stations li', { autoAlpha: 0, x: -40 }, {
        autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.08, scrollTrigger: { trigger: '.stations', start: 'top 90%' },
      });
    }

    // Projekte: Akten fliegen abwechselnd von links und rechts auf den Tisch
    $$('.project').forEach((project, i) => {
      const side = i % 2 ? 1 : -1;
      gsap.fromTo(project, { autoAlpha: 0, x: side * 200, rotation: side * 5 }, {
        autoAlpha: 1, x: 0, rotation: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: project, start: 'top 90%' },
      });
    });
    $$('.project').forEach((project) => {
      project.addEventListener('toggle', () => setTimeout(() => ScrollTrigger.refresh(), 400));
    });

    // Referenzen: Städtenamen werden aufgesprüht, Presseliste fährt ein
    gsap.fromTo('.clients li', { autoAlpha: 0, xPercent: -40, skewX: 20 }, {
      autoAlpha: 1, xPercent: 0, skewX: 0, duration: 0.65, stagger: 0.13, ease: 'power4.out',
      scrollTrigger: { trigger: '.clients', start: 'top 88%' },
    });
    gsap.fromTo('.press li', { autoAlpha: 0, y: 26 }, {
      autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.07, scrollTrigger: { trigger: '.press', start: 'top 90%' },
    });

    // Kontakt: Frage baut sich auf, Nummer läuft wie auf einem Einsatzcomputer ein
    const contactH2 = $('.contact h2');
    if (contactH2) {
      gsap.fromTo(splitWords(contactH2), { autoAlpha: 0, y: 50, rotation: 6 }, {
        autoAlpha: 1, y: 0, rotation: 0, duration: 0.6, stagger: 0.06, ease: 'back.out(1.6)',
        scrollTrigger: { trigger: contactH2, start: 'top 88%' },
      });
    }
    gsap.fromTo('.contact-lead, .contact-list', { autoAlpha: 0, y: 30 }, {
      autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.15, scrollTrigger: { trigger: '.contact-lead', start: 'top 92%' },
    });
    const phone = $('.phone');
    if (phone) {
      const number = phone.textContent;
      ScrollTrigger.create({
        trigger: phone,
        start: 'top 92%',
        once: true,
        onEnter: () => {
          const state = { p: 0 };
          gsap.to(state, {
            p: 1,
            duration: 1.5,
            ease: 'power1.inOut',
            onUpdate: () => {
              const locked = Math.floor(state.p * number.length);
              phone.textContent = [...number].map((ch, i) => (i < locked || ch === ' ' ? ch : String(Math.floor(Math.random() * 10)))).join('');
            },
            onComplete: () => { phone.textContent = number; },
          });
        },
      });
    }
    gsap.fromTo('.van-side--rear .stripe', { clipPath: 'inset(0% 0% 0% 100%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
      scrollTrigger: { trigger: '.contact', start: 'top 70%', end: 'bottom bottom', scrub: 0.5 },
    });
  };

  /* ---------- Start, sobald die Schablonenschrift geladen ist ---------- */

  const start = () => {
    clearTimeout(window.__introFallback);
    if (!window.gsap || !window.ScrollTrigger) {
      root.classList.remove('intro');
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const hero = $('.hero');
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      if (hero) shooting(hero, intro(hero));
      scenes(hero);
    });
    root.classList.remove('intro');
  };

  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise((resolve) => setTimeout(resolve, 1500))]).then(start);
})();
