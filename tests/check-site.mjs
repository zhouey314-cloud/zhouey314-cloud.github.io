import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
const root = fileURLToPath(new URL("../", import.meta.url));
const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};
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
];
const pages = [
  "index.html",
  "projects.html",
  "resume.html",
  "404.html",
  ...caseIds.map((id) => `cases/${id}.html`),
];
const hub = readFileSync(join(root, "projects.html"), "utf8");
const home = readFileSync(join(root, "index.html"), "utf8");
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
function targetFor(href, page) {
  const url = new URL(href, `https://portfolio.local/${page}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith("/")) pathname += "index.html";
  return { path: join(root, pathname), hash: url.hash.slice(1) };
}
for (const page of pages) {
  const html = readFileSync(join(root, page), "utf8");
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
  assert(
    html.includes('href="/tokens.css"') && html.includes('href="/style.css"'),
    `${page}: missing shared styles`,
  );
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
  home.includes("广播电视编导专业在读") && home.includes("周恩宇") && home.includes("向 FDE 方向发展"),
  "home: preserve verified identity and directional FDE positioning",
);
assert(
  (hub.match(/class="active-build"/g) || []).length === 3,
  "archive: preserve three separately listed work-in-progress projects",
);
for (const name of ["黑客松项目", "Ethan Creator Studio / EthanCut", "录音转写与摘要工作台"])
  assert(hub.includes(`<h3>${name}</h3>`), `missing in-progress project ${name}`);
for (const id of caseIds)
  assert(hub.includes(`/cases/${id}.html`), `archive: missing case ${id}`);
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
  if (!["thought-to-x", "relay-audit", "voice-clone-video"].includes(id))
    for (let n = 0; n < (id === "recruitment" ? 10 : 14); n++)
      assert(
        html.includes(`id="s${n}"`),
        `case ${id}: missing preserved fragment s${n}`,
      );
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
  ["public/fonts/lexend-latin.woff2", "1ec8f6ee2750554b4bc59ff0b507d316a82a7ba37e0e5bebc41d3bd9b9faad46"],
]) assert(createHash("sha256").update(readFileSync(join(root,file))).digest("hex") === hash, `pinned authored runtime/font changed: ${file}`);
for (const file of ["public/vendor/threeui/LICENSE", "public/vendor/threejs/r149/LICENSE", "public/fonts/Lexend-OFL.txt", "public/scenes/sylva/capture.json"])
  assert(existsSync(join(root,file)), `source/license provenance missing: ${file}`);
if (failures.length) {
  console.error("SITE_CHECK_FAIL\n" + failures.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `SITE_CHECK_PASS pages=${pages.length} cases=${caseIds.length} archived_projects=16 primary_flagships=3 legacy_fragments=94 contacts=6`,
  );
