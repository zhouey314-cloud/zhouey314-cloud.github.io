# 本轮实际使用的第三方资源

## 2026-11-09 Astryx 交互升级

采用 [Meta Astryx](https://github.com/meta/astryx) 的实际 npm 发布包，未将主分支版本当成发布版本：`@astryxdesign/core`、`theme-neutral`、开发用 `cli` 均固定 **0.7.11**；React / React DOM **19.3.1**；StyleX **0.19.1**。精确版本、传递依赖及 npm integrity 在 `package-lock.json`。使用官方发布的预编译 CSS/JS，未克隆、构建或发布整套单体仓库，也没有在线 CDN。

MIT 许可证全文在 `public/licenses/astryx-MIT.txt`（Meta；与已安装官方主题/CLI 一致）、`react-MIT.txt`（React 与 React DOM / Scheduler）及 `stylex-MIT.txt`（[StyleX 官方 MIT](https://github.com/facebook/stylex/blob/main/LICENSE)）。主题的 Lucide 图标许可证完整保存在 `lucide-LICENSE.txt`，包括 ISC 与 Feather 衍生声明。FormatJS 解析、骨架和 memoize 的 MIT 及 intl-messageformat 的 BSD-3-Clause 分别保存在同目录 `formatjs-*-MIT.txt`、`intl-messageformat-BSD.txt`。打包器还保留并链接运行模块自己的 `*.LEGAL.txt`；未修改供应包代码。CLI、esbuild、测试与 PDF 维护依赖不进入浏览器运行时。

实际组件：Button、TextInput、TextArea、Selector、FileInput、Banner、Dialog、Theme、InternationalizationProvider。中立主题作为基底，本地 `src/ui/garden-theme.mjs` 通过官方 `defineTheme` 与 CLI `theme build` 生成自然绿主题；中文控件字符串来自官方 `zh-CN` 词表。组件用于正式首页行动入口、项目筛选、三项工作台、合作提纲与图片查看。完整映射及构建方式见 [维护说明](docs/ASTRYX.md)。ThreeUI 的场景、运行库、字体、密度与既有资源没有改动，以下来源继续有效。

核对日期：2026-10-27。只发布所需 Community 场景、匹配运行库和字体；不复制 ThreeUI 整个组件库、后台或 Pro/Beta 媒体。

| 资源 | 固定来源 | 许可 | 实际位置 |
| --- | --- | --- | --- |
| ThreeUI Community 1.2.0 / Sylva Living Green | `MengTo/threeui@68802d5428071ada5c20db8094b1649e6bb770ed` | MIT，© 2026 Meng To | 首页完整森林；`public/scenes/sylva/scene.js` |
| Three.js r149 | 上述源码配套 `public/landing-pages/inner-green-assets/three.min.js` | MIT，© 2010–2023 three.js authors | `public/vendor/threejs/r149/three.min.js` |
| Lexend Latin WOFF2 | 上述源码同目录 `lexend-latin.woff2` | SIL OFL 1.1 | `public/fonts/lexend-latin.woff2`，全站英文字体 |

MIT 全文：`public/vendor/threeui/LICENSE`、`public/vendor/threejs/r149/LICENSE`。字体 OFL：`public/fonts/Lexend-OFL.txt`，版权与保留名称未改动；来源为 [Google Fonts Lexend OFL](https://github.com/google/fonts/blob/main/ofl/lexend/OFL.txt)。中文使用系统宋体与黑体，没有下载整套大字库。

## 官方基线与源文件

- [完整 Hero](https://threeui.com/hero/sylva/living-green) 与 [纯 Scene](https://threeui.com/three-js/sylva-living-world/living-green) 分别用于理解整页布局与场景。
- [完整 HTML](https://github.com/MengTo/threeui/blob/68802d5428071ada5c20db8094b1649e6bb770ed/public/landing-pages/inner-green-3d.html)，Git blob `4128d48f50324d6ca7530c181b9c2adaad00c214`，197,914 bytes，SHA-256 `69c3694bd63f44ef9f007ebe4dac57a83e4402e0cdf6b54dd10b96dd4f05e197`。
- [React 纯场景包装](https://github.com/MengTo/threeui/blob/68802d5428071ada5c20db8094b1649e6bb770ed/src/shaders/sylva-living-world/SylvaLivingWorldScene.tsx) 仅公开 `variant="living-green"`、className、style。本站没有编造公开 props，也不依赖该 React wrapper 的 onload ready。
- 同源场景内部源：`src/shaders/sylva-living-world/sources/inner-green-3d.html`；Hero 包装入口：`src/shaders/landing-pages/LandingPages.tsx`。实际提取使用完整 public HTML 及配套 r149。

独立参考先运行完整页面和全部四份配套资源，记录真实 WebKit / Apple GPU 的原版画面和交互。原版的两张卡片图片只在独立参考目录使用；正式个人站使用自身已公开的项目截图和样片，不将参考图片冒充成果。

## 保留与定制

**保留：** 原版近景根拱、远景根脊、程序苔藓材质与实例化叶片、蕨类、花朵、空间光照、花粉、指针扰动、扫描入场和桌面蝴蝶。默认 near/far 苔藓密度 190000/60000；small 70000/20000。Three.js tone mapping、exposure、色彩编码保留。2026-10-28 将桌面 DPR 上限从 2 调到 1.5，small 保持 1.6；指针与滚动镜头改为按时间指数插值，植物几何与材质不减。

**定制：** 原生个人 DOM 与全站排版、透明沙箱隔离、第二次真实 render 后的握手、同源 token/source 校验、离屏/后台/动效控制、上下文与编译错误诊断、48 world-unit 的滚动镜头偏移、显式重试。滚动镜头与整站章节是本站实现，不是原组件自带能力。

`scripts/prepare-sylva.py` 从固定完整 HTML 提取最后一个场景 IIFE，再以唯一匹配的补丁加入这些行为。正常构建不运行上游脚本、不访问网络。来源 Shader 与植物模型仍可直接审阅；版权头保留。

## 字节核对

| 文件 | 大小 | 上游 Git blob / SHA-256 |
| --- | ---: | --- |
| r149 three.min.js | 608081 | Git blob `4494cf4e8d37049896b6051da6edfe44a83355af`；SHA-256 `8a5f7249903b54d30f79f708699d2fed2d6a1d0741a4cd41377d1f01bb5a2271` |
| lexend-latin.woff2 | 39692 | Git blob `0968c152f1c0d617a90bd843fa3d510c336af085`；SHA-256 `1ec8f6ee2750554b4bc59ff0b507d316a82a7ba37e0e5bebc41d3bd9b9faad46` |

2026-10-28 的全站前端打磨复用上述场景和已有项目素材；新增原生作品切换与案例阅读控件，没有新增第三方运行库、升级 r149 或修改植物/Shader/光照。静态森林渲染也用于档案的背景、简历页眉和 404。

两个文件逐字节与上述上游 blob 一致。回退图来自同一场景在本机 WebKit 的真实渲染，另见 `ASSET_SOURCES.md`。

## 未采用的旧方案

PR #7 的 Gallery、AnimatedTopDock、r186 模块与旧 hero-scene/dock 实现已由当前方案替换，未使用的运行文件移除。原来的 GSAP/ScrollTrigger 运行库也不再加载；当前滚动使用原生行为、CSS 与场景自己的循环，没有叠加平滑滚动器。历史 GSAP Standard No Charge License 不改变为 MIT；其历史记录可在既有提交查询。

项目截图、GEO 脱敏界面、54 秒原创样片与字幕的原有许可、批准和事实范围继续有效。第三方场景不代表 Ethan 独立原创植物建模，样片也不代表客户投产或真人效果验收。


## 2026-10-28 作品工作台新增来源

- [Fuse.js v7.5.0](https://github.com/krisk/Fuse/releases/tag/v7.5.0)：Apache-2.0。仅复制 `dist/fuse.basic.min.mjs` 到 `public/vendor/fuse/fuse.js`（19,308 bytes，Git blob `181c26b35a90598d22a0712000ffe5351fb425a1`），许可证为同目录 `LICENSE`。原版权头完整保留，内容未修改，仅扩展名改成 `.js` 方便静态服务器。用于作品目录的标题/介绍检索，不介入知识回答。
- [Enterprise RAG Starter 固定提交](https://github.com/zhouey314-cloud/enterprise-rag-starter/tree/5c18455fbc59a2a8ffd46eb0231434f247efce29)：MIT / Copyright (c) 2026 Ethan Zhou。`web/rag.mjs` 原样复制到 `public/workbench/rag.js`，Git blob `c19fc2bc61c50077f82f7809e91584411d108458`。`data/documents.json`、MIT、answerability/excerpts 合成回归一并保留；网页操作层重新设计。该引擎只做英文词法检索与原文摘录，不是生成模型。
- Relay 检查器解析本站已有 `synthetic-report-20261023.md`；视频章节解析既有 VTT。九张 WebP 是从已授权的原 54 秒视频每章第 2 秒提取，不含新生成或外部素材。

本轮也核查 [Lenis](https://github.com/darkroomengineering/lenis)、[Motion](https://github.com/motiondivision/motion)、[PhotoSwipe](https://github.com/dimsemenov/PhotoSwipe)、[Swup](https://github.com/swup/swup)。这些均未复制或加载。原生滚动、原生 video/dialog 和现有生命周期足以支持当前路径，新增滚动接管、全页路由缓存或第二个动画循环会增加兼容与生命周期成本。
