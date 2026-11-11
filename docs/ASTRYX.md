# Astryx 版本的维护与验收

本轮基线为 `main@7f0022cb5f2a911043291097383c192431eab6ef`，本地分支 `codex/astryx-portfolio-20261109`。开始时正确仓库无未提交修改。原分支与历史成果保留。仅做本地修改和提交；没有推送、合并或部署，也没有修改域名、Pages 设置或账户。

## 启动与静态构建

要求 Node >=22.13，沿用 npm 与唯一的 `package-lock.json`，不需要模型密钥、业务服务器或数据库。

```sh
npm ci
npm run build
npm run preview
```

预览默认只监听 `127.0.0.1`，终端打印随机端口，按 Ctrl+C 停止。实际服务 `dist/`，支持原生视频 HTTP Range；没有 SPA 路由兜底。生产根路径为 `/`，原有 `/public/…` 不重映射。部署时只使用 `dist/`，其中 `asset-manifest.json` 列出每个文件的大小与 SHA-256；构建拒绝已知私有目录/日志。不要将工作目录、截图或 `.env` 作为部署产物。本轮未执行部署；现有 Pages 设置保持原样。

## 页面与组件

| 实际页面 / 功能 | Astryx 0.7.11 组件 | 维护源码 |
| --- | --- | --- |
| 首页看作品 / 聊合作 | SSR Button，原生链接 | `src/ui/shared.jsx` 的 `HeroActions`，`content/home.template.html` |
| 16 项档案搜索、类别、重置 | TextInput、Button | `src/ui/archive.jsx`，列表正文仍在 `projects.html` |
| 知识检索、导入、输出状态 | TextArea、Selector、FileInput、Button、Banner | `src/ui/workbench.jsx` 的 `RagWorkbench` |
| 报告导入、恢复、摘要与导出 | FileInput、Button、Banner | 同文件 `RelayWorkbench` |
| 真实播放器、速度、字幕搜索与章节 | Selector、TextInput、Button、Banner；视频保持原生 | 同文件 `VideoWorkbench` |
| 合作方向、需求校验、复制 / 文本 / 邮件 | Selector、TextArea、TextInput、Button | `src/ui/cooperate.jsx` |
| 首页、档案与十篇案例的图片查看 | Dialog、Button | `src/ui/viewer.jsx` |
| 自然绿主题与中文提示 | Theme、InternationalizationProvider | `src/ui/shared.jsx`、`garden-theme.mjs` |

依赖固定为 core / theme-neutral / cli 0.7.11、React / React DOM 19.3.1、StyleX 0.19.1；esbuild 0.28.2 仅用于构建。API 与兼容性按已安装版本的官方 CLI 文档核对；许可证见 `THIRD_PARTY.md`。

## 内容编辑

| 修改内容 | 准确入口 |
| --- | --- |
| 简介、邮箱、三个精选项目、贡献、状态与证据链接 | `content/portfolio.json` |
| 能力、输入、产物、检查方式及联系渠道 | 同文件 `services` / `engineering` / `contactLinks` |
| 文章 | 同文件 `writing`；目前为空，新增真实文章后才显示 |
| 首页身份、结构、照片与分享信息 | `content/home.template.html`；照片复用 `public/portrait/`，来源记录 `ASSET_SOURCES.md` |
| 完整 16 项档案与 3 项项目与实践记录 | `projects.html`；只编辑正文，保留 `astryx:archive` / `portfolio:styles` 生成标记 |
| 工作台静态介绍、边界与项目原链 | `content/workbench.template.html` |
| 十篇案例 | `cases/*.html`；正文直接维护，图片原链与锚点保留 |
| 合作页排版与固定内容 | `content/collaborate.template.html`、`collaborate.css` |
| 网页简历与 PDF | `resume.html`；按 README 的隔离环境步骤导出 `public/ethan-zhou-resume.pdf` 与 `.meta.json` |
| 微信二维码 | `public/contact/wechat-qr.svg`；构建嵌入原批准 SVG，不生成二维码 |
| 主题颜色 / 字号 | `src/ui/garden-theme.mjs`；官方 CLI 构建 `src/ui/generated/`，不手改生成文件 |
| 控件几何、正文阅读层 | `src/ui/ui.css`、`portfolio.css`；原生整体布局继续在 `home.css` / `garden.css` 等 |
| 森林生命周期 / 场景 | `forest.js`、`public/scenes/sylva/scene.js`，匹配 Three.js r149；未迁入 React |

所有更改后运行 `npm run build`。不要只编辑生成的 `index.html`、`collaborate.html`、`workbench.html`、`public/site/` 或 `public/ui/`；再次构建会覆盖它们。档案的筛选控件同样由构建器生成，正文不会被 React 接管。

## 构建与失败边界

`scripts/build-site.mjs` 是统一入口：构建主题和 React 模块 → 原数据模板生成三个页面 → 合并各页原生样式 → 写入明确的静态清单。`build-home.mjs` 与 `page-output.mjs` 共用同一个 SSR 输出，`--check` 检查字节一致性。生成文件仍保存在原公开路径，便于 review 与兼容现有静态托管。

正文、项目证据、二维码、简历与原生链接都在初始 HTML 中。React 只 hydrate 明确标记的交互区域，旧脚本跳过这些区域。主页不预载 React 交互模块；案例在首次图片交互意图时再载入组件 CSS 与 Dialog。官方 reset 用 `@scope` 限定在组件主题根内，避免覆盖正文与森林 iframe。

无 JS / 模块失败时，档案仍列全 16 项，合作页保留直接邮箱与真实二维码，工作台保留边界、原始证据、字幕与原生视频。检索引擎 `public/workbench/rag.js` 未改，仍是合成英文资料上的词法检索和抽取；没有引入模型、生产鉴权或新 AI 判断。导入只存在当前页面内存，刷新清空；不上传、不持久化。邮件链接只打开客户端草稿，不代表服务端收到。

bootstrap 已成功执行后，组件或运行时模块导入失败，或 React 的异步渲染（包括懒加载组件）发生未捕获错误时，该交互区域进入 `data-ui-state="error"`，恢复首次 SSR 内容并显示错误提示。合作页恢复四项沟通提示与邮件链接，不展示无法操作的表单。bootstrap 脚本本身未能加载时，页面直接保留初始 SSR 与邮箱、二维码，此时没有脚本可以设置错误状态或提示。异步错误通过 React 19 的 `onUncaughtError` 处理，等当前提交完成再卸载失败的根；没有安装全局错误拦截器。原始错误继续写入控制台，`data-ui-error-phase` 与 `portfolio:ui-error` 事件保留失败阶段、原始堆栈和组件堆栈。已经局部处理的错误不再次抛成全局未捕获异常。回退不恢复尚未保存的交互输入，需要刷新后重试；React 之外的独立 Promise 不由这个回调接管。

## 验证命令

```sh
npm test
SITE_DIR=dist npm run test:browser
SITE_DIR=dist npm run test:experience
SITE_DIR=dist npm run test:workbench
SITE_DIR=dist npm run test:collaboration
SITE_DIR=dist npm run test:fallback
SITE_DIR=dist npm run test:fallback:guard
SITE_DIR=dist npm run test:loading
SITE_DIR=dist npm run test:crm
SITE_DIR=dist npm run test:astryx
SITE_DIR=dist npm run test:threeui
SITE_DIR=dist THREEUI_ENGINE=webkit npm run test:threeui
npm run astryx -- doctor --built dist
.cache/resume-venv/bin/python -m unittest discover -s tests -p test_resume_export.py -v
```

浏览器证据默认在被 Git 忽略的 `test-results/`；本轮完整改前/改后证据独立存于工作空间 `astryx-20261109/`。自动化检查不是审美或无障碍认证；手机为视口与触摸模拟，未代替 iPhone 真机。Chromium 软件 WebGL 与 WebKit / Apple GPU 的实际绘制证据分开记录。本地资源/双 rAF 交互样本不是用户现场 LCP/INP。

`test:fallback` 在 Chromium / WebKit 的 320、390、1440px 下分别检查正常交互、BottomSheet 分块中断与 404、入口组件中断、慢加载期间刷新及无 JS。另从两篇独立实践案例进入合作页，保持移动端分块待决，再用浏览器返回一个延迟加载的案例文档，检查真实导航取消不会变成全局未捕获错误。桌面原生锚定弹层不会请求移动端分块；受控错误仍必须出现在分阶段诊断中，导航例外只关联那条已取消请求的 ID、文档与时间边界。报告、故障截图和 trace 保存在 `test-results/island-fallback/`，可用 `FALLBACK_REPORT_DIR` 指定独立证据目录。

`test:fallback:guard` 分别注入额外的 `UNRELATED_REVIEW_PROBE` 未捕获异常和包含通用导入错误文字的无关 console.error，确认受控资源失败恢复后，两者仍会使对应的故障或返回用例失败。导航只接受正式 bootstrap 来源、精确岛与阶段前缀、数量与结构事件一一对应的诊断。子用例失败报告与错误原文保留在独立目录，不把任意超时或浏览器启动失败当成负向自检通过。

CI 增加 `npm ci`、正式构建、产物目录测试和静态产物 artifact，不新增部署任务。本轮 CI 配置仅本地验证，远程 Actions 未运行。

## 回滚

先保存自己的后续修改。提交后用 `git log -1 --oneline` 查看本轮提交；`git revert <该提交>` 会生成可 review 的反向提交，然后 `npm ci && npm run build`。仅查看旧版本可在独立分支 / worktree 检出上述基线。不要使用强制 reset、clean 或强推。线上未被本轮改动，不需要线上回滚。

## 2026-11-11 原生导航期间的加载

项目档案与作品工作台在初始 HTML 中分别加载 `ready-archive` / `ready-workbench`。它们只静态导出当前页组件与 hydrate，把关键模块图纳入浏览器原生 load 生命周期；仍由原 bootstrap 挂载和恢复 SSR，不创建第二个 React root。首页、普通案例和合作页不加载这两个入口，合作页保留原版自适应 Selector 与按设备加载的 BottomSheet。

档案搜索把同一份已许可的 Fuse 源码编译进组件；工作台把同一份词法检索引擎编译进组件。算法与公开合成资料不变，原始下载 URL 保留。公共小型资料 GET 使用 `keepalive`，让浏览器在原生导航期间继续完成请求；它不发送问题、导入文件或合作提纲。资料依然通过真实 GET 读取，等待、503 和解析错误仍走原错误状态与诊断，不把失败转换为成功。

非首页主文档 CSS 包内嵌同一份 Lexend woff2 原始字节，使 no-JS 导航也不留下另一个字体请求。公开字体文件、OFL 与森林场景字体保持原样。Creator 案例的响应式证据截图为 eager，使页面 load 完成时证据图已加载；截图、文字与外链不变。

原浏览器、工作台、48 故障组合和无关错误否决测试不修改验收条件。新增静态依赖入口是加载约定，不能替代运行时成功或错误回退的检查；资源和模块故障仍须记录。
