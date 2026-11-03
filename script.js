/* ==========================================================
   GIEL — Portafolio · script.js (vanilla)
   1 Utilidades · 2 Intro · 3 Navegación · 4 Revelado
   5 Profundidad · 6 Lightbox · 7 Volver arriba
   ========================================================== */
(() => {
  'use strict';

  /* 1 · UTILIDADES */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  /* 2 · INTRO (A): breve, saltable con clic/tecla */
  const intro = $('#intro');
  let introDone = false;
  const finishIntro = () => {
    if (introDone) return;
    introDone = true;
    intro.classList.add('is-out');
    document.body.classList.remove('is-locked');
    root.classList.add('is-ready');
    setTimeout(() => intro.remove(), 1000);
    placeIndicator();
  };
  document.body.classList.add('is-locked');
  setTimeout(finishIntro, reduced ? 350 : 1900);
  ['click', 'keydown', 'touchstart'].forEach(e => intro.addEventListener(e, finishIntro, { once: true, passive: true }));
  window.addEventListener('keydown', finishIntro, { once: true });

  /* 3 · NAVEGACIÓN (B) */
  const nav = $('#nav'), menu = $('#navMenu'), toggle = $('#navToggle'), ind = $('.nav__ind');
  const links = $$('a[data-sec]', menu);
  const sections = links.map(a => $('#' + a.dataset.sec));
  const bar = $('#progressBar');

  // Indicador deslizante bajo el enlace activo (escritorio)
  function placeIndicator() {
    const a = $('.is-active', menu);
    if (!a || getComputedStyle(ind).display === 'none') return;
    ind.style.width = a.offsetWidth + 'px';
    ind.style.transform = `translateX(${a.offsetLeft}px)`;
  }
  function setActive(id) {
    links.forEach(a => {
      const on = a.dataset.sec === id;
      a.classList.toggle('is-active', on);
      on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
    });
    placeIndicator();
  }
  // Sección activa: la que cruza la línea del 45 % del viewport
  const secObs = new IntersectionObserver(es => {
    es.forEach(e => e.isIntersecting && setActive(e.target.id));
  }, { rootMargin: '-45% 0px -54% 0px' });
  sections.forEach(s => secObs.observe(s));
  setActive('inicio');

  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  const closeMenu = () => { menu.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); };
  links.forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('click', e => { if (!nav.contains(e.target)) closeMenu(); });
  window.addEventListener('resize', placeIndicator);

  /* 4 · REVELADO AL DESPLAZARSE (C): escalonado, sin entrar todo a la vez */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    let batch = 0, timer;
    const revObs = new IntersectionObserver(es => {
      es.filter(e => e.isIntersecting).forEach(e => {
        e.target.style.setProperty('--d', (batch++ * 0.12) + 's');
        e.target.classList.add('is-in');
        revObs.unobserve(e.target);
      });
      clearTimeout(timer); timer = setTimeout(() => (batch = 0), 250);
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(el => revObs.observe(el));
  } else reveals.forEach(el => el.classList.add('is-in'));

  /* 5 · PROFUNDIDAD + BARRA DE PROGRESO + VOLVER ARRIBA (una sola lectura por frame) */
  const toTop = $('#toTop');
  const depthEls = $$('.depth');
  const parallaxOn = !reduced && matchMedia('(min-width: 701px)').matches;
  let ticking = false;
  function onScroll() {
    const max = root.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
    toTop.classList.toggle('is-show', scrollY > innerHeight * 0.8);
    if (parallaxOn) depthEls.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;   // -1 … 1
      el.style.setProperty('--py', (p * -10).toFixed(1) + 'px');
    });
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* 7 · VOLVER ARRIBA */
  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));

  /* 6 · LIGHTBOX (D): cierra con botón, Esc o clic fuera de la imagen */
  const lb = $('#lb'), lbImg = $('#lbImg'), lbScroll = $('#lbScroll'), lbCount = $('#lbCount');
  const pages = [...new Set($$('[data-full]').map(f => f.dataset.full))];   // páginas únicas en orden
  let current = -1, lastFocus = null, startY = 0;

  function show(i, y = 0) {
    current = (i + pages.length) % pages.length;
    lbImg.classList.remove('is-zoomed');
    lbImg.style.opacity = 0;
    lbImg.onload = () => {
      const tall = lbImg.naturalHeight > lbImg.naturalWidth * 1.3;
      lbImg.className = tall ? 'fit-width' : 'fit-contain';
      lbImg.style.opacity = '';
      lbScroll.scrollTop = tall ? lbScroll.scrollHeight * y : 0;   // abre en el fragmento pulsado
    };
    lbImg.src = pages[current];
    const src = $(`[data-full="${pages[current]}"] img`);
    lbImg.alt = src ? src.alt : 'Página del portafolio';
    lbCount.textContent = `${String(current + 1).padStart(2, '0')} / ${String(pages.length).padStart(2, '0')}`;
  }
  function open(fig) {
    lastFocus = document.activeElement;
    startY = parseFloat(fig.dataset.y) || 0;
    show(pages.indexOf(fig.dataset.full), startY);
    lb.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => lb.classList.add('is-open'));
    document.body.classList.add('is-locked');
    $('#lbClose').focus({ preventScroll: true });
  }
  function close() {
    if (current < 0) return;
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    current = -1;
    lastFocus && lastFocus.focus({ preventScroll: true });
  }
  const isOpen = () => lb.classList.contains('is-open');

  $$('.zoomable').forEach(fig => {
    fig.addEventListener('click', e => { if (!e.target.closest('a')) open(fig); });
    // Accesible con teclado
    fig.tabIndex = 0; fig.setAttribute('role', 'button');
    fig.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target === fig) { e.preventDefault(); open(fig); }
    });
  });
  $('#lbClose').addEventListener('click', close);
  $('#lbPrev').addEventListener('click', () => show(current - 1));
  $('#lbNext').addEventListener('click', () => show(current + 1));
  $('#lbZoom').addEventListener('click', () => lbImg.classList.toggle('is-zoomed'));
  lbImg.addEventListener('click', e => { e.stopPropagation(); lbImg.classList.toggle('is-zoomed'); });
  // Clic fuera de la imagen (en el fondo) cierra
  lbScroll.addEventListener('click', e => { if (e.target === lbScroll) close(); });
  addEventListener('keydown', e => {
    if (!isOpen()) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(current - 1);
    else if (e.key === 'ArrowRight') show(current + 1);
    else if (e.key === 'Tab') {   // trampa de foco simple
      const f = $$('button', lb).filter(b => b.offsetParent !== null);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();
