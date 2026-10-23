// Rebuild the 1200×630 sharing image from local text and the existing geometry.
// Uses the locked Playwright dependency and system fonts; no network or model.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = new URL('../', import.meta.url);
const content = JSON.parse(await readFile(new URL('content/portfolio.json', root), 'utf8'));
const geometry = (await readFile(new URL('public/field-form.svg', root), 'utf8'))
  .replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>.*?<\/title>/, '');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">
<title id="title">${escape(content.name)} · 把实际需求，做成能运行的 AI 应用</title>
<desc id="desc">编导生转 AI；企业知识检索、内容生产工作流与 AI 工具。文字与原创线框分享封面，不是项目运行截图。</desc>
<rect width="1200" height="630" fill="#f3f3ec"/><rect x="880" width="320" height="630" fill="#171b18"/>
<g font-family="Arial,PingFang SC,Microsoft YaHei,sans-serif" fill="#171b18">
<text x="56" y="74" font-size="34" font-weight="700">${escape(content.name)}</text>
<text x="56" y="115" font-size="19" fill="#5d6459">编导生转 AI · 在企业场景里参与 AI 与 GEO 实践</text>
<path d="M56 145H824" stroke="#cbd1c2"/>
<text x="52" y="244" font-size="62" font-weight="700">把实际需求，</text>
<text x="52" y="329" font-size="62" font-weight="700">做成能运行的</text>
<text x="52" y="414" font-size="62" font-weight="700">AI 应用。</text>
<path d="M56 435H345" stroke="#9eb72e" stroke-width="5"/>
<text x="56" y="510" font-size="23" font-weight="700">企业知识检索 / 内容生产工作流 / AI 工具</text>
<text x="56" y="570" font-size="18" fill="#5d6459">zhouey314-cloud.github.io</text>
<text x="916" y="72" font-size="13" fill="#c2d1ac">SELECTED WORK / 2026</text>
</g>
<g transform="translate(900 85) scale(.5)">${geometry}</g>
<g font-family="Arial,PingFang SC,Microsoft YaHei,sans-serif" font-size="48" font-weight="700">
<text x="916" y="403" fill="#d6fa58">作品</text><text x="916" y="474" fill="#edf0e6">过程</text><text x="916" y="545" fill="#edf0e6">证据</text>
</g></svg>`;
await writeFile(new URL('public/og-image.svg', root), svg + '\n');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<html><meta charset="utf-8"><style>html,body{margin:0;width:1200px;height:630px;overflow:hidden}svg{display:block}</style>${svg}</html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: fileURLToPath(new URL('public/social-preview.png', root)) });
  console.log('Exported public/og-image.svg and public/social-preview.png (1200×630).');
} finally { await browser.close(); }
