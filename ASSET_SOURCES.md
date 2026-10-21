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
| `public/social-preview.png` | 新首页真实浏览器截图 | 仅包含本轮已允许公开的文案和项目内容 |

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
