(() => {
  'use strict';
  const root = document.documentElement;
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#navigation');
  const motion = document.querySelector('#motion-toggle');
  const cursor = document.querySelector('.demo-cursor');
  const echoes = [...document.querySelectorAll('.cursor-echo')];
  const progress = document.querySelector('.scroll-progress');
  const hero = document.querySelector('.hero');
  const figure = document.querySelector('.car-figure');
  const parts = [...document.querySelectorAll('.assembly-part')];
  const reveals = [...document.querySelectorAll('.reveal')];
  const chapters = [...document.querySelectorAll('.chapter')];
  const targets = [...document.querySelectorAll('[data-target]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 901px) and (min-height: 680px) and (pointer: fine)');
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const ease = n => n * n * (3 - 2 * n);
  let enabled = false, userOff = false, frame = 0, lastTime = 0;
  let width = innerWidth, height = innerHeight, maxScroll = 1, heroTravel = 0;
  let revealData = [], partData = [], route = [], chapterData = [];
  let previousScroll = scrollY, x = width * .5, y = height * .5;
  let echoX = x, echoY = y, echo2X = x, echo2Y = y, pulseTimer;

  // This preference is optional: storage may be unavailable for local files.
  try { userOff = localStorage.getItem('heliotech-motion') === 'off'; } catch {}
  document.querySelector('#year').textContent = new Date().getFullYear();
  root.classList.add('js-ready');
  menu.hidden = false;
  motion.hidden = false;
  function closeMenu() {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.textContent = 'Menu +';
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.textContent = open ? 'Close −' : 'Menu +';
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      closeMenu(); menu.focus();
    }
  });
  function schedule() { if (!frame) frame = requestAnimationFrame(render); }
  function bounds(element) {
    const rect = element.getBoundingClientRect();
    return { element, top: rect.top + scrollY, x: rect.left + rect.width * .65,
      y: rect.top + scrollY + Math.min(rect.height * .45, 120) };
  }
  function measure() {
    // All layout reads are grouped here, never in the animation loop.
    width = innerWidth; height = innerHeight;
    const animated = [...reveals, ...parts, figure];
    animated.forEach(element => { element.style.transform = 'none'; });
    heroTravel = enabled ? Math.max(0, hero.offsetHeight - height) : 0;
    revealData = reveals.map(bounds);
    revealData.filter(item => item.element.classList.contains('team-card')).forEach((item, i) => {
      item.top += enabled ? (i % 3) * height * .06 : 0;
    });
    partData = parts.map(bounds);
    chapterData = chapters.map(bounds);
    route = targets.map(element => {
      const item = bounds(element);
      const inHero = hero.contains(element);
      if (inHero) item.y -= Math.min(scrollY, heroTravel);
      item.hero = inHero;
      item.at = inHero ? (element.dataset.target === 'title' ? 0 : heroTravel * .65)
        : Math.max(0, item.y - height * .56);
      const partIndex = parts.indexOf(element);
      if (partIndex >= 0) item.at = item.top - height * .68 + partIndex * height * .09;
      if (element.dataset.target === 'electrical') item.at += height * .08;
      item.dark = !!element.closest('.support,.car-figure');
      return item;
    }).sort((a, b) => a.at - b.at);
    animated.forEach(element => { element.style.removeProperty('transform'); });
    maxScroll = Math.max(1, document.documentElement.scrollHeight - height);
    previousScroll = scrollY;
    schedule();
  }
  function configure() {
    enabled = desktop.matches && !reduced.matches && !userOff;
    root.classList.toggle('enhanced', enabled);
    motion.disabled = reduced.matches || !desktop.matches;
    motion.textContent = reduced.matches ? 'Reduced motion' : enabled ? 'Motion: on' : 'Motion: off';
    motion.setAttribute('aria-pressed', String(!enabled));
    motion.setAttribute('aria-label', enabled ? 'Turn scroll animation off' : 'Turn scroll animation on');
    // CSS custom properties must not leave content hidden after switching modes.
    if (!enabled) {
      [...reveals, ...parts, figure].forEach(element => element.removeAttribute('style'));
      document.querySelector('.assembly').style.removeProperty('--line-progress');
      hero.style.removeProperty('--title-outline');
    }
    measure();
  }
  motion.addEventListener('click', () => {
    userOff = !userOff;
    try { localStorage.setItem('heliotech-motion', userOff ? 'off' : 'on'); } catch {}
    configure();
  });
  function pulse() {
    cursor.classList.remove('clicking');
    clearTimeout(pulseTimer);
    // A new animation name is not needed; the next frame restarts the ring.
    requestAnimationFrame(() => cursor.classList.add('clicking'));
    pulseTimer = setTimeout(() => cursor.classList.remove('clicking'), 650);
  }
  function render(time) {
    frame = 0;
    const s = scrollY;
    progress.style.transform = `scaleX(${clamp(s / maxScroll)})`;
    let active = chapterData[0]?.element.id;
    chapterData.forEach(item => { if (s + height * .4 >= item.top) active = item.element.id; });
    nav.querySelectorAll('a').forEach(link => {
      if (link.hash === `#${active}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    if (!enabled || document.hidden) { lastTime = 0; return; }
    const dt = lastTime ? Math.min(64, time - lastTime) : 16;
    lastTime = time;
    const hp = clamp(s / Math.max(1, heroTravel));
    const car = ease(clamp((hp - .08) / .55));
    figure.style.setProperty('--car-opacity', .35 + car * .65);
    figure.style.setProperty('--car-y', `${(1 - car) * 24}px`);
    figure.style.setProperty('--outline', Math.sin(car * Math.PI).toFixed(3));
    hero.style.setProperty('--title-outline', Math.max(0, 1 - hp * 5));
    revealData.forEach(item => {
      const p = ease(clamp((s + height * .92 - item.top) / (height * .32)));
      item.element.style.setProperty('--reveal', p.toFixed(3));
      item.element.style.setProperty('--reveal-y', `${(1 - p) * 32}px`);
      item.element.style.setProperty('--outline', Math.sin(p * Math.PI).toFixed(3));
    });
    let line = 0;
    partData.forEach((item, i) => {
      const p = ease(clamp((s + height * .85 - item.top - i * height * .09) / (height * .19)));
      item.element.style.setProperty('--part', (.16 + p * .84).toFixed(3));
      item.element.style.setProperty('--part-y', `${(1 - p) * 25}px`);
      line += p / parts.length;
    });
    document.querySelector('.assembly').style.setProperty('--line-progress', line.toFixed(3));
    let index = 0;
    while (index < route.length - 2 && s > route[index + 1].at) index++;
    const a = route[index], b = route[Math.min(index + 1, route.length - 1)];
    const raw = clamp((s - a.at) / Math.max(1, b.at - a.at));
    // Hold briefly at each target, then travel smoothly to the next one.
    const t = ease(clamp((raw - .12) / .76));
    const screenY = item => item.y - (item.hero ? Math.max(0, s - heroTravel) : s);
    const tx = clamp(a.x + (b.x - a.x) * t, 24, width - 100);
    const ty = clamp(screenY(a) + (screenY(b) - screenY(a)) * t, 115, height - 65);
    const follow = 1 - Math.exp(-dt / 65);
    x += (tx - x) * follow; y += (ty - y) * follow;
    echoX += (x - echoX) * follow * .55; echoY += (y - echoY) * follow * .55;
    echo2X += (echoX - echo2X) * follow * .45; echo2Y += (echoY - echo2Y) * follow * .45;
    cursor.style.transform = `translate3d(${x}px,${y}px,0)`;
    echoes[0].style.transform = `translate3d(${echoX - 10}px,${echoY + 14}px,0)`;
    echoes[1].style.transform = `translate3d(${echo2X + 14}px,${echo2Y + 25}px,0)`;
    const target = t > .5 ? b : a;
    cursor.classList.toggle('on-dark', target.dark);
    echoes.forEach(element => { element.style.color = target.dark ? '#fff' : '#1e1f2b'; });
    const visible = s < maxScroll - 100;
    cursor.style.opacity = visible ? '1' : '0';
    echoes.forEach(element => { element.style.visibility = visible ? 'visible' : 'hidden'; });
    if (route.some(item => previousScroll < item.at && s >= item.at)) pulse();
    previousScroll = s;
    if (Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(x - echo2X) + Math.abs(y - echo2Y) > .4) schedule();
  }
  // Native scroll remains in control; no wheel/touch interception or scroll locking.
  addEventListener('scroll', schedule, { passive: true });
  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer); resizeTimer = setTimeout(configure, 120);
  });
  addEventListener('load', measure);
  addEventListener('pageshow', measure);
  reduced.addEventListener('change', configure);
  desktop.addEventListener('change', configure);
  document.addEventListener('visibilitychange', () => { lastTime = 0; schedule(); });
  // Keyboard focus always exposes its containing animated content.
  document.addEventListener('focusin', event => {
    if (enabled && event.target.closest('.reveal')) {
      event.target.closest('.reveal').style.setProperty('--reveal', '1');
      event.target.closest('.reveal').style.setProperty('--reveal-y', '0px');
    }
  });
  configure();
})();
