import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(process.env.BROWSER_REPORT_DIR || 'test-results');
await mkdir(output, { recursive: true });
const allPages = ['/', '/projects.html', '/404.html', ...[
  'multi-tenant', 'rag', 'eval', 'video', 'crm', 'skills', 'recruitment',
  'thought-to-x', 'relay-audit', 'voice-clone-video',
].map(id => `/cases/${id}.html`)];
const pages = process.env.BROWSER_PAGES ? process.env.BROWSER_PAGES.split(',') : allPages;
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4', '.vtt': 'text/vtt', '.json': 'application/json' };
const server = http.createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    const file = resolve(root, `.${path.endsWith('/') ? path + 'index.html' : path}`);
    if (!file.startsWith(root.endsWith(sep) ? root : root + sep)) throw new Error('outside root');
    const data = await readFile(file);
    const headers = { 'Content-Type': mime[extname(file)] || 'application/octet-stream',
      'Accept-Ranges': 'bytes' };
    // Match Pages' single-range media delivery so real native seeking is tested.
    const range = req.headers.range;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      const start = match?.[1] ? Number(match[1]) : Math.max(0, data.length - Number(match?.[2]));
      const end = match?.[1] && match[2] ? Math.min(Number(match[2]), data.length - 1) : data.length - 1;
      if (!match || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= data.length) {
        res.writeHead(416, { 'Content-Range': `bytes */${data.length}` }); res.end(); return;
      }
      res.writeHead(206, { ...headers, 'Content-Length': end - start + 1,
        'Content-Range': `bytes ${start}-${end}/${data.length}` });
      res.end(data.subarray(start, end + 1));
    } else {
      res.writeHead(200, { ...headers, 'Content-Length': data.length });
      res.end(data);
    }
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(await readFile(resolve(root, '404.html')));
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const report = { at: new Date().toISOString(), scope: 'Actual Chromium/WebKit, desktop and mobile viewport; selected WCAG A/AA automated rules, not certification or physical-device/human acceptance.', pages: [], interactions: [], failures: [] };
try {
  report.source_revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  report.worktree_dirty = Boolean(execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim());
} catch { report.source_revision = null; report.worktree_dirty = null; }
const fail = message => report.failures.push(message);
const progress = async phase => {
  console.log(phase);
  await writeFile(resolve(output, 'progress.json'), JSON.stringify({ at: new Date().toISOString(), phase, pages: report.pages.length }) + '\n');
};
const bounded = (promise, name, milliseconds = 25_000) => {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${name} exceeded ${milliseconds}ms`)), milliseconds);
  })]).finally(() => clearTimeout(timer));
};
try {
  for (const [name, type] of Object.entries({ chromium, webkit })) {
    if (process.env.BROWSER_ENGINES && !process.env.BROWSER_ENGINES.split(',').includes(name)) continue;
    await progress(`${name}: launch`);
    const browser = await type.launch({ timeout: 20_000 });
    try {
      for (const [viewportName, viewport] of Object.entries({ desktop: { width: 1440, height: 1000 }, mobile: { width: 390, height: 844 } })) {
        const context = await browser.newContext({ viewport, reducedMotion: 'reduce', locale: 'zh-CN', timezoneId: 'Asia/Shanghai' });
        const page = await context.newPage();
        page.setDefaultTimeout(15_000);
        page.setDefaultNavigationTimeout(20_000);
        for (const path of pages) {
          await progress(`${name}/${viewportName}${path}: navigate`);
          const errors = [];
          const capture = error => errors.push(error.message);
          page.on('pageerror', capture);
          const response = await page.goto(base + path, { waitUntil: 'load' });
          await bounded(page.evaluate(() => document.fonts.ready), 'font readiness', 10_000);
          // Trigger the production lazy-loading behavior before calling an image
          // broken. Do not rewrite loading attributes or replace source assets.
          for (const image of await page.locator('img[src]').all()) {
            if (!await image.isVisible()) continue;
            await image.scrollIntoViewIfNeeded();
            await bounded(image.evaluate(img => img.decode().catch(() => null)), 'image decode', 10_000);
          }
          await page.evaluate(() => scrollTo(0, 0));
          const dom = await page.evaluate(() => ({
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            badImages: [...document.querySelectorAll('img[src]')].filter(i => !i.complete || i.naturalWidth === 0 || !i.alt.trim()).map(i => i.getAttribute('src')),
            headings: document.querySelectorAll('h1').length,
          }));
          await progress(`${name}/${viewportName}${path}: axe`);
          const axe = await bounded(new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze(), 'axe analysis');
          const violations = axe.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help,
            nodes: v.nodes.map(n => ({ target: n.target, failureSummary: n.failureSummary })) }));
          const entry = { browser: name, version: browser.version(), viewport: viewportName, path,
            status: response.status(), ...dom, pageErrors: errors, axeViolations: violations,
            axeIncompleteRules: axe.incomplete.map(x => x.id) };
          report.pages.push(entry);
          if (path === '/cases/video.html') {
            // Exercise the player where a viewer actually uses it. WebKit may
            // suspend offscreen muted video to conserve rendering resources.
            await page.locator('video.approved-sample').scrollIntoViewIfNeeded();
            entry.videoPlayback = await bounded(page.locator('video.approved-sample').evaluate(async video => {
              const event = type => new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error(`video ${type} timeout`)), 10_000);
                video.addEventListener(type, () => { clearTimeout(timer); resolve(); }, { once: true });
              });
              if (video.readyState < 1) { const metadata = event('loadedmetadata'); video.load(); await metadata; }
              video.muted = true; // Mechanical browser playback; user audio review is separate.
              const beforePlay = video.currentTime;
              const start = performance.now();
              await video.play();
              // Linux WebKit can start decoding later than 300ms. Require real
              // media-clock progress, bounded by a failure timeout, not a sleep.
              await new Promise((resolve, reject) => {
                const cleanup = () => { clearTimeout(timer); video.removeEventListener('timeupdate', check); video.removeEventListener('error', error); };
                const check = () => { if (video.currentTime > beforePlay + .05) { cleanup(); resolve(); } };
                const error = () => { cleanup(); reject(new Error('native media playback error')); };
                const timer = setTimeout(() => { cleanup(); reject(new Error('native media clock did not advance within 10s: ' + JSON.stringify({ paused: video.paused, ended: video.ended, readyState: video.readyState, networkState: video.networkState, mediaError: video.error?.code || null, visibility: document.visibilityState, viewport: { top: video.getBoundingClientRect().top, bottom: video.getBoundingClientRect().bottom, height: innerHeight } }))); }, 10_000);
                video.addEventListener('timeupdate', check); video.addEventListener('error', error); check();
              });
              const firstProgressSeconds = video.currentTime;
              const playbackWaitMs = performance.now() - start;
              const advanced = firstProgressSeconds > beforePlay + .05;
              video.pause();
              const seek = event('seeked'); video.currentTime = 51; await seek;
              return { duration: video.duration, width: video.videoWidth, height: video.videoHeight,
                advanced, firstProgressSeconds, playbackWaitMs, seekSeconds: video.currentTime, readyState: video.readyState,
                captions: video.querySelectorAll('track[kind="captions"]').length };
            }), 'native video playback');
            const media = entry.videoPlayback;
            if (!media.advanced || Math.abs(media.duration - 54) > .05 || media.width !== 1280 || media.height !== 720 || Math.abs(media.seekSeconds - 51) > .2 || !media.captions) {
              fail(`${name}/${viewportName}: native 54-second video play/seek/captions`);
            }
          }
          if (path === '/') {
            const primary = await page.locator('#flagship-evidence > li').evaluateAll(items => items.map(item => ({
              project: item.dataset.project,
              entries: [...item.querySelectorAll('a')].map(a => a.dataset.entry),
            })));
            entry.primaryEvidence = primary;
            if (primary.length !== 3 || primary.some(item => ['demo', 'code', 'evidence'].some(type => !item.entries.includes(type)))) {
              fail(`${name}/${viewportName}: requested three primary projects need Demo/Code/Evidence entries`);
            }
          }
          await writeFile(resolve(output, 'browser-report.json'), JSON.stringify(report, null, 2) + '\n');
          if (entry.status !== 200 || dom.overflow || dom.badImages.length || dom.headings !== 1 || errors.length || violations.length) {
            fail(`${name}/${viewportName}${path}: status=${entry.status}, overflow=${dom.overflow}, images=${dom.badImages.length}, errors=${errors.length}, axe=${violations.length}`);
          }
          if (path === '/' || (violations.length && viewportName === 'mobile')) {
            await page.screenshot({ path: resolve(output, `${name}-${viewportName}-${path === '/' ? 'home' : path.replaceAll('/', '-').replace('.html', '')}.png`), fullPage: path !== '/' });
          }
          page.off('pageerror', capture);
        }
        await page.goto(base, { waitUntil: 'load' });
        const skipKey = name === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
        await page.keyboard.press(skipKey);
        const skipFocused = await page.locator('.skip-link').evaluate(el => el === document.activeElement);
        await page.keyboard.press('Enter');
        const skipTarget = new URL(page.url()).hash === '#main';
        if (!skipFocused || !skipTarget) fail(`${name}/${viewportName}: keyboard skip link`);
        let menu = 'not applicable at desktop';
        if (viewportName === 'mobile') {
          const button = page.getByRole('button', { name: /^菜单/ });
          await button.focus();
          await page.keyboard.press('Enter');
          const expanded = await button.getAttribute('aria-expanded') === 'true';
          await page.keyboard.press('Escape');
          const closed = await button.getAttribute('aria-expanded') === 'false';
          const focusReturned = await button.evaluate(el => el === document.activeElement);
          menu = { expanded, closed, focusReturned };
          if (!expanded || !closed || !focusReturned) fail(`${name}/mobile: keyboard menu/Escape/focus`);
        }
        const missing = await page.goto(base + '/__missing_validation_page__');
        const notFound = missing.status() === 404 && await page.locator('h1').count() === 1;
        if (!notFound) fail(`${name}/${viewportName}: actual HTTP 404`);
        report.interactions.push({ browser: name, viewport: viewportName, skipKey, skipFocused, skipTarget, menu, actualHttp404: notFound });
        await context.close();
      }
    } finally {
      await bounded(browser.close(), 'browser shutdown', 10_000);
    }
  }
} catch (error) {
  fail(`Browser execution unavailable or failed: ${error.message}`);
} finally {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  report.status = report.failures.length ? 'FAIL' : 'PASS';
  await writeFile(resolve(output, 'browser-report.json'), JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ status: report.status, pages: report.pages.length, interactions: report.interactions.length, failures: report.failures }));
process.exitCode = report.failures.length ? 1 : 0;
