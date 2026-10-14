(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- load sequence ---------- */
  requestAnimationFrame(() => setTimeout(() => document.body.classList.add('loaded'), 60));

  /* ---------- nav turns solid after the hero ---------- */
  const nav = $('#nav');
  const hero = $('.hero');
  const onScroll = () => nav.classList.toggle('solid', window.scrollY > hero.offsetHeight - 80);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- hero: glow + wall follow the pointer ---------- */
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    const glow = $('.glow'), wall = $('.wall');
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      glow.style.setProperty('--gx', `${x * 100}%`);
      glow.style.setProperty('--gy', `${y * 100}%`);
      wall.style.setProperty('--px', `${(x - .5) * -24}px`);
      wall.style.setProperty('--py', `${(y - .5) * -24}px`);
    });
  }

  /* ---------- hero: rotating role ---------- */
  const roles = ['designs mobile apps', 'runs user research', 'builds design systems', 'writes front-end code', 'hands off clean files'];
  const rot = $('.rot-word');
  if (!reduce && rot) {
    let i = 0;
    setInterval(() => {
      rot.classList.add('out');
      setTimeout(() => {
        i = (i + 1) % roles.length;
        rot.textContent = roles[i];
        rot.classList.remove('out'); rot.classList.add('in');
        requestAnimationFrame(() => requestAnimationFrame(() => rot.classList.remove('in')));
      }, 350);
    }, 2600);
  }

  /* ---------- counters ---------- */
  const countUp = (el) => {
    const end = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0);
    if (reduce) { el.textContent = end.toFixed(dec); return; }
    const t0 = performance.now(), dur = 1600;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur), v = end * (1 - Math.pow(1 - p, 3));
      el.textContent = v.toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  setTimeout(() => $$('[data-count]').forEach(countUp), 700);

  /* ---------- scroll reveal ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in-view'); io.unobserve(en.target); } });
  }, { threshold: .14, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((el) => io.observe(el));

  /* ---------- project cards: live demo slideshows ---------- */
  $$('.pcard').forEach((card) => {
    const imgs = $$('.slides img', card);
    if (!imgs.length) return;
    imgs[0].classList.add('on');
    let i = 0, timer = null, fast = false;
    const tick = () => { imgs[i].classList.remove('on'); i = (i + 1) % imgs.length; imgs[i].classList.add('on'); };
    const run = (ms) => { clearInterval(timer); if (!reduce) timer = setInterval(tick, ms); };
    // slow autoplay while visible, faster on hover
    const vis = new IntersectionObserver(([en]) => { en.isIntersecting ? run(fast ? 1100 : 2800) : clearInterval(timer); }, { threshold: .3 });
    vis.observe(card);
    card.addEventListener('pointerenter', () => { fast = true; tick(); run(1100); });
    card.addEventListener('pointerleave', () => { fast = false; run(2800); });
  });

  /* ---------- case study sheet with hash routing ---------- */
  const order = ['bloomtech', 'happytails', 'closet', 'tmhm', 'rsm'];
  const sheet = $('#sheet'), body = $('#sheet-body'), panel = $('.sheet-panel');
  let current = null, lastFocus = null;

  const openCase = (id) => {
    const tpl = document.getElementById(`case-${id}`);
    if (!tpl) return;
    if (!current) lastFocus = document.activeElement;
    current = id;
    body.replaceChildren(tpl.content.cloneNode(true));
    sheet.hidden = false;
    document.body.classList.add('locked');
    panel.scrollTop = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('open')));
    panel.focus({ preventScroll: true });
    enableDrag(body);
    document.title = `${$('#sheet-title', body).textContent} · Rewan Ibrahim`;
  };
  const closeCase = () => {
    if (!current) return;
    sheet.classList.remove('open');
    document.body.classList.remove('locked');
    current = null;
    document.title = 'Rewan Ibrahim · UI/UX Designer & Front-End Developer';
    setTimeout(() => { if (!current) { sheet.hidden = true; body.replaceChildren(); } }, reduce ? 0 : 550);
    lastFocus?.focus?.({ preventScroll: true });
  };
  const route = () => {
    const m = location.hash.match(/^#\/work\/([\w-]+)/);
    m ? openCase(m[1]) : closeCase();
  };
  window.addEventListener('hashchange', route);
  route();

  sheet.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) { e.preventDefault(); history.pushState('', '', location.pathname + '#work'); closeCase(); }
    const step = e.target.closest('[data-step]');
    if (step && current) {
      const n = order[(order.indexOf(current) + +step.dataset.step + order.length) % order.length];
      location.hash = `#/work/${n}`;
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && current && !$('#lightbox').open) { history.pushState('', '', location.pathname + '#work'); closeCase(); }
  });

  /* ---------- drag-to-scroll screen strips ---------- */
  function enableDrag(root) {
    $$('.strip', root).forEach((strip) => {
      let down = false, x0 = 0, s0 = 0, moved = false;
      strip.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse') return;
        down = true; moved = false; x0 = e.clientX; s0 = strip.scrollLeft; strip.style.scrollSnapType = 'none';
      });
      window.addEventListener('pointermove', (e) => {
        if (!down) return;
        const dx = e.clientX - x0;
        if (Math.abs(dx) > 4) moved = true;
        strip.scrollLeft = s0 - dx;
      });
      window.addEventListener('pointerup', () => {
        if (!down) return;
        down = false; strip.style.scrollSnapType = '';
        if (moved) strip.addEventListener('click', (ev) => ev.stopPropagation(), { capture: true, once: true });
      });
    });
  }

  /* ---------- lightbox ---------- */
  const lb = $('#lightbox'), lbImg = $('img', lb), lbCap = $('figcaption', lb);
  let group = [], idx = 0;
  const show = (i) => {
    idx = (i + group.length) % group.length;
    const img = group[idx];
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    const cap = img.closest('figure')?.querySelector('figcaption')?.textContent || img.alt || '';
    lbCap.textContent = `${cap}  (${idx + 1} / ${group.length})`;
  };
  body.addEventListener('click', (e) => {
    const img = e.target.closest('.strip img, .boards img, .wide-fig img, .cs-hero-media img');
    if (!img) return;
    group = $$('.strip img, .boards img, .wide-fig img', body);
    if (!group.includes(img)) group = [img, ...group];
    show(group.indexOf(img));
    lb.showModal();
  });
  $('.lb-close', lb).addEventListener('click', () => lb.close());
  $('.lb-prev', lb).addEventListener('click', () => show(idx - 1));
  $('.lb-next', lb).addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
})();
