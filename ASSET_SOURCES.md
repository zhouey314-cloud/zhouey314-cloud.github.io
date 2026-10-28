# 公开资产与许可

## 2026-10-27 · 完整 Sylva 森林与分享图

本轮不新增人物照片、客户素材或生成媒体。ThreeUI Community 1.2.0，固定 commit `68802d5428071ada5c20db8094b1649e6bb770ed`，MIT。采用完整 public Hero 的程序几何、Shader、材质、光照与原版质量分档；不是三张截图或官网远程预览。源文件、runtime/font 固定 blob、许可及改动范围见 [THIRD_PARTY.md](THIRD_PARTY.md)。

- 正式场景：`public/scenes/sylva/scene.js`；匹配 r149：`public/vendor/threejs/r149/three.min.js`，原始版权头和 MIT 保留。
- 字体：`public/fonts/lexend-latin.woff2`，39692 bytes；原版文件，SIL OFL 1.1 见同目录 `Lexend-OFL.txt`。
- 静态回退：`node scripts/capture-forest.mjs` 用本机 WebKit / Apple GPU 实际运行同一场景，减少动效、DPR1、desktop1600×880 / mobile390×935，经第二次成功 WebGL 绘制后截图，再以 WebP quality86 压缩。来源记录在 `public/scenes/sylva/capture.json`。不是生成图，不是远程缩略图；静态回退不作为实时3D成功证明。
- 分享图：`node scripts/export-social.mjs` 将实际森林与本站身份文字排成1200×630，输出 `public/social-preview.png`、`public/og-image.svg`。
- 原版两张卡片照片只用于工作区的完整参考运行，没有复制进正式个人站。正式作品证据仍为已有 RAG、Relay、GEO 与54秒样片素材。
- PR7未使用的Gallery/Dock/r186与旧预览图移除；旧批准项目图片、原始视频、字幕、PDF和微信二维码保留，字节清单在本轮迁移证据中。

| 回退资产 | 实际字节与校验 |
| --- | --- |
| `public/scenes/sylva/forest-desktop.webp` | 111614 bytes · SHA-256 `2f0958df0729e2425b47cadcf3ca01534926dcaad0ece5b09bcb6bf1176857a8` |
| `public/scenes/sylva/forest-mobile.webp` | 16146 bytes · SHA-256 `ca5f9ee7e2b14a7c24919e43933fe134594b17f80b1d2bd36682e7e53a2cbed8` |

以下保留既有项目素材的来源和批准记录，日期、版本及历史测量按各条原范围解释。

核对日期：2026-10-11。

| 资产 | 来源与用途 | 权限／边界 |
| --- | --- | --- |
| `public/projects/rag/demo-query.png` | 本站既有公开图；与 `enterprise-rag-starter` 当前 `89b9d31` 的同名项目图 blob 相同 | 用户授权继续在个人站展示；合成数据与线上词面模式，非真实企业准确率 |
| `public/projects/workflow/hero.png` | 本站既有公开图；与 `multi-tenant-ai-workflow-saas` 当前 `fc0141b` 的 `docs/images/hero.png` blob 相同 | 用户授权继续展示；虚构角色演示，无生产认证 |
| `public/projects/crm/`、`eval/`、`video/`、`skills/`、`recruitment/`、`novamach/` | 沿用 `ef00327` 中的公开项目资产 | 仅用于用户自己的项目说明；样本、合成、规则模拟等边界保持可见 |
| `public/projects/geo/` | 沿用 `ef00327` 已公开脱敏截图，未添加私人素材 | 仅说明参与范围，不公开内部地址和客户信息；不等于独立完成或生产验收 |
| `public/contact/wechat-qr.svg` | 沿用 `ef00327` 的有意公开联系方式，文件未改动 | 仅作 Ethan 恩宇联系入口 |
| `public/projects/thought/example.svg`、首页与案例摘录 | [Thought-to-X 公开示例](https://github.com/zhouey314-cloud/thought-to-x/blob/b8a3c18ebe11bd36e25ccebc7ec7e0f38a99b032/examples/destiny-example.md) 的原文重新排版 | MIT；Copyright (c) 2026 Thought-to-X contributors；完整许可在 `public/licenses/thought-to-x-MIT.txt`。不是产品截图或本轮实时模型输出 |
| `public/favicon.svg`、Ethan 恩宇文字字标 | 本轮原创简单图形与系统字体排版 | 不复用参考站字标、人物、相机、车辆、插画或商用字体 |
| `public/social-preview.png` | 2026-10-22 原创分享封面：准确中文排版与参数化几何线框 | 用于分享卡片；是设计图，不是浏览器截图 |

参考站只用于观察设计原则。没有复制它们的布局源码、插画、字体文件或互动资产。第三方网站的研究截图位于仓库外，未加入站点资源。

本站未为全部历史文本／媒体指定统一的转授权许可证；上述使用权限不等于允许第三方任意复制。各公开项目的代码许可应到对应仓库核验。


## 2026-10-11 新增图形

- `public/projects/recent/relay-flow.svg`：本次独立制作的流程结构示意，依据 [RelayAudit README](https://github.com/zhouey314-cloud/relay-audit)，不包含产品真实运行截图。
- `public/projects/recent/voice-flow.svg`：本次独立制作的流程结构示意，依据 [Voice Clone Video README](https://github.com/zhouey314-cloud/voice-clone-video)，不包含克隆声音、真人肖像或真实客户素材。
- 两张图不代表性能、识别率或真实用户验收。


## 2026-10-21 第二轮原创动画

- `public/projects/video/original-54s.mp4`：来自个人 `ai-video-workflow-engine` 的
  `examples/original_54s/sample.mp4`，9个程序动画镜头、原创数学合成BGM、无真人声音或外部素材。
  代码和新原创媒体沿用该仓MIT，字体未打包，许可说明在上游样片目录。
- 原视频SHA256：`0a7f73e9a5a014a352aa5f27a2852b39e558546ccc38f93016785cf2fba0e1a9`。
  用户于2026-10-21观看并批准此精确文件用于作品集；不是客户或真人口播验收。
- `original-54s-poster.jpg`：同一成片第3镜头的实际抽帧，不是AI虚构截图。
- `original-54s.vtt`：从同一成片SRT转换时间戳格式的可选字幕；原MP4已烧录中文字幕。
- 可复现生成器、源资产清单、机器QA与独立批准记录：
  [原动画源码与许可](https://github.com/zhouey314-cloud/ai-video-workflow-engine/tree/main/examples/original_54s)。

未新增或改写既有GEO参与材料；不把参与工作归为个人独立完成的系统。


## 2026-10-22 身份与视觉更新

- `public/field-form.svg`：本轮原创参数化环面线框，作为 FDE / GEO 品牌装饰，不是产品截图或业务成果图。
- `public/social-preview.png` / `public/og-image.svg`：基于新首页身份文案的原创文字与几何排版。PNG 渲染使用 Noto Sans CJK SC 字形；字体来自 https://github.com/notofonts/noto-cjk ，字体文件未随网站分发。
- `public/favicon.svg`：原创 E 字母路径，炭黑与酸橙配色。
- 沿用既有 GEO / RAG / 视频 / 微信资产，保留各自原授权范围。没有使用生成的人物照或替换用户的真人形象。
- 设计研究：https://github.com/motiondivision/motion 、https://github.com/DavidHDev/react-bits 、https://github.com/darkroomengineering/lenis 、https://github.com/greensock/GSAP 、https://github.com/bchiang7/v4 。仅研究设计原则，无上述项目代码或第三方运行时依赖被打包。


## 2026-10-22 可下载简历 PDF

- `public/ethan-zhou-resume.pdf`：由 `scripts/export-resume.py` 使用 ReportLab 导出为 2 页 A4。`resume.html` 是简历正文的唯一来源；导出器从该页读取简介、经历、项目、能力、教育与联系方式，不维护另一份简历文案。网页上的「打印 / 保存 PDF」调用浏览器打印；下载文件采用独立的 ReportLab 排版，不声称与 Chrome 打印结果相同。
- PDF 的中文字体为 **Droid Sans Fallback Regular**，由本地已安装的正式 Python 包 **PyMuPDF 1.26.6** 提供，通过 `fitz.Font("cjk").buffer` 读取其底层 MuPDF 内置的 TTF。本次使用的字体为 3,556,308 字节，Git blob SHA-1 为 `cc7d41d3483cafbbbda246ee4a2bb93f88a51835`，与 [MuPDF 1.26.6 官方字体文件](https://github.com/ArtifexSoftware/mupdf/blob/1.26.6/resources/fonts/droid/DroidSansFallback.ttf) 完全一致。
- 字体版权归 **Copyright (c) 2005-2008, The Android Open Source Project**，许可为 **Apache License, Version 2.0**。依据同版本 [官方 `resources/fonts/droid/NOTICE`](https://github.com/ArtifexSoftware/mupdf/blob/1.26.6/resources/fonts/droid/NOTICE) 核对，并将该文件的版权声明和完整许可条款保留在 [`public/licenses/DroidSansFallback-NOTICE.txt`](public/licenses/DroidSansFallback-NOTICE.txt)。这项说明针对 PDF 内嵌字体，不为本站其他资产指定许可证。
- ReportLab 将使用到的字形转换为 PDF 字体子集并嵌入文件，字体子集名称带有 ReportLab 生成的前缀；没有另行绘制或替换字形。网站不单独分发完整 TTF。拉丁文标题使用 PDF 标准字体 Helvetica-Bold。


## 2026-10-23 真实项目证据更新

本轮仅改网站展示，未改 RAG、RelayAudit 或视频引擎的 AI 行为。README 通过 GitHub connector 核对；现场演示与历史测试结果分别标注。

### RAG 的三步截图

- 原站：[Enterprise RAG browser demo](https://zhouey314-cloud.github.io/enterprise-rag-starter/)。对应源仓 main 为 [`45e2daa8fa7cbd4092c08219a68b16ca02148d50`](https://github.com/zhouey314-cloud/enterprise-rag-starter/tree/45e2daa8fa7cbd4092c08219a68b16ca02148d50)；截图时观察到的页面为词法检索与原文摘录，LLMProvider 仍 `NOT_CONFIGURED`。不是生成模型回答、企业真实数据或生产认证。
- Playwright 1.64.1 的 Chromium，viewport 1200×980、deviceScaleFactor 1、fullPage 截图；最终每张 1200×1093。未修改演示页面 DOM、CSS、查询结果或可见文案。以 Pillow WebP quality 90 压缩，完整内容保留；原始 PNG 留在忽略的 `test-results/project-evidence-originals/`。
- `story-material.webp`：默认问题 `What are the support hours?`，public、Top-K=3，显示真实支持时间摘录、`support:0`、v1 与访问范围。
- `story-citation.webp`：点击 Refund policy，实际问题 `What is the refund policy?`，显示 14 calendar days 摘录与 `returns:0` 引用。
- `story-refusal.webp`：输入 `What is the support phone number?` 并点击 Retrieve and answer，实际返回 `NO_ANSWER / QUESTION_NOT_ANSWERABLE_BY_TOP_HIT`，仍显示相关支持时间片段。
- 可复现操作：打开上述 URL → 保持 Public / Top-K=3 → 依次执行上述三个问题 → 截取整页。来源和各图 SHA256 另存 `public/projects/rag/capture-20261023.json`。页面的范围选择只演示过滤，不是登录或身份鉴权。
- 用于首页项目预览、三步故事和 RAG 案例。源项目 MIT / Copyright (c) 2026 Ethan Zhou；许可全文 `public/licenses/ethan-project-evidence-MIT.txt`。

### RelayAudit 的实际合成报告

- 源仓 [`relay-audit@4d6c15874ecaa9d404a17ebe4112b48bb2599902`](https://github.com/zhouey314-cloud/relay-audit/tree/4d6c15874ecaa9d404a17ebe4112b48bb2599902)，2026-10-23 独立复制到临时目录。使用已有 Python 与 aiohttp 3.13.5 运行 `python3 -m relay_audit guard demo --out <new-temporary-directory>`。所有请求仅在 loopback 与假凭证下运行，不更改 Codex 配置，不调用收费模型。
- 实际输出：Agent 3 请求、上游 3 请求、额外模型 0 请求、一条标签不一致告警；告警后请求继续完成。`identity_status=unverified`、`evidence_status=synthetic_unverified`、`real_api_verified=false`。本次未运行完整负载比较或真实身份评测。
- `public/projects/relay/synthetic-report-20261023.md` 原样保留实际 `report.md`；`fixture-report.webp` 是该原始报告加来源说明的浏览器排版截图，1200×1394，WebP quality 90。它不是产品仪表盘，不伪造 UI 或测量数字。原始 Markdown 的内容未改写，临时运行状态、凭证和 association key 没有纳入网站。
- `public/projects/relay/capture-20261023.json` 保留来源提交、命令、选取的实际 summary 字段与哈希；用于首页卡片和案例。MIT / Copyright (c) 2026 Ethan Zhou，许可全文同上。

### 媒体与缺少素材

- 2026-10-23 重新计算 `public/projects/video/original-54s.mp4` SHA256，与已有批准的 `0a7f73e9a5a014a352aa5f27a2852b39e558546ccc38f93016785cf2fba0e1a9` 完全相同。未重渲染、生成音色或调用模型。案例保持程序动画与原批准范围。
- 当前仓库与上述公开项目材料未找到可确认为本人且获准复用的真人照片，也没有足以核实题目、日期、原文的本人已发布文章。使用文字版 About 与已公开的 X 主页入口；未把草稿当发布记录，没有生成冒充本人的头像。

| 本轮资产 | Bytes | SHA256 |
| --- | ---: | --- |
| `public/projects/rag/story-material.webp` | 84,518 | `a07e9cddac5ea664b72a3637e857e2e3c997aa0ff0a36cddbc4dc746ad03e23a` |
| `public/projects/rag/story-citation.webp` | 86,612 | `eaced6830b66ae370453a6fe750668fa157f82c1958d1b889052372a332bf09b` |
| `public/projects/rag/story-refusal.webp` | 84,952 | `7d299d2310cca423e4711dbfd187cc90b3fbc24ea4bba85968c49932adb59b8d` |
| `public/projects/relay/fixture-report.webp` | 107,174 | `e3eba779d7b343ee6fbbe3b3572ca637446947c7344e7b5fef0dc499741512d0` |
| `public/projects/relay/synthetic-report-20261023.md` | 1,365 | `b70d6626ecf3e818ea25dcbf870f89e1519eccd2a3ac5e1a186b804d1b28c704` |


## 2026-10-23 简历与分享图同步

- 简历 RAG 段已明确：公开页为合成资料上的词法检索与原文摘录，LLM 未配置，范围选择不是生产鉴权，本地文件/身份库独立运行。保留本人企业参与范围与 FDE 职业方向。
- 用原有 `scripts/export-resume.py` 重新导出 PDF，未改变排版器。Bundled Python 提供 ReportLab、lxml、pypdf；缺少的 PyMuPDF 1.26.6 仅安装于临时目录后通过 `PYTHONPATH` 使用，未改全局环境。字体仍使用该固定版本自带 Droid Sans Fallback，许可沿用上方 Apache 2.0 声明。
- 已验证 2 页 A4、20 个可点击链接、嵌入中文字体及新增边界文字；用 Poppler `pdftoppm -r 108 -png` 与 PyMuPDF 逐页渲染检查，无缺字、裁切或重叠。忽略目录 `test-results/resume-20261023/` 保存页面图与验证 JSON。此导出不是浏览器打印，未把字体渲染检查说成真实招聘者验收。
- 分享图 `public/social-preview.png` 与 `public/og-image.svg` 使用新标题“把实际需求，做成能运行的 AI 应用”，标注“编导生转 AI / 企业场景参与”，保留米白、炭黑、酸绿和本项目已有 `public/field-form.svg` 几何。移除巨型职位缩写，侧栏为“作品 / 过程 / 证据”。是文字设计图，不是截图、认证或真人照片。
- 重建命令：`node scripts/export-social.mjs`。脚本从 `content/portfolio.json` 读取姓名，直接生成 SVG，再用锁定的 Playwright Chromium 输出 1200×630 PNG；无需联网、模型或额外库。字体栈 Arial / PingFang SC / Microsoft YaHei / sans-serif，实际为本机系统字体；不复制或分发字体文件。不同操作系统的字形可能略有差异。2026-10-22 的 Noto 渲染记录属于前一版，本版以此说明为准。

### 响应式缩略图

以下为已有真实截图/海报的全画幅等比例缩小，无裁剪、无内容重绘：Pillow `resize((640, round(height*640/width)), Image.Resampling.LANCZOS)`，WebP `quality=85, method=6`。原图与批准的视频文件均未修改；仅用于首页响应式预览，放大仍打开完整资源。

| 输出 | 来源 | 尺寸 | Bytes | SHA256 |
| --- | --- | --- | ---: | --- |
| `public/projects/rag/story-citation-preview.webp` | `public/projects/rag/story-citation.webp` | 640×583 | 29,108 | `117c1a86c506a8574df4e4a271da7b720bee53cc9394017c06e9922061c95378` |
| `public/projects/relay/fixture-report-preview.webp` | `public/projects/relay/fixture-report.webp` | 640×743 | 40,904 | `1344de230ea3aa66c52f871bd872df57349b5d6d7eb98292a330e9b8f5e8a40f` |
| `public/projects/video/original-54s-poster-preview.webp` | `public/projects/video/original-54s-poster.jpg` | 640×360 | 14,670 | `3b1819845cbaa7c07105610d2e43908ae6610161009ab5e38cdeca998947fa99` |

本次简历 PDF SHA256：`cf8ec1e3f4b056045295d79ee1ceee01351511c0c28f8a2e66e9aa68c5440e98`。


## 2026-10-28 展示名与工作台

根据用户直接要求，将公开展示名改成「恩宇」。`public/ethan-zhou-resume.pdf` 仍使用原 URL，从更新后的 resume.html 导出两页 A4、20 个链接并逐页检查；分享图使用原森林渲染与更名文字重新生成。

`public/workbench/video-1.webp` 至 `video-9.webp`：从原授权 `public/projects/video/original-54s.mp4` 分别在 2、8、14、20、26、32、38、44、50 秒抽取，240×135，WebP quality 80。原视频与 VTT 未改写；它们是可点击章节的真实缩略图。

新增 `public/workbench/rag.js`、documents.json 与 RAG-LICENSE，来源与固定版本见 THIRD_PARTY.md。报告检查器读取既有真实报告文件，不将展示界面描述成实时监控或身份识别结果。

`public/workbench/{rag,relay,video}-workspace.webp` 及 `-preview.webp`：使用 `scripts/capture-workbench.mjs` 在本站运行中的工作台实际截取，原画宽 1480px，预览宽 640px，等比例 WebP 转码。来源与说明见同目录 captures.json；仅显示公开合成资料、原报告与原创视频，不是概念图或第三方产品截图。首页、项目档案与三个案例使用这一组当前界面图，旧证据素材继续保留。
