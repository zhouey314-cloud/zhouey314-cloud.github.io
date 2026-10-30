# 恩宇 Ethan Zhou · 数字花园

[实际网站](https://zhouey314-cloud.github.io/) · [检查记录](https://github.com/zhouey314-cloud/zhouey314-cloud.github.io/actions/workflows/portfolio-check.yml) · [Pages 发布](https://github.com/zhouey314-cloud/zhouey314-cloud.github.io/actions/workflows/pages/pages-build-deployment)

2026-10-27 基于最新 `main@e1929e1` 重做。原生静态 HTML/CSS/JS 整合 ThreeUI Community 的完整 Sylva Living Green 植物场景，沿用原仓库、域名和 GitHub Pages 根目录。保留 16 个公开项目、3 项在推进工作、10 个案例、原有 URL/深链和联系方式。

2026-10-28 补全前端体验：首屏可手动切换三个代表作品，档案有精选入口，十篇案例有材料封面、固定章节目录、阅读进度和下一案例；简历与 404 也沿用花园视觉。ThreeUI 场景、r149 和原版植物密度保持不变。

首页阅读路径：完整数字花园与人物身份 → 三个真实作品 → GEO 企业参与 → 编导与工程实践 → 简历、写作入口与联系。没有虚构照片、文章、客户、生产验收或商业成绩。

## 本地运行

```sh
npm ci
npm run build
python3 -m http.server 8810 --bind 127.0.0.1
```

打开 http://127.0.0.1:8810/ 。无需模型、服务端或账号。`npm run build` 由本地 JSON 与模板生成可直接静态托管的 `index.html`。没有 Vite 的 `publicDir` 重映射，现有 `/public/...` 资源路径继续有效。

## 内容维护

2026-10-30 更新能力与价值表达：保留现有 Sylva 场景、首屏作品切换与工作台，以「能解决的问题 → 交付内容 → 项目证据 → 技术与验证 → 联系」组织首页。项目档案支持按问题进入，五篇核心案例、网页简历与 PDF 同步更新。维护与证据边界见 [内容说明](docs/CAPABILITY_CONTENT.md)。

| 修改内容 | 入口 |
| --- | --- |
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
| 网页简历及 PDF | `resume.html`；修改内容后 `python3 scripts/export-resume.py`，逐页复核导出 |
| 分享图 | 先更新实际场景静态渲染，再 `node scripts/export-social.mjs` |

`writing` 当前为空，页面只展示真实 X 主页与 Thought-to-X 入口。新增文章需要核实 `{title,takeaway,date,url}`；不要用占位标题填满版面。没有授权头像时继续使用文字身份。

## 场景和回退

ThreeUI Community **1.2.0 / `68802d5428071ada5c20db8094b1649e6bb770ed`**；Three.js **r149**。几何、Shader、材质、光照、植物密度和质量分档来自完整 Sylva Hero；没有沿用 PR #7 的三张曲面截图。新增的滚动镜头偏移和生命周期属于本站定制，不是公开 React 组件的 props。

1600×880 的宽场景保留桌面蝴蝶。原版宽度 ≤900px 或面积 <620000px² 的 small 档保留植物并省略蝴蝶。原版 DPR 上限为桌面 2、small 1.6；本站 2026-10-28 将桌面上限调为 1.5，small 仍为 1.6，几何密度不变。字体与静态森林先绘制，随后再启动 Shader 编译。

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
npm run test:threeui
THREEUI_ENGINE=webkit SYLVA_REQUIRE_WEBGL=1 npm run test:threeui
```

- 静态：构建一致性、14 页、10 案例、16 项公开档案、3 项在推进工作、原有 94 个案例片段、metadata、媒体与本地链接。
- 浏览器：Chromium/WebKit × 14 页 × 桌面/手机 = 56 组合；axe、资源、键盘、菜单与真实视频播放/定位/字幕。
- 体验：14 布局/降级配置与 14 组交互，含 1600/768/390/320px、200% 等效 CSS 重排、无 JS、脚本失败、对话框、复制失败、hash/历史、深链、实际 PDF 下载，以及作品窗口键盘/鼠标切换、案例章节跟随与继续阅读。
- 场景：独立观察 GL draw calls、r149、完整几何、指针、滚动镜头、单一 rAF、暂停/恢复、真实 context loss、Shader 编译失败、404、异常、沙箱消息校验与手机质量档。Chromium 明确使用软件 WebGL；其他没有 GL 的环境只报告 fallback 验收。`SYLVA_REQUIRE_WEBGL=1` 禁止把 fallback 当实际渲染通过。

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

新工作台不启动网关、不上传文件、不接模型 API。本地文件只留当前页面内存，刷新或重置清除；用户主动导出时生成下载。其他开源项目及服务端未被此次网站改造重写，也未新增生产验收声明。

## 2026-10-30 工程与合作说明

保持现有前端视觉，更新个人简介与联系文案为具体问题、实现范围和交付方式；首页项目贡献与五篇案例增加已实现的运行、备份、容量、事务、交付包和评测入口。服务端能力与静态工作台继续明确区分。对应仓库的 docs/OPERATIONS.md、CAPACITY.md、DELIVERY_BUNDLES.md、HTTP_API.md、RECORDED_EVAL.md 是维护与复现入口。
