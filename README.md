# 周恩宇 Ethan · 个人作品网站

当前版本：[ThreeUI 改版说明与预览](docs/threeui-redesign.md) · [CI 检查记录](https://github.com/zhouey314-cloud/zhouey314-cloud.github.io/actions/workflows/portfolio-check.yml) · [Pages 发布记录](https://github.com/zhouey314-cloud/zhouey314-cloud.github.io/actions/workflows/pages/pages-build-deployment) · [实际网站](https://zhouey314-cloud.github.io/)。各阶段是否完成以对应提交的实际记录为准；上一轮内容重构见 [PR #6](https://github.com/zhouey314-cloud/zhouey314-cloud.github.io/pull/6)。

原生 HTML / CSS / JavaScript，沿用 `main` 根目录 GitHub Pages 与原域名。ThreeUI 改版基于 `d3859d9`，保留 16 个公开项目、3 个开发中项目、10 个案例及旧链接。

首页顺序：本人定位 → 三个代表项目 → GEO 企业参与 → RAG 三步证据 → 关于我 → 写作入口 → 简历与联系 → 完整档案。FDE 是职业方向，GEO 说明本人参与范围；项目事实边界保留在卡片和案例中。

## 预览与维护

```sh
npm ci
npm run build
python3 -m http.server 8767 --bind 127.0.0.1
```

打开 http://127.0.0.1:8767/。构建只把本地内容写入静态 HTML，不需要服务端、模型或账号。核心内容在 HTML 中，脚本关闭或动效失效时仍可阅读。

- **姓名、简介、邮箱、三个项目、精选文章：** 编辑 `content/portfolio.json`，然后 `npm run build`。`writing` 当前为空，仅显示真实 X 主页。将来添加 `{title, takeaway, date, url}` 前，先核实原文与日期。
- **首页段落／个人经历：** 编辑 `content/home.template.html`，然后构建。不要手改生成的 `index.html`；CI 检查是否同步。
- **照片：** 尚无已核实可用头像，现用文字身份。取得本人授权素材后，在模板的 `#about` 中添加带实际宽高和说明的图片；不要用生成图冒充真人。
- **项目事实与验证：** 首页状态在 JSON，详细证据在 `cases/`；修改能力表述时同时核对项目 README。素材来源、批准和哈希见 `ASSET_SOURCES.md`。
- **简历与 PDF：** `resume.html` 是简历的内容源。修改后运行 `python3 scripts/export-resume.py`，并逐页核对 PDF；导出需要 ReportLab、lxml、PyMuPDF、pypdf。
- **动效：** `home.js` 负责首页阅读进度、章节与 RAG 三步；`hero-scene.js` 按需加载 ThreeUI 衍生场景 `public/js/threeui-gallery.js`；`dock.js` 增强导航文字反馈。`script.js` 统一管理动效偏好、共用弹窗和项目筛选；`navigation.js` 独立负责手机菜单。
- **样式：** `tokens.css` 共享变量，`style.css` 共用基础，`home.css` 首页范围内样式。系统中文字体，无远程字体请求。

## 依赖与回退

首页按需加载本地固定版本的 GSAP / ScrollTrigger 3.15.0 与 Three.js r186。ThreeUI Community Gallery 的原生适配只渲染一个装饰 canvas，真实文字、项目链接、截图拼贴均在 HTML 中。减少动效、手动关闭、数据节省模式不加载 3D 引擎；模块失败或 WebGL 不可用时保留静态拼贴。页面隐藏、首屏离开视口时停止绘制。

CSS sticky 和原生滚动继续负责案例布局，ScrollTrigger 只在桌面且允许动效时切换真实截图。手机、减少动效、手动关闭动效、无 JS 和库加载失败时均以完整的三段图文呈现。无 Lenis、React、CMS、付费 API 或视频自动播放。

依赖版本、哈希、许可与参考文档见 `THIRD_PARTY.md`。GSAP 运行库是 Standard No Charge License，**不是 MIT**。公开项目截图的许可和事实边界另记在资产清单。

## 检查

```sh
npm test
npm run install:browsers
npm run test:browser
npm run test:threeui
THREEUI_ENGINE=webkit THREEUI_REPORT_DIR=test-results/threeui-webkit npm run test:threeui
SKIP_PERFORMANCE=1 npm run test:experience
```

- 静态检查：14 页、10 案例、16 项档案、94 个旧片段、6 个联系方式，HTML 构建一致性和首页顺序。
- `test:browser`：14 页 × Chromium/WebKit × 桌面/手机，共 56 组合；axe 自动规则、坏图、链接、键盘、手机菜单及原生视频播放/定位/字幕轨。测试服务器支持单段 Range。
- `test:threeui`：实际 WebGL 首帧与 draw calls、动态动效开关、离屏／后台停帧、像素预算、手机滚动、WebGL／模块／脚本失败、无 JS，以及导航命中区和焦点；每引擎 9 组。报告标明软件渲染与 headless visibility 注入，不能据此声称实体手机帧率。
- `test:experience`：390×844、768×1024、1440×900、320px；200% 等效 CSS 视口、无 JS、库加载失败、减少动效、开关与响应式清理、图片弹窗焦点、邮箱失败提示、hash 历史。它保留实际滚动录屏。
- 不设置 `SKIP_PERFORMANCE=1` 时附三次冷启动移动端实验室测量。环境：Chromium、4×CPU、150ms RTT、1.6Mbps。一次本地测量不是实际用户 INP/CrUX，也不代表实体 Safari/iPhone。

结果与截图输出在忽略的 `test-results/` 或指定的 `BROWSER_REPORT_DIR` / `EXPERIENCE_REPORT_DIR` / `THREEUI_REPORT_DIR`。一张经过核对的 ThreeUI 视觉预览随维护文档保存；完整测试证据由 CI artifact 保存。历史失败报告不会冒充最终验收结果。

## 发布

沿用原仓库的 PR → Portfolio checks → 合并 `main` → GitHub Pages 流程；无 CNAME，无托管迁移。CI 同时检查静态构建一致性、56 组合浏览器及体验回归。发布结果必须对照实际提交、Actions 和 Pages 部署，并核对线上资源与交互。

本轮仅修改静态作品呈现，没有改变 RAG、模型、Prompt 或 Agent 行为；这里的检查不构成 AI 质量评估。项目历史指标和本次合成 fixture 均保留原范围。

## 历史记录

以下记录保留原时间与条件；其中“未发布”“403”等描述是当时的状态，不是当前部署结论。2026-10-23 的基线 `1b030b8` 已由 PR #5 发布。后续改造以对应 PR/部署记录及交付报告为准。

## 2026-10-11 最近项目补充（历史记录）

- 新增 RelayAudit / AgentGuard、Voice Clone Video 两项可查公开仓库，公开作品总数从 14 调整到 16；新增两个案例页与原创结构示意图，不冒充截图。
- 正在进行的黑客松实践、Ethan Creator Studio / EthanCut 和本地录音转写工具独立列于“开发中”，不计入 16 项，不发布未经核实的技术成果、商业数据或内部材料。
- 公开仓库来源：[`relay-audit`](https://github.com/zhouey314-cloud/relay-audit)、[`voice-clone-video`](https://github.com/zhouey314-cloud/voice-clone-video)。当前 README 所载测试是原项目记录，不是本次作品集亲自复测的模型质量。
- 当时本地预览记录了 86 项桌面 Chromium / WebKit 浏览器回归及静态检查；手机尺寸模拟不代表实体手机验收。后续已通过 [PR #2](https://github.com/zhouey314-cloud/zhouey314-cloud.github.io/pull/2) 合并，这些历史结果不作为今天的浏览器复测证据。


## 2026-10-21 工程证据更新

保留现有视觉、导航和 16 项公开档案，更新已核实项目的修复与 CI 永久链接。RAG 的检索和可答性案例分开计数；视频只声称合成渲染与机械 QA；Thought-to-X 只验证离线交付和 Prompt 字节一致。私有个人项目仍保留在开发中，不宣称公开上线、自然语音或真人验收。

本轮具体测试与限制见对应案例的“深入查看”。静态检查与脚本语法检查可在本地重复运行；实际浏览器、键盘与手机尺寸验收另行记录，不由静态检查代替。

第二轮进一步加入三主线的 Demo/Code/Evidence 入口、RAG文件/身份/版本与候选指标、
Relay真实本机开销，以及54秒原创动画的原生播放器和独立用户批准。动画只使用程序
绘制与原创数学合成音乐，文件哈希绑定已有批准；没有公司/客户素材、私人声音或付费模型。
源文件和许可/来源说明见 [ASSET_SOURCES.md](ASSET_SOURCES.md)。用户已确认审阅62条RAG候选，
但2条语义改写仍失败；没有把候选集或CI写成真实企业模型准确率。


## 2026-10-22 FDE / GEO 个人身份改版（首轮记录）

- 首屏明确姓名、企业一线 FDE / GEO 与 AI 应用工程；以实际工作、项目、方法、个人路径介绍本人。
- 米白、炭黑、酸橙配色；原创参数化线框图；真实 GEO / RAG 图与已有视频样片。
- GEO 企业参与内容提前；16 项档案、3 主工程入口、10 案例及联系方式继续保留。
- 更新分享封面、图标、搜索摘要、Person JSON-LD 与全站浅色 theme-color。
- 当时本地静态检查及脚本语法通过；使用云端 Chrome 检查首页、档案、RAG 案例、窄屏 iframe、菜单与图片预览。该轮未执行当时定义的 13 页 × 2 引擎 × 2 尺寸，共 52 个组合；这是历史范围，本轮已扩展为 56 个组合。
- 原 GitHub 发布受本轮连接写权限限制（创建分支返回 403），本条记录不代表 GitHub Pages 已更新。

设计研究参考官方仓库 Motion、React Bits、Lenis、GSAP、Brittany Chiang v4 的交互与信息组织；本站未复制其组件源码或引入运行时依赖。

## 2026-10-22 Zara 参考、滚动叙事与简历（本轮）

研究了 Zara Zhang 的[个人网站观点原帖](https://x.com/zarazhangrui/status/2113148949842534482)、[主站博客](https://zarazhang.com/)、[Wishlist](https://wishlist.zarazhang.com/)、[Tokyo 精选](https://zaraintokyo.com/)、[deck](https://deck.zarazhang.com/) 和本人 GitHub 模板项目。Wishlist 是互动礼物作品，不是简历主页；本站借鉴人物表达、精选内容与章节大字，来源和边界见 `DESIGN.md`。

- 保留象牙白、炭黑、酸绿。首页增加“业务理解 → GEO 实践 → 工程实现”三段自然滚动故事，桌面 sticky 场景随章节切换，移动端保持正常文流。
- 作品证据使用原生链接；新增独立网页简历、两页 A4 PDF 与可复现导出脚本。没有复制参考站代码或插画，没有引入 Matter.js / GSAP。
- 本轮静态检查通过：14 页、10 个案例、16 项档案、3 条主线、94 个旧片段、6 个联系方式；四份页面脚本语法通过。两份测试仅将 `resume.html` 加入页面列表，未削弱断言。
- 云端 Chrome 已检查桌面三场景、键盘操作与关闭动效；375px / 753px 同源 iframe 检查了响应式、手机菜单与 Escape、无 JS 内容及横向溢出。网页简历的桌面与窄屏排版已检查；两页 PDF 已逐页渲染查看，中文与 20 个链接正常。本地预览对 PDF 返回 200 / application/pdf，内容与源文件一致；云端浏览器下载事件等待超时，未确认浏览器下载完成，也未测试打印对话框。
- 当前完整 14 页 × 2 引擎 × 2 尺寸的 56 组合浏览器矩阵尚未运行，不能以局部检查代替。
- 预览版本的准确来源提交与部署结果记录在完整交付包的 `VERIFICATION.md`，以部署服务返回值为准。GitHub 写入仍受 403 阻塞，原 GitHub Pages 网址尚未上线本轮版本。
