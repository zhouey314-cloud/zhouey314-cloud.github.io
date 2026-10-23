import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const data = JSON.parse(readFileSync(root + 'content/portfolio.json', 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const preview = p => `<a class="project-image" href="${escape(p.image)}" data-preview="${escape(p.image)}" data-title="${escape(p.name)}" data-caption="${escape(p.caption)}" data-case="${escape(p.case)}" aria-label="放大图片：${escape(p.name)}"><img src="${escape(p.preview || p.image)}" srcset="${escape(p.preview || p.image)} 640w, ${escape(p.image)} ${p.width}w" sizes="(max-width: 600px) calc(100vw - 40px), (max-width: 999px) calc((100vw - 92px) / 2), (max-width: 1392px) calc((100vw - 168px) / 3), 408px" alt="${escape(p.caption)}" width="${p.width}" height="${p.height}" loading="lazy" decoding="async" /><span class="image-action">放大图片 ⤢</span></a>`;
const projects = data.projects.map(p => `<li class="selected-project" data-project="${p.id}"><div class="project-topline"><span>${p.number} / ${escape(p.field)}</span><span aria-hidden="true">↗</span></div>${preview(p)}<div class="selected-copy"><p class="project-product">${escape(p.name)}</p><h3>${escape(p.headline)}</h3><p class="project-problem">${escape(p.problem)}</p><p class="project-role">${escape(p.role)}</p><div class="project-entry"><a data-entry="demo" href="${escape(p.demo)}">${escape(p.demoLabel)} ↗</a><a data-entry="code" href="${escape(p.code)}" target="_blank" rel="noopener noreferrer">源码 ↗</a><a data-entry="evidence" href="${escape(p.case)}">案例与验证 ↗</a></div><p class="project-note">${escape(p.status)}</p></div></li>`).join('\n');
const writing = data.writing.length ? data.writing.map(p => `<a class="writing-item" href="${escape(p.url)}" target="_blank" rel="noopener noreferrer"><time datetime="${escape(p.date)}">${escape(p.date)}</time><h3>${escape(p.title)} ↗</h3><p>${escape(p.takeaway)}</p></a>`).join('\n') : '<p class="writing-note">持续记录 AI 实践、项目里的问题和自己的判断。公开文章精选整理中，先从我的 X 主页开始。</p>';
const replacements = { name: escape(data.name), intro: escape(data.intro), email: escape(data.email), projects, writing };
const template = readFileSync(root + 'content/home.template.html', 'utf8');
const output = template.replace(/\{\{(\w+)\}\}/g, (_, key) => { if (!(key in replacements)) throw new Error('Unknown content key: ' + key); return replacements[key]; });
if (process.argv.includes('--check')) {
  if (readFileSync(root + 'index.html', 'utf8') !== output) throw new Error('Home is stale. Run node scripts/build-home.mjs');
} else writeFileSync(root + 'index.html', output);
