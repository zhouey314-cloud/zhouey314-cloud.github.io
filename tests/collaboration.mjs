import {choiceValue} from './controls.mjs';
// Visitor-facing brief composition, privacy boundaries and graceful enhancement.
import {chromium, webkit} from 'playwright';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {serve, source, mkdir, writeFile, resolve, frames, assert} from './support.mjs';

const site = await serve();
const out = resolve(process.env.COLLABORATION_REPORT_DIR || 'test-results/collaboration');
await mkdir(out, {recursive: true});
const report = {
  at: new Date().toISOString(), base_url: site.base, source: source(),
  scope: 'Actual Chromium/WebKit user flows. Mobile uses simulated 390/320 CSS viewports and touch, not physical-device acceptance. Clipboard permissions are controlled test doubles; downloads are actual browser downloads. Mail links are inspected, never opened or sent.',
  cases: [], failures: []
};
const email = 'zhouey314@gmail.com';
const wechat = 'https://u.wechat.com/MJNJhDRZFiAFKD09uKIRGvM?s=3';
const topics = ['retrieval', 'workflow', 'api', 'media'];
const engines = {chromium, webkit};
const selectedEngines = (process.env.COLLABORATION_ENGINES || 'chromium,webkit').split(',').map(x => x.trim()).filter(Boolean);
const save = () => writeFile(resolve(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');

async function run(title, fn) {
  const entry = {title};
  try { await fn(entry); entry.status = 'PASS'; }
  catch (error) { entry.status = 'FAIL'; entry.error = error.stack; report.failures.push({title, error: error.message}); }
  report.cases.push(entry); await save(); console.log(entry.status, title, entry.error || '');
}

async function contextFor(browser, width = 1440, extra = {}) {
  const context = await browser.newContext({
    viewport: {width, height: 960}, hasTouch: width <= 390,
    reducedMotion: 'reduce', locale: 'zh-CN', acceptDownloads: true, ...extra
  });
  // Observe storage calls without changing whether the browser accepts them.
  await context.addInitScript(() => {
    window.__briefStorageCalls = [];
    for (const method of ['setItem', 'removeItem', 'clear']) {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function (...args) {
        window.__briefStorageCalls.push({method, store: this === localStorage ? 'localStorage' : 'sessionStorage'});
        return original.apply(this, args);
      };
    }
  });
  return context;
}

function observe(page) {
  const observed = {errors: [], resources: [], dataRequests: [], webSockets: [], popups: 0, requests: 0};
  page.setDefaultTimeout(15000); page.setDefaultNavigationTimeout(25000);
  page.on('pageerror', error => observed.errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) observed.resources.push({url: response.url(), status: response.status()}); });
  page.on('request', request => {
    observed.requests++;
    if (!['GET', 'HEAD'].includes(request.method()) || ['fetch', 'xhr', 'ping', 'eventsource', 'websocket'].includes(request.resourceType())) {
      observed.dataRequests.push({method: request.method(), type: request.resourceType(), url: request.url()});
    }
  });
  page.on('websocket', socket => observed.webSockets.push(socket.url()));
  page.on('popup', () => observed.popups++);
  return observed;
}

async function privacy(page, observed) {
  const storage = await page.evaluate(() => ({calls: window.__briefStorageCalls || [], localKeys: localStorage.length, sessionKeys: sessionStorage.length}));
  assert(observed.dataRequests.length === 0 && observed.webSockets.length === 0, 'brief interactions must not initiate upload, fetch/XHR, beacon, event stream or WebSocket requests');
  assert(storage.calls.length === 0 && storage.localKeys === 0 && storage.sessionKeys === 0, 'brief must not write or retain local/session storage');
  assert(observed.popups === 0, 'generating, editing, copying and downloading must not open email or another page');
  return {dataRequests: observed.dataRequests, webSockets: observed.webSockets, storage, popups: observed.popups, requestsObserved: observed.requests};
}

async function noOverflow(page, label) {
  const geometry = await page.evaluate(() => ({width: innerWidth, documentWidth: document.documentElement.scrollWidth}));
  assert(geometry.documentWidth <= geometry.width + 1, `${label}: horizontal overflow`);
  return geometry;
}

function readMail(href) {
  const url = new URL(href);
  assert(url.protocol === 'mailto:' && url.pathname === email, 'draft must address the approved email via a mailto link');
  return {subject: url.searchParams.get('subject'), body: url.searchParams.get('body'), length: href.length};
}

async function installClipboard(page, allowed) {
  await page.evaluate(success => {
    window.__briefCopiedText = null;
    Object.defineProperty(navigator, 'clipboard', {configurable: true, value: {
      writeText: text => success
        ? (window.__briefCopiedText = text, Promise.resolve())
        : Promise.reject(new DOMException('Controlled permission denial', 'NotAllowedError'))
    }});
  }, allowed);
}

try {
  for (const name of selectedEngines) {
    assert(engines[name], `unknown requested engine ${name}`);
    const browser = await engines[name].launch();
    try {
      await run(`${name}: topic links select a valid direction; unknown input stays safe`, async entry => {
        const context = await contextFor(browser); const page = await context.newPage(); const observed = observe(page);
        try {
          const results = [];
          for (const topic of topics) {
            await page.goto(`${site.base}/collaborate.html?topic=${topic}#brief`, {waitUntil: 'load'});
            await page.locator('[data-inquiry-form]').waitFor({state: 'visible'});
            assert(await choiceValue(page,'#inquiry-topic','topic') === topic, `${topic} URL preselection`);
            assert(await page.locator(`[href="/collaborate.html?topic=${topic}#brief"]`).count() > 0, `${topic} has a real scope entry`);
            results.push(topic);
          }
          const unknown = '"><img src=x onerror=alert(1)>';
          await page.goto(`${site.base}/collaborate.html?topic=${encodeURIComponent(unknown)}#brief`, {waitUntil: 'load'});
          await page.locator('[data-inquiry-form]').waitFor({state: 'visible'});
          assert(await choiceValue(page,'#inquiry-topic','topic') === 'other', 'unknown topic defaults to other');
          assert(await page.locator('img[src="x"]').count() === 0, 'unknown query is not interpreted as HTML');
          await page.goto(`${site.base}/collaborate.html`, {waitUntil: 'load'});
          await page.locator('[data-inquiry-form]').waitFor({state: 'visible'});
          assert(await choiceValue(page,'#inquiry-topic','topic') === 'other', 'missing topic defaults to other');
          entry.browser = browser.version(); entry.preselected = results; entry.safeDefault = true;
          entry.privacy = await privacy(page, observed);
          assert(observed.errors.length === 0 && observed.resources.length === 0, 'topic routes have no unexpected script/resource errors');
        } finally { await context.close(); }
      });

      for (const width of [1440, 390, 320]) await run(`${name} ${width}px: compose, edit, copy, download and retain the full long brief`, async entry => {
        const context = await contextFor(browser, width); const page = await context.newPage(); const observed = observe(page);
        try {
          await page.goto(`${site.base}/collaborate.html?topic=retrieval#brief`, {waitUntil: 'load'});
          await page.locator('[data-inquiry-form]').waitFor({state: 'visible'});
          await page.evaluate(() => document.fonts.ready);
          const initialURL = page.url();
          entry.initialGeometry = await noOverflow(page, 'initial page');
          assert(await page.locator('.scope-item').count() === 4, 'all four cooperation ranges remain present');

          const submit = page.locator('[data-inquiry-form] button[type="submit"]');
          if (width <= 390) await submit.tap(); else { await submit.focus(); await page.keyboard.press('Enter'); }
          assert(await page.locator('#inquiry-problem').evaluate(element => element.validity.valueMissing && !!element.validationMessage), 'empty required input uses native validity feedback');
          assert(await page.locator('[data-inquiry-output]').isHidden() && await page.locator('#inquiry-draft').inputValue() === '', 'invalid submission must not generate a brief');
          assert(page.url() === initialURL, 'invalid submission must not navigate or send');

          const values = {problem: '检索接口 & RAG?', context: 'MD / API', result: '原文与测试 ✅', timing: '郑州 / 远程'};
          for (const [field, value] of Object.entries(values)) await page.locator(`[name="${field}"]`).fill(value);
          await page.locator('[name="intent"][value="role"]').check();
          if (width <= 390) await submit.tap(); else { await submit.focus(); await page.keyboard.press('Enter'); }
          await page.locator('[data-inquiry-output]').waitFor({state: 'visible'});
          const draft = await page.locator('#inquiry-draft').inputValue();
          for (const value of Object.values(values)) assert(draft.includes(value), 'generated brief retains each supplied field');
          for (const heading of ['问题 / 岗位需求', '已有资料 / 系统 / 团队条件', '期望产物与完成标准', '时间安排 / 合作条件']) assert(draft.includes(heading), `brief labels ${heading}`);
          assert(draft.includes('岗位交流') && draft.includes('知识检索 / RAG'), 'intent and direction are part of the brief');
          assert(await page.locator('#inquiry-output-title').evaluate(element => element === document.activeElement), 'generated result receives keyboard focus');
          await page.waitForFunction(() => {
            const heading = document.getElementById('inquiry-output-title');
            const box = heading.getBoundingClientRect();
            if (box.top < 0 || box.bottom > innerHeight || box.width <= 0) return false;
            // Use the painted hit target, so a sticky navigation overlay cannot
            // pass merely because the heading has an in-viewport rectangle.
            return [.25, .75].every(position => heading.contains(document.elementFromPoint(box.left + box.width / 2, box.top + box.height * position)));
          });
          assert(await page.locator('#inquiry-draft').getAttribute('readonly') !== null, 'generated brief remains a selectable read-only result');
          const shortMail = readMail(await page.locator('[data-email-brief]').getAttribute('href'));
          assert(shortMail.subject === '岗位交流 · 知识检索 / RAG · 与恩宇交流' && shortMail.body === draft, 'mailto decodes the complete short brief and the selected intent without corrupting Chinese or reserved characters');
          assert(await page.locator('[data-email-note]').isHidden(), 'short brief needs no shortening message');
          assert(page.url() === initialURL, 'generating a mailto must not open or send email');

          await page.locator('[name="problem"]').fill(values.problem + ' 更新');
          await page.waitForFunction(() => document.getElementById('inquiry-draft').value.includes('RAG? 更新'));
          assert(await page.locator('[name="problem"]').evaluate(element => element === document.activeElement), 'live edits keep keyboard focus in the input');
          let updated = await page.locator('#inquiry-draft').inputValue();
          assert(updated !== draft && readMail(await page.locator('[data-email-brief]').getAttribute('href')).body === updated, 'editing updates both the visible brief and the email draft');

          // A visitor may remove the original problem while revising the brief.
          // Invalid edits must not leave an actionable blank or stale email draft.
          for (const invalidProblem of ['', ' \n\t  ']) {
            await page.locator('[name="problem"]').fill(invalidProblem);
            await page.locator('[data-inquiry-output]').waitFor({state: 'hidden'});
            assert(await page.locator('#inquiry-draft').inputValue() === '', 'clearing the required problem removes the generated brief');
            assert(!readMail(await page.locator('[data-email-brief]').getAttribute('href')).body, 'invalid edits do not retain an empty or stale sendable outline');
            if (width <= 390) await submit.tap(); else { await submit.focus(); await page.keyboard.press('Enter'); }
            assert(await page.locator('#inquiry-problem').evaluate(element => !element.validity.valid && !!element.validationMessage), 'empty and whitespace-only edits remain invalid on submit');
            assert(await page.locator('[data-inquiry-output]').isHidden() && await page.locator('#inquiry-draft').inputValue() === '', 'rejected edits keep the invalid output unavailable');
          }
          const recoveredProblem = values.problem + ' 恢复后检查';
          await page.locator('[name="problem"]').fill(recoveredProblem);
          await page.locator('[data-inquiry-output]').waitFor({state: 'visible'});
          assert(await page.locator('[name="problem"]').evaluate(element => element === document.activeElement), 'correcting an invalid problem does not move focus away from the input');
          updated = await page.locator('#inquiry-draft').inputValue();
          assert(updated.includes(recoveredProblem) && !updated.includes('RAG? 更新'), 'a corrected problem restores the newly composed outline instead of the stale one');
          assert(readMail(await page.locator('[data-email-brief]').getAttribute('href')).body === updated, 'recovered email draft matches the corrected visible outline');

          await installClipboard(page, true);
          await page.locator('[data-copy-brief]').click();
          await page.waitForFunction(() => document.querySelector('[data-brief-feedback]').textContent.includes('已复制'));
          assert(await page.evaluate(() => window.__briefCopiedText) === updated, 'successful clipboard action copies the exact complete result');
          await installClipboard(page, false);
          await page.locator('[data-copy-brief]').click();
          await page.waitForFunction(() => document.querySelector('[data-brief-feedback]').textContent.includes('已选中'));
          assert(await page.locator('#inquiry-draft').evaluate(element => element === document.activeElement && element.selectionStart === 0 && element.selectionEnd === element.value.length), 'denied clipboard permission focuses and selects the whole brief for manual copying');

          const waiting = page.waitForEvent('download');
          await page.locator('[data-download-brief]').click(); const download = await waiting;
          assert(download.suggestedFilename().endsWith('.txt'), 'download is a text file');
          const downloadPath = resolve(out, `${name}-${width}-brief.txt`); await download.saveAs(downloadPath);
          assert(await download.failure() === null, 'actual text download completes');
          const bytes = await readFile(downloadPath); const text = new TextDecoder('utf-8', {fatal: true}).decode(bytes);
          assert(text.includes(updated) && text.startsWith(shortMail.subject + '\n'), 'UTF-8 download contains subject and complete current outline');
          entry.download = {file: downloadPath, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')};
          entry.generatedGeometry = await noOverflow(page, 'generated result');
          await page.locator('[data-inquiry-output]').scrollIntoViewIfNeeded(); await frames(page);
          await page.locator('.collaborate-brief').screenshot({path: resolve(out, `${name}-${width}-brief.png`)});

          const longValues = {problem: '资料查询'.repeat(150), context: '现有文档'.repeat(100), result: '引用出处'.repeat(100), timing: '远程协作'.repeat(40)};
          for (const [field, value] of Object.entries(longValues)) await page.locator(`[name="${field}"]`).fill(value);
          const longDraft = await page.locator('#inquiry-draft').inputValue();
          for (const value of Object.values(longValues)) assert(longDraft.includes(value), 'maximum-length inputs remain complete in the full brief');
          assert(await page.locator('[data-email-note]').isVisible() && (await page.locator('[data-email-note]').innerText()).includes('全文'), 'long email has visible instruction to copy the full text');
          const shortLongMail = readMail(await page.locator('[data-email-brief]').getAttribute('href'));
          assert(shortLongMail.length < 1800 && shortLongMail.body.length < longDraft.length && shortLongMail.subject === shortMail.subject, 'long mailto uses a short body while retaining the actual subject');
          await installClipboard(page, true); await page.locator('[data-copy-brief]').click();
          await page.waitForFunction(() => document.querySelector('[data-brief-feedback]').textContent.includes('已复制'));
          assert(await page.evaluate(() => window.__briefCopiedText) === longDraft, 'long-mail shortening does not truncate the copyable full brief');
          entry.longGeometry = await noOverflow(page, 'long result');
          assert(page.url() === initialURL, 'all local composition actions keep the visitor on the page');
          entry.privacy = await privacy(page, observed);
          entry.longBrief = {characters: longDraft.length, mailtoLength: shortLongMail.length, fullCopyRetained: true};

          await page.reload({waitUntil: 'load'}); await page.locator('[data-inquiry-form]').waitFor({state: 'visible'});
          assert(await page.locator('[data-inquiry-output]').isHidden() && await page.locator('#inquiry-draft').inputValue() === '', 'refresh does not retain the generated brief');
          for (const field of Object.keys(values)) assert(await page.locator(`[name="${field}"]`).inputValue() === '', 'refresh clears entered ' + field);
          assert(await page.locator('[name="intent"][value="project"]').isChecked(), 'refresh restores the initial collaboration intent');
          entry.afterRefreshPrivacy = await privacy(page, observed);
          assert(observed.errors.length === 0 && observed.resources.length === 0, 'interactive flows have no unexpected script or resource errors');
          entry.browser = browser.version(); entry.viewport = {width, height: 960};
          entry.nativeValidation = true; entry.editing = true; entry.visibleOutputHeading = true; entry.editFocusRetained = true; entry.invalidEditRecovery = true; entry.clipboard = {controlledSuccess: true, controlledDenial: true}; entry.noAutomaticSending = true;
        } finally { await context.close(); }
      });

      for (const mode of ['nojs', 'scriptFailure']) await run(`${name}: ${mode} retains real cooperation, contact and resume paths`, async entry => {
        const context = await contextFor(browser, 390, mode === 'nojs' ? {javaScriptEnabled: false} : {});
        if (mode === 'scriptFailure') await context.route('**/public/ui/bootstrap-*.js', route => route.abort('failed'));
        const page = await context.newPage(); const observed = observe(page);
        try {
          await page.goto(`${site.base}/collaborate.html#brief`, {waitUntil: 'load'});
          assert(await page.locator('[data-inquiry-form]').isHidden() && await page.locator('[data-inquiry-output]').isHidden(), 'unavailable enhancement does not expose an inert form or partial output');
          assert(await page.locator('[data-inquiry-fallback]').isVisible(), 'a readable direct-contact fallback is visible');
          for (const topic of topics) {
            const item = page.locator(`#scope-${topic}`); assert(await item.isVisible(), topic + ' cooperation scope remains readable');
            assert(await item.locator('dl dt').count() === 3 && await item.locator('a[href^="/cases/"],a[href^="/projects.html"]').count() === 1, topic + ' keeps inputs, outcomes, checks and real evidence');
          }
          assert(await page.locator('.collaborate-email').getAttribute('href') === 'mailto:' + email, 'approved email remains reachable');
          assert(await page.locator('[data-inquiry-fallback] a[href="mailto:' + email + '"]').isVisible(), 'fallback provides an actual email link');
          const qr = page.locator('.collaborate-qr svg'); assert(await qr.isVisible(), 'inline WeChat QR remains visible');
          const box = await qr.boundingBox(); assert(box.width >= 140 && Math.abs(box.width - box.height) < 1, 'fallback QR keeps a readable square scan area');
          assert(await page.locator('.collaborate-qr>a').getAttribute('href') === '/public/contact/wechat-qr.png' && await page.locator('.collaborate-qr>a').getAttribute('data-wechat-profile') === wechat, 'QR opens the saveable PNG of the same approved account');
          assert(await page.locator('.collaborate-recruiter a[href="/resume.html"]').isVisible() && await page.locator('.collaborate-recruiter a[download][href="/public/ethan-zhou-resume.pdf"]').isVisible(), 'online and downloadable resume remain available');
          for (const target of ['https://github.com/zhouey314-cloud', 'https://x.com/UPing123zzz', 'https://t.me/ethanyu520']) assert(await page.locator(`.collaborate-contact a[href="${target}"]`).isVisible(), 'existing social contact remains usable: ' + target);
          entry.geometry = await noOverflow(page, mode);
          await page.screenshot({path: resolve(out, `${name}-${mode}.png`), fullPage: true});
          entry.privacy = await privacy(page, observed); entry.browser = browser.version(); entry.staticContent = true; entry.expectedScriptBlock = mode === 'scriptFailure';
          assert(observed.errors.length === 0 && observed.resources.length === 0, 'fallback retains content without additional script/runtime or HTTP errors');
        } finally { await context.close(); }
      });
    } finally { await browser.close(); }
  }
} catch (error) {
  report.failures.push({title: 'test setup or browser launch', error: error.stack});
} finally {
  await site.close(); report.status = report.failures.length ? 'FAIL' : 'PASS'; await save();
  console.log(JSON.stringify({status: report.status,groups: report.cases.length,failures: report.failures}));
  if (report.failures.length) process.exitCode = 1;
}
