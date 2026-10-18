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

  // Waagerechter Abstand von einem Element zur Schiebetür des geparkten Vans
  const toDoor = (el) => {
    const van = $('.van-exit');
    if (!van) return 0;
    const v = van.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return v.left + v.width * 0.45 - (r.left + r.width / 2);
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

  /* ---------- Vorspann: D schlägt ein, der Van rast herein, das Team steigt aus ---------- */

  const intro = (hero) => {
    const fx = document.createElement('div');
    fx.className = 'fx';
    fx.setAttribute('aria-hidden', 'true');
    const flash = document.createElement('div');
    flash.className = 'flash';
    flash.setAttribute('aria-hidden', 'true');
    hero.append(fx, flash);

    const grid = $('.hero-grid', hero);
    const logoD = $('.logo-d', hero);
    const team = $('.logo-team', hero);
    const by = $('.logo-by', hero);
    const copy = $$('.hero-copy > *', hero);
    const van = $('.van-drive', hero);
    const vanArt = $('.van-art', hero);
    const wheels = $$('.spin', hero);
    const stripe = $('.van-side .stripe', hero);
    const headlight = $('.headlight', hero);
    const teamChars = splitChars(team, false);

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Das D schlägt ein und wirbelt Staub auf
    tl.fromTo(logoD,
      { autoAlpha: 0, scale: 3.4, rotation: -14, filter: 'blur(10px)' },
      { autoAlpha: 1, scale: 1, rotation: 0, filter: 'blur(0px)', duration: 0.5, ease: 'power4.in' })
      .addLabel('impact')
      .fromTo(flash, { autoAlpha: 0.45 }, { autoAlpha: 0, duration: 0.45, ease: 'power2.out' }, 'impact')
      .add(() => {
        shake(grid, 10);
        const p = centerIn(logoD, hero);
        dust(fx, p.x - p.w * 0.3, p.y + p.h * 0.45, { count: 6, direction: -1, spread: 120 });
        dust(fx, p.x + p.w * 0.3, p.y + p.h * 0.45, { count: 6, direction: 1, spread: 120 });
      }, 'impact')
      .set(team, { autoAlpha: 1 }, 'impact')
      .fromTo(teamChars,
        { autoAlpha: 0, x: 160, skewX: -35 },
        { autoAlpha: 1, x: 0, skewX: 0, duration: 0.42, stagger: 0.055, ease: 'back.out(2.2)' }, 'impact+=0.05')
      .fromTo(by, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.45 }, 'impact+=0.4')
      .fromTo(copy, { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08 }, 0.1);

    const brake = () => {
      wheels.forEach((wheel) => {
        const p = centerIn(wheel, hero);
        dust(fx, p.x, p.y + p.h * 0.45, { count: 8, direction: 1, spread: 140 });
      });
      shake(grid, 3);
    };

    tl.addLabel('van', 'impact+=0.6')
      .fromTo(van, { autoAlpha: 1, x: () => window.innerWidth * 1.15 }, { x: 0, duration: 1.35, ease: 'power3.out' }, 'van')
      .fromTo(wheels, { rotation: -1440, transformOrigin: '50% 50%' }, { rotation: 0, duration: 1.35, ease: 'power3.out' }, 'van')
      .fromTo(stripe, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.15, ease: 'power3.inOut' }, 'van')
      .add(brake, 'van+=0.8')
      .to(vanArt, { rotation: -2.4, transformOrigin: '80% 100%', duration: 0.16, yoyo: true, repeat: 1, ease: 'power1.inOut' }, 'van+=0.95')
      .fromTo(headlight, { opacity: 1 }, { opacity: 0.25, duration: 0.07, repeat: 5, yoyo: true, ease: 'none' }, 'van+=1.25');

    // Die Schiebetür geht auf, das Team springt nacheinander heraus
    const door = $('.van-door', hero);
    const mates = $$('.mate', hero);
    const thumb = $('.arm--thumb', hero);
    const wave = $('.arm--wave', hero);
    tl.addLabel('crew', 'van+=1.45')
      .fromTo(door, { opacity: 1, scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 0.3, ease: 'power2.out' }, 'crew');
    mates.forEach((mate, i) => {
      const at = `crew+=${0.3 + i * 0.3}`;
      tl.fromTo(mate, { autoAlpha: 0, x: toDoor(mate), scale: 0.8, transformOrigin: '50% 100%' },
        { autoAlpha: 1, x: 0, scale: 1, duration: 0.55, ease: 'power2.out' }, at)
        .fromTo(mate, { y: 0 }, { keyframes: { y: [0, -38, 0] }, duration: 0.55, ease: 'none' }, at)
        .add(() => {
          const p = centerIn(mate, hero);
          dust(fx, p.x, p.y + p.h / 2, { count: 4, direction: i % 2 ? 1 : -1, spread: 50 });
        }, `${at}+=0.55`);
    });
    if (thumb) {
      tl.fromTo(thumb, { rotation: 130, transformOrigin: '50% 0%' }, { rotation: 0, duration: 0.4, ease: 'back.out(3)' }, 'crew+=1.5');
    }
    if (wave) {
      tl.to(wave, { rotation: 28, transformOrigin: '50% 0%', duration: 0.18, yoyo: true, repeat: 5, ease: 'sine.inOut' }, 'crew+=1.75')
        .add(() => {
          // Ab und zu winkt der Kleine noch einmal
          gsap.timeline({ repeat: -1, repeatDelay: 6, delay: 5 })
            .to(wave, { rotation: 28, transformOrigin: '50% 0%', duration: 0.18, yoyo: true, repeat: 5, ease: 'sine.inOut' });
        });
    }

    return tl;
  };

  /* ---------- Sprechblasen: das Team hat was zu sagen ---------- */

  const SAYINGS = [
    ['Ich liebe es, wenn ein Plan funktioniert.', 'Erst der Plan, dann die Action.', 'Jeder Plan fängt mit dem ersten Schritt an.'],
    ['Ich steig in kein Flugzeug! Wir nehmen den Van.', 'Montag ist Kochtag. Fertiggerichte? Nicht mit uns!'],
    ['Kein Problem ist zu groß für das D-Team.', 'Wenn sonst keiner mehr hilft: D-Team!'],
    ['Wann ist der nächste Ausflug?', 'Gemeinsam schaffen wir das!'],
  ];

  const talk = (hero, introTl) => {
    const crew = $('.crew', hero);
    const mates = $$('.mate-exit', hero);
    if (!crew || !mates.length) return;
    const bubble = document.createElement('p');
    bubble.className = 'bubble';
    bubble.setAttribute('aria-hidden', 'true');
    crew.appendChild(bubble);

    const next = mates.map(() => 0);
    let current;
    let turn = 0;

    // Das Team ist sichtbar, wenn es ausgestiegen ist und im Bildschirm steht
    const crewVisible = () => {
      const r = crew.getBoundingClientRect();
      return r.bottom > 80 && r.top < window.innerHeight - 30
        && mates.every((m) => parseFloat(getComputedStyle(m).opacity) > 0.9);
    };

    const say = (i) => {
      if (!crewVisible()) return;
      const lines = SAYINGS[i % SAYINGS.length];
      bubble.textContent = lines[next[i] % lines.length];
      next[i] += 1;
      if (current) current.kill();
      gsap.set(bubble, { autoAlpha: 0, scale: 1, y: 0 });

      // Blase über die Figur setzen, ohne über den Bildschirmrand zu ragen
      const c = crew.getBoundingClientRect();
      const m = mates[i].getBoundingClientRect();
      const center = m.left + m.width / 2 - c.left;
      const width = bubble.offsetWidth;
      const min = 12 - c.left;
      const max = document.documentElement.clientWidth - 12 - width - c.left;
      const left = Math.max(min, Math.min(max, center - width * 0.3));
      bubble.style.left = `${left}px`;
      bubble.style.setProperty('--tail', `${center - left}px`);

      gsap.fromTo(mates[i].firstElementChild, { y: 0 }, { y: -8, duration: 0.14, yoyo: true, repeat: 1, ease: 'power1.out' });
      current = gsap.timeline()
        .fromTo(bubble, { autoAlpha: 0, scale: 0.4, y: 12, transformOrigin: `${center - left}px 100%` },
          { autoAlpha: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(2.5)' })
        .to(bubble, { autoAlpha: 0, scale: 0.85, duration: 0.25, ease: 'power1.in' }, '+=3.4');
    };

    // Nach dem Aussteigen spricht zuerst der Chef, danach reihum
    introTl.add(() => {
      say(0);
      gsap.timeline({ repeat: -1, delay: 5, repeatDelay: 5 }).add(() => {
        turn = (turn + 1) % mates.length;
        say(turn);
      });
    }, '+=0.2');

    // Ein Klick auf eine Figur bringt den nächsten Spruch
    crew.classList.add('is-talking');
    mates.forEach((mate, i) => mate.addEventListener('click', () => { turn = i; say(i); }));

    ScrollTrigger.create({
      trigger: crew, start: 'bottom bottom',
      onEnter: () => say(turn),
    });
    ScrollTrigger.create({
      trigger: hero, start: 'top top', end: '45% top',
      onLeave: () => { if (current) current.kill(); gsap.to(bubble, { autoAlpha: 0, duration: 0.2 }); },
    });
  };

  /* ---------- Szenen beim Scrollen ---------- */

  const scenes = (hero) => {
    // Fortschritt als roter Streifen unter der Kopfleiste
    gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

    // Der Van fährt davon, das Logo steigt langsamer
    if (hero) {
      gsap.timeline({ scrollTrigger: { trigger: hero, start: '45% top', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true } })
        .to('.mate-exit', { x: (i, el) => toDoor(el), autoAlpha: 0, scale: 0.8, transformOrigin: '50% 100%', duration: 0.25, stagger: 0.04, ease: 'power1.in' }, 0)
        .to('.van-door', { scaleX: 0, transformOrigin: '0% 50%', duration: 0.1 }, 0.33)
        .to('.van-exit', { x: () => -window.innerWidth * 1.25, duration: 0.6, ease: 'power2.in' }, 0.4)
        .to('.spin2', { rotation: 1080, transformOrigin: '50% 50%', duration: 0.6, ease: 'power2.in' }, 0.4)
        .to('.logo', { y: -60, duration: 1, ease: 'none' }, 0);
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

    // Montags-Einsatz: Block fährt hoch, Wochentage erscheinen, der Montag wird gestempelt
    const mission = $('#kochen');
    if (mission) {
      const today = $('.week .is-on', mission);
      const days = $$('.week li', mission).filter((day) => day !== today);
      gsap.timeline({ scrollTrigger: { trigger: mission, start: 'top 85%' } })
        .fromTo(mission, { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' })
        .fromTo(days, { autoAlpha: 0, y: -20 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.05, ease: 'back.out(2)' }, '-=0.3')
        .fromTo(today, { autoAlpha: 0, scale: 4, rotation: -30 }, { autoAlpha: 1, scale: 1.12, rotation: -6, duration: 0.3, ease: 'power4.in' }, '+=0.1')
        .add(() => shake(mission, 6));
    }

    // Ausflüge: die Reisetickets fliegen herein
    const trips = $('#ausfluege');
    if (trips) {
      gsap.timeline({ scrollTrigger: { trigger: trips, start: 'top 85%' } })
        .fromTo(trips, { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' })
        .fromTo($$('.ticket', trips), { autoAlpha: 0, x: 240, rotation: 14 }, {
          autoAlpha: 1, x: 0, rotation: (i) => (i % 2 ? 1.5 : -2), duration: 0.6, stagger: 0.15, ease: 'back.out(1.6)',
        }, '-=0.3')
        .add(() => shake(trips, 5));
    }

    // Fotoreihen: die Bilder fliegen wie hingeworfene Abzüge auf den Tisch
    $$('.mission-gallery').forEach((gallery) => {
      gsap.fromTo($$('figure', gallery),
        { autoAlpha: 0, y: 90, scale: 1.3, rotation: () => gsap.utils.random(-28, 28) },
        { autoAlpha: 1, y: 0, scale: 1, rotation: 0, duration: 0.6, stagger: 0.1, ease: 'back.out(1.4)',
          scrollTrigger: { trigger: gallery, start: 'top 92%' } });
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
    $$('details').forEach((item) => {
      item.addEventListener('toggle', () => setTimeout(() => ScrollTrigger.refresh(), 400));
    });

    // Häufige Fragen: Zeilen schieben sich nacheinander herein
    gsap.fromTo('.faq-item', { autoAlpha: 0, x: -50 }, {
      autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.09, ease: 'power3.out',
      scrollTrigger: { trigger: '.faq', start: 'top 88%' },
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
    // Hannibals Spruch knallt wie ein Stempel hin
    gsap.fromTo('.contact-quote', { autoAlpha: 0, scale: 1.6, rotation: -6 }, {
      autoAlpha: 1, scale: 1, rotation: 0, duration: 0.45, ease: 'power4.in', transformOrigin: '0% 50%',
      scrollTrigger: { trigger: '.contact-quote', start: 'top 90%' },
      onComplete: () => shake($('.contact .wrap'), 4),
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
      root.classList.add('motion');
      if (hero) talk(hero, intro(hero));
      scenes(hero);
    });
    gsap.matchMedia().add('(prefers-reduced-motion: reduce)', () => {
      const crew = $('.crew');
      if (!crew) return undefined;
      const bubble = document.createElement('p');
      bubble.className = 'bubble bubble--static';
      bubble.setAttribute('aria-hidden', 'true');
      bubble.textContent = SAYINGS[0][0];
      crew.appendChild(bubble);
      return () => bubble.remove();
    });
    root.classList.remove('intro');
  };

  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise((resolve) => setTimeout(resolve, 1500))]).then(start);
})();
