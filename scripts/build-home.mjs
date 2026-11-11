import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {buildUI} from './build-ui.mjs';
import {finalizePage} from './page-output.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const data = JSON.parse(readFileSync(root + 'content/portfolio.json', 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const checking = process.argv.includes('--check');
export const ui = await buildUI({checking});
function outputFile(path, content) {
  if (checking) {
    if (readFileSync(root + path, 'utf8') !== content) throw new Error(path + ' is stale. Run npm run build');
  } else writeFileSync(root + path, content);
}
// Preserve authored CSS order and independent, native JS closures. Fewer initial
// requests remove the parser-blocking navigation round trip without a framework.
const styles = ['tokens.css', 'style.css', 'garden.css', 'home.css', 'studio.css', 'capabilities.css', 'portrait.css', 'portfolio.css'];
const interactions = ['script.js', 'home.js', 'garden-ui.js'];
const homeCss = styles.map(path => {
  const css = readFileSync(root + path, 'utf8');
  if (/@import\b|url\(\s*['"]?(?!\/|data:|https?:|#)[^'"\s)]/i.test(css)) throw new Error(path + ': bundled CSS requires root-relative URLs and no @import');
  return `/* Source: /${path} */\n${css}\n`;
}).join('\n');
const homeJs = interactions.map(path => `/* Source: /${path} */\n${readFileSync(root + path, 'utf8')}\n;\n`).join('\n');
mkdirSync(root + 'public/site', {recursive: true});
outputFile('public/site/home.css', homeCss);
outputFile('public/site/home.js', homeJs);
const version = content => createHash('sha256').update(content).digest('hex').slice(0, 12);
const navigation = readFileSync(root + 'navigation.js', 'utf8').replace(/<\/script/gi, '<\\/script');
const homeAssets = `<script data-navigation>\n${navigation}</script>\n  <link rel="stylesheet" href="/public/site/home.css?v=${version(homeCss)}" />\n  <script src="/public/site/home.js?v=${version(homeJs)}" defer></script>\n  <script src="/forest.js?v=${version(readFileSync(root + 'forest.js', 'utf8'))}" defer></script>`;
const preview = p => `<a class="project-art" href="${escape(p.image)}" data-preview="${escape(p.image)}" data-title="${escape(p.name)}" data-caption="${escape(p.caption)}" data-case="${escape(p.case)}" aria-label="放大项目证据：${escape(p.name)}"><img src="${escape(p.preview || p.image)}" srcset="${escape(p.preview || p.image)} 640w, ${escape(p.image)} ${p.width}w" sizes="(max-width: 600px) calc(100vw - 74px), (max-width: 900px) calc(100vw - 100px), 680px" alt="${escape(p.caption)}" width="${p.width}" height="${p.height}" loading="lazy" decoding="async" /><span class="art-action">放大项目证据 ⤢</span></a>`;
const video = `<div class="project-art"><video class="garden-video" controls playsinline preload="none" poster="/public/projects/video/original-54s-poster.jpg" width="1280" height="720" aria-label="54秒原创程序动画，带中文字幕"><source src="/public/projects/video/original-54s.mp4" type="video/mp4" /><track kind="captions" src="/public/projects/video/original-54s.vtt" srclang="zh" label="可选中文字幕（原片已烧录）" /><a href="/public/projects/video/original-54s.mp4">下载54秒原创程序动画</a></video></div>`;
const boundaries = { rag: '合成资料上的词法检索与抽取式回答，未接入生成模型；范围选择不是生产身份鉴权。本地实现另见案例。', relay: '公开 fixture 是合成演示，不能证明上游真实模型身份。', video: '54 秒样片是原创程序动画，不是真人口播、数字人效果或客户商业成片。' };
const services = data.services.map(s => `<article class="capability-offer"><p class="capability-field"><span>${escape(s.number)}</span>${escape(s.field)}</p><h3>${escape(s.title)}</h3><p>${escape(s.problem)}</p><dl><dt>合适的起点</dt><dd>${escape(s.startingPoint)}</dd><dt>可以交付</dt><dd>${escape(s.deliverable)}</dd><dt>怎样验收</dt><dd>${escape(s.acceptance)}</dd></dl><div class="capability-actions"><a class="line-link" href="${escape(s.href)}">${escape(s.proof)} ↗</a><a class="line-link" href="/collaborate.html?topic=${s.topic}#brief">聊这个问题 ↗</a></div></article>`).join('\n');
const engineering = data.engineering.map(s => `<tr><th scope="row">${escape(s.area)}<span>${escape(s.stack)}</span></th><td>${escape(s.implementation)}</td><td><a href="${escape(s.href)}"${s.href.startsWith('https:') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escape(s.label)} ↗</a></td></tr>`).join('\n');
const projects = data.projects.map(p => `<article class="garden-project" data-project="${p.id}" id="project-${p.id}">${p.id === 'video' ? video : preview(p)}<div class="project-copy"><p class="project-orderline"><span>${p.number}</span><span>${escape(p.field)}</span><span class="project-state">${escape(p.status)}</span></p><p class="project-title">${escape(p.name)}</p><h3>${escape(p.headline)}</h3><p class="project-description">${escape(p.problem)}</p><p class="project-contribution"><strong>我做的部分</strong> / ${escape(p.role)}</p><dl class="project-delivery"><dt>交付内容</dt><dd>${escape(p.deliverable)}</dd></dl><ul class="project-stack" aria-label="实现技术">${p.stack.map(s => `<li>${escape(s)}</li>`).join('')}</ul><div class="project-contract"><p class="project-route">${escape(p.route)}</p><dl><dt>关键判断</dt><dd>${escape(p.decision)}</dd><dt>怎样验收</dt><dd>${escape(p.acceptance)}</dd></dl><nav class="project-proof-links" aria-label="${escape(p.name)} 的工程证据">${p.proofLinks.map(link=>`<a href="${escape(link.href)}" target="_blank" rel="noopener noreferrer">${escape(link.label)} ↗</a>`).join('')}</nav></div><div class="project-entry"><a data-entry="demo" href="${escape(p.demo)}">${escape(p.demoLabel)} ↗</a><a data-entry="code" href="${escape(p.code)}" target="_blank" rel="noopener noreferrer">源码 ↗</a><a data-entry="evidence" href="${escape(p.case)}">案例与证据 ↗</a></div><p class="project-demo-scope"><strong>在线可体验</strong> / ${escape(p.demoScope)}</p><p class="project-boundary">${escape(boundaries[p.id])}</p></div></article>`).join('\n');
const writing = data.writing.length ? data.writing.map(p => `<a class="writing-item" href="${escape(p.url)}" target="_blank" rel="noopener noreferrer"><time datetime="${escape(p.date)}">${escape(p.date)}</time><h3>${escape(p.title)} ↗</h3><p>${escape(p.takeaway)}</p></a>`).join('\n') : '<p class="writing-note">想继续认识我，可以看看 X 主页，或读读项目里的取舍与记录。</p>';
const heroNotes = {rag: '合成资料 · 词法检索演示', relay: '本地工具 · 合成 fixture', video: '54 秒原创程序动画'};
const heroLabels = {rag: '检索', relay: '链路', video: '视频'};
const heroPanel = p => `<div class="hero-project-panel" data-hero-panel="${p.id}"><a class="hero-project-image" href="${escape(p.case)}"><img src="${escape(p.preview || p.image)}" width="640" height="${Math.round(640*p.height/p.width)}" alt="${escape(p.caption)}" decoding="async" /><span aria-hidden="true">↗</span></a><div class="hero-project-copy"><p>${escape(p.name)}</p><a href="${escape(p.case)}">${escape(p.headline).replace("，", "，<br />")} <span aria-hidden="true">↗</span></a></div><p class="hero-project-note">${heroNotes[p.id]}</p></div>`;
const heroProjects = `<aside class="hero-project" aria-label="三个代表作品" data-hero-projects><p class="garden-kicker"><span data-hero-number>01</span> / SELECTED WORK</p><div class="hero-project-stage" data-hero-stage>${heroPanel(data.projects[0])}</div><div class="hero-project-switches enhanced-only" role="group" aria-label="选择代表作品">${data.projects.map((p,i)=>`<button type="button" data-hero-select="${p.id}" aria-pressed="${i===0}" aria-label="0${i+1} ${heroLabels[p.id]}：查看 ${escape(p.name)}"><span>0${i+1}</span> ${heroLabels[p.id]}</button>`).join('')}</div><p class="sr-only" role="status" data-hero-status></p>${data.projects.map(p=>`<template data-hero-template="${p.id}">${heroPanel(p)}</template>`).join('')}</aside>`;
// Paint the approved contact code directly, without a lazy image request.
const wechatQr = readFileSync(root + 'public/contact/wechat-qr.svg', 'utf8').trim()
  .replace('aria-labelledby="title desc"', 'aria-labelledby="wechat-code-title wechat-code-desc"')
  .replace('id="title"', 'id="wechat-code-title"').replace('id="desc"', 'id="wechat-code-desc"');
const topics = ['retrieval', 'workflow', 'api', 'media'];
if (data.services.length !== topics.length || data.services.some(s => !topics.includes(s.topic) || !s.startingPoint || !s.acceptance) || new Set(data.services.map(s => s.topic)).size !== topics.length) throw new Error('Cooperation scopes must match the four evidence-backed service areas');
const contactById = Object.fromEntries(data.contactLinks.map(c => [c.id, c]));
if (contactById.email.href !== 'mailto:' + data.email || !['email','wechat','github','x','telegram'].every(id => contactById[id])) throw new Error('Canonical contact channels are incomplete');
// A u.wechat.com link in an ordinary phone browser can open WeChat's generic
// website. Use a static, saveable image of the same approved code instead.
const wechatImage = '/public/contact/wechat-qr.png';
const external = c => `<a href="${escape(c.id === 'wechat' ? wechatImage : c.href)}"${c.id === 'wechat' ? ` data-wechat-profile="${escape(c.href)}"` : ''} target="_blank" rel="noopener noreferrer">${escape(c.id === 'wechat' ? '微信二维码' : c.label)} ↗</a>`;
const socialLinks = data.contactLinks.filter(c => !['email','wechat'].includes(c.id)).map(external).join('');
const contactLinks = data.contactLinks.filter(c => c.id !== 'email').map(external).join('');
const cooperationScopes = data.services.map(s => `<article class="scope-item" id="scope-${s.topic}"><p class="garden-kicker">${escape(s.number)} / ${escape(s.field)}</p><h3>${escape(s.title)}</h3><dl><dt>从这里开始</dt><dd>${escape(s.startingPoint)}</dd><dt>首轮产物</dt><dd>${escape(s.deliverable)}</dd><dt>怎样检查</dt><dd>${escape(s.acceptance)}</dd></dl><a href="${escape(s.href)}">查看对应作品与证据 ↗</a><a href="/collaborate.html?topic=${s.topic}#brief">按这个方向聊 ↘</a></article>`).join('\n');
const cooperationOptions = data.services.map(s => `<option value="${s.topic}">${escape(s.field)}</option>`).join('');
const replacements = { name: escape(data.name), intro: escape(data.intro), email: escape(data.email), services, engineering, projects, writing, heroProjects, wechatQr, wechatImage, socialLinks, contactLinks, cooperationScopes, cooperationOptions, homeAssets, wechatHref: escape(contactById.wechat.href), heroActions:ui.heroActions(), cooperationComposer:ui.island('cooperate',{services:data.services,email:data.email}), ragWorkbench:ui.island('rag'), relayWorkbench:ui.island('relay'), videoWorkbench:ui.island('video'), uiAssets:ui.assets };
for (const [source, target] of [['content/home.template.html', 'index.html'], ['content/collaborate.template.html', 'collaborate.html'], ['content/workbench.template.html','workbench.html']]) {
  const template = readFileSync(root + source, 'utf8');
  const output = template.replace(/\{\{(\w+)\}\}/g, (_, key) => { if (!(key in replacements)) throw new Error('Unknown content key: ' + key); return replacements[key]; });
  outputFile(target, finalizePage(target,output,ui,checking));
}
// Existing visitors may still cache the old CRM runtime. New markup must never
// execute that old DOM contract; preserve the legacy URLs with versioned refs.
const crmPath = 'demos/ai-crm/index.html';
let crm = readFileSync(root + crmPath, 'utf8');
for (const path of ['demos/ai-crm/style.css', 'demos/ai-crm/app.js']) {
  const reference = new RegExp(`((?:href|src)="/${path.replaceAll('.', '\\.').replaceAll('/', '\\/')})(?:\\?v=[^"\\s]*)?"`, 'g');
  if (!reference.test(crm)) throw new Error(crmPath + ': missing asset reference ' + path);
  crm = crm.replace(reference, `$1?v=${version(readFileSync(root + path, 'utf8'))}"`);
}
outputFile(crmPath, crm);
