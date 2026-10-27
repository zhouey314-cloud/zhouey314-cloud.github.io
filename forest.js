/* A bounded bridge to the authored Sylva scene. The iframe stays opaque. */
(() => {
  'use strict';
  const host = document.querySelector('[data-forest]');
  if (!host) return;
  const hero = document.querySelector('.garden-hero');
  const mount = host.querySelector('[data-forest-mount]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 900px)');
  const retry = document.querySelector('[data-forest-retry]');
  const pulse = document.querySelector('[data-forest-pulse]');
  const caption = document.querySelector('[data-scene-caption]');
  const status = document.querySelector('[data-scene-status]');
  const diagnostics = window.__forestDiagnostics = { state: 'static', errors: [], received: 0, mounts: 0, frame: null };
  let iframe, token, timer, pointerFrame = 0, pointer, rendered = false, pending = false, generation = 0;
  let intersecting = hero.getBoundingClientRect().bottom > 0 && hero.getBoundingClientRect().top < innerHeight;
  const motion = () => !reduced.matches && document.documentElement.dataset.motion === 'on';
  const visible = () => intersecting && !document.hidden;
  function state(value) { host.dataset.sceneState = value; diagnostics.state = value; }
  function send(type, payload = {}) {
    iframe?.contentWindow?.postMessage({ channel: 'ethan-sylva', token, type, ...payload }, '*');
  }
  function fail(code, message) {
    clearTimeout(timer);
    diagnostics.errors.push({ code, message, at: new Date().toISOString() });
    state(code === 'context-lost' ? 'context-lost' : 'error');
    send('control', { motion: false, visible: false });
    caption.textContent = '静态花园 · 作品和联系入口仍可浏览。';
    status.textContent = '已显示静态花园。可以重新载入三维场景。';
    retry.hidden = false; pulse.disabled = true;
    iframe?.remove(); iframe = null; rendered = false; host.removeAttribute('data-rendered');
  }
  function deadline() {
    clearTimeout(timer);
    if (iframe && !rendered && visible() && motion()) timer = setTimeout(() => {
      fail('ready-timeout', 'No successful WebGL handshake within 45 seconds');
      iframe?.remove(); iframe = null;
    }, 45000);
  }
  function control() {
    if (['error', 'context-lost'].includes(diagnostics.state)) return;
    if (!iframe) {
      if (motion() && visible() && !navigator.connection?.saveData) start();
      else { state(reduced.matches ? 'reduced-motion' : 'static'); pulse.disabled = true; caption.textContent = '静静看，也是一座花园。'; }
      return;
    }
    send('control', { motion: motion(), visible: visible() });
    if (visible()) send('journey', { value: Math.max(0, Math.min(1, -hero.getBoundingClientRect().top / hero.clientHeight)) });
    if (rendered) state(motion() && visible() ? 'ready' : 'paused');
    pulse.disabled = !motion() || !rendered;
    caption.textContent = motion() ? '移动指针，发现一点生机。' : '花园已暂停，文字与作品照常可用。';
    deadline();
  }
  async function start(force = false) {
    if (iframe || pending || (!force && (!motion() || !visible()))) return;
    pending = true; const request = ++generation; state('loading');
    // Let real text, fonts and the small forest poster paint before shader compilation.
    await Promise.allSettled([document.fonts.ready, host.querySelector('img').decode()]);
    await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(done, 120))));
    if (request !== generation) return;
    pending = false;
    if (!force && (!motion() || !visible())) { control(); return; }
    token = crypto.randomUUID?.() || String(Math.random()).slice(2) + Date.now();
    iframe = document.createElement('iframe');
    iframe.title = 'Ethan 的数字花园：苔藓根拱、蕨类、花朵与花粉';
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.setAttribute('tabindex', '-1');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.src = '/public/scenes/sylva/index.html#' + token;
    iframe.addEventListener('load', () => send('control', { motion: motion(), visible: visible() }));
    iframe.addEventListener('error', () => fail('iframe-load', 'Scene document failed to load'));
    rendered = false; retry.hidden = true; diagnostics.mounts++;
    host.removeAttribute('data-rendered'); state('loading'); mount.replaceChildren(iframe); deadline();
  }
  window.addEventListener('message', event => {
    // An opaque sandbox reports origin "null". Never trust a global message by shape alone.
    const data = event.data;
    if (!iframe || event.source !== iframe.contentWindow || event.origin !== 'null' || !data || data.channel !== 'ethan-sylva' || data.token !== token) return;
    diagnostics.received++;
    if (data.type === 'error') { fail(data.payload?.code || 'scene-error', String(data.payload?.message)); return; }
    if (data.type === 'boot') { send('control', { motion: motion(), visible: visible() }); return; }
    if (data.type === 'ready') {
      const frame = data.payload;
      if (!(frame?.frames >= 2 && frame.calls > 0 && frame.lost === false)) { fail('invalid-ready', 'Ready without two successful draws'); return; }
      rendered = true; diagnostics.readyAt = performance.now(); host.dataset.rendered = 'true'; clearTimeout(timer); status.textContent = '';
      diagnostics.frame = frame; control();
    } else if (['state', 'frame'].includes(data.type)) diagnostics.frame = data.payload;
  });
  hero.addEventListener('pointermove', event => {
    if (!rendered || !motion() || event.pointerType === 'touch') return;
    const rect = hero.getBoundingClientRect();
    pointer = { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
    if (!pointerFrame) pointerFrame = requestAnimationFrame(() => { pointerFrame = 0; if (visible() && motion()) send('pointer', pointer); });
  }, { passive: true });
  hero.addEventListener('pointerleave', () => send('pointer', { x: .5, y: .5, leave: true }));
  pulse.addEventListener('click', () => { if (motion()) send('pulse'); });
  retry.addEventListener('click', () => { iframe?.remove(); iframe = null; start(true); });
  new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; control(); }, { threshold: 0 }).observe(hero);
  new MutationObserver(control).observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  document.addEventListener('visibilitychange', control);
  reduced.addEventListener('change', control);
  narrow.addEventListener('change', () => {
    // Rebuild only when crossing the source's quality boundary. Removed documents own no surviving rAF.
    generation++; pending = false; iframe?.remove(); iframe = null; rendered = false;
    host.removeAttribute('data-rendered'); control();
  });
  let scrollFrame = 0;
  window.addEventListener('scroll', () => {
    if (scrollFrame || !rendered || !motion() || !visible()) return;
    scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; send('journey', { value: Math.max(0, Math.min(1, -hero.getBoundingClientRect().top / hero.clientHeight)) }); });
  }, { passive: true });
  window.addEventListener('pagehide', () => send('control', { motion: false, visible: false }));
  window.addEventListener('pageshow', control);
  // Explicit inspection is used by tests and local diagnosis, not visitor-facing counters.
  host.addEventListener('forest:inspect', () => send('inspect'));
  control();
})();
