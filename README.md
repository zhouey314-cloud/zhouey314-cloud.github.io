# 恩宇 Ethan Zhou · 数字花园

2026-11-09：在 `main@7f0022c` 上增量接入 Meta Astryx 0.7.11，升级正式页面的作品筛选、三项工作台、合作表单、图片查看及阅读排版。保留森林实时场景、大幅真实照片、项目与全部联系方式。采用预渲染 React 交互区域和原生静态正文，统一输出 `dist/`；**本轮仅本地提交，没有推送或部署**。组件映射、准确编辑入口、验证与回滚见 [Astryx 维护说明](docs/ASTRYX.md)。

[实际网站](https://zhouey314-cloud.github.io/) · [检查记录](https://github.com/zhouey314-cloud/zhouey314-cloud.github.io/actions/workflows/portfolio-check.yml) · [Pages 发布](https://github.com/zhouey314-cloud/zhouey314-cloud.github.io/actions/workflows/pages/pages-build-deployment)

2026-10-27 基于最新 `main@e1929e1` 重做。原生静态 HTML/CSS/JS 整合 ThreeUI Community 的完整 Sylva Living Green 植物场景，沿用原仓库、域名和 GitHub Pages 根目录。保留 16 个公开项目、3 项在推进工作、10 个案例、原有 URL/深链和联系方式。

2026-11-01 完整合作路径：四类能力补充输入、交付与检查方式；新增[合作页](https://zhouey314-cloud.github.io/collaborate.html)，在本地整理项目/岗位沟通提纲，支持复制、邮件草稿和文本下载。首页、十篇案例、档案与简历互相连接，微信与其他联系入口统一核对。手机先展示定位和主按钮，后续章节导航使用完整底板。

2026-10-28 补全前端体验：首屏可手动切换三个代表作品，档案有精选入口，十篇案例有材料封面、固定章节目录、阅读进度和下一案例；简历与 404 也沿用花园视觉。ThreeUI 场景、r149 和原版植物密度保持不变。

首页阅读路径：完整数字花园与人物身份 → 三个真实作品 → GEO 企业参与 → 个人实践与交付方式 → 简历、写作入口与联系。没有虚构照片、文章、客户、生产验收或商业成绩。

## 本地运行

```sh
npm ci
npm run build
npm run preview
```

打开终端输出的本地地址，按 Ctrl+C 停止。需要 Node >=22.13。预览只服务正式 `dist/` 并监听 `127.0.0.1`，复用浏览器回归测试的 HTTP Range 与媒体类型处理，支持视频分段播放和定位。无需模型、业务服务端或账号。`npm run build` 由本地 JSON、模板与组件统一生成静态页面及产物清单。没有 Vite 的 `publicDir` 重映射，现有 `/public/...` 资源路径继续有效。

首页的原生 CSS 按原级联顺序合并为 `public/site/home.css`，界面脚本合并为 `public/site/home.js`；小型导航脚本内联，森林仍独立加载。其他页面的原生样式同样合并，Astryx 的样式经独立打包与作用域隔离，不塞进旧 CSS 拼接链。首页资源和 CRM 引用带自动生成的内容哈希版本，React 模块分包写入 `public/ui/`。维护时修改源码再构建；`npm test` 会识别未同步的页面、主题和生成资源。

## 内容维护

2026-10-30 更新能力与价值表达：保留现有 Sylva 场景、首屏作品切换与工作台，以「能解决的问题 → 交付内容 → 项目证据 → 技术与验证 → 联系」组织首页。项目档案支持按问题进入，五篇核心案例、网页简历与 PDF 同步更新。维护与证据边界见 [内容说明](docs/CAPABILITY_CONTENT.md)。

| 修改内容 | 入口 |
| --- | --- |
| 四类合作范围、输入与检查方式、统一联系方式 | `content/portfolio.json` 的 `services` / `contactLinks`；修改后 `npm run build`，同时生成首页与合作页 |
| 合作页结构与本地提纲工具 | `content/collaborate.template.html`、`src/ui/cooperate.jsx`、`collaborate.css`；只整理文本，不存储、不上传、不自动发邮件 |
| 简介、邮箱、三个作品的数据/状态/证据链接、精选文章 | `content/portfolio.json`；修改后 `npm run build` |
| 四类可参与问题、具体交付、技术与证据矩阵 | `content/portfolio.json` 的 `services` / `engineering`；项目取舍和演示范围也在该文件 |
| 能力、工程证据、GEO 贡献与联系说明的样式 | `capabilities.css`；首页与项目档案引用，沿用现有花园视觉 |
| 姓名、栏目、经历、社交/微信入口与页面结构 | `content/home.template.html`；同步对应 metadata、简历后构建 |
| 首页排版与手机样式 | `home.css` |
| 全站字体、配色、导航、案例与简历的统一样式 | `tokens.css`、`garden.css` |
| 首屏作品切换、案例目录与阅读进度 | `garden-ui.js`；作品窗口从 `content/portfolio.json` 构建，案例封面和后续阅读链接在各篇 `cases/*.html` |
| 场景加载、沙箱握手、指针/滚动、暂停与恢复 | `forest.js` |
| 苔藓、根拱、蕨类、花朵、花粉、蝴蝶与光照 | `public/scenes/sylva/scene.js`；来源和改动见 `THIRD_PARTY.md` |
| 场景隔离文档与匹配运行库 | `public/scenes/sylva/index.html`、`public/vendor/threejs/r149/` |
| 项目素材 | `public/projects/`；来源、许可与事实边界同步 `ASSET_SOURCES.md` |
| 网页简历及 PDF | `resume.html`；按下方隔离环境步骤导出并逐页复核；同时生成的 `.meta.json` 让检查识别网页/PDF 未同步 |
| 分享图 | 先更新实际场景静态渲染，再 `node scripts/export-social.mjs` |

`writing` 当前为空，页面只展示真实 X 主页与 Thought-to-X 入口。新增文章需要核实 `{title,takeaway,date,url}`；不要用占位标题填满版面。

### 简历 PDF 的隔离导出

使用 Python 3.10+，在仓库根目录安装固定的维护依赖。`.cache/` 已被 Git 忽略，不修改系统 Python：

```sh
python3 -m venv .cache/resume-venv
.cache/resume-venv/bin/python -m pip install -r requirements-resume.txt
# 先导出预览，保留网站已发布的 PDF 与 manifest。
.cache/resume-venv/bin/python scripts/export-resume.py --output .cache/resume-preview/resume.pdf
.cache/resume-venv/bin/python -m unittest discover -s tests -p test_resume_export.py -v
```

逐页检查预览的两页排版、中文和链接。确认内容后，去掉 `--output` 运行同一导出器，更新 `public/ethan-zhou-resume.pdf` 及相邻 `.meta.json`，再运行 `npm test`。自定义 HTML 可用 `--source /path/to/resume.html`，但必须保留导出器读取的简历结构。

导出器沿用 ReportLab 排版与已声明 Apache 2.0 的 Droid Sans Fallback，固定字体字节并拒绝静默替换；manifest 记录内容/PDF/字体哈希及依赖版本。同环境重复导出使用固定元数据；跨环境仍应核对文本、链接和实际页面，不能只看哈希。这里是维护依赖，没有向正式网页增加 Python 服务或第三方运行库。

2026-10-30 加入用户本人提供并授权用于网站的照片：`public/portrait/enyu-speaking-{384,960,1254}.webp`。首页以大幅半身照作为人物主视觉，桌面约 600px 宽、手机接近整屏宽，点击可前往个人介绍；三个作品保留为较小的交互索引。“关于我”使用响应式大图。浏览器按显示尺寸与 DPR 选择一个版本；只调整尺寸与格式，不生成或修饰人物。替换照片时同步首页模板的图片描述、Person `image`、`ASSET_SOURCES.md`，再运行构建；排版在 `portrait.css`。

关键身份与联系内容不依赖滚动加载：首屏与“关于我”照片立即请求并同步解码，首屏使用高优先级，个人介绍保留浏览器的自动优先级；微信二维码由构建脚本直接嵌入已批准 SVG 的相同模块，保留原 SVG 地址和微信链接。二维码桌面与手机均 196px，深绿配白底，手机提示改为整行排列；点击打开同一模块矩阵的 784px PNG，可保存后从微信「扫一扫 → 相册」识别。`public/contact/wechat-qr.svg` 与历史 JPG 地址继续保留，更新账号时需同时核对 JSON、SVG、PNG 与测试契约；`npm run test:mobile-contact` 检查 PNG 打开/下载、触摸、键盘与无 JS，`tests/wechat-qr.test.mjs` 比对原 SVG 摘要与 PNG 每个像素。实体手机/微信资料页状态需另行实测；`tests/experience.mjs` 包含独立冷启动 `#about` / `#contact` / 首页、无 JS 与主按钮键盘回归，检查前不强制图片解码或更改 loading。

## 场景和回退

ThreeUI Community **1.2.0 / `68802d5428071ada5c20db8094b1649e6bb770ed`**；Three.js **r149**。几何、Shader、材质、光照、植物密度和质量分档来自完整 Sylva Hero；没有沿用 PR #7 的三张曲面截图。新增的滚动镜头偏移和生命周期属于本站定制，不是公开 React 组件的 props。

1600×880 的宽场景保留桌面蝴蝶。原版宽度 ≤900px 或面积 <620000px² 的 small 档保留植物并省略蝴蝶。原版 DPR 上限为桌面 2、small 1.6；本站 2026-10-28 将桌面上限调为 1.5，small 仍为 1.6，几何密度不变。先给文字与静态图留绘制机会，资源等待最长500ms；挂起的字体不会无限阻止场景初始化。

场景位于 `sandbox="allow-scripts"` 的 opaque iframe。父页校验对应 `contentWindow`、`origin` 与本次 token；只有第二次成功实际绘制、非丢失上下文及有效 draw call 才能发出 ready。编译、资源、上下文与脚本错误单独报告，不根据 `iframe.onload` 宣称 WebGL 成功。

系统减少动效、站内关闭、离屏与后台会停止循环；恢复继续使用已有文档，跨 900px 分档才重建。无 JS、模块异常、WebGL 不可用或上下文丢失时显示**同一森林的实际渲染图**，人物、项目和联系仍是可选择的 DOM。故障可显式重试。静态版不作为 3D 成功证明。

需要重新从上游生成场景时，先取得上述固定提交的完整 `public/landing-pages/inner-green-3d.html`，核实许可，然后运行：

```sh
python3 scripts/prepare-sylva.py /path/to/inner-green-3d.html
```

脚本校验固定上游 blob，常规构建不访问网络。实际回退图用 `node scripts/capture-forest.mjs` 重拍（需要可运行 WebGL 的 WebKit 和 Python Pillow），再运行分享图导出。更换场景后必须重新验证实际绘制、完整/手机质量档、错误与生命周期，并从真实渲染更新两张回退图，不能只换库版本。

## 检查与发布

```sh
npm test
npm run install:browsers
npm run test:browser
npm run test:experience
npm run test:loading
npm run test:crm
npm run test:threeui
THREEUI_ENGINE=webkit SYLVA_REQUIRE_WEBGL=1 npm run test:threeui
```

- 静态：构建一致性、18 页、12 案例、16 项公开档案、3 项项目与实践记录、原有 94 个案例片段、metadata、媒体与本地链接。
- 浏览器：Chromium/WebKit × 18 页 × 桌面/手机 = 72 页面组合；axe、资源、键盘、菜单与真实视频播放/定位/字幕。
- 体验：14 布局/降级配置与 18 组交互，含 1600/768/390/320px、200% 等效 CSS 重排、无 JS、脚本失败、对话框、复制失败、hash/历史、深链、实际 PDF 下载，以及作品窗口键盘/鼠标切换、案例章节跟随与继续阅读。
- 场景：独立观察 GL draw calls、r149、完整几何、指针、滚动镜头、单一 rAF、暂停/恢复、真实 context loss、Shader 编译失败、404、异常、沙箱消息校验与手机质量档。Chromium 明确使用软件 WebGL；其他没有 GL 的环境只报告 fallback 验收。`SYLVA_REQUIRE_WEBGL=1` 禁止把 fallback 当实际渲染通过。
- 加载：两浏览器六组实际资源故障路径，挂起字体/海报仍能初始化与诊断、动效关闭时重试不创建renderer、界面脚本失效仍保留原生菜单和联系。
- CRM：两浏览器十组真实输入、阶段/图表联动、校验、备注、筛选导出、键盘与无脚本回退。六条虚构商机仅在本次访问内存中修改，没有模型、后端或客户数据；兼容URL为 `/demos/ai-crm/`。

`BASE_URL=https://zhouey314-cloud.github.io` 可以直接验收实际网站。各脚本支持 `BROWSER_REPORT_DIR` / `EXPERIENCE_REPORT_DIR` / `THREEUI_REPORT_DIR`。结果默认在忽略的 `test-results/`；独立的视觉、录屏和发布材料保存于交付工作区，实际 CI 与部署结论以对应提交为准。

沿用 PR → 检查 → 合并 `main` → GitHub Pages。发布后需要核对确切 SHA、Pages 与实际页面。自动测试不是视觉验收；手机模拟不是实体 iPhone/Safari，实验室 FPS/LCP 不是现场 INP 或真实用户数据。本轮没有改变 AI 项目的模型、Prompt 或检索行为。

## 来源与历史

[依赖、许可与固定来源](THIRD_PARTY.md) · [素材来源](ASSET_SOURCES.md) · [设计与移植说明](DESIGN.md)。PR #7 的 Gallery 方案保存在 [历史提交](https://github.com/zhouey314-cloud/zhouey314-cloud.github.io/tree/e1929e12f4967d7fb8f3f2f7b33154c38abd4561)，不是本轮视觉目标。

## 作品工作台（2026-10-28）

`/workbench.html#rag` / `#relay` / `#video` 提供实际的来源检查、报告解析和媒体定位；入口已连接首页、档案及对应案例。展示姓名统一为「恩宇」，GitHub、邮件与旧 URL 不改。详见 [实现、来源与维护](docs/STUDIO.md)。

- `workbench.html`、`workbench.css`、`workbench.js`：工作台结构、排版与交互；数据始终用 textContent 展示，不执行导入内容。
- `public/workbench/rag.js` 与 `documents.json`：固定公开引擎与合成资料，原引擎字节不改；不要只为画面改变证据判断。
- `archive-search.js`、`public/vendor/fuse/`：项目标题与公开介绍的本地容错检索，跟 RAG 引擎分开。
- `studio.css`：整站最后一层排版；`scripts/prepare-sylva.py` 已同步 DPR 与按时间插值，重新生成场景可逐字节复现。
- `npm test` 包含 36 条原有合成回归；`npm run test:workbench` 检查输入、导出、上传失败、键盘、媒体、搜索、无 JS、失败回退和各标签无障碍。CI 同步运行。
- `npm run test:collaboration` 检查合作提纲的实际用户路径、原生验证、编码、复制、下载、长邮件处理、无 JS 与零上传/零持久化。

新工作台不启动网关、不上传文件、不接模型 API。本地文件只留当前页面内存，刷新或重置清除；用户主动导出时生成下载。其他开源项目及服务端未被此次网站改造重写，也未新增生产验收声明。

## 2026-10-30 工程与合作说明

保持现有前端视觉，更新个人简介与联系文案为具体问题、实现范围和交付方式；首页项目贡献与五篇案例增加已实现的运行、备份、容量、事务、交付包和评测入口。服务端能力与静态工作台继续明确区分。对应仓库的 docs/OPERATIONS.md、CAPACITY.md、DELIVERY_BUNDLES.md、HTTP_API.md、RECORDED_EVAL.md 是维护与复现入口。

## 2026-11-10 作品集内容维护

- 首页代表作的 `route`、`decision`、`acceptance`、`proofLinks` 位于 `content/portfolio.json`，由 `scripts/build-home.mjs` 展开呈现，不再把关键取舍藏在折叠项里。
- 档案的责任说明位于 `projects.html#engineering-readout`；三个深度案例保留旧章节ID，正文说明输入、本人实现、取舍与交接。
- 评审下载包为 `public/projects/engineering-review.md`，当次复验摘要为 `engineering-verification-20261110.json`。摘要只包含已执行测试、对应源码树和环境；不要将其数字更新成未经执行的新结果。
- 简历正文改动后，使用隔离的导出器同步PDF与meta，并逐页看排版；原照片、二维码、媒体与16个公开档案继续保留；项目记录与本人贡献按实际资料核对。

## 2026-11-10 创作与语音实践档案

- `projects.html#building-now` 保留黑客松这一已有项目，并补充两项个人工具工程的完整案例；三项记录不计入16个公开仓库。
- `cases/creator-studio.html`：手机PWA与Mac/EthanCut的实现、原片保护、恢复、清单交换与审片；真实公开入口截图位于 `public/projects/creator-studio/`。独立原生iOS分支、云功能和真人闭环均不冒充已验收。
- `cases/local-tingwu.html`：分块/指纹、回听与字段保护、引用覆盖和导出；只展示脱敏工程说明，不连接本机服务或公开私人录音。
- 两篇正文可直接编辑；6章节ID用于目录与深链。维护图、版本和验证日期时，同步相应 `public/projects/*/engineering-notes.md`、`ASSET_SOURCES.md`。历史测试记录须带原日期，不能当本轮重跑。
- `practice.css` 只进入档案页与两篇新案例；通过 `content/page-styles.json` 纳入构建。添加新case时同步该配置、sitemap和浏览器/静态回归的页面列表。原有构建和Pages工作流继续使用。
