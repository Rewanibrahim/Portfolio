(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Nav border once the page scrolls
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hero: one orchestrated sequence, then type the CSS for the selected component
  const canvas = document.querySelector('.canvas');
  const typed = document.getElementById('typed');
  const css = [
    ['k', '.plant-card'], ['', ' {\n'],
    ['p', '  display'], ['', ': '], ['v', 'flex'], ['', ';\n'],
    ['p', '  padding'], ['', ': '], ['v', '16px 20px'], ['', ';\n'],
    ['p', '  border-radius'], ['', ': '], ['v', '24px'], ['', ';\n'],
    ['p', '  background'], ['', ': '], ['v', 'var(--leaf-100)'], ['', ';\n'],
    ['', '}']
  ];
  const render = (n) => {
    let left = n, html = '';
    for (const [cls, text] of css) {
      if (left <= 0) break;
      const part = text.slice(0, left);
      left -= text.length;
      const safe = part.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      html += cls ? `<span class="${cls}">${safe}</span>` : safe;
    }
    typed.innerHTML = html;
  };
  const total = css.reduce((s, [, t]) => s + t.length, 0);

  requestAnimationFrame(() => document.body.classList.add('ready'));
  if (reduce) {
    render(total);
  } else {
    let i = 0;
    setTimeout(function tick() {
      render(++i);
      if (i < total) setTimeout(tick, 22 + Math.random() * 30);
    }, 2300);
  }

  // Count up the hero numbers when the page loads
  if (!reduce) {
    document.querySelectorAll('[data-count]').forEach((el) => {
      const end = +el.dataset.count, start = performance.now(), dur = 1400;
      const step = (t) => {
        const p = Math.min(1, (t - start) / dur);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  // Drag-to-scroll for the phone strips (mouse only; touch scrolls natively)
  document.querySelectorAll('.strip').forEach((strip) => {
    let down = false, x0 = 0, s0 = 0, moved = false;
    strip.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; x0 = e.clientX; s0 = strip.scrollLeft;
      strip.style.scrollSnapType = 'none';
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

  // Lightbox: open any screen, step through its project with arrows
  const lb = document.getElementById('lightbox');
  const lbImg = lb.querySelector('img');
  const lbCap = lb.querySelector('figcaption');
  let group = [], idx = 0;
  const show = (i) => {
    idx = (i + group.length) % group.length;
    const img = group[idx];
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    const cap = img.closest('figure')?.querySelector('figcaption')?.textContent || '';
    const project = img.closest('.case')?.querySelector('h3')?.textContent || '';
    lbCap.textContent = `${project} · ${cap} (${idx + 1} of ${group.length})`;
  };
  document.addEventListener('click', (e) => {
    const img = e.target.closest('.strip img, .board img');
    if (!img) return;
    group = [...img.closest('.case').querySelectorAll('.strip img, .board img')];
    show(group.indexOf(img));
    lb.showModal();
  });
  lb.querySelector('.lb-close').addEventListener('click', () => lb.close());
  lb.querySelector('.lb-prev').addEventListener('click', () => show(idx - 1));
  lb.querySelector('.lb-next').addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
})();
