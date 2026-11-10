// Production islands must retain an honest, usable server-rendered fallback
// when an entry module or a later React lazy import fails. Keep fault evidence.
import {chromium, webkit} from 'playwright';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {serve, source, root, resolve, mkdir, writeFile, assert} from './support.mjs';
import {choose, choiceValue} from './controls.mjs';

assert(root.endsWith('/dist'), 'Run SITE_DIR=dist npm run test:fallback after npm run build');
const site = await serve();
const out = resolve(process.env.FALLBACK_REPORT_DIR || 'test-results/island-fallback');
await mkdir(out, {recursive: true});
const manifestBytes = await readFile(resolve(root, 'public/ui/manifest.json'));
const manifest = JSON.parse(manifestBytes);
const componentPath = '/' + manifest.generated.find(path => /\/cooperate-[^/]+\.js$/.test(path));
const sheetPath = '/' + manifest.generated.find(path => /\/BottomSheet-[^/]+\.js$/.test(path));
assert(!componentPath.includes('undefined') && !sheetPath.includes('undefined'), 'Real component and lazy-sheet assets are listed');
const engines = {chromium, webkit};
const selectedEngines = (process.env.FALLBACK_ENGINES || 'chromium,webkit').split(',');
const widths = (process.env.FALLBACK_WIDTHS || '320,390,1440').split(',').map(Number);
const modes = (process.env.FALLBACK_MODES || 'normal,sheet-abort,sheet-404,component-abort,slow-refresh,nojs').split(',');
assert(selectedEngines.every(name => engines[name]) && widths.every(width => [320, 390, 1440].includes(width)) &&
  modes.every(mode => ['normal', 'sheet-abort', 'sheet-404', 'component-abort', 'slow-refresh', 'nojs'].includes(mode)), 'Known fallback matrix selections');
const report = {at: new Date().toISOString(), source: source(), base: site.base,
  scope: 'Local dist in actual Chromium/WebKit; touch/viewports are emulated. Faults are controlled, briefs synthetic, no messages or model requests. A handled product error remains in the diagnostic record.',
  manifestSha256: createHash('sha256').update(manifestBytes).digest('hex'),
  planned: selectedEngines.length * widths.length * modes.length, cases: [], failures: [], status: 'PARTIAL'};
const save = () => writeFile(resolve(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
async function bounded(promise, label, milliseconds = 10000) {
  let timer;
  try {return await Promise.race([promise, new Promise((_, reject) => {timer = setTimeout(() => reject(Error(label + ' timed out')), milliseconds);})]);}
  finally {clearTimeout(timer);}
}
function observe(page) {
  const started = Date.now(), observed = {phase: 'setup', events: [], errors: [], consoleErrors: [], failedRequests: [], httpErrors: [], dataRequests: [], popups: 0};
  const requests = new WeakMap(), pending = new Map();
  let nextRequest = 0, documentId = 0;
  const record = (type, detail) => {const event = {ms: Date.now() - started, phase: observed.phase, documentId, type, ...detail}; observed.events.push(event); return event;};
  observed.mark = phase => {observed.phase = phase; record('phase', {name: phase});};
  observed.requestInfo = request => {
    if (!requests.has(request)) {
      const info = {requestId: ++nextRequest, url: request.url(), requestedMs: Date.now() - started,
        requestPhase: observed.phase, requestDocumentId: request.isNavigationRequest() ? documentId + 1 : documentId};
      requests.set(request, info); pending.set(info.requestId, info);
    }
    return requests.get(request);
  };
  observed.pendingRequests = () => [...pending.values()];
  observed.requestCount = () => nextRequest;
  page.on('framenavigated', frame => {if (frame === page.mainFrame()) {documentId++; record('navigation', {url: frame.url()});}});
  page.on('pageerror', error => observed.errors.push(record('pageerror', {name: error.name, message: error.message, stack: error.stack})));
  page.on('console', message => {if (message.type() === 'error') observed.consoleErrors.push(record('console', {message: message.text(), location: message.location()}));});
  page.on('requestfinished', request => pending.delete(observed.requestInfo(request).requestId));
  page.on('requestfailed', request => {
    const info = observed.requestInfo(request); pending.delete(info.requestId);
    observed.failedRequests.push(record('requestfailed', {...info, error: request.failure()?.errorText}));
  });
  page.on('response', response => {if (response.status() >= 400) observed.httpErrors.push(record('response', {...observed.requestInfo(response.request()), status: response.status()}));});
  page.on('request', request => {
    record('request', observed.requestInfo(request));
    if (!['GET', 'HEAD'].includes(request.method()) || ['fetch', 'xhr', 'ping', 'websocket'].includes(request.resourceType())) observed.dataRequests.push(record('data-request', {url: request.url(), method: request.method(), resource: request.resourceType()}));
  });
  page.on('popup', () => observed.popups++);
  return observed;
}
async function snapshot(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-ui=cooperate]');
    const visible = element => Boolean(element?.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
    return {state: root?.dataset.uiState, errorPhase: root?.dataset.uiErrorPhase, children: root?.childElementCount,
      formVisible: visible(document.querySelector('[data-inquiry-form]')), fallbackVisible: visible(document.querySelector('[data-inquiry-fallback]')),
      fallbackEmail: document.querySelector('[data-inquiry-fallback] a')?.getAttribute('href'),
      errorNotice: [...document.querySelectorAll('[data-ui-error-for]')].filter(element => element.dataset.uiErrorFor === root?.dataset.uiId).map(element => ({role: element.getAttribute('role'), text: element.textContent})),
      staticEmail: visible(document.querySelector('.collaborate-email')), qr: visible(document.querySelector('.collaborate-qr svg')),
      scopeCount: document.querySelectorAll('.scope-item').length, width: innerWidth, documentWidth: document.documentElement.scrollWidth,
      reportedErrors: window.__islandErrors || [], storage: {local: localStorage.length, session: sessionStorage.length}};
  });
}
async function normalForm(page, width) {
  await page.locator('[data-inquiry-form]').waitFor({state: 'visible'});
  assert(await choiceValue(page, '#inquiry-topic', 'topic') === 'media', 'URL topic is selected in normal form');
  await choose(page, '#inquiry-topic', 'workflow');
  assert(await choiceValue(page, '#inquiry-topic', 'topic') === 'workflow', 'Public adaptive selector remains usable');
  const problem = '合成回归：保留原文并整理工作流。';
  await page.locator('#inquiry-problem').fill(problem);
  const submit = page.locator('[data-inquiry-form] button[type=submit]');
  if (width < 768) await submit.tap(); else {await submit.focus(); await page.keyboard.press('Enter');}
  await page.locator('[data-inquiry-output]').waitFor({state: 'visible'});
  assert((await page.locator('#inquiry-draft').inputValue()).includes(problem), 'Actual outline retains supplied problem');
}
async function fallback(page, phase) {
  await page.waitForFunction(phase => document.querySelector('[data-ui=cooperate]')?.dataset.uiState === 'error' && document.querySelector('[data-ui=cooperate]')?.dataset.uiErrorPhase === phase, phase);
  const state = await snapshot(page);
  assert(state.children > 0 && state.fallbackVisible && !state.formVisible && state.fallbackEmail === 'mailto:zhouey314@gmail.com', 'Failure restores SSR direct-email fallback without exposing an inert form');
  assert(state.errorNotice.length === 1 && state.errorNotice[0].role === 'alert' && state.errorNotice[0].text.trim(), 'One explicit accessible failure message');
  assert(state.reportedErrors.some(error => error.phase === phase && error.island === 'cooperate' && error.message), 'Island error retains phase, source and original message');
  return state;
}
async function run(browser, name, width, mode) {
  const title = `${name}/${width}/${mode}`, entry = {title, browser: browser.version(), width, mode};
  const context = await browser.newContext({viewport: {width, height: 960}, hasTouch: width < 768, javaScriptEnabled: mode !== 'nojs', reducedMotion: 'reduce', locale: 'zh-CN'});
  await context.tracing.start({screenshots: true, snapshots: true});
  await context.addInitScript(() => {window.__islandErrors = []; addEventListener('portfolio:ui-error', event => window.__islandErrors.push(event.detail));});
  const page = await context.newPage(), observed = observe(page); entry.observed = observed;
  page.setDefaultTimeout(10000); page.setDefaultNavigationTimeout(20000);
  const deadline = setTimeout(() => {entry.deadlineExceeded = true; context.close().catch(() => {});}, 55000);
  let requested = false, releaseFirstRequest, releaseHeldRequest;
  const firstRequest = new Promise(resolve => {releaseFirstRequest = resolve;});
  const heldRequest = new Promise(resolve => {releaseHeldRequest = resolve;});
  if (mode.startsWith('sheet-')) await context.route(site.base + sheetPath, route => {
    requested = true;
    return mode === 'sheet-abort' ? route.abort('failed') : route.fulfill({status: 404, contentType: 'text/javascript', body: '// controlled missing lazy module'});
  });
  if (mode === 'component-abort') await context.route(site.base + componentPath, route => {requested = true; return route.abort('failed');});
  if (mode === 'slow-refresh') await context.route(site.base + componentPath, async route => {
    const info = observed.requestInfo(route.request());
    if (!requested) {requested = true; releaseFirstRequest(info); await heldRequest;} else await delay(100);
    try {await route.continue();} catch (error) {observed.events.push({phase: observed.phase, type: 'abandoned-route', requestId: info.requestId, message: error.message});}
  });
  try {
    observed.mark('initial-navigation');
    const response = await page.goto(site.base + '/collaborate.html?topic=media#brief', {waitUntil: mode === 'slow-refresh' ? 'domcontentloaded' : 'load'});
    assert(response.status() === 200, 'Cooperation document is served');
    if (mode === 'normal' || mode.startsWith('sheet-') && width === 1440) {
      observed.mark('normal-form'); await normalForm(page, width);
      entry.expected = mode.startsWith('sheet-') ? 'desktop anchored selector does not request the compact sheet' : 'normal adaptive form';
      if (mode.startsWith('sheet-')) assert(!requested, 'Desktop compact-sheet fault is not artificially triggered');
      assert(!observed.errors.length && !observed.consoleErrors.length && !observed.failedRequests.length && !observed.httpErrors.length, 'Normal path has no unexpected errors');
    } else if (mode === 'sheet-abort' || mode === 'sheet-404' || mode === 'component-abort') {
      observed.mark('await-fallback');
      entry.fallback = await fallback(page, mode === 'component-abort' ? 'module-import' : 'react-uncaught');
      assert(requested && (observed.failedRequests.length || observed.httpErrors.length), 'The intended real module failure was recorded');
      assert(observed.errors.length || observed.consoleErrors.length, 'Handled failure remains in browser diagnostics');
      entry.expected = 'explicit error state with SSR fallback; no claim that the interactive form works';
    } else if (mode === 'slow-refresh') {
      const controlled = await bounded(firstRequest, 'First delayed component request');
      const until = Date.now() + 10000;
      let quietSince = Date.now(), requestCount = observed.requestCount();
      while (Date.now() - quietSince < 250) {
        if (observed.pendingRequests().some(request => request.requestId !== controlled.requestId) || observed.requestCount() !== requestCount) quietSince = Date.now();
        requestCount = observed.requestCount();
        assert(Date.now() < until, 'Other initial-document requests finish before controlled refresh'); await delay(20);
      }
      assert(observed.pendingRequests().some(request => request.requestId === controlled.requestId), 'The one controlled component request remains pending');
      entry.refreshControl = {request: controlled, quietWindowMs: 250, pending: observed.pendingRequests()};
      observed.mark('refresh-during-module-load'); await page.reload({waitUntil: 'load'});
      releaseHeldRequest();
      observed.mark('normal-form-after-refresh'); await normalForm(page, width);
      // Only this known request may be cancelled. Correlate old-document
      // errors with its ID, cancellation time and the next document boundary.
      const cancellations = observed.failedRequests.filter(request => request.requestId === controlled.requestId && request.requestDocumentId === controlled.requestDocumentId && request.phase === 'refresh-during-module-load' && /cancelled|ERR_ABORTED|NS_BINDING_ABORTED/i.test(request.error || ''));
      const navigation = observed.events.find(event => event.type === 'navigation' && event.documentId > controlled.requestDocumentId);
      // Chromium can abandon the held request without emitting requestfailed;
      // that allows no error exception at all. Any reported failure must be
      // this exact controlled request, never another module or document.
      assert(cancellations.length <= 1 && observed.failedRequests.length === cancellations.length && navigation, 'Only the controlled old-document request may fail during navigation');
      const belongsToCancelledDocument = event => cancellations.length === 1 && event.documentId === controlled.requestDocumentId && event.phase === 'refresh-during-module-load' && event.ms >= cancellations[0].ms && event.ms < navigation.ms;
      const abandonedErrors = observed.errors.filter(error => belongsToCancelledDocument(error) && /Importing a module script failed|dynamically imported module/i.test(error.message));
      const abandonedConsole = observed.consoleErrors.filter(error => belongsToCancelledDocument(error) && error.message.includes('Portfolio interaction failed: cooperate module-import'));
      assert(!observed.httpErrors.length && abandonedErrors.length === observed.errors.length && abandonedConsole.length === observed.consoleErrors.length, 'No new-document or unrelated error is accepted as a navigation cancellation');
      const fresh = await snapshot(page);
      assert(fresh.state === 'ready' && !fresh.reportedErrors.length && !fresh.errorNotice.length, 'Refreshed document is usable and has no island error');
      entry.abandonedDocument = {controlledRequest: controlled, cancellations, cancellationSignal: cancellations.length ? 'requestfailed with recorded reason' : 'browser emitted no requestfailed; no error exception allowed', nextNavigation: navigation, errors: abandonedErrors, consoleErrors: abandonedConsole};
      entry.expected = 'fresh page recovers after an interrupted slow module request';
    } else {
      entry.expected = 'server-rendered no-JavaScript contact fallback';
      const state = await snapshot(page);
      assert(state.fallbackVisible && !state.formVisible && state.fallbackEmail === 'mailto:zhouey314@gmail.com', 'No-JS initial HTML offers direct email');
      assert(!observed.errors.length && !observed.httpErrors.length, 'No-JS content requires no interaction runtime');
    }
    observed.mark('contact-and-privacy'); entry.state = await snapshot(page);
    assert(entry.state.staticEmail && entry.state.qr && entry.state.scopeCount === 4, 'Static email, real QR and all cooperation scopes remain readable');
    assert(entry.state.documentWidth <= entry.state.width + 1, 'No horizontal page overflow');
    assert(!observed.dataRequests.length && !observed.popups && !entry.state.storage.local && !entry.state.storage.session, 'No upload, automatic message or persisted brief');
    entry.status = 'PASS';
  } catch (error) {
    entry.status = 'FAIL'; entry.error = error.stack; report.failures.push({title, error: error.message});
    try {entry.stateAtFailure = await snapshot(page);} catch {}
  } finally {
    clearTimeout(deadline); releaseHeldRequest(); observed.mark('evidence');
    if (entry.status === 'FAIL' || mode === 'component-abort' || mode.startsWith('sheet-') && width < 768 || width === 320 && ['normal', 'nojs'].includes(mode)) {
      try {await page.screenshot({path: resolve(out, title.replaceAll('/', '-') + '.png'), fullPage: true});} catch {}
      entry.trace = title.replaceAll('/', '-') + '.zip';
      try {await context.tracing.stop({path: resolve(out, entry.trace)});} catch {}
    } else await context.tracing.stop();
    await context.close(); report.cases.push(entry); await save(); console.log(entry.status, title, entry.error?.split('\n')[0] || '');
  }
}
try {
  for (const name of selectedEngines) {
    const browser = await engines[name].launch();
    try {for (const width of widths) for (const mode of modes) await run(browser, name, width, mode);}
    finally {await browser.close();}
  }
} finally {
  await site.close(); report.status = report.failures.length || report.cases.length !== report.planned ? 'FAIL' : 'PASS'; await save();
}
console.log(JSON.stringify({status: report.status, cases: report.cases.length, planned: report.planned, failures: report.failures}));
process.exitCode = report.status === 'PASS' ? 0 : 1;
