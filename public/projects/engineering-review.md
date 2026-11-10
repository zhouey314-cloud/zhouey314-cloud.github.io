# 恩宇 / Ethan Zhou：工程评审与首轮交付清单

更新：2026-11-10。用途：技术面试、合作范围讨论、复现公开项目。

我做 AI 应用与工具开发，公开实现覆盖资料检索、本地 HTTP/SSE 网关和视频内容工作流。企业 GEO 条目说明本人参与范围，个人仓库说明我实现的系统。这份清单帮助读者检查代码、设计取舍和复现条件。

## 1. 根据你的问题选一个项目

| 场景 | 我负责的实现 | 首轮可以检查的结果 |
| --- | --- | --- |
| 团队需要查文档并核对来源 | 文档版本、授权范围内检索、引用/拒答、本地恢复 | 从问题回到当前可访问原文；旧版本、缺值和撤销如何处理 |
| AI 接口流式中断或出现过载 | HTTP/SSE 转发、容量准入、独立观察与报告 | 拒绝新超限请求时，在途流继续完成；释放后恢复接收 |
| 视频反复导出且难以交接 | 素材到时间轴/字幕/渲染/QA/完整包 | 成片、字幕、时间轴与清单一致；缺失或篡改能检出 |

先体验网站的检索、报告、视频工作台：https://zhouey314-cloud.github.io/workbench.html

## 2. 对照固定源码评审

### Enterprise RAG Starter

工程快照：`7fc40fb309a75926c9828711e4fdfda5de85704b`。

- [架构与三个运行边界](https://github.com/zhouey314-cloud/enterprise-rag-starter/blob/7fc40fb309a75926c9828711e4fdfda5de85704b/docs/architecture.md)
- [本地服务的设计取舍](https://github.com/zhouey314-cloud/enterprise-rag-starter/blob/7fc40fb309a75926c9828711e4fdfda5de85704b/docs/adr-local-rag.md)
- [授权合成资料的完整复现步骤](https://github.com/zhouey314-cloud/enterprise-rag-starter/blob/7fc40fb309a75926c9828711e4fdfda5de85704b/docs/local-quickstart.md)
- [备份、恢复与缺值拒答回归](https://github.com/zhouey314-cloud/enterprise-rag-starter/blob/7fc40fb309a75926c9828711e4fdfda5de85704b/tests/test_operations.py)

评审问题：为什么不先检索全库再过滤？授权快照如何限制其他租户对 BM25 统计的影响？新版本尚未生效时，为什么旧政策不能自动复活？备份后恢复到新路径，撤销状态是否保留？

本地实现需要可信操作员；不等同生产 IAM。公开网页用合成资料进行词法检索和原文摘录，范围选择不是鉴权，没有接入生成模型。保留既有语义漏检与业务数据评测边界。

### RelayAudit / AgentGuard

工程快照：`f8d7376d7593925cb420fd670deef3b0d33f5a19`。

- [源码安装与本地合成演示](https://github.com/zhouey314-cloud/relay-audit/blob/e222f684be89697c9d44d0c11626780a43fcd53b/README.md)
- [协议与生命周期](https://github.com/zhouey314-cloud/relay-audit/blob/f8d7376d7593925cb420fd670deef3b0d33f5a19/docs/PROTOCOLS.md)
- [容量与恢复约定](https://github.com/zhouey314-cloud/relay-audit/blob/f8d7376d7593925cb420fd670deef3b0d33f5a19/docs/CAPACITY.md)
- [真实 loopback 协议与失败回归](https://github.com/zhouey314-cloud/relay-audit/blob/f8d7376d7593925cb420fd670deef3b0d33f5a19/tests/test_guard_proxy.py)

评审问题：一个 SSE 什么时候释放名额？本地 503 是否发起了上游请求？观察队列、存储或检测器失败时，业务流怎样继续？取消、上游 429 和协议故障分别记录在哪里？

从固定源码的 QuickStart 复现容量能力；历史 v0.2.1 安装包不包含这项后续改动。公开报告是合成 fixture，不能用可见标签证明真实模型身份。

### AI Video Workflow Engine

工程快照：`367badd7c3ed2314ec1014964fb8ed3931dc019e`。

- [任务包实现](https://github.com/zhouey314-cloud/ai-video-workflow-engine/blob/367badd7c3ed2314ec1014964fb8ed3931dc019e/video_workflow/delivery.py)
- [完整包生成与独立校验](https://github.com/zhouey314-cloud/ai-video-workflow-engine/blob/367badd7c3ed2314ec1014964fb8ed3931dc019e/docs/DELIVERY_BUNDLES.md)
- [缺失、篡改与失败清理回归](https://github.com/zhouey314-cloud/ai-video-workflow-engine/blob/367badd7c3ed2314ec1014964fb8ed3931dc019e/tests/test_bundles.py)
- [54 秒原创程序动画及复现材料](https://github.com/zhouey314-cloud/ai-video-workflow-engine/tree/367badd7c3ed2314ec1014964fb8ed3931dc019e/examples/original_54s)

评审问题：为什么不能看到 MP4 就交付？如何阻止缺字幕或未列入清单的文件进入任务包？渲染失败会影响旧产物吗？新任务为什么不能继承旧样片的人审批准？

已有样片是 54 秒原创程序动画，不是真人口播或客户商业成片。网站版本只做 faststart 重封装，媒体 packet 数据/时间戳一致，文件哈希与 GitHub 原批准文件不同。机械 QA 通过后，新的产物仍需人工审片。

## 3. 用现成用例开始复现

在新 checkout 与独立虚拟环境中，遵循对应固定源码的 README 安装固定依赖。可以先检查以下确定性测试入口：

```sh
# Enterprise RAG Starter
python -m unittest discover -s tests -p 'test_operations.py' -v

# RelayAudit
python -m unittest discover -s tests -p 'test_guard_proxy.py' -v

# AI Video Workflow Engine
python -m unittest discover -s tests -p 'test_bundles.py' -v
```

这只是入口，不是安装脚本。视频回归需要 FFmpeg 和适用字体；RAG 需要对应解析依赖与 FTS5；网关需要其锁定依赖。测试使用各仓库合成输入与本地链路，不需要真实模型 Key。历史 CI 数字对应各自提交和环境；请记录本次实际命令、版本与输出，不把历史通过视为你当前环境通过。

## 4. 首次合作：把验收约定写成一页

以下是新项目的沟通模板，不是过去客户案例或固定工期承诺。

1. **使用者与现状**：谁在什么步骤遇到问题？现有工具和人工步骤是什么？
2. **输入与权限**：资料从哪里来，是否有处理授权？哪些内容不能进入演示与日志？
3. **首轮交付**：一条可运行的使用路径、对应源码和配置说明、检查记录、已知限制。
4. **验收样例**：正常输入、缺资料、权限不足、超时/取消、重复或损坏输入，分别期待什么结果？
5. **边界与取舍**：这一轮不做什么？哪些条件会阻塞，哪些结果必须由业务负责人确认？
6. **运行与交接**：谁配置环境，谁确认结果？怎样启动、停止、备份、恢复与处理失败？
7. **后续迭代**：根据已观察问题补回归，再决定下一项实现；另行约定模型费用、部署与生产接入。

联系：zhouey314@gmail.com

项目与岗位沟通提纲：https://zhouey314-cloud.github.io/collaborate.html#brief

## 5. 本轮机械回归复验（2026-11-10）

| 当前远程 main 的同一源码树 | 本轮实际通过 | 运行范围 |
| --- | --- | --- |
| Enterprise RAG Starter `60ee0b3` | 55 Python + 36 Node | 入库、身份/版本、备份恢复、词法摘录与拒答 |
| RelayAudit `e222f68` | 128 Python | 合成本地链路、协议、容量、取消与恢复 |
| AI Video Workflow Engine `04b749a` | 56 Python | 工作流、真实短片编码、完整包及失败回收 |

以上数字来自本轮本地命令输出；本地被测提交与所列远程 main 的 Git tree SHA 逐项相同，未拿历史 CI 数字代替。源码未改动，没有调用真实模型。运行 Python 3.13.3；RAG 的现有 pypdf 为 6.10.0（仓库要求6.20.0），Video 的 Pillow 为12.3.0（要求12.2.0），Relay 的 aiohttp 为3.13.5。没有为得到通过而安装或改写依赖；这些结果不代替锁定环境、语义质量与真实业务验收。

[查看完整版本、命令、通过数与环境说明](https://zhouey314-cloud.github.io/public/projects/engineering-verification-20261110.json)
