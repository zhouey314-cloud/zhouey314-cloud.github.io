# Ethan Creator Studio / EthanCut · 公开工程说明

整理日期：2026-11-10。个人创作工具链；本说明不含私人安装包、原片、未批准真人样片或私有源码。

## 各部分的边界

- 手机 PWA（Ethan Creator）：文稿、本地草稿、提词和录制、本地停顿候选、保留/恢复/撤销、手动字幕和 SRT 导入；设备能力允许时进行 H.264/AAC 导出、分享及 EDL 备份。
- Mac Studio：素材/手机清单导入、项目选择与续开、草稿、审片、取消/重试和时间线交接。
- EthanCut：独立个人口播工具，连接本地 ASR、FFmpeg、候选剪辑与人工审片。
- Palmier：第三方编辑器，只做集成与工程交换；不是本人自研。
- Whisper、FFmpeg 等模型/编解码工具来自开源生态，不是本人训练或自研。

本人负责工具链、状态与原片保护、素材交接、包装集成和核对流程。剪辑候选须经人工审片，不自动代表最终成片。

## 实现模块

以下路径相对于本人 Creator 工程，源码暂未公开：

- `apps/web/src/Prompter.tsx`：手动/定速提词与位置控制。
- `apps/web/src/media.ts`：媒体流录制、格式和实际规格。
- `apps/web/src/storage.ts`：IndexedDB 分块、文稿及中断恢复；只能保留实际已收到的分片。
- `apps/web/src/LocalStudio.tsx`、`local-engine.ts`：本地编辑、字幕和导出编排。
- `apps/web/src/interchange.ts`：源文件哈希、版本、字幕和剪口清单。
- `scripts/studio.py`：复用独立 EthanCut 的 `scripts/ethancut.py`，连接Mac导入、本地ASR、Palmier及受限工程往返。审批绑定当前计划哈希，修改计划后撤销旧审批。

本地媒体处理不等于整个AI工作流完全离线。宿主Agent的语义审稿仍受其自身的数据与模型边界约束。

## 公开入口

https://ethan-creator-personal.pages.dev/

当前公开静态版没有开放云 ASR、语音跟随或云媒体同步。网站只链接既有部署，本轮没有部署或修改该应用。

2026-11-10 用新的匿名桌面 Chrome 会话读取首页与390px视口，实见“新建口播”“导入视频”“查看归档”和空项目列表。未在本轮点击录制、申请相机权限或上传素材。截图不代表实体手机验收。

## 历史验证与剩余验收

2026-11-09 `docs/CLOUDFLARE_RELEASE.md` 记录的生产检查点为971c0c1。项目记录14项匿名Chrome/WebKit公网检查通过，覆盖文稿保存、离线重开和云不可用状态；保留首次308/离线故障及修复回归。当前源码文档提交358363e，本文没有重跑项目全套测试或长片编码。

项目还保留桌面合成短片导出、完整解码、原片哈希、字幕跨裁切和取消清理检查。它们不是本人实拍、iPhone性能或成片内容质量证明。

待本人真实手机确认国内网络、相机/麦克风、保存与离线行为；再走通一条授权真人原片从拍摄、导入Mac到审片的完整交接。历史旧域名手机访问失败记录不能因桌面新入口可打开而关闭。

独立原生iOS分支仍需完整Xcode与真机验收；当前公开入口是PWA，不是已交付原生App。

项目页：https://zhouey314-cloud.github.io/cases/creator-studio.html
联系：https://zhouey314-cloud.github.io/collaborate.html?topic=media#brief
