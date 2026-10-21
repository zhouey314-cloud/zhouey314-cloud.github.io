# Ethan 恩宇 · Portfolio V3

静态个人作品集。首页介绍编导与 AI 项目实践，项目档案保留 16 个公开项目及既有 GEO 参与材料；10 个案例使用统一的六章结构。GitHub Pages 从 `main` 根目录发布，维护改动通过独立 PR 审核。

## 本地预览

```sh
python3 -m http.server 8767 --bind 127.0.0.1
```

打开 <http://127.0.0.1:8767/>。无需构建、运行时依赖、账号、数据库或模型服务。

```sh
node tests/check-site.mjs
node --check script.js
```

静态检查覆盖页面、资源、锚点、16 项档案、六旗舰、联系方式、元信息与事实边界。它不替代浏览器、无障碍或模型评估。

## 文件结构

- `tokens.css`：唯一的颜色、字体、间距/尺寸与动效基础变量层。
- `style.css`：共用导航、首页、图片弹窗、响应式与减少动态模式。
- `projects.css` / `case-study.css`：各页面作用域样式。
- `navigation.js`：首绘前初始化的独立手机菜单；增强脚本失效时仍可导航。
- `script.js`：原生渐进增强；三项目切换、图片查看器、分镜、档案筛选。
- `cases/`：保留既有八个案例 URL，新增 RelayAudit 与 Voice Clone Video 两个案例；旧 `s0…` 片段仍可访问。
- `demos/ai-crm/`：原站内独立演示，保留其内容和路径。

首页关键内容直接存在于 HTML。无 JS 时导航、项目、联系和三段示例仍可阅读。图片可通过普通链接查看。系统减少动态偏好优先于本地动效开关；开关只使用浏览器 localStorage 保存偏好。

## 内容与资产

项目状态是公开示例、原型或工作流的实际范围，不代表客户生产部署或验收。网站未调用项目模型，也不能以本次 UI 检查证明模型质量。X 记录保留公开主页入口。

已有项目图与微信二维码沿用此前公开资产。新增 Thought-to-X 图是公开示例原文的原创排版，明确标注非实时模型运行；见 [ASSET_SOURCES.md](ASSET_SOURCES.md) 与 MIT 许可全文。字体使用系统栈，未打包或下载商业字体。无第三方运行时库。

## 验收与发布

浏览器截图、录屏、性能原始 JSON、参考研究和测试报告保存在仓库外的本地交付目录，避免随 Pages 发布。浏览器回归使用项目外的 Playwright 与 axe-core；Chromium 与 WebKit 结果不等于真机 Safari/Android。

V3 首次交付停在本地分支，未发布。2026-10-11，用户随后明确授权将已验收版本发布到原域名 `https://zhouey314-cloud.github.io/`。沿用现有 `main` 根目录 GitHub Pages 发布方式，不新增 CNAME 或改变域名设置；具体构建结果以对应提交的 GitHub Actions / Pages 记录为准。

## 2026-10-11 最近项目补充（历史记录）

- 新增 RelayAudit / AgentGuard、Voice Clone Video 两项可查公开仓库，公开作品总数从 14 调整到 16；新增两个案例页与原创结构示意图，不冒充截图。
- 正在进行的黑客松实践、Ethan Creator Studio / EthanCut 和本地录音转写工具独立列于“开发中”，不计入 16 项，不发布未经核实的技术成果、商业数据或内部材料。
- 公开仓库来源：[`relay-audit`](https://github.com/zhouey314-cloud/relay-audit)、[`voice-clone-video`](https://github.com/zhouey314-cloud/voice-clone-video)。当前 README 所载测试是原项目记录，不是本次作品集亲自复测的模型质量。
- 当时本地预览记录了 86 项桌面 Chromium / WebKit 浏览器回归及静态检查；手机尺寸模拟不代表实体手机验收。后续已通过 [PR #2](https://github.com/zhouey314-cloud/zhouey314-cloud.github.io/pull/2) 合并，这些历史结果不作为今天的浏览器复测证据。


## 2026-10-21 工程证据更新

保留现有视觉、导航和 16 项公开档案，仅更新七个案例的修复与 CI 永久链接。RAG 的检索和可答性案例分开计数；视频只声称合成渲染与机械 QA；Thought-to-X 只验证离线交付和 Prompt 字节一致。私有个人项目仍保留在开发中，不宣称公开上线、自然语音或真人验收。

本轮具体测试与限制见对应案例的“深入查看”。静态检查与脚本语法检查可在本地重复运行；实际浏览器、键盘与手机尺寸验收另行记录，不由静态检查代替。
