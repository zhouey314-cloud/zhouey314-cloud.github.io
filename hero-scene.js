/* Optional ThreeUI hero. The complete, useful page exists before this module. */
const host = document.querySelector('[data-hero-scene]');

if (host) {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const connection = navigator.connection;
  const pictures = [
    {src:'/public/projects/rag/story-citation-preview.webp', title:'ENTERPRISE RAG', note:'PUBLIC DEMO / CITATIONS'},
    {src:'/public/projects/relay/fixture-report-preview.webp', title:'RELAYAUDIT', note:'LOCAL FIXTURE / IDENTITY UNVERIFIED'},
    {src:'/public/projects/video/original-54s-poster-preview.webp', title:'VIDEO WORKFLOW', note:'ORIGINAL FRAME / PROGRAMMATIC VIDEO'},
  ];
  let scene = null, loading = null, ready = false, failed = false;
  let contextLost = false, disposed = false, pageSuspended = false;
  let visible = false, measureFrame = 0, idleHandle = null, idleIsTimeout = false;
  let bounds = host.getBoundingClientRect(), lastStatsAt = 0, lastFrames = 0;
  let pointer = {x:0,y:0}, progress = 0;
  const cleanups = [];

  const setState = state => {
    if (host.dataset.sceneState !== state) host.dataset.sceneState = state;
  };
  const concealScene = () => {
    host.removeAttribute('data-scene-ready');
    const canvas = host.querySelector('[data-hero-canvas]');
    if (canvas) canvas.style.opacity = '0';
  };
  const listen = (target, type, callback, options) => {
    target.addEventListener(type, callback, options);
    cleanups.push(() => target.removeEventListener(type, callback, options));
  };
  const motionDisabled = () => {
    if (root.dataset.motion) return root.dataset.motion === 'off';
    try { return localStorage.getItem('ethan-motion') === 'off'; }
    catch { return false; }
  };
  const permitted = () => !reduced.matches && !motionDisabled() && !connection?.saveData;
  const foreground = () => !document.hidden && !pageSuspended;
  const flushFrames = () => { host.dataset.sceneFrames = String(lastFrames); };

  function pause(state, hide = false) {
    scene?.setRunning(false);
    flushFrames();
    if (hide) concealScene();
    setState(state);
  }
  function fail() {
    if (disposed || failed) return;
    failed = true;
    ready = false;
    scene?.dispose();
    scene = null;
    host.querySelector('[data-hero-canvas]')?.remove();
    concealScene();
    flushFrames();
    setState('failed');
  }

  function sync() {
    if (disposed) return;
    if (failed) { pause('failed', true); return; }
    if (reduced.matches) { pause('reduced-motion', true); return; }
    if (motionDisabled() || connection?.saveData) { pause('disabled', true); return; }
    if (contextLost) { pause('context-lost', true); return; }
    if (!foreground()) { pause('hidden'); return; }
    if (!visible) { pause('offscreen'); return; }
    if (scene && ready) {
      scene.setPointer(pointer.x, pointer.y);
      scene.setProgress(progress);
      scene.setRunning(true);
      if (!failed && !contextLost) setState('running');
      return;
    }
    if (!loading) load();
    else setState('loading');
  }

  function measure() {
    measureFrame = 0;
    if (disposed) return;
    bounds = host.getBoundingClientRect();
    visible = bounds.width > 0 && bounds.height > 0 && bounds.bottom > 0 && bounds.top < innerHeight;
    progress = Math.max(0, Math.min(1, -bounds.top / Math.max(1, bounds.height)));
    scene?.resize(bounds.width, bounds.height);
    scene?.setProgress(progress);
    sync();
  }
  const scheduleMeasure = () => {
    if (!disposed && foreground() && !measureFrame) measureFrame = requestAnimationFrame(measure);
  };

  function load() {
    if (loading || disposed || !permitted() || !foreground() || !visible) return;
    setState('loading');
    loading = (async () => {
      const {createThreeUIGallery} = await import('/public/js/threeui-gallery.js');
      // The user may have disabled motion while the optional module was downloading.
      if (disposed || !permitted() || !foreground() || !visible) return;
      const canvas = document.createElement('canvas');
      canvas.setAttribute('data-hero-canvas', '');
      canvas.setAttribute('aria-hidden', 'true');
      Object.assign(canvas.style, {
        position:'absolute', inset:'0', display:'block', width:'100%', height:'100%',
        pointerEvents:'none', opacity:'0',
      });
      host.append(canvas);
      scene = createThreeUIGallery({
        canvas, pictures,
        onFrame(frames, stats) {
          lastFrames = frames;
          if (disposed || contextLost || !permitted()) return;
          if (!host.hasAttribute('data-scene-ready')) {
            host.dataset.sceneReady = 'true';
            canvas.style.opacity = '1';
          }
          const now = performance.now();
          if (frames === 1 || now - lastStatsAt > 1000) {
            lastStatsAt = now;
            flushFrames();
            host.dataset.sceneDrawCalls = String(stats.drawCalls);
            host.dataset.sceneBuffer = `${stats.width}x${stats.height}`;
          }
        },
        onFailure:fail,
        onContextLost() {
          contextLost = true;
          concealScene();
          canvas.style.opacity = '0';
          sync();
        },
        onContextRestored() {
          if (disposed || failed) return;
          contextLost = false;
          measure();
        },
      });
      host.dataset.sceneRenderer = 'threejs-r186';
      host.dataset.sceneSource = 'threeui-community-gallery';
      scene.resize(bounds.width, bounds.height);
      await scene.ready;
      if (disposed || failed) return;
      ready = true;
      sync();
    })().catch(() => { if (!disposed) fail(); }).finally(() => {
      loading = null;
      if (!disposed && !failed && !scene) sync();
    });
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (measureFrame) cancelAnimationFrame(measureFrame);
    if (idleHandle !== null) {
      if (idleIsTimeout) clearTimeout(idleHandle);
      else cancelIdleCallback(idleHandle);
    }
    scene?.dispose();
    scene = null;
    cleanups.forEach(cleanup => cleanup());
    host.querySelector('[data-hero-canvas]')?.remove();
    concealScene();
    flushFrames();
    setState('disposed');
  }

  const motionObserver = new MutationObserver(sync);
  motionObserver.observe(root, {attributes:true, attributeFilter:['data-motion']});
  cleanups.push(() => motionObserver.disconnect());
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      if (visible) scheduleMeasure();
      else sync();
    });
    observer.observe(host);
    cleanups.push(() => observer.disconnect());
  }
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(host);
    cleanups.push(() => observer.disconnect());
  }
  listen(reduced, 'change', sync);
  listen(connection || new EventTarget(), 'change', sync);
  listen(finePointer, 'change', () => {
    pointer = {x:0,y:0};
    scene?.setPointer(0,0);
  });
  listen(host, 'pointermove', event => {
    if (!scene || !permitted() || !foreground() || !visible || !finePointer.matches) return;
    pointer = {
      x:Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1)),
      y:Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1)),
    };
    scene.setPointer(pointer.x,pointer.y);
  }, {passive:true});
  listen(host, 'pointerleave', () => { pointer = {x:0,y:0}; scene?.setPointer(0,0); });
  listen(window, 'scroll', scheduleMeasure, {passive:true});
  listen(window, 'resize', scheduleMeasure, {passive:true});
  listen(document, 'visibilitychange', () => {
    if (!foreground() && measureFrame) { cancelAnimationFrame(measureFrame); measureFrame = 0; }
    if (foreground()) measure();
    else sync();
  });
  listen(window, 'pagehide', event => {
    if (event.persisted) { pageSuspended = true; sync(); }
    else dispose();
  });
  listen(window, 'pageshow', () => { pageSuspended = false; measure(); });
  setState(reduced.matches ? 'reduced-motion' : motionDisabled() || connection?.saveData ? 'disabled' : 'static');
  host.dataset.sceneFrames = '0';
  // A useful HTML first paint takes priority over downloading the optional renderer.
  if ('requestIdleCallback' in window) idleHandle = requestIdleCallback(measure, {timeout:900});
  else { idleIsTimeout = true; idleHandle = setTimeout(measure, 120); }
}
