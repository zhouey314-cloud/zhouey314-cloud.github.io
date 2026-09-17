const projects = {
  geo: {
    kicker: "PROJECT 01 · PARTICIPATED PROJECT",
    title: "GEO 多渠道信源分发 / SaaS 项目",
    summary: "企业做 GEO 时，AI 可见度诊断、意图词、知识、内容生产、渠道分发、门店协同和数据查看，容易散落在多个流程中。",
    truth: ["PARTICIPATED PROJECT", "REDACTED", "NO CLIENT DATA"],
    details: [
      ["PROBLEM", "多个模块彼此割裂，会让内容生产、分发、协同和结果查看难以形成可追踪的工作流。"],
      ["MY ROLE", "参与产品技术实现、AI Coding、部分 Skill / Workflow、页面功能、验证、测试和交付整理；不是独立完成整个项目。"],
      ["WHAT I BUILT", "参与部分页面与流程实现，协助把模块连接成可演示、可验证的产品路径，并整理测试与交付材料。"],
      ["WHAT I LEARNED", "在多人项目里，最难的不是多做几个页面，而是把自己的责任边界、前后端状态和验收证据对齐。一次流程只有在错误状态、人工回执和交接材料都能被检查时，才接近可交付。"],
      ["CURRENT STATUS", "参与项目。公开内容来自本地验收记录，并经过裁切和遮罩；具体功能仍以项目现状与后续人工确认为准。"],
      ["BOUNDARY", "不公开客户名称、客户数据、门店信息、内部 URL、账号或企业内部资料。"],
    ],
    images: [
      { src: "/public/projects/geo/geo-generation-flow.webp", caption: "内容生成流程与候选记录 · 经裁切脱敏", statusLabel: "PARTICIPATED PROJECT · REDACTED", sourceType: "LOCAL ACCEPTANCE CAPTURE", redacted: true },
      { src: "/public/projects/geo/geo-knowledge-scope.webp", caption: "知识继承与作用域结构 · 标识已遮罩", statusLabel: "PARTICIPATED PROJECT · REDACTED", sourceType: "LOCAL ACCEPTANCE CAPTURE", redacted: true },
      { src: "/public/projects/geo/geo-publish-handoff.webp", caption: "四路内容与人工发布回执流程 · 经裁切脱敏", statusLabel: "PARTICIPATED PROJECT · REDACTED", sourceType: "LOCAL ACCEPTANCE CAPTURE", redacted: true },
    ],
  },
  crm: {
    kicker: "PROJECT 02 · SELF-BUILT DEMO",
    title: "AI CRM 智能销售系统",
    summary: "围绕销售流程重新自建的一套可运行 Demo，用来验证从客户与商机，到报价、合同、履约、分析和 AI 助手的产品结构。所有记录均为演示数据。",
    truth: ["SELF-BUILT DEMO", "SAMPLE DATA", "NOT CUSTOMER RESULTS"],
    details: [
      ["PROBLEM", "销售流程常被拆在表格、聊天和多个工具里，状态、负责人、下一步动作与预测缺少一致视图。"],
      ["MY ROLE", "独立完成 Demo 的产品拆解、信息架构、前端界面、交互流程、示例数据和本地交付整理。"],
      ["WHAT I BUILT", "Dashboard、Pipeline、Opportunity、Quotation、Contract、Delivery、Analytics、AI Assistant 与 Forecast 等演示模块。"],
      ["WHAT I LEARNED", "B 端界面的可信感来自状态之间的关系，不来自更多 KPI 卡片。重做后，我把重点放在记录、阶段、责任人和下一步动作；也更清楚 Demo 只能证明交互和结构，不能代替真实权限、数据和集成。"],
      ["CURRENT STATUS", "可运行的自建演示版本，用于展示产品结构与关键交互，不代表真实客户系统。"],
      ["BOUNDARY", "页面中的金额、百分比、客户名和预测全部是 Sample Data，不是商业业绩或真实客户数据。"],
    ],
    demoUrl: "/demos/ai-crm/",
    images: [
      { src: "/public/projects/crm/crm-dashboard.webp", caption: "Dashboard 与待办总览 · Sample Data", statusLabel: "SELF-BUILT DEMO · SAMPLE DATA", sourceType: "RUNNING DEMO CAPTURE", redacted: false },
      { src: "/public/projects/crm/crm-pipeline.webp", caption: "Pipeline 阶段与下一步动作 · Sample Data", statusLabel: "SELF-BUILT DEMO · SAMPLE DATA", sourceType: "RUNNING DEMO CAPTURE", redacted: false },
      { src: "/public/projects/crm/crm-opportunity.webp", caption: "Opportunity 记录表 · Sample Data", statusLabel: "SELF-BUILT DEMO · SAMPLE DATA", sourceType: "RUNNING DEMO CAPTURE", redacted: false },
      { src: "/public/projects/crm/crm-ai-assistant.webp", caption: "AI Assistant 与人工复核边界 · Demo", statusLabel: "SELF-BUILT DEMO · SAMPLE DATA", sourceType: "RUNNING DEMO CAPTURE", redacted: false },
      { src: "/public/projects/crm/crm-mobile.webp", caption: "移动端 Dashboard · Sample Data", statusLabel: "SELF-BUILT DEMO · SAMPLE DATA", sourceType: "RUNNING DEMO CAPTURE", redacted: false },
    ],
  },
  novamach: {
    kicker: "PROJECT 03 · SELF-BUILT DEMO",
    title: "NovaMach B2B Multilingual Website",
    summary: "为虚构工业品牌制作的完整 B2B 网站 Demo，重点验证品牌表达、产品目录、深层路由、多语言、移动端、RFQ 与后台演示的整体产品路径。",
    truth: ["SELF-BUILT DEMO", "FICTIONAL BRAND", "DEMO DATA"],
    details: [
      ["PROBLEM", "B2B 网站不只是一个首页；产品发现、详情路径、语言切换、询盘提交和内容管理必须形成完整体验。"],
      ["MY ROLE", "独立完成需求拆解、信息架构、视觉与前端实现、响应式、多语言路由、RFQ 流程、Admin Demo、测试与交接。"],
      ["WHAT I BUILT", "Brand、Product Catalog、Deep Routes、Multilingual、Responsive、RFQ 与 Admin Demo。"],
      ["WHAT I LEARNED", "多语言、移动端、深层产品路由和 RFQ 不是首页做完就自动成立。每条路径都要实际切换、提交和回看；展示 Demo 与真实 CMS、数据库和业务接入也必须明确分开。"],
      ["CURRENT STATUS", "可运行的自建演示网站，用于展示从需求到交接的一整套产品实现能力。"],
      ["BOUNDARY", "NovaMach 是虚构品牌，产品、询盘、后台与全部业务数据均为 Demo Data。"],
    ],
    images: [
      { src: "/public/projects/novamach/novamach-home.webp", caption: "NovaMach 首页 · Fictional Brand", statusLabel: "SELF-BUILT DEMO · FICTIONAL BRAND", sourceType: "RUNNING DEMO CAPTURE", redacted: false },
      { src: "/public/projects/novamach/novamach-product.webp", caption: "产品目录与详情路径 · Demo Data", statusLabel: "SELF-BUILT DEMO · FICTIONAL BRAND", sourceType: "RUNNING DEMO CAPTURE", redacted: false },
      { src: "/public/projects/novamach/novamach-admin.webp", caption: "Admin Demo · Demo Data", statusLabel: "SELF-BUILT DEMO · FICTIONAL BRAND", sourceType: "RUNNING DEMO CAPTURE", redacted: false },
    ],
  },
};

const writingItems = [
  {
    title: "刚刚，我彻底卸载了剪映，这辈子不会再给它充一分钱了",
    excerpt: "一次 ChatCut 与 Codex Skill 的公开实测：从操作软件转向把意图交给 Agent。",
    href: "https://x.com/UPing123zzz/status/2076191291822805260",
    publishedAt: "2026-07-12", views: 431464, likes: 4722, reposts: 974, capturedAt: "2026-09-15", category: "AI / AGENT",
  },
  {
    title: "什么是 Eval？为什么它决定了 AI 项目能不能真正落地",
    excerpt: "从“能生成”走向“可验收”：为什么 AI 项目需要基线、评估标准和回归检查。",
    href: "https://x.com/UPing123zzz/status/2093183040952623415",
    publishedAt: "2026-08-28", views: 30547, likes: 293, reposts: 76, capturedAt: "2026-09-15", category: "EVAL / DELIVERY",
  },
  {
    title: "我把 Eval 装进 Codex 后，AI Coding 的工作方式变了",
    excerpt: "把评估放进工作流之后，AI Coding 不再只看代码是否跑通，而是持续检查行为有没有退化。",
    href: "https://x.com/UPing123zzz/status/2093371727611105362",
    publishedAt: "2026-08-29", views: 18534, likes: 143, reposts: 28, capturedAt: "2026-09-15", category: "AI CODING / EVAL",
  },
];

const header = document.querySelector("[data-header]");
const menuButton = document.querySelector("[data-menu-button]");
const nav = document.querySelector("[data-nav]");
const projectDialog = document.querySelector("[data-project-dialog]");
const dialogContent = document.querySelector("[data-dialog-content]");
const lightbox = document.querySelector("[data-lightbox]");
let activeImages = [];
let activeIndex = 0;
let lastProjectTrigger = null;

const compactNumber = (value) => value >= 1000 ? `${(value / 1000).toFixed(value >= 100000 ? 0 : 1).replace(".0", "")}K` : String(value);
document.querySelector("#writing-list").innerHTML = writingItems.map((item) => `
  <a class="writing-card reveal" href="${item.href}" target="_blank" rel="noopener noreferrer">
    <span>${item.category}</span><h3>${item.title}</h3><p>${item.excerpt}</p>
    <div class="writing-proof"><b>${compactNumber(item.views)} Views</b><b>${compactNumber(item.likes)} Likes</b><b>${compactNumber(item.reposts)} Reposts</b></div>
    <time datetime="${item.publishedAt}">X snapshot · ${item.capturedAt}</time>
  </a>`).join("");

const closeMenu = () => {
  nav.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "打开导航");
};

menuButton.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "关闭导航" : "打开导航");
});
nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 24), { passive: true });

const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    }), { threshold: 0.08 })
  : null;
document.querySelectorAll(".reveal").forEach((item) => revealObserver ? revealObserver.observe(item) : item.classList.add("visible"));

function openProject(key) {
  const project = projects[key];
  lastProjectTrigger = document.activeElement;
  activeImages = project.images;
  dialogContent.innerHTML = `
    <div class="dialog-content">
      <p class="dialog-kicker">${project.kicker}</p>
      <h3 class="dialog-title" id="dialog-title">${project.title}</h3>
      <p class="dialog-summary">${project.summary}</p>
      <div class="detail-grid">${project.details.map(([heading, copy]) => `<section class="detail"><h4>${heading}</h4><p>${copy}</p></section>`).join("")}</div>
      <div class="dialog-proof">${project.truth.map((item) => `<span>${item}</span>`).join("")}</div>
      ${project.demoUrl ? `<a class="button primary demo-link" href="${project.demoUrl}" target="_blank" rel="noopener">Open Demo <span>↗</span></a>` : ""}
      <div class="gallery">${project.images.map((image, index) => `<button class="gallery-button" type="button" data-gallery-index="${index}" aria-label="放大查看：${image.caption}"><img src="${image.src}" alt="${image.caption}" width="1600" height="900" loading="lazy"><span>${image.caption} ↗</span><small>${image.sourceType}${image.redacted ? " · REDACTED" : ""}</small></button>`).join("")}</div>
    </div>`;
  dialogContent.querySelectorAll("[data-gallery-index]").forEach((button) => button.addEventListener("click", () => openLightbox(Number(button.dataset.galleryIndex), project.truth.join(" · "))));
  projectDialog.showModal();
  document.body.style.overflow = "hidden";
}

function closeProject() {
  projectDialog.close();
  document.body.style.overflow = "";
  if (lastProjectTrigger instanceof HTMLElement) lastProjectTrigger.focus();
}

function renderLightbox(truth) {
  const image = activeImages[activeIndex];
  lightbox.querySelector("[data-lightbox-image]").src = image.src;
  lightbox.querySelector("[data-lightbox-image]").alt = image.caption;
  lightbox.querySelector("[data-lightbox-caption]").textContent = image.caption;
  lightbox.querySelector("[data-lightbox-truth]").textContent = `${image.statusLabel} · ${image.sourceType}`;
  lightbox.querySelector("[data-lightbox-count]").textContent = `${activeIndex + 1} / ${activeImages.length}`;
}

function openLightbox(index, truth) {
  activeIndex = index;
  renderLightbox(truth);
  lightbox.dataset.truth = truth;
  lightbox.showModal();
}

function moveLightbox(step) {
  activeIndex = (activeIndex + step + activeImages.length) % activeImages.length;
  renderLightbox(lightbox.dataset.truth);
}

document.querySelectorAll("[data-project]").forEach((card) => {
  card.addEventListener("click", () => openProject(card.dataset.project));
});
document.querySelector("[data-dialog-close]").addEventListener("click", closeProject);
document.querySelector("[data-lightbox-close]").addEventListener("click", () => lightbox.close());
document.querySelector("[data-lightbox-prev]").addEventListener("click", () => moveLightbox(-1));
document.querySelector("[data-lightbox-next]").addEventListener("click", () => moveLightbox(1));
projectDialog.addEventListener("click", (event) => { if (event.target === projectDialog) closeProject(); });
lightbox.addEventListener("click", (event) => { if (event.target === lightbox) lightbox.close(); });
projectDialog.addEventListener("close", () => { if (!lightbox.open) document.body.style.overflow = ""; });
lightbox.addEventListener("close", () => { if (!projectDialog.open) document.body.style.overflow = ""; });
document.addEventListener("keydown", (event) => {
  if (!lightbox.open) return;
  if (event.key === "ArrowLeft") moveLightbox(-1);
  if (event.key === "ArrowRight") moveLightbox(1);
});
