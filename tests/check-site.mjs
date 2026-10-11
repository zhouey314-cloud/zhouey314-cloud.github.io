import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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
      /\balt="[^"]+"/.test(match[0]),
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
  (hub.match(/data-flagship/g) || []).length === 6,
  "archive: preserve six flagship entries",
);
assert(
  (hub.match(/data-category=/g) || []).length === 16,
  "archive: preserve sixteen public entries",
);
assert(
  home.includes(`浏览全部 ${baselineProjects.length} 个公开项目`),
  "home: public project total must match the full archive",
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
  "线上词面",
  "合成数据",
  "角色选择器",
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
if (failures.length) {
  console.error("SITE_CHECK_FAIL\n" + failures.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `SITE_CHECK_PASS pages=${pages.length} cases=${caseIds.length} archived_projects=16 flagships=6 legacy_fragments=94 contacts=6`,
  );
