// User-journey regressions and reproducible local before/after lab measurements.
// SITE_ROOT + BASELINE_ONLY allow the same capture procedure on a fixed archive.
import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium, webkit } from 'playwright';

const root = resolve(process.env.SITE_ROOT || fileURLToPath(new URL('../', import.meta.url)));
const output = resolve(process.env.EXPERIENCE_REPORT_DIR || 'test-results/experience');
const baseline = process.env.BASELINE_ONLY === '1';
const performanceOnly = process.env.PERFORMANCE_ONLY === '1';
const skipPerformance = process.env.SKIP_PERFORMANCE === '1';
await mkdir(output, { recursive: true });
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.pdf': 'application/pdf', '.mp4': 'video/mp4' };
const server = http.createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    const file = resolve(root, `.${path.endsWith('/') ? path + 'index.html' : path}`);
    if (!file.startsWith(root + sep)) throw Error('outside root');
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Content-Length': data.length, 'Cache-Control': 'no-store' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
});
await new Promise((resolve, reject) => { server.on('error', reject); server.listen(0, '127.0.0.1', resolve); });
const base = (process.env.BASE_URL || process.env.TEST_BASE_URL)?.replace(/\/$/, '') || `http://127.0.0.1:${server.address().port}`;
const report = {
  at: new Date().toISOString(), root, base, base_url: base, baseline, performanceOnly, skipPerformance,
  scope: 'Automated Chromium/WebKit on macOS. Viewports are emulated, not physical iPhone/Safari acceptance. Local lab metrics are not field Core Web Vitals; field INP unavailable.',
  labEnvironment: { device: process.platform + '/' + process.arch, network: 'local HTTP, cache disabled, 150ms latency, 1.6Mbps download, 750Kbps upload', cpu: '4x slowdown (Chromium CDP)', runs: 3, motion: 'system reduced motion for stable comparison' },
  layouts: [], interactions: [], performance: [], failures: [],
};
try {
  report.sourceRevision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  report.worktreeDirty = Boolean(execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim());
} catch { report.sourceRevision = null; report.worktreeDirty = null; }
function check(condition, message) { if (!condition) report.failures.push(message); }
const frames = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const geometry = page => page.evaluate(() => {
  const top = selector => { const el = document.querySelector(selector); return el ? Math.round(el.getBoundingClientRect().top + scrollY) : null; };
  const story = document.querySelector('#story');
  const storySteps = document.querySelector('.story-steps');
  const storyGeometry = story && storySteps ? {
    sectionWidth: story.getBoundingClientRect().width,
    stepsWidth: storySteps.getBoundingClientRect().width,
    widthRatio: storySteps.getBoundingClientRect().width / story.getBoundingClientRect().width,
    imageWidths: [...story.querySelectorAll('[data-story-panel] img')].map(el => el.getBoundingClientRect().width),
    stepLabels: [...story.querySelectorAll('.step-number')].map(el => ({ fontSize: getComputedStyle(el).fontSize, fontStyle: getComputedStyle(el).fontStyle })),
    verticallyStacked: [...story.querySelectorAll('[data-story-step]')].every(step => {
      const copy = step.querySelector('.step-copy'), figure = step.querySelector('[data-story-panel]');
      return copy && figure && figure.getBoundingClientRect().top >= copy.getBoundingClientRect().bottom - 1;
    }),
  } : null;
  return { width: innerWidth, height: innerHeight, pageHeight: document.documentElement.scrollHeight, overflow: document.documentElement.scrollWidth > innerWidth + 1,
    workTop: top('#work'), firstProjectTop: top('#flagship-evidence > li'), contactTop: top('#contact'),
    sections: [...document.querySelectorAll('main > section[id]')].map(el => ({ id: el.id, top: Math.round(el.getBoundingClientRect().top + scrollY) })),
    hiddenCore: [...document.querySelectorAll('h1, #flagship-evidence > li, #contact a[href^="mailto:"]')].filter(el => !el.getClientRects().length || getComputedStyle(el).visibility === 'hidden' || getComputedStyle(el).display === 'none' || getComputedStyle(el).opacity === '0').length,
    storyGeometry,
  };
});
async function lazyImages(page) {
  for (const image of await page.locator('img[src]').all()) {
    if (!await image.isVisible()) continue;
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(i => i.decode().catch(() => null));
  }
}
async function availableStory(page) {
  return page.locator('[data-story-step]').evaluateAll(steps => steps.map(step => ({
    text: step.textContent.trim(), visible: !!step.getClientRects().length && getComputedStyle(step).display !== 'none' && getComputedStyle(step).visibility !== 'hidden' && getComputedStyle(step).opacity !== '0',
  })));
}
async function allStoryImagesVisible(page) {
  return page.evaluate(() => {
    const root = document.querySelector('#story');
    if (!root) return false;
    // Every narrative step must have a visible corresponding image in fallback.
    // The layout may reuse its desktop panels or render inline mobile figures.
    const images = [...root.querySelectorAll('img[src]')].filter(img => img.getClientRects().length && getComputedStyle(img).visibility !== 'hidden');
    return new Set(images.map(img => img.currentSrc || img.src)).size >= 3;
  });
}
try {
  for (const [name, engine] of Object.entries({ chromium, webkit })) {
    if (performanceOnly && name !== 'chromium') continue;
    const browser = await engine.launch();
    try {
      for (const [label, viewport] of Object.entries({ desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 }, tablet: { width: 768, height: 1024 }, narrow: { width: 320, height: 844 } })) {
        if (performanceOnly) continue;
        if (baseline && (name !== 'chromium' || !['desktop', 'mobile'].includes(label))) continue;
        console.log(`${name}/${label}: layout and fallbacks`);
        const context = await browser.newContext({ viewport, reducedMotion: 'reduce', locale: 'zh-CN', timezoneId: 'Asia/Shanghai' });
        const page = await context.newPage();
        const errors = [], failedResources = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
        page.on('response', res => { if (res.status() >= 400) failedResources.push({ url: res.url(), status: res.status() }); });
        page.on('requestfailed', request => failedResources.push({ url: request.url(), failure: request.failure()?.errorText }));
        await page.goto(base, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        await frames(page);
        const first = await geometry(page);
        if (['desktop', 'mobile'].includes(label)) await page.screenshot({ path: resolve(output, `${name}-${label}-home.png`) });
        await lazyImages(page);
        await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
        await frames(page);
        if (['desktop', 'mobile'].includes(label)) await page.screenshot({ path: resolve(output, `${name}-${label}-full.png`), fullPage: true });
        const entry = { browser: name, version: browser.version(), viewport: label, ...first, errors, failedResources };
        report.layouts.push(entry);
        check(!first.overflow && first.hiddenCore === 0, `${name}/${label}: layout overflow or hidden core content`);
        if (!baseline) {
          const story = await availableStory(page);
          entry.reducedMotion = { steps: story.length, allTextVisible: story.every(s => s.visible && s.text), allImagesVisible: await allStoryImagesVisible(page) };
          check(story.length === 3 && entry.reducedMotion.allTextVisible && entry.reducedMotion.allImagesVisible, `${name}/${label}: reduced-motion must retain all three complete story steps`);
          check(first.storyGeometry?.widthRatio >= .9, `${name}/${label}: fallback narrative uses the available section width`);
          if (label === 'desktop') {
            check(first.storyGeometry.imageWidths.every(width => width >= 250), `${name}: desktop fallback images remain readable`);
            check(first.storyGeometry.stepLabels.every(style => parseFloat(style.fontSize) >= 10 && parseFloat(style.fontSize) <= 14 && style.fontStyle === 'normal'), `${name}: compact upright story step labels`);
            await page.locator('#story').screenshot({ path: resolve(output, `${name}-desktop-story-reduced.png`) });
          }
          if (label === 'mobile' || label === 'narrow') {
            check(first.storyGeometry.verticallyStacked && first.storyGeometry.imageWidths.every(width => width >= first.storyGeometry.sectionWidth * .9), `${name}/${label}: story text and readable full-width images stack vertically`);
            if (label === 'mobile') await page.locator('#story').screenshot({ path: resolve(output, `${name}-mobile-story.png`) });
          }
          // Native dialog: separate original/case targets, keyboard containment and Esc return.
          const preview = page.locator('[data-preview]').first();
          await preview.scrollIntoViewIfNeeded();
          await preview.focus();
          await page.keyboard.press('Enter');
          const dialog = page.locator('[data-viewer]');
          await dialog.waitFor({ state: 'visible' });
          const modal = await dialog.evaluate(el => ({ open: el.open, name: !!document.getElementById(el.getAttribute('aria-labelledby'))?.textContent.trim(), caption: !!el.querySelector('[data-viewer-caption]')?.textContent.trim(), focused: el.contains(document.activeElement), original: el.querySelector('[data-viewer-original]')?.getAttribute('href'), case: el.querySelector('[data-viewer-case]')?.getAttribute('href') }));
          await page.keyboard.press('Shift+Tab');
          modal.focusContained = await dialog.evaluate(el => el.contains(document.activeElement));
          await page.keyboard.press('Escape');
          await dialog.waitFor({ state: 'hidden' });
          modal.focusReturned = await preview.evaluate(el => el === document.activeElement);
          check(modal.open && modal.name && modal.caption && modal.focused && modal.focusContained && modal.focusReturned && modal.original !== modal.case, `${name}/${label}: native dialog accessibility`);
          // Force the real clipboard failure path, retaining usable mailto.
          await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('test denied')) } }));
          await page.locator('[data-copy-email]').click();
          const copyFallback = await page.locator('[data-copy-feedback]').textContent();
          const mailto = await page.locator('#contact a[href^="mailto:"]').getAttribute('href');
          check(!!copyFallback.trim() && mailto === 'mailto:zhouey314@gmail.com', `${name}/${label}: clipboard failure fallback`);
          // Native hashes must survive browser history; anchors cannot be hidden under header.
          await page.goto(base, { waitUntil: 'networkidle' });
          const jump = page.locator('main a[href="#work"]').first();
          await jump.click(); await frames(page);
          const workHash = new URL(page.url()).hash;
          const workAnchorTop = await page.locator('#work').evaluate(el => Math.round(el.getBoundingClientRect().top));
          await page.locator('main a[href="#contact"]').first().click();
          await frames(page);
          const contactHash = new URL(page.url()).hash;
          await page.goBack(); await frames(page);
          const backHash = new URL(page.url()).hash;
          await page.goForward(); await frames(page);
          const forwardHash = new URL(page.url()).hash;
          check(workHash === '#work' && contactHash === '#contact' && backHash === '#work' && forwardHash === '#contact' && workAnchorTop >= 0, `${name}/${label}: native anchor/history`);
          report.interactions.push({ browser: name, viewport: label, modal, copyFallback, mailto, hashes: { workHash, contactHash, backHash, forwardHash, workAnchorTop } });
        }
        check(errors.length === 0 && failedResources.length === 0, `${name}/${label}: browser console or resource failures`);
        await context.close();
      }
      if (!baseline && !performanceOnly) {
        // Normal motion: scrolling changes all three panels; toggle tears enhancement down.
        const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference', locale: 'zh-CN', recordVideo: name === 'chromium' ? { dir: resolve(output, 'recording'), size: { width: 1440, height: 900 } } : undefined });
        const page = await context.newPage();
        await page.goto(base, { waitUntil: 'networkidle' });
        const scrollStates = [];
        for (let i = 0; i < 3; i++) {
          // Record real native wheel input, rather than a synthetic animation.
          // Short pauses only pace the review video; state assertions below wait
          // on the visible result and do not infer success from a timeout.
          if (name === 'chromium') {
            const targetY = await page.locator('[data-story-step]').nth(i).evaluate(el => el.getBoundingClientRect().top + scrollY + el.offsetHeight / 2 - innerHeight / 2);
            let remaining = targetY - await page.evaluate(() => scrollY);
            for (let n = 0; n < 30 && Math.abs(remaining) > 20; n++) {
              await page.mouse.wheel(0, Math.sign(remaining) * Math.min(Math.abs(remaining), 360));
              await page.waitForTimeout(110);
              remaining = targetY - await page.evaluate(() => scrollY);
            }
          }
          await page.locator('[data-story-step]').nth(i).evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
          await frames(page);
          // Wait on the observable active panel, not on animation implementation details.
          await page.waitForFunction(index => {
            const panels = [...document.querySelectorAll('[data-story-panel]')];
            return panels[index] && !panels[index].hidden && panels[index].getClientRects().length && getComputedStyle(panels[index]).visibility !== 'hidden' && Number(getComputedStyle(panels[index]).opacity) > .9;
          }, i);
          scrollStates.push(await page.locator('[data-story-panel]').evaluateAll(panels => panels.map(p => ({ hidden: p.hidden, visible: getComputedStyle(p).visibility !== 'hidden', opacity: getComputedStyle(p).opacity }))));
          if (i === 1) await page.locator('#story').screenshot({ path: resolve(output, `${name}-desktop-story-motion.png`) });
          if (name === 'chromium') await page.waitForTimeout(600);
        }
        // A focused evidence link must survive moving between sticky desktop
        // presentation and inline mobile figures, including the return resize.
        await page.locator('[data-story-step="1"]').evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await page.waitForFunction(() => !document.querySelector('[data-story-panel="1"]').hidden);
        const focusedPreview = page.locator('[data-story-panel="1"] [data-preview]');
        await focusedPreview.focus();
        await page.setViewportSize({ width: 390, height: 844 }); await frames(page);
        const focusedMobile = await focusedPreview.evaluate(el => el === document.activeElement && el.getClientRects().length > 0);
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.waitForFunction(() => document.querySelector('#story').hasAttribute('data-story-enhanced'));
        await frames(page);
        const focusedDesktop = await focusedPreview.evaluate(el => el === document.activeElement && el.getClientRects().length > 0);
        check(focusedMobile && focusedDesktop, `${name}: focused second story preview survives desktop → mobile → desktop`);
        await page.locator('[data-motion-toggle]').click();
        await frames(page);
        const manualOff = { state: await page.locator('html').getAttribute('data-motion'), allImagesVisible: await allStoryImagesVisible(page), steps: await availableStory(page) };
        check(manualOff.state === 'off' && manualOff.allImagesVisible && manualOff.steps.every(s => s.visible), `${name}: manual motion-off retains all story content`);
        await page.reload({ waitUntil: 'networkidle' });
        const persisted = await page.locator('html').getAttribute('data-motion') === 'off';
        check(persisted, `${name}: motion preference persists`);
        await page.locator('[data-motion-toggle]').click();
        await page.emulateMedia({ reducedMotion: 'reduce' }); await frames(page);
        const dynamicReduced = await page.locator('html').getAttribute('data-motion') === 'off' && await allStoryImagesVisible(page);
        check(dynamicReduced, `${name}: OS reduced-motion change tears down story enhancement`);
        await page.emulateMedia({ reducedMotion: 'no-preference' }); await frames(page);
        await page.setViewportSize({ width: 390, height: 844 }); await frames(page);
        const mobileFallback = await allStoryImagesVisible(page);
        check(mobileFallback, `${name}: resizing to mobile retains all story images`);
        report.interactions.push({ browser: name, viewport: 'motion-lifecycle', scrollStates, focusAcrossResize: { focusedMobile, focusedDesktop }, manualOff, persisted, dynamicReduced, mobileFallback });
        const recording = page.video();
        await context.close();
        if (recording) {
          report.scrollRecording = resolve(output, 'native-scroll.webm');
          await recording.saveAs(report.scrollRecording);
        }
        // Script-disabled content and a 200% page-zoom equivalent reflow (720 CSS px).
        for (const [label, settings] of Object.entries({ nojs: { viewport: { width: 390, height: 844 }, javaScriptEnabled: false }, zoom200: { viewport: { width: 720, height: 450 }, deviceScaleFactor: 2, reducedMotion: 'reduce' }, libraryFailure: { viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' } })) {
          const fallbackContext = await browser.newContext(settings);
          if (label === 'libraryFailure') await fallbackContext.route('**/public/vendor/**', route => route.abort('failed'));
          const fallbackPage = await fallbackContext.newPage();
          const errors = [];
          fallbackPage.on('pageerror', error => errors.push(error.message));
          await fallbackPage.goto(base, { waitUntil: 'networkidle' });
          const geo = await geometry(fallbackPage);
          const steps = await availableStory(fallbackPage);
          const allImages = await allStoryImagesVisible(fallbackPage);
          check(!geo.overflow && !geo.hiddenCore && steps.length === 3 && steps.every(s => s.visible) && allImages && !errors.length, `${name}/${label}: readable content/reflow fallback`);
          report.layouts.push({ browser: name, viewport: label, note: label === 'zoom200' ? 'Equivalent CSS viewport and DPR for 200% of 1440×900; does not claim browser toolbar zoom UI test.' : label === 'nojs' ? 'JavaScript disabled in browser context' : 'GSAP/ScrollTrigger vendor requests deliberately failed; content must remain usable.', ...geo, storySteps: steps.length, allImages, errors });
          await fallbackPage.screenshot({ path: resolve(output, `${name}-${label}-home.png`) });
          await fallbackContext.close();
        }
      }
      if (name === 'chromium' && !skipPerformance) {
        for (let run = 1; run <= 3; run++) {
          console.log(`Chromium: cold throttled lab run ${run}/3`);
          const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
          const page = await context.newPage();
          const cdp = await context.newCDPSession(page);
          await cdp.send('Network.enable');
          await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
          await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1_600_000 / 8, uploadThroughput: 750_000 / 8, connectionType: 'cellular3g' });
          await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
          await page.addInitScript(() => {
            window.__lab = { lcp: 0, cls: 0, lcpElement: null };
            new PerformanceObserver(list => list.getEntries().forEach(e => { window.__lab.lcp = e.startTime; window.__lab.lcpElement = e.element?.tagName + (e.element?.id ? '#' + e.element.id : ''); })).observe({ type: 'largest-contentful-paint', buffered: true });
            new PerformanceObserver(list => list.getEntries().forEach(e => { if (!e.hadRecentInput) window.__lab.cls += e.value; })).observe({ type: 'layout-shift', buffered: true });
          });
          await page.goto(base, { waitUntil: 'networkidle' });
          await page.evaluate(() => document.fonts.ready); await frames(page);
          const measured = await page.evaluate(() => ({ ...window.__lab, fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || null,
            navigation: performance.getEntriesByType('navigation').map(e => ({ domContentLoaded: e.domContentLoadedEventEnd, load: e.loadEventEnd, transferBytes: e.transferSize, bodyBytes: e.encodedBodySize }))[0],
            resources: performance.getEntriesByType('resource').map(e => ({ path: new URL(e.name).pathname, type: e.initiatorType, transferBytes: e.transferSize, bodyBytes: e.encodedBodySize, duration: e.duration })),
          }));
          measured.run = run;
          measured.initialTransferBytes = measured.navigation.transferBytes + measured.resources.reduce((s, r) => s + r.transferBytes, 0);
          measured.initialBodyBytes = measured.navigation.bodyBytes + measured.resources.reduce((s, r) => s + r.bodyBytes, 0);
          report.performance.push(measured);
          await context.close();
        }
      }
    } finally { await browser.close(); }
  }
  if (!baseline && !performanceOnly) {
    const response = await fetch(base + '/public/ethan-zhou-resume.pdf');
    const bytes = Buffer.from(await response.arrayBuffer());
    const pdf = { status: response.status, bytes: bytes.length, signature: bytes.subarray(0, 5).toString(), hasEndMarker: bytes.subarray(-1024).includes(Buffer.from('%%EOF')) };
    check(pdf.status === 200 && pdf.signature === '%PDF-' && pdf.hasEndMarker, 'resume: valid downloadable PDF envelope');
    report.resume = pdf;
  }
} catch (error) { report.failures.push(error.stack || error.message); }
finally {
  server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  report.status = report.failures.length ? 'FAIL' : 'PASS';
  await writeFile(resolve(output, 'experience-report.json'), JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ status: report.status, layouts: report.layouts.length, interactions: report.interactions.length, performanceRuns: report.performance.length, failures: report.failures }, null, 2));
process.exitCode = report.failures.length ? 1 : 0;
