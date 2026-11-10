# Ethan Local Tingwu · 公开工程说明

整理日期：2026-11-10。个人本地项目，源码未公开；此文不提供公网转写服务，不含原录音、逐字稿、声纹或私人导出。

## 解决的问题与本人实现

把音视频导入、分块处理、取消恢复、回听校对、引用整理和导出接成单机流程。识别模型与推理框架是集成依赖，不是本人训练。

- `backend/longform.py`：规划分块、指纹与覆盖；输入哈希、引擎/模型/热词/声道进入处理指纹。`backend/worker.py` 执行任务，保存源区间、解码证据、原始 ASR 响应 SHA256 和提交状态，复用已完成块。
- 校对与版本：保留识别原稿和人工修订，文字、人物、时间和核对状态分别保护，支持拆句、来源追踪、撤销重做。
- `backend/speaker_worker.py`：处理匿名声学候选；相似度不是身份置信概率，不自动猜姓名。默认快速读稿不认人。
- `backend/llm.py`：逐窗消费保存片段，保留引用与覆盖清单；缺块不称整场完成，失败保留旧纪要和本次部分结果。
- `backend/content_exports.py`：从当前保存内容生成 MD/TXT/JSON/PDF/DOCX；逐字稿另有 SRT/VTT。归档含引用与修订，不含原录音或声纹向量。

## 核对与版本

本轮只读主目录 HEAD：84c5f4b3940b39ea160f3d1d6de1a85e1308d628。
2026-11-10 本机健康回读：0.3.1-local-beta，schema 5，local_only=true，mature_quality_accepted=false；ASR/LLM 依赖可用。未在本轮重新运行模型推理或全套工程回归。

历史 `docs/MAC_0.3.1_APPLIED_20261031.md` 记录 2026-10-31 Mac 原环境415项机械回归、9项真实Metal/CLI短音频 smoke，并有浏览器、取消恢复、升级和备份验证。这些数字属于历史版本和环境，不是本轮重跑、识别准确率或客户验收。

相关回归文件包括 `tests/test_asr_task_sessions.py`、`tests/test_field_locks_and_segment_split.py`、`tests/test_disk_lifecycle.py`。源码与测试暂未公开，本文仅作为架构和范围说明。

## 尚未完成的验收

自然录音文字、术语、说话人和摘要语义没有可信人工金标，不能报告准确率或成熟质量；输入覆盖完整也不等于语义完整。重叠与相似声音、候选碎片化仍有风险。

干净 Mac 安装、Safari、Word 原生分页、签名公证、其他系统和多设备使用尚未全面验证。下一步以获授权的小段自然录音建立人工核对基线，分别检查文字、说话人、引用与摘要，再决定可公开范围。

项目页：https://zhouey314-cloud.github.io/cases/local-tingwu.html
联系：https://zhouey314-cloud.github.io/collaborate.html?topic=workflow#brief
