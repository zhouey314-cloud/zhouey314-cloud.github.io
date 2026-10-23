# 公开资产与许可

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
