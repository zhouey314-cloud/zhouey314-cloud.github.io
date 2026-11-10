import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
const root = fileURLToPath(new URL("../", import.meta.url));
const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};
const localCaseIds = ["creator-studio", "local-tingwu"];
const caseIds = [
  "multi-tenant",
  "rag",
  "eval",
  "video",
  "crm",
  "skills",
  "recruitment",
  "thought-to-x",
  "relay-audit",
  "voice-clone-video",
  ...localCaseIds,
];
// These seven pre-existing cases own the old deep links; new case studies do
// not need invented s0..s13 anchors to satisfy the compatibility contract.
const legacyFragmentCounts = new Map([
  ["multi-tenant", 14], ["rag", 14], ["eval", 14], ["video", 14],
  ["crm", 14], ["skills", 14], ["recruitment", 10],
]);
const legacyFragmentCount = [...legacyFragmentCounts.values()].reduce((sum, count) => sum + count, 0);
const pages = [
  "index.html",
  "projects.html",
  "resume.html",
  "404.html",
  "workbench.html",
  "collaborate.html",
  ...caseIds.map((id) => `cases/${id}.html`),
];
const hub = readFileSync(join(root, "projects.html"), "utf8");
const home = readFileSync(join(root, "index.html"), "utf8");
const collaboration = readFileSync(join(root, "collaborate.html"), "utf8");
const content = JSON.parse(readFileSync(join(root, "content/portfolio.json"), "utf8"));
for (const contact of content.contactLinks) {
  assert(home.includes(contact.href), `home: canonical ${contact.id} contact missing`);
  assert(collaboration.includes(contact.href), `collaboration: canonical ${contact.id} contact missing`);
}
const resumeManifest = JSON.parse(readFileSync(join(root, "public/ethan-zhou-resume.meta.json"), "utf8"));
for (const [field, file] of [["source_sha256", "resume.html"], ["pdf_sha256", "public/ethan-zhou-resume.pdf"]])
  assert(resumeManifest[field] === createHash("sha256").update(readFileSync(join(root, file))).digest("hex"), `resume: ${file} no longer matches its verified PDF export; rerun scripts/export-resume.py`);
// MP4 metadata must precede media data so a cold visitor can initialize the
// player without fetching the tail first. Browser checks still verify playback.
try {
  const video = readFileSync(join(root, "public/projects/video/original-54s.mp4"));
  const atoms = [];
  let offset = 0;
  while (offset < video.length) {
    if (video.length - offset < 8) throw Error("truncated box header");
    let size = video.readUInt32BE(offset);
    let header = 8;
    if (size === 1) {
      if (video.length - offset < 16) throw Error("truncated extended box header");
      size = Number(video.readBigUInt64BE(offset + 8));
      header = 16;
    } else if (size === 0) size = video.length - offset;
    if (!Number.isSafeInteger(size) || size < header || size > video.length - offset)
      throw Error("invalid box size");
    atoms.push({ type: video.toString("ascii", offset + 4, offset + 8), offset });
    offset += size;
  }
  const moov = atoms.find(box => box.type === "moov");
  const mdat = atoms.find(box => box.type === "mdat");
  assert(moov && mdat && moov.offset < mdat.offset, "video: MP4 must have faststart metadata before media data");
} catch (error) {
  assert(false, `video: invalid MP4 container: ${error.message}`);
}
const baselineProjects = [
  "Multi-Tenant Workflow",
  "Enterprise RAG Starter",
  "AI Eval Engineering",
  "AI Video Workflow Engine",
  "AI CRM Sales Copilot",
  "Portable Agent Skills",
  "Recruitment Review",
  "Thought to X",
  "Obsidian AI Inbox",
  "NovaMach",
  "AI Director",
  "Agentic Coding Starter",
  "AI Delivery Starter Kit",
  "AI Content Workflow",
  "RelayAudit / AgentGuard",
  "Voice Clone Video",
];
const sections = ["what", "result", "build", "decision", "limits", "deep"];
const sectionText = (html, id) => (html.match(new RegExp(`<section\\b[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)<\\/section>`))?.[1] || "")
  .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
function targetFor(href, page) {
  const url = new URL(href, `https://portfolio.local/${page}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith("/")) pathname += "index.html";
  return { path: join(root, pathname), hash: url.hash.slice(1) };
}
for (const page of pages) {
  const html = readFileSync(join(root, page), "utf8");
  assert(
    !/中原工学院|广播电视编导|编导背景|教育背景|本科在读/.test(html),
    `${page}: public presentation must focus on practice, without school or major`,
  );
  assert(html.includes('lang="zh-CN"'), `${page}: missing page language`);
  assert(
    html.includes("<title>") && html.includes('name="description"'),
    `${page}: missing metadata`,
  );
  assert(
    html.includes('property="og:image"') && html.includes('rel="canonical"'),
    `${page}: missing social/canonical metadata`,
  );
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((x) => x[1]);
  assert(new Set(ids).size === ids.length, `${page}: duplicate ids`);
  assert((html.match(/<h1\b/g) || []).length === 1, `${page}: expected one h1`);
  const profile=html.match(/href="\/(public\/site\/page-[a-f0-9]{12}\.css)"/);
  const shared=profile&&existsSync(join(root,profile[1]))?readFileSync(join(root,profile[1]),'utf8'):'';
  assert((shared.includes('/* tokens.css */')&&shared.includes('/* style.css */'))||
    (page==='index.html'&&html.includes('href="/public/site/home.css?v=')),`${page}: missing verified shared style profile`);
  assert(
    !/enhancements\.css|portfolio-v2\.css/.test(html),
    `${page}: legacy style cascade retained`,
  );
  for (const match of html.matchAll(/(?:href|src)="([^"<>]+)"/g)) {
    const href = match[1];
    if (/^(https?:|mailto:|tel:|data:)/.test(href)) continue;
    const target = targetFor(href, page);
    assert(existsSync(target.path), `${page}: missing local target ${href}`);
    if (
      target.hash &&
      existsSync(target.path) &&
      target.path.endsWith(".html")
    ) {
      const dest = readFileSync(target.path, "utf8");
      assert(
        dest.includes(`id="${target.hash}"`),
        `${page}: missing anchor ${href}`,
      );
    }
  }
  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\bsrc=/.test(match[0])) continue; // Empty modal media is populated and checked by browser QA.
    assert(
      /\balt="[^"]+"/.test(match[0]) || (/\balt=""/.test(match[0]) && /aria-hidden="true"|role="presentation"/.test(match[0])),
      `${page}: image missing meaningful alt`,
    );
    assert(
      /\bwidth="\d+"/.test(match[0]) && /\bheight="\d+"/.test(match[0]),
      `${page}: image missing dimensions`,
    );
  }
  assert(
    !/<a\b[^>]*>\s*<button\b/.test(html),
    `${page}: nested interactive control`,
  );
}
assert(
  home.includes('id="building-now"') || hub.includes('id="building-now"'),
  "missing work-in-progress section",
);
for (const name of baselineProjects)
  assert(
    hub.includes(`data-project-name="${name}"`),
    `archive: missing original project ${name}`,
  );
assert(
  (hub.match(/data-flagship/g) || []).length === 3,
  "archive: three primary evidence projects",
);
assert(
  (hub.match(/data-category=/g) || []).length === 16,
  "archive: preserve sixteen public entries",
);
assert(
  home.includes(`浏览全部 ${baselineProjects.length} 个公开项目`),
  "home: public project total must match the full archive",
);
// The homepage promises concrete work before the longer practice narrative.
const readingOrder = ["top", "work", "practice", "about", "contact"];
const positions = readingOrder.map((id) => home.indexOf(`id="${id}"`));
assert(
  positions.every((position, index) => position >= 0 && (index === 0 || position > positions[index - 1])),
  "home: identity → representative work → practice → about → contact reading path",
);
assert(
  ["rag", "relay", "video"].every(id => home.includes(`data-project="${id}"`)) &&
    home.includes('data-forest-mount') && home.includes('forest-desktop.webp'),
  "home: three real projects plus forest fallback must exist before JavaScript",
);
assert(
  home.includes("自 2026 年 6 月参与企业 GEO 与 AI 应用实践") && home.includes("恩宇") && home.includes("向 FDE 方向发展"),
  "home: preserve verified identity and directional FDE positioning",
);
assert(
  home.includes("需求拆解 / 实现与验证") && home.includes("代码、测试与运行说明"),
  "home: describe concrete delivery practices in place of academic background",
);
assert(
  !/中原工学院|广播电视编导|编导生|从编导/.test(readFileSync(join(root, "public/og-image.svg"), "utf8")),
  "sharing image: omit school and major from visible text and accessible description",
);
assert(
  (hub.match(/class="active-build"/g) || []).length === 2,
  "archive: list the two verified personal work-in-progress projects",
);
for (const name of ["Ethan Creator Studio / EthanCut", "录音转写与摘要工作台"])
  assert(hub.includes(`<h3>${name}</h3>`), `missing in-progress project ${name}`);
const activeBuilds = [...hub.matchAll(/<article\b[^>]*class="active-build"[^>]*>([\s\S]*?)<\/article>/g)].map(match => match[0]);
assert(activeBuilds.every(card => !/黑客松/.test(card)), "archive: exclude hackathon entries without personal contribution from personal projects");
for (const id of localCaseIds) {
  const card = activeBuilds.find(html => html.includes(`href="/cases/${id}.html"`));
  assert(card && /本地|本机/.test(card), `archive: local case ${id} needs a real link within a local work-in-progress entry`);
  assert(!/\bdata-category=/.test(card || ""), `archive: local case ${id} must not be counted as a public repository`);
}
for (const id of caseIds)
  assert(hub.includes(`/cases/${id}.html`), `archive: missing case ${id}`);
for (const id of caseIds)
  assert(/href="\/collaborate\.html\?topic=(retrieval|workflow|api|media|other)#brief"/.test(readFileSync(join(root, `cases/${id}.html`), "utf8")), `case ${id}: missing contextual cooperation path`);
for (const id of [
  "thought-to-x",
  "rag",
  "multi-tenant",
  "relay-audit",
  "voice-clone-video",
])
  assert(home.includes(`/cases/${id}.html`), `home: missing selected ${id}`);
for (const contact of [
  "mailto:zhouey314@gmail.com",
  "https://t.me/ethanyu520",
  "https://x.com/UPing123zzz",
  "https://github.com/zhouey314-cloud",
  "/public/contact/wechat-qr.svg",
  "https://u.wechat.com/MJNJhDRZFiAFKD09uKIRGvM?s=3",
])
  assert(home.includes(contact), `home: missing current contact ${contact}`);
for (const text of [
  "合成资料",
  "未接入生成模型",
  "范围选择不是生产身份鉴权",
  "不能证明上游真实模型身份",
  "原创程序动画",
  "不自动发帖",
  "非实时模型运行",
])
  assert(home.includes(text), `home: missing evidence boundary ${text}`);
for (const id of caseIds) {
  const html = readFileSync(join(root, `cases/${id}.html`), "utf8");
  for (const section of sections)
    assert(
      html.includes(`class="case-section" id="${section}"`),
      `case ${id}: missing narrative section ${section}`,
    );
  for (let n = 0; n < (legacyFragmentCounts.get(id) || 0); n++)
    assert(
      html.includes(`id="s${n}"`),
      `case ${id}: missing preserved fragment s${n}`,
    );
  if (localCaseIds.includes(id)) {
    const url = `https://zhouey314-cloud.github.io/cases/${id}.html`;
    assert(new RegExp(`<link\\b[^>]*rel="canonical"[^>]*href="${url.replaceAll(".", "\\.")}"`).test(html), `case ${id}: canonical must identify this case`);
    assert(new RegExp(`<meta\\b[^>]*property="og:url"[^>]*content="${url.replaceAll(".", "\\.")}"`).test(html), `case ${id}: social URL must identify this case`);
    const scope = sectionText(html, "what") + " " + sectionText(html, "result");
    assert(/本地|本机/.test(scope) && /原型|工具|工作台/.test(scope), `case ${id}: explain the local prototype/tool scope in the narrative`);
    const limits = sectionText(html, "limits");
    assert(/尚未|还未|未完成|未通过|未验收|待|仍需|需要/.test(limits) && /验收|复核|核对|验证/.test(limits), `case ${id}: preserve pending acceptance or human-review boundaries`);
    assert(html.includes('href="/projects.html"'), `case ${id}: missing return path to the archive`);
  }
}
const sitemap = readFileSync(join(root, "sitemap.xml"), "utf8");
for (const page of pages.filter((p) => p !== "404.html"))
  assert(
    sitemap.includes(
      `<loc>https://zhouey314-cloud.github.io/${page === "index.html" ? "" : page}</loc>`,
    ),
    `sitemap missing ${page}`,
  );
assert(
  existsSync(join(root, "demos/ai-crm/index.html")),
  "legacy CRM demo removed",
);
assert(
  existsSync(join(root, "public/licenses/thought-to-x-MIT.txt")),
  "Thought example MIT notice missing",
);
assert(!existsSync(join(root, "CNAME")), "unexpected domain migration");
for (const [file, hash] of [
  ["public/vendor/threejs/r149/three.min.js", "8a5f7249903b54d30f79f708699d2fed2d6a1d0741a4cd41377d1f01bb5a2271"],
  ["public/vendor/fuse/fuse.js", "8d0ff71fbe94cadc319be0c559c64fe7ce2754afe47c9f0a67579d4112c6b62b"],
  ["public/workbench/rag.js", "1ba20ecf72a2c939c76cc806186e1ca6ae9d5d221429e42e50fa788c91f31910"],
  ["public/workbench/documents.json", "0f1d7eeb0ef8568e55287e48205975c8dfb9a6059f6a7c8f050b3653f84ab204"],
  ["public/fonts/lexend-latin.woff2", "1ec8f6ee2750554b4bc59ff0b507d316a82a7ba37e0e5bebc41d3bd9b9faad46"],
]) assert(createHash("sha256").update(readFileSync(join(root,file))).digest("hex") === hash, `pinned authored runtime/font changed: ${file}`);
for (const file of ["public/vendor/threeui/LICENSE", "public/vendor/threejs/r149/LICENSE", "public/fonts/Lexend-OFL.txt", "public/scenes/sylva/capture.json"])
  assert(existsSync(join(root,file)), `source/license provenance missing: ${file}`);
if (failures.length) {
  console.error("SITE_CHECK_FAIL\n" + failures.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `SITE_CHECK_PASS pages=${pages.length} cases=${caseIds.length} archived_projects=16 primary_flagships=3 legacy_fragments=${legacyFragmentCount} contacts=6`,
  );
