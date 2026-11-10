// Prove that an expected missing module cannot hide an unrelated page error.
import {spawnSync} from 'node:child_process';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const repo = fileURLToPath(new URL('../', import.meta.url));
const out = resolve(process.env.FALLBACK_SELFCHECK_REPORT_DIR || 'test-results/island-fallback-selfcheck');
await mkdir(out, {recursive: true});
const cases = [];
for (const definition of [
  {name: 'pageerror', engine: 'chromium', mode: 'sheet-abort', injection: '1', reason: 'No uncaught browser errors are allowed in a handled fault case'},
  {name: 'return-console', engine: 'webkit', mode: 'return-creator', injection: 'console', reason: 'Rapid Back rejects unrelated console or island diagnostics'},
]) {
  // A negative test is meaningful only if the same unmodified case succeeds.
  const controlOut = resolve(out, definition.name + '-control');
  const control = spawnSync(process.execPath, ['tests/island-fallback.mjs'], {
    cwd: repo, encoding: 'utf8', timeout: 90000,
    env: {...process.env, SITE_DIR: process.env.SITE_DIR || 'dist', FALLBACK_ENGINES: definition.engine, FALLBACK_WIDTHS: '320',
      FALLBACK_MODES: definition.mode, FALLBACK_UNRELATED_PROBE: '', FALLBACK_REPORT_DIR: controlOut},
  });
  await writeFile(resolve(out, definition.name + '-control-stdout.txt'), control.stdout || '');
  await writeFile(resolve(out, definition.name + '-control-stderr.txt'), control.stderr || '');
  const controlReport = JSON.parse(await readFile(resolve(controlOut, 'report.json'), 'utf8'));
  const childOut = resolve(out, definition.name);
  const child = spawnSync(process.execPath, ['tests/island-fallback.mjs'], {
    cwd: repo, encoding: 'utf8', timeout: 90000,
    env: {...process.env, SITE_DIR: process.env.SITE_DIR || 'dist', FALLBACK_ENGINES: definition.engine, FALLBACK_WIDTHS: '320',
      FALLBACK_MODES: definition.mode, FALLBACK_UNRELATED_PROBE: definition.injection, FALLBACK_REPORT_DIR: childOut},
  });
  await writeFile(resolve(out, definition.name + '-stdout.txt'), child.stdout || '');
  await writeFile(resolve(out, definition.name + '-stderr.txt'), child.stderr || '');
  const report = JSON.parse(await readFile(resolve(childOut, 'report.json'), 'utf8'));
  const entry = report.cases[0];
  const probe = definition.name === 'pageerror'
    ? entry?.observed.errors.find(error => error.message === 'UNRELATED_REVIEW_PROBE')
    : entry?.observed.consoleErrors.find(error => error.message.startsWith('UNRELATED_REVIEW_PROBE:'));
  const recovered = definition.name === 'pageerror' ? entry.stateAtFailure : entry.departure?.handled[0];
  const productRecovered = definition.name === 'pageerror' ? recovered?.state === 'error' && recovered.fallbackVisible : recovered?.rootState === 'error' && recovered.fallbackVisible;
  const correctRejection = control.status === 0 && controlReport.status === 'PASS' && controlReport.cases.length === 1 && child.status === 1 && report.cases.length === 1 && entry.status === 'FAIL' && entry.error.includes(definition.reason) && probe && productRecovered;
  cases.push({name: definition.name, status: correctRejection ? 'PASS' : 'FAIL', controlExit: control.status, controlReport: resolve(controlOut, 'report.json'), childExit: child.status, childSignal: child.signal,
    childReport: resolve(childOut, 'report.json'), originalProbe: probe, productFallback: recovered, childFailure: entry.error});
}
const summary = {status: cases.every(entry => entry.status === 'PASS') ? 'PASS' : 'FAIL',
  expected: 'Unrelated pageerror and lookalike console errors reject their fault/navigation case even though the product fallback recovered', cases};
await writeFile(resolve(out, 'report.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({status: summary.status, rejected: cases.map(entry => ({name: entry.name, childExit: entry.childExit, status: entry.status}))}));
process.exitCode = summary.status === 'PASS' ? 0 : 1;
