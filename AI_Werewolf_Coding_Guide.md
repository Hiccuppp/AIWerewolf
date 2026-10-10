# AI Werewolf Coding Guide

## 开发启动指令

你现在负责开发 AI Werewolf Simulation 项目。

请阅读：

docs/AI_Werewolf_Development_Plan.md

当前目标：

完成第一阶段： 带 Web UI 的狼人杀模拟器。

## 当前范围

实现： - 三个固定板型。 - 游戏流程。 - 角色技能。 - RandomPlayer
自动运行。 - 日志记录。 - Web 查看。

禁止： - LLM。 - Prompt。 - Observer Agent。 - 真人语音分析。 -
房间系统。 - 匹配系统。 - 无限角色扩展。

## 开发原则

1.  游戏规则与玩家决策分离。
2.  RandomPlayerController 后续可替换为 LLMPlayerController。
3.  所有关键状态变化必须记录。
4.  不为了未来需求提前建设复杂框架。
5.  优先保证完整对局运行。

## 开发顺序

D001: 初始化项目。

D002: 建立数据模型。

D003: 实现游戏流程。

D004: 实现角色技能。

D005: 实现随机玩家。

D006: 实现 Web UI。

D007: 完成测试。

每完成一个任务： - 更新 DEVELOPMENT_STATUS.md。 - 更新当前状态。 -
编写测试。 - 运行测试。

现在开始 D001。
