# 周恩宇 Ethan · Portfolio V4 — FDE × GEO

静态个人网站。以「在企业一线做 FDE 与 GEO」介绍周恩宇本人，再展示企业参与记录、三条工程主线、工作方法、个人经历与联系方式。项目档案保留 16 个公开项目、3 个进行中项目，10 个案例与旧锚点继续可用。沿用 `main` 根目录 GitHub Pages，不迁移框架或域名。

## 本地预览

```sh
python3 -m http.server 8767 --bind 127.0.0.1
```

打开 <http://127.0.0.1:8767/>。无需构建、运行时依赖、账号、数据库或模型服务。

```sh
node tests/check-site.mjs
node --check script.js
node --check home.js
node --check resume.js
```

静态检查覆盖页面、资源、锚点、16 项档案、三条主线、联系方式、元信息与事实边界。它不替代浏览器、无障碍或模型评估。

## 实际浏览器回归

```sh
npm ci
npm run install:browsers
npm test
npm run test:browser
```

Playwright 与 axe-core 是锁定版本的开发依赖，不进入静态页面运行时。
CI 在 Linux 安装 Chromium/WebKit 及其系统依赖；本机按实际安装结果执行。
默认检查14页 × 两个引擎 × 桌面1440×1000/手机390×844，共56个页面组合，
并检查54秒样片原生播放/51秒定位/字幕轨、键盘跳转、手机菜单/Escape/焦点和真实HTTP404。
本地测试服务器实现单段 HTTP Range，保持媒体拖动行为与 Pages 一致；视频按原生产属性加载。懒加载图片先滚入视口再
解码，避免把未加载图片误判为坏图。macOS WebKit 使用平台的 Option-Tab
访问链接，其他环境使用 Tab；不改用户浏览器设置。参见
[Apple 键盘说明](https://support.apple.com/en-in/guide/safari/cpsh003/mac)。

报告与截图默认写到忽略的 `test-results/`，可用 `BROWSER_REPORT_DIR` 指定
输出目录。`BROWSER_ENGINES` / `BROWSER_PAGES` 只用于局部诊断，CI默认运行完整集。
axe仅检查所选 WCAG A/AA 自动规则；incomplete规则保留待人工核查，0报告项不等于
完整无障碍认证、实体手机或真人审美验收。未能启动浏览器会明确失败，不静默跳过。

## 文件结构

- `tokens.css`：唯一的颜色、字体、间距/尺寸与动效基础变量层。
- `style.css`：共用导航、图片弹窗、响应式与兼容旧页面的基础样式。
- `home.css` / `home.js`：首页编辑式排版、业务 / GEO / 工程三段 sticky 故事、章节导航与复制邮箱反馈。
- `resume.html` / `resume.css` / `resume.js`：独立网页简历、打印样式与打印按钮增强。
- `public/ethan-zhou-resume.pdf` / `scripts/export-resume.py`：两页 A4 简历 PDF 与读取网页简历内容的导出脚本。
- `DESIGN.md`：视觉、信息结构、参考来源和渐进增强的设计约束。
- `projects.css` / `case-study.css`：各页面作用域样式。
- `navigation.js`：首绘前初始化的独立手机菜单；增强脚本失效时仍可导航。
- `script.js`：原生渐进增强；图片查看器、档案筛选、锚点导航、内容进入与动效偏好；保留旧页面兼容逻辑。
- `cases/`：保留既有八个案例 URL，新增 RelayAudit 与 Voice Clone Video 两个案例；旧 `s0…` 片段仍可访问。
- `demos/ai-crm/`：原站内独立演示，保留其内容和路径。

首页关键内容直接存在于 HTML。无 JS 时人物介绍、导航、项目、联系仍可阅读。图片可通过普通链接查看。系统减少动态偏好优先于本地动效开关；开关只使用浏览器 localStorage 保存偏好。

## 网页简历与 PDF

网页入口为 `/resume.html`，PDF 为 `/public/ethan-zhou-resume.pdf`。导出脚本以网页简历为唯一内容来源，使用 ReportLab 独立排成两页 A4；它不是浏览器打印结果。

```sh
python3 scripts/export-resume.py
```

导出需要 Python 开发依赖 `reportlab`、`lxml`、`PyMuPDF` 和 `pypdf`，不进入网站运行时。网页内容变更后应重新导出，再核对两页排版、中文、链接与内容一致性。

## 内容与资产

项目状态是公开示例、原型或工作流的实际范围，不代表客户生产部署或验收。网站未调用项目模型，也不能以本次 UI 检查证明模型质量。X 记录保留公开主页入口。

已有项目图与微信二维码沿用此前公开资产。新增 Thought-to-X 图是公开示例原文的原创排版，明确标注非实时模型运行；见 [ASSET_SOURCES.md](ASSET_SOURCES.md) 与 MIT 许可全文。字体使用系统栈，未打包或下载商业字体。无第三方运行时库。

## 验收与发布

浏览器截图、性能原始 JSON 和测试报告保存在被忽略的目录或 CI artifact，避免随 Pages 发布。浏览器回归使用本仓锁定的开发依赖；Chromium 与 WebKit 结果不等于真机 Safari/Android。

V3 首次交付停在本地分支，未发布。2026-10-11，用户随后明确授权将已验收版本发布到原域名 `https://zhouey314-cloud.github.io/`。沿用现有 `main` 根目录 GitHub Pages 发布方式，不新增 CNAME 或改变域名设置；具体构建结果以对应提交的 GitHub Actions / Pages 记录为准。

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
