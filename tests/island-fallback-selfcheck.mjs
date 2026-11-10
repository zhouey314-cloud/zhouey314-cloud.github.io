// Prove that an expected missing module cannot hide an unrelated page error.
import {spawnSync} from 'node:child_process';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const repo = fileURLToPath(new URL('../', import.meta.url));
const out = resolve(process.env.FALLBACK_SELFCHECK_REPORT_DIR || 'test-results/island-fallback-selfcheck');
await mkdir(out, {recursive: true});
const childOut = resolve(out, 'injected-failure');
const child = spawnSync(process.execPath, ['tests/island-fallback.mjs'], {
  cwd: repo, encoding: 'utf8', timeout: 90000,
  env: {...process.env, SITE_DIR: process.env.SITE_DIR || 'dist', FALLBACK_ENGINES: 'chromium', FALLBACK_WIDTHS: '320',
    FALLBACK_MODES: 'sheet-abort', FALLBACK_UNRELATED_PROBE: '1', FALLBACK_REPORT_DIR: childOut},
});
await writeFile(resolve(out, 'stdout.txt'), child.stdout || '');
await writeFile(resolve(out, 'stderr.txt'), child.stderr || '');
const report = JSON.parse(await readFile(resolve(childOut, 'report.json'), 'utf8'));
const entry = report.cases[0];
const probe = entry?.observed.errors.find(error => error.message === 'UNRELATED_REVIEW_PROBE');
const correctRejection = child.status === 1 && report.cases.length === 1 && entry.status === 'FAIL' &&
  entry.error.includes('No uncaught browser errors are allowed in a handled fault case') && probe &&
  entry.stateAtFailure?.state === 'error' && entry.stateAtFailure?.fallbackVisible;
const summary = {status: correctRejection ? 'PASS' : 'FAIL', expected: 'Unrelated pageerror rejects the fault case even though its SSR fallback recovered',
  childExit: child.status, childSignal: child.signal, childReport: resolve(childOut, 'report.json'),
  originalProbe: probe, productFallback: entry.stateAtFailure, childFailure: entry.error};
await writeFile(resolve(out, 'report.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({status: summary.status, childExit: child.status, rejectedUnrelatedError: Boolean(correctRejection)}));
process.exitCode = correctRejection ? 0 : 1;
