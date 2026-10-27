// Exercise the actual optional WebGL layer and its public lifecycle contract.
// Layout, navigation, RAG evidence and accessibility remain covered by the
// existing browser/experience suites. This is not a GPU performance benchmark.
import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium, webkit } from 'playwright';

const root = resolve(process.env.SITE_ROOT || fileURLToPath(new URL('../', import.meta.url)));
const output = resolve(process.env.THREEUI_REPORT_DIR || 'test-results/threeui');
const engineName = process.env.THREEUI_ENGINE || 'chromium';
const engine = { chromium, webkit }[engineName];
if (!engine) throw new Error('THREEUI_ENGINE must be chromium or webkit');
const softwareWebGL = engineName === 'chromium' && process.env.THREEUI_SOFTWARE_WEBGL !== '0';
const sceneSelector = '[data-hero-scene]';
const fallbackSelector = '[data-scene-fallback]';
await mkdir(output, { recursive: true });

// Existing suites are standalone programs rather than importable fixtures.
// Keep their local static-server convention and BASE_URL escape hatch here.
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.pdf': 'application/pdf' };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    const path = resolve(root, `.${pathname.endsWith('/') ? pathname + 'index.html' : pathname}`);
    if (!path.startsWith(root + sep)) throw new Error('outside root');
    const bytes = await readFile(path);
    res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Content-Length': bytes.length, 'Cache-Control': 'no-store' });
    res.end(bytes);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
});
await new Promise((done, reject) => { server.on('error', reject); server.listen(0, '127.0.0.1', done); });
const base = (process.env.BASE_URL || process.env.TEST_BASE_URL)?.replace(/\/$/, '') || `http://127.0.0.1:${server.address().port}`;
const report = {
  at: new Date().toISOString(), base_url: base, engine: engineName,
  platform: `${process.platform}/${process.arch}`, softwareWebGL,
  scope: 'Real browser loading and WebGL draw calls; software rendering when explicitly recorded. Viewport emulation is not physical-device acceptance. Injected visibility events, if needed in headless mode, are labelled separately from real tab visibility. No field performance or GPU-speed claim.',
  cases: [], failures: [],
};
try {
  report.source_revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  report.worktree_dirty = Boolean(execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim());
} catch { report.source_revision = null; report.worktree_dirty = null; }

function assert(condition, message) { if (!condition) throw new Error(message); }
async function save() { await writeFile(resolve(output, 'threeui-report.json'), JSON.stringify(report, null, 2) + '\n'); }
async function run(name, fn) {
  console.log(`threeui/${engineName}: ${name}`);
  const entry = { name, status: 'RUNNING' };
  report.cases.push(entry);
  try { await fn(entry); entry.status = 'PASS'; }
  catch (error) { entry.status = 'FAIL'; entry.error = error.stack || error.message; report.failures.push(`${name}: ${error.message}`); }
  await save();
}
async function contextFor(browser, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'no-preference', locale: 'zh-CN', timezoneId: 'Asia/Shanghai', ...options });
  await context.addInitScript(() => {
    // Observe rendering without changing the scene, scheduling or its counters.
    window.__threeuiDrawProbe = { calls: 0 };
    for (const Type of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
      if (!Type) continue;
      for (const name of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
        const descriptor = Object.getOwnPropertyDescriptor(Type.prototype, name);
        if (!descriptor || typeof descriptor.value !== 'function') continue;
        const original = descriptor.value;
        Object.defineProperty(Type.prototype, name, { ...descriptor, value: function (...args) {
          if (this.canvas?.matches?.('[data-hero-canvas]')) window.__threeuiDrawProbe.calls++;
          return original.apply(this, args);
        } });
      }
    }
  });
  return context;
}
async function pageFor(context) {
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(30000);
  const diagnostics = { pageErrors: [], consoleErrors: [], requests: [], failedRequests: [] };
  page.on('pageerror', error => diagnostics.pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') diagnostics.consoleErrors.push(message.text()); });
  page.on('request', request => diagnostics.requests.push(request.url()));
  page.on('requestfailed', request => diagnostics.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  return { page, diagnostics };
}
async function visit(page) {
  const response = await page.goto(base + '/', { waitUntil: 'load' });
  assert(response?.status() === 200, 'homepage must return HTTP 200');
  await page.locator(sceneSelector).waitFor({ state: 'attached' });
}
async function state(page, expected) {
  const states = Array.isArray(expected) ? expected : [expected];
  await page.waitForFunction(({ selector, states }) => states.includes(document.querySelector(selector)?.dataset.sceneState), { selector: sceneSelector, states }, { polling: 50 });
  return snapshot(page);
}
async function snapshot(page) {
  return page.evaluate(({ sceneSelector, fallbackSelector }) => {
    const visible = el => {
      if (!el || !el.getClientRects().length) return false;
      for (let n = el; n instanceof Element; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      }
      return true;
    };
    const scene = document.querySelector(sceneSelector), canvas = scene?.querySelector('[data-hero-canvas]');
    const primary = [...document.querySelectorAll('#flagship-evidence > li')];
    return {
      state: scene?.dataset.sceneState, ready: scene?.dataset.sceneReady,
      reportedFrames: Number(scene?.dataset.sceneFrames || 0), actualDrawCalls: window.__threeuiDrawProbe?.calls || 0,
      renderer: scene?.dataset.sceneRenderer, source: scene?.dataset.sceneSource,
      fallbackVisible: visible(document.querySelector(fallbackSelector)),
      canvasCount: scene?.querySelectorAll('[data-hero-canvas]').length || 0,
      canvas: canvas ? { visible: visible(canvas), width: canvas.width, height: canvas.height, cssWidth: canvas.getBoundingClientRect().width, cssHeight: canvas.getBoundingClientRect().height, devicePixelRatio, ariaHidden: canvas.getAttribute('aria-hidden'), touchAction: getComputedStyle(canvas).touchAction } : null,
      coreVisible: visible(document.querySelector('h1')) && primary.length === 3 && primary.every(visible) && visible(document.querySelector('#contact a[href^="mailto:"]')),
      primaryLinks: primary.every(item => ['demo', 'code', 'evidence'].every(kind => item.querySelector(`a[data-entry="${kind}"][href]`))),
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      motion: document.documentElement.dataset.motion, visibility: document.visibilityState,
    };
  }, { sceneSelector, fallbackSelector });
}
async function stableDraws(page, label) {
  // Absence of rendering requires an observation interval. The caller has
  // already awaited the actual stopped state; this is not a readiness sleep.
  const before = await snapshot(page);
  await page.waitForTimeout(400);
  const after = await snapshot(page);
  assert(after.actualDrawCalls === before.actualDrawCalls, `${label}: WebGL draws continued (${before.actualDrawCalls} -> ${after.actualDrawCalls})`);
  return { before, after, observation_ms: 400 };
}
async function running(page) {
  await state(page, 'running');
  await page.waitForFunction(({ sceneSelector, fallbackSelector }) => {
    if (document.querySelector(sceneSelector)?.dataset.sceneReady !== 'true' || !(window.__threeuiDrawProbe?.calls > 0)) return false;
    const fallback = document.querySelector(fallbackSelector);
    if (!fallback?.getClientRects().length) return true;
    for (let node = fallback; node instanceof Element; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return true;
    }
    return false;
  }, { sceneSelector, fallbackSelector });
  const current = await snapshot(page);
  assert(current.canvasCount === 1 && current.canvas?.width > 0 && current.canvas?.height > 0 && current.canvas?.visible, 'one visible, nonempty scene canvas is required');
  assert(!current.fallbackVisible, 'ready scene must replace the decorative fallback');
  assert(current.canvas.ariaHidden === 'true', 'decorative canvas must be hidden from the accessibility tree');
  const compact = current.canvas.cssWidth < 520;
  const pixelBudget = compact ? 900000 : 1500000;
  const ratioLimit = compact ? 1.25 : 1.5;
  assert(current.canvas.width * current.canvas.height <= pixelBudget, `scene drawing buffer exceeds ${pixelBudget} pixels`);
  assert(current.canvas.width <= Math.ceil(current.canvas.cssWidth * ratioLimit) && current.canvas.height <= Math.ceil(current.canvas.cssHeight * ratioLimit), `scene drawing buffer exceeds the ${ratioLimit}x device-pixel-ratio limit`);
  assert(current.coreVisible && current.primaryLinks, 'identity, projects and contact must remain readable');
  const previous = current.actualDrawCalls;
  await page.waitForFunction(before => (window.__threeuiDrawProbe?.calls || 0) > before, previous);
  return snapshot(page);
}
async function fallbackSnapshot(page) {
  await page.waitForFunction(({ sceneSelector, fallbackSelector }) => {
    const scene = document.querySelector(sceneSelector), fallback = document.querySelector(fallbackSelector);
    const visible = element => {
      if (!element?.getClientRects().length) return false;
      for (let node = element; node instanceof Element; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      }
      return true;
    };
    return scene?.dataset.sceneReady !== 'true' && visible(fallback) && !visible(scene?.querySelector('[data-hero-canvas]'));
  }, { sceneSelector, fallbackSelector }, { polling: 50 });
  const value = await snapshot(page);
  assert(value.ready !== 'true' && value.fallbackVisible, 'static fallback must be visible and scene-ready must be cleared');
  assert(!value.canvas?.visible, 'disabled or failed canvas must not obscure the static fallback');
  assert(value.coreVisible && value.primaryLinks && !value.overflow, 'fallback must retain identity, three project paths, contact and normal page width');
  return value;
}
const heavyRequests = diagnostics => diagnostics.requests.filter(url => /\/public\/(?:js\/threeui-gallery\.js|vendor\/threejs\/)/.test(url));

let browser;
try {
  browser = await engine.launch({
    ...(softwareWebGL ? { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } : {}),
    ...(process.env.THREEUI_EXECUTABLE_PATH ? { executablePath: process.env.THREEUI_EXECUTABLE_PATH } : {}),
  });
  report.browser_version = browser.version();

  await run('actual render, manual/system motion and offscreen/background suspension', async entry => {
    const context = await contextFor(browser);
    try {
      const { page, diagnostics } = await pageFor(context);
      await visit(page);
      await page.locator(sceneSelector).scrollIntoViewIfNeeded();
      entry.initial = await running(page);
      await page.screenshot({ path: resolve(output, `${engineName}-scene-running.png`) });

      await page.locator('[data-motion-toggle]').click();
      await state(page, 'disabled'); entry.manualOff = await fallbackSnapshot(page);
      entry.manualStopped = await stableDraws(page, 'manual motion off');
      await page.locator('[data-motion-toggle]').click();
      entry.manualRestart = await running(page);

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await state(page, 'reduced-motion'); entry.systemReduced = await fallbackSnapshot(page);
      entry.systemStopped = await stableDraws(page, 'dynamic reduced motion');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      entry.systemRestart = await running(page);

      await page.locator('#contact').scrollIntoViewIfNeeded();
      entry.offscreen = await state(page, 'offscreen');
      entry.offscreenStopped = await stableDraws(page, 'offscreen');
      await page.locator(sceneSelector).scrollIntoViewIfNeeded();
      entry.onscreenRestart = await running(page);

      const other = await context.newPage(); await other.goto('about:blank'); await other.bringToFront();
      let realHidden = false;
      try {
        await page.waitForFunction(() => document.hidden, null, { polling: 50, timeout: 750 });
        realHidden = true;
      } catch (error) {
        if (error.name !== 'TimeoutError') throw error;
      }
      entry.visibilityMethod = realHidden ? 'real_tab_visibility' : 'synthetic_visibility_event_in_headless_browser';
      if (!realHidden) {
        await page.evaluate(() => {
          Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
          Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
          document.dispatchEvent(new Event('visibilitychange'));
        });
      }
      entry.background = await state(page, 'hidden');
      entry.backgroundStopped = await stableDraws(page, 'background visibility handler');
      if (!realHidden) await page.evaluate(() => { delete document.hidden; delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); });
      await other.close(); await page.bringToFront();
      entry.foregroundRestart = await running(page);
      entry.diagnostics = diagnostics;
      assert(!diagnostics.pageErrors.length && !diagnostics.consoleErrors.length && !diagnostics.failedRequests.length, 'normal rendering/lifecycle produced a browser error or failed request');
    } finally { await context.close(); }
  });

  for (const mode of ['system-reduced-at-load', 'saved-manual-off-at-load']) {
    await run(mode, async entry => {
      const context = await contextFor(browser, mode.startsWith('system') ? { reducedMotion: 'reduce' } : {});
      try {
        if (mode.startsWith('saved')) await context.addInitScript(() => localStorage.setItem('ethan-motion', 'off'));
        const { page, diagnostics } = await pageFor(context);
        await visit(page);
        await state(page, mode.startsWith('system') ? 'reduced-motion' : 'disabled');
        entry.snapshot = await fallbackSnapshot(page);
        entry.engineRequests = heavyRequests(diagnostics);
        assert(!entry.engineRequests.length, 'motion disabled at load must not import the optional rendering engine');
        assert(!diagnostics.pageErrors.length, 'disabled rendering must not produce an unhandled error');
      } finally { await context.close(); }
    });
  }

  await run('navigation feedback preserves link targets and keyboard/motion behavior', async entry => {
    const context = await contextFor(browser);
    try {
      const { page, diagnostics } = await pageFor(context);
      await visit(page);
      const nav = page.locator('.site-nav');
      const link = nav.locator(':scope > a[href]').first();
      await page.waitForFunction(() => !!document.querySelector('.site-nav [data-dock-label]'));
      const readDock = () => nav.evaluate(el => ({
        state: el.dataset.dockState,
        links: [...el.querySelectorAll(':scope > a[href]')].map(a => {
          const rect = a.getBoundingClientRect(), label = a.querySelector('[data-dock-label]');
          const transform = label ? getComputedStyle(label).transform : 'none';
          const matrix = new DOMMatrix(transform === 'none' ? undefined : transform);
          return { text: a.textContent.trim(), href: a.getAttribute('href'), x: rect.x, y: rect.y, width: rect.width, height: rect.height, labelY: matrix.m42, inlineTransform: label?.style.transform || '' };
        }),
      }));
      entry.before = await readDock();
      const box = await link.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForFunction(() => document.querySelector('.site-nav')?.dataset.dockState === 'active' && [...document.querySelectorAll('[data-dock-label]')].some(el => el.style.transform));
      entry.pointer = await readDock();
      assert(entry.pointer.links.some(item => item.labelY < 0), 'dock pointer feedback did not move any label');
      assert(entry.pointer.links.every((item, i) => {
        const before = entry.before.links[i];
        return before && item.href === before.href && item.text === before.text && item.labelY >= -2.01 && item.labelY <= .01 && ['x', 'y', 'width', 'height'].every(key => Math.abs(item[key] - before[key]) <= .5);
      }), 'dock must keep native link hitboxes stationary and limit label lift to 2px');
      await link.focus();
      await page.waitForFunction(() => document.querySelector('.site-nav')?.dataset.dockState === 'focus' && [...document.querySelectorAll('[data-dock-label]')].every(el => !el.style.transform));
      entry.keyboard = await readDock();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => location.hash === '#work');
      entry.keyboardDestination = new URL(page.url()).hash;
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(() => document.querySelector('.site-nav')?.dataset.dockState === 'static' && [...document.querySelectorAll('[data-dock-label]')].every(el => !el.style.transform));
      entry.reduced = await readDock();
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.locator('[data-motion-toggle]').click();
      await page.waitForFunction(() => document.documentElement.dataset.motion === 'off' && document.querySelector('.site-nav')?.dataset.dockState === 'static' && [...document.querySelectorAll('[data-dock-label]')].every(el => !el.style.transform));
      entry.manualOff = await readDock();
      assert(!diagnostics.pageErrors.length, 'navigation enhancement produced an unhandled error');
    } finally { await context.close(); }
  });

  await run('mobile rendering retains native scrolling and reduced-motion fallback', async entry => {
    const context = await contextFor(browser, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
    try {
      const { page, diagnostics } = await pageFor(context);
      await visit(page); await page.locator(sceneSelector).scrollIntoViewIfNeeded();
      entry.running = await running(page);
      await page.screenshot({ path: resolve(output, `${engineName}-mobile-scene-running.png`) });
      assert(!entry.running.overflow && entry.running.canvas.touchAction !== 'none', 'mobile scene must retain page width and native touch handling');
      const y = await page.evaluate(() => scrollY);
      const box = await page.locator(sceneSelector).boundingBox();
      await page.mouse.move(box.x + box.width / 2, Math.max(1, Math.min(843, box.y + box.height / 2)));
      // Playwright cannot send wheel input to mobile WebKit. Exercise its native
      // keyboard scroll path instead, and state that coverage limit explicitly.
      if (engineName === 'webkit') await page.keyboard.press('PageDown');
      else await page.mouse.wheel(0, 180);
      await page.waitForFunction(before => scrollY > before, y);
      entry.nativeScroll = { before: y, after: await page.evaluate(() => scrollY), method: engineName === 'webkit' ? 'native PageDown input in mobile WebKit emulation; this driver does not support mobile wheel and this is not a physical touch-swipe test' : 'native wheel input in mobile viewport emulation' };
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await state(page, 'reduced-motion'); entry.reduced = await fallbackSnapshot(page);
      entry.stopped = await stableDraws(page, 'mobile reduced motion');
      assert(!diagnostics.pageErrors.length, 'mobile scene produced an unhandled browser error');
    } finally { await context.close(); }
  });

  await run('WebGL unavailable falls back without losing content', async entry => {
    const context = await contextFor(browser);
    try {
      await context.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
          if (/^(webgl2?|experimental-webgl)$/.test(kind)) return null;
          return original.call(this, kind, ...args);
        };
      });
      const { page, diagnostics } = await pageFor(context);
      await visit(page); await page.locator(sceneSelector).scrollIntoViewIfNeeded();
      await state(page, 'failed'); entry.snapshot = await fallbackSnapshot(page);
      entry.stopped = await stableDraws(page, 'WebGL unavailable');
      entry.diagnostics = diagnostics;
      assert(!diagnostics.pageErrors.length, 'WebGL initialization failure escaped the enhancement boundary');
    } finally { await context.close(); }
  });

  await run('render module import failure retains static fallback', async entry => {
    const context = await contextFor(browser); let blocked = 0;
    try {
      await context.route('**/public/js/threeui-gallery.js*', route => { blocked++; return route.abort('failed'); });
      const { page, diagnostics } = await pageFor(context);
      await visit(page); await page.locator(sceneSelector).scrollIntoViewIfNeeded();
      await state(page, 'failed'); entry.snapshot = await fallbackSnapshot(page);
      entry.blockedRequests = blocked;
      assert(blocked > 0, 'module-failure fixture did not intercept the requested rendering module');
      assert(!diagnostics.pageErrors.length, 'failed optional module produced an unhandled error');
      entry.diagnostics = diagnostics;
    } finally { await context.close(); }
  });

  for (const mode of ['entry-script-failure', 'javascript-disabled']) {
    await run(mode, async entry => {
      const context = await contextFor(browser, { javaScriptEnabled: mode !== 'javascript-disabled' }); let blocked = 0;
      try {
        if (mode === 'entry-script-failure') await context.route('**/hero-scene.js*', route => { blocked++; return route.abort('failed'); });
        const { page, diagnostics } = await pageFor(context);
        await visit(page);
        entry.snapshot = await fallbackSnapshot(page);
        entry.blockedRequests = blocked;
        if (mode === 'entry-script-failure') assert(blocked > 0, 'entry-script fixture did not intercept hero-scene.js');
        assert(!diagnostics.pageErrors.length, 'static fallback produced an unhandled browser error');
      } finally { await context.close(); }
    });
  }
} catch (error) {
  report.failures.push(`suite setup: ${error.stack || error.message}`);
} finally {
  if (browser) await browser.close();
  server.closeAllConnections();
  await new Promise(done => server.close(done));
  report.status = report.failures.length ? 'FAIL' : 'PASS';
  await save();
}
console.log(JSON.stringify({ status: report.status, engine: engineName, cases: report.cases.length, failures: report.failures, report: resolve(output, 'threeui-report.json') }, null, 2));
process.exitCode = report.failures.length ? 1 : 0;
