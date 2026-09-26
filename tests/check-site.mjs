import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const caseIds = ['multi-tenant', 'rag', 'eval', 'video', 'crm', 'skills'];
const supportingCases = ['recruitment'];
const sections = ['Problem', 'Context', 'Constraints', 'Architecture', 'Implementation', 'Demo', 'What Worked', 'What Failed', 'Lessons', 'Next Steps'];
const flagshipSections = ['Engineering Decisions', 'Tests', 'Evaluation', 'Limitations'];
const pages = ['index.html', 'projects.html', ...[...caseIds, ...supportingCases].map(id => `cases/${id}.html`)];
const failures = [];

for (const page of pages) {
  const html = readFileSync(join(root, page), 'utf8');
  for (const match of html.matchAll(/(?:href|src)="(\/[^"]+)"/g)) {
    const pathname = match[1].split(/[?#]/)[0];
    if (!pathname) continue;
    const target = join(root, pathname === '/' ? 'index.html' : pathname);
    if (!existsSync(target)) failures.push(`${page}: missing ${pathname}`);
  }
  if (!html.includes('<title>') || !html.includes('name="description"')) {
    failures.push(`${page}: missing title or description`);
  }
}

const home = readFileSync(join(root, 'index.html'), 'utf8');
const hub = readFileSync(join(root, 'projects.html'), 'utf8');
for (const id of caseIds) {
  for (const [name, text] of [['home', home], ['hub', hub]]) {
    if (!text.includes(`/cases/${id}.html`)) failures.push(`${name}: missing flagship ${id}`);
  }
}
if ((home.match(/class="flagship-card"/g) ?? []).length !== 6) failures.push('home: flagship count is not six');
if ((hub.match(/class="card"/g) ?? []).length !== 6) failures.push('hub: flagship count is not six');

for (const id of [...caseIds, ...supportingCases]) {
  const html = readFileSync(join(root, `cases/${id}.html`), 'utf8');
  for (const section of id === 'recruitment' ? sections : [...sections, ...flagshipSections]) {
    if (!html.includes(`>${section}</h2>`)) failures.push(`cases/${id}: missing ${section}`);
  }
  if (id !== 'recruitment' && (html.match(/<section aria-labelledby="s\d+">/g) ?? []).length !== 14) {
    failures.push(`cases/${id}: expected 14 engineering sections`);
  }
}

const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
for (const page of pages) {
  const url = page === 'index.html' ? 'https://zhouey314-cloud.github.io/' : `https://zhouey314-cloud.github.io/${page}`;
  if (!sitemap.includes(`<loc>${url}</loc>`)) failures.push(`sitemap: missing ${page}`);
}

if (failures.length) {
  console.error('SITE_CHECK_FAIL\n' + failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`SITE_CHECK_PASS pages=${pages.length} flagships=6 flagship_case_sections=14`);
}
