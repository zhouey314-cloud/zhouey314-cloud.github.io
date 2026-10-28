# 作品工作台与流畅度改造

2026-10-28，基于已上线 `main@5893ce5c4a79b535a2f1456bb6a03c7c52bb25e3`，独立分支实现。公开展示名改为恩宇；账号、邮箱、域名、旧文件 URL 不改。

## 实际能力

- 检索：`/workbench.html#rag`。三栏布局包含可见资料、问题与摘录、来源检查器。可检查匹配得分/引用原文、切换合成访问范围、导入不超过 200 KB 的 .txt/.md、恢复资料、导出结果 JSON、重访本次查询。所有本地文本只在页面内存中处理。刷新/恢复清除；没有上传、持久化或外部模型请求。
- 协议：`#relay`。解析既有真实 Markdown 中的合成事件 JSON，展示请求/响应标签、时间、规则、请求及会话 ID、观察事实和可能解释。支持本地事件 JSON 检查与下载；不伪造在线流量、耗时或模型身份。无效输入保留当前有效报告并显示错误。
- 视频：`#video`。原生 54 秒视频、9 段 VTT 字幕、实际原片章节缩略图、字幕检索、定位播放、播放速度、当前时间分享、原片/字幕下载。离开视频标签自动暂停，没有隐藏的播放循环。
- 档案：16 项内容保留，改为清晰双列作品索引。Fuse 对标题/公开介绍做容错检索，可与类别组合，查询写入 URL 方便分享/返回；若 Fuse 未加载，仍可用精确子串搜索。
- 案例：10 篇及已有 227 个跨页面锚点保留。三篇重点案例直达相应工作台，其余证据、外链和状态不改写成生产能力。

## GitHub 方案核查与选择

核查官方仓库的维护状态、许可证、当前代码和已有依赖。不执行外来安装脚本，不加入付费服务。

| 方案 | 核查结果 | 本站决定 |
| --- | --- | --- |
| [ThreeUI](https://github.com/MengTo/threeui) | MIT；固定 Community 源码及匹配 r149 已有真实基线 | 沿用完整 Sylva 植物场景 |
| [Fuse](https://github.com/krisk/Fuse) | Apache-2.0；v7.5.0 官方发布说明包含评分修复 | vendored basic ESM 19.3 KB，仅作品索引加载 |
| [Lenis](https://github.com/darkroomengineering/lenis) | MIT；仓库维护中 | 本轮不接管滚轮/触摸；先解决实际 GPU 负担 |
| [Motion](https://github.com/motiondivision/motion) | MIT；仓库维护中 | 现有原生动画和单一场景循环足够，不加第二套时钟 |
| [PhotoSwipe](https://github.com/dimsemenov/PhotoSwipe) | MIT；仓库未归档 | 现有原生 dialog 已有焦点/错误验收，本轮继续沿用 |
| [Swup](https://github.com/swup/swup) | MIT；仓库维护中 | 原生页面与深链保留，避免页面替换导致 iframe 生命周期复杂化 |
| [lax.js](https://github.com/alexfoxy/lax.js) | 搜索时发现已归档 | 不采用 |

同时检索 Three.js portfolio 开源案例，见 [Fireship](https://github.com/fireship-io/threejs-scroll-animation-demo)、[developer portfolio](https://github.com/adrianhajdin/project_3D_developer_portfolio)。仅作为候选识别，没有复制其模型/图片/课程示例，没有把其作品或履历用于本站。采用的文件、固定 SHA 与许可证见 THIRD_PARTY.md。

## 性能与原始场景

植物几何、密度、Shader、材质、光照和 r149 不改。只将桌面 DPR cap 2 调为 1.5；手机 small cap 仍为 1.6。桌面缓冲像素相对 DPR 2 为 56.25%，降低像素绘制负担，真实 DOM 文字分辨率不受影响。指针及滚动镜头使用按时间指数插值，避免刷新率不同导致不同速度。没有 wheel/touch preventDefault 或滚动劫持。

同一 Mac、WebKit 27.2 / Apple GPU、本地 HTTP、无网络/CPU 节流、1600×880 / deviceScaleFactor 2，每档 3 次，每次成功握手后等待 1 秒再采样实际场景 frame counter 约 3 秒：改前 39.51–40.21 FPS，改后 57.61–58.16 FPS。390×844 / DPR 2 的 small 档前后约 60 FPS。是开发设备实验室样本，不是实体手机、生产容量、现场 INP 或整机内存结论。自动脚本与原始 JSON 保存在本轮工作区交付目录。

`scripts/prepare-sylva.py` 同步全部补丁，从固定官方 HTML 重新生成与提交 scene.js 字节一致。原有 sandbox、对应 iframe/source/token 校验、实际绘制后 ready、后台/离屏停帧、失败回退均保留。

## 检索行为与回归边界

公开引擎固定为 `enterprise-rag-starter@5c18455fbc59a2a8ffd46eb0231434f247efce29`，Git blob `c19fc2bc61c50077f82f7809e91584411d108458`；原样复制，不重写检索、typed value 校验或摘录规则。先在独立来源目录运行上游 36 条 Node 测试，随后对本站同一引擎运行同一 36 条：前后均通过，0 回归、0 改答案。旧失败案例全部保留，包括电话/邮件缺值、时间戳误判和 Unicode 边界。

它们是 synthetic_unverified 的机械契约，不能推导真实企业回答准确率。没有运行语义模型或生成模型。导入本地文本只扩充当前输入资料，不改变模型配置或服务端。界面使用 textContent/原生节点构建，不执行文件 HTML。

## 维护与检查

- 个人文案：`content/portfolio.json`、`content/home.template.html` → `npm run build`。配套页面及 metadata 名称同步。简历继续同 URL，通过现有 export-resume.py 导出并逐页检查。
- 操作层：`workbench.html/js/css`；全站排版最后覆盖在 `studio.css`。报告仍从原始 Markdown 解析，视频从实际 VTT 解析，不独立维护一份虚构事件或字幕。
- 界面截图：运行 `node scripts/capture-workbench.mjs` 后，将真实截图等比例转为 WebP，更新 `public/workbench/captures.json` 和 `content/portfolio.json` 的 image/preview。不要用设计稿代替运行画面。
- 新视频必须同步 MP4、VTT、poster 与真实帧缩略图。不得只换播放器画面而保留旧章节。
- `npm test`：15 页静态约束和 36 条公开检索回归。
- `npm run test:workbench`：双引擎 × 1440/390/320px 操作、axe、导入/导出、错误、键盘、视频、搜索与无 JS。
- `npm run test:browser`：双引擎 × 桌面/手机 × 15 页，以及原有媒体交互。
- `npm run test:experience`：原有 14 布局/降级与 14 交互组。
- `THREEUI_ENGINE=webkit SYLVA_REQUIRE_WEBGL=1 npm run test:threeui`：实际 WebGL、context loss、Shader 失败、偏好与生命周期。

发布遵循 PR、CI、正常合并、Pages、线上资源及浏览器复验。技术验收与本人审美认可分别报告。
