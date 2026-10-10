---
title: AI Werewolf Simulation Development Plan
version: v1.0
---

# AI Werewolf Simulation 开发计划

## 1. 项目定位

AI Werewolf Simulation 是一个基于狼人杀规则的多 Agent 社会推理实验平台。

目标： - 模拟多个 AI 玩家进行狼人杀。 - 保存完整行为数据。 -
分析玩家行为与隐藏动机。 - 后续支持真人狼人杀语音分析。

项目不是： - 商业狼人杀游戏平台。 - 真人在线房间。 -
通用狼人杀规则编辑器。 - 无限角色扩展平台。

## 2. 开发路线

### Phase 1：可观察狼人杀模拟器

完成： - 固定三个板型。 - 自动完成游戏。 - Web 查看过程。 -
保存完整日志。

不接入 LLM。

### Phase 2：AI 玩家

替换 RandomPlayerController 为 LLMPlayerController。

实现： - 独立上下文。 - 私有记忆。 - 策略生成。 - 自然发言。

### Phase 3：Observer Agent

实现： - 身份概率分析。 - 行为目的分析。 - 关键证据提取。 -
不确定性分析。

### Phase 4：真人分析

输入： - 语音转录。 - 发言顺序。 - 投票记录。

输出： - 玩家状态分析。 - 动机推测。 - 可信度判断。

## 3. 第一阶段技术范围

Backend: - Node.js - TypeScript

Frontend: - React + Vite

Storage: - SQLite

Testing: - Vitest

## 4. 核心设计

### GameState

GameState 是唯一真实状态。

包含： - 游戏 ID - 板型 - 当前阶段 - 玩家状态 - 行动记录 - 事件日志 -
胜负状态

### Player Controller

玩家决策独立。

接口：

``` typescript
interface PlayerController {
  decide(context): Action;
}
```

第一阶段： - RandomPlayerController

未来： - LLMPlayerController

## 5. 支持板型

第一阶段支持：

### 预女猎白

狼人： - 狼人 ×4

好人： - 预言家 - 女巫 - 猎人 - 白痴 - 平民 ×4

### 骑士狼美人

狼人： - 普通狼人 ×3 - 狼美人 ×1

好人： - 预言家 - 女巫 - 骑士 - 守卫 - 平民 ×4

### 预女猎守卫狼王

狼人： - 普通狼人 ×3 - 狼王 ×1

好人： - 预言家 - 女巫 - 猎人 - 守卫 - 平民 ×4

## 6. 第一阶段流程

夜晚：

夜晚开始 → 狼人行动 → 女巫行动 → 预言家行动 → 夜晚结算 → 公布死亡

白天：

发言 → 讨论 → 投票 → 放逐 → 死亡技能 → 胜负判断

## 7. 第一阶段任务

D001 项目初始化

D002 数据模型

D003 状态机

D004 角色技能

D005 RandomPlayer 自动对局

D006 Web UI

D007 测试与验收

## 8. 验收标准

完成后：

-   可以选择板型。
-   可以启动一局游戏。
-   12名玩家自动完成流程。
-   可以查看事件日志。
-   可以回放。
-   可以查看最终胜负。

后续 AI 接入只替换玩家控制器，不修改游戏流程。
