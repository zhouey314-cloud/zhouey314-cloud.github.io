// Failure isolation under actually stalled resources, not synthetic WebGL success.
import {chromium, webkit} from 'playwright';
import {serve, source, mkdir, writeFile, resolve, assert} from './support.mjs';
const site = await serve(), out = resolve(process.env.LOADING_REPORT_DIR || 'test-results/loading');
await mkdir(out, {recursive: true});
const report = {source: source(), base_url: site.base, scope: 'Controlled font/poster/network failures in actual browsers; not field performance or physical-device acceptance.', cases: [], failures: []};
try {
  for (const [name, engine] of Object.entries({chromium, webkit})) {
    const browser = await engine.launch();
    try {
      for (const dependency of ['font', 'poster']) {
        const entry = {name, dependency}; report.cases.push(entry);
        const context = await browser.newContext({viewport: {width: 390, height: 844}, reducedMotion: 'no-preference'});
        const releases = [];
        try {
          const pattern = dependency === 'font' ? '**/public/fonts/*.woff2' : '**/public/scenes/sylva/forest-*.webp';
          await context.route(pattern, async route => { await new Promise(done => releases.push(done)); await route.abort().catch(() => {}); });
          await context.route('**/public/vendor/threejs/r149/three.min.js', route => route.fulfill({status: 404, body: 'controlled runtime failure'}));
          const page = await context.newPage();
          await page.goto(site.base, {waitUntil: 'domcontentloaded'});
          await page.waitForFunction(() => window.__forestDiagnostics?.state === 'error', null, {timeout: 8000});
          entry.diagnostics = await page.evaluate(() => window.__forestDiagnostics);
          assert(entry.diagnostics.mounts === 1, 'a stalled decorative dependency cannot prevent scene initialization and error reporting');
          assert(entry.diagnostics.errors.some(e => e.code === 'resource-load' && e.message.includes('/r149/three.min.js')), 'real runtime request failure is classified');
          if (dependency === 'font') assert(await page.evaluate(() => document.fonts.status === 'loading'), 'font remains genuinely pending during fallback');
          assert(await page.locator('h1').isVisible() && await page.locator('#contact a[href^="mailto:"]').count() > 0, 'identity and contact remain usable');
          const retry = page.locator('[data-forest-retry]');
          assert(await retry.isVisible() && await retry.isEnabled(), 'failure offers an actionable retry');
          await page.emulateMedia({reducedMotion: 'reduce'});
          await page.waitForFunction(() => document.querySelector('[data-forest-retry]').disabled);
          await retry.dispatchEvent('click'); // Even a programmatic event must respect reduced motion.
          assert(await page.evaluate(() => window.__forestDiagnostics.mounts === 1) && await page.locator('[data-forest] iframe').count() === 0, 'retry cannot allocate a renderer while motion is disabled');
          await page.emulateMedia({reducedMotion: 'no-preference'});
          await retry.click();
          await page.waitForFunction(() => window.__forestDiagnostics.mounts === 2 && window.__forestDiagnostics.state === 'error', null, {timeout: 8000});
          entry.retryAfterPreferenceRecovery = true; entry.status = 'PASS';
        } catch (error) { entry.status = 'FAIL'; entry.error = error.stack; report.failures.push(entry); }
        finally { releases.forEach(done => done()); await context.close(); }
      }
      const entry = {name, dependency: 'interaction-bundle'}; report.cases.push(entry);
      const context = await browser.newContext({viewport: {width: 390, height: 844}, reducedMotion: 'reduce'});
      try {
        await context.route('**/public/site/home.js*', route => route.abort());
        const page = await context.newPage(); await page.goto(site.base, {waitUntil: 'load'});
        const menu = page.locator('.menu-toggle'); await menu.focus(); await page.keyboard.press('Enter');
        assert(await menu.getAttribute('aria-expanded') === 'true', 'inline navigation survives optional interaction bundle failure');
        await page.keyboard.press('Escape'); assert(await menu.getAttribute('aria-expanded') === 'false' && await menu.evaluate(el => el === document.activeElement), 'keyboard close restores menu focus');
        await menu.click(); await page.locator('.site-nav a[href="#contact"]').click();
        assert(new URL(page.url()).hash === '#contact' && await page.locator('.garden-qr svg').isVisible(), 'native contact and inline QR survive bundle failure');
        assert(await page.locator('[data-forest] iframe').count() === 0 && await page.locator('h1').isVisible(), 'failed enhancement retains static readable page');
        entry.status = 'PASS';
      } catch (error) { entry.status = 'FAIL'; entry.error = error.stack; report.failures.push(entry); }
      finally { await context.close(); }
    } finally { await browser.close(); }
  }
} finally {
  await site.close(); report.status = report.failures.length ? 'FAIL' : 'PASS';
  await writeFile(resolve(out, 'report.json'), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report)); process.exitCode = report.failures.length ? 1 : 0;
