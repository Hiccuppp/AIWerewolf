# Development Status

## Current Phase

Phase 0：架构重建（Architecture Rebuild）— **Completed**

依据：`docs/AIWerewolf_v2_Architecture.md` §17 Phase 0。
下一阶段：Phase 1 预女猎白 + RandomController + Web UI。

## Status

旧 v1 代码已全部删除，v2 分层骨架已建立，59 个测试通过。
Phase 0 不含 LLM、不含 UI、不含存储、不含 Observer。

## Tasks

| ID    | Task                          | Status    |
| ----- | ----------------------------- | --------- |
| P0-01 | 删除 v1 旧代码                | Completed |
| P0-02 | domain 层（基础模型）         | Completed |
| P0-03 | roles 层（角色即数据）        | Completed |
| P0-04 | engine 层（GameState + 流程） | Completed |
| P0-05 | controller 层（决策接口）     | Completed |
| P0-06 | boards 配置形状 + 校验        | Completed |
| P0-07 | 测试（59 passing）            | Completed |
| P0-08 | TS/Vitest 工具链              | Completed |
| P0-09 | 文档与删除原因说明            | Completed |

## 目录结构（现状）

```
src/
├── domain/       faction.ts phase.ts role.ts action.ts event.ts player.ts
├── engine/       GameState.ts PhaseMachine.ts ActionResolver.ts
│                 DeathResolver.ts VictoryChecker.ts GameEngine.ts
├── roles/        Wolf/WolfKing/WolfBeauty/Villager/Seer/Witch/Hunter/
│                 Idiot/Guard/Knight + index.ts（目录 + 查找）
├── boards/       BoardDefinition.ts（板型 = 配置，尚无具体板型）
├── controller/   PlayerController.ts（只有接口）
├── app/          — Phase 1
├── observer/     — Phase 4
├── storage/      — Phase 1
└── web/          — Phase 1
tests/            domain / engine / actions / view + fixtures
```

## Phase 0 已实现

- **基础模型**：GameState（§6）、PlayerState / Player（§5）、Role（§4）、
  Action（§9）、GameEvent + Visibility（§10）、Faction、Phase（§8）。
- **角色即数据**：10 个角色定义为 `{ id, name, faction, abilities }`，
  没有任何角色类、没有 `Role.WOLF` 枚举。
- **流程**：PhaseMachine 走完 §8 全部 15 个阶段；WIN_CHECK 判定胜负，
  未分胜负则进入下一夜，`round` 递增。
- **信息隔离（§7）**：`engine.createView(playerId)` 是唯一的对外信息出口。
  视图不含他人身份、不含 `god` 事件、只有 `public` / 发给自己的 `private` 事件。
  狼人看到队友，预言家看到自己的验人结果，平民只看到公开信息。
- **Action 系统（§9）**：统一 `Action` 形状 + 准入校验
  （actor 存在/存活、类型已知、角色真的拥有该技能、目标存在/存活、投票必须指定目标）。
- **胜负判定（§6）**：狼人清零 → 好人胜；狼人数量 ≥ 好人 → 狼人胜。
- **死亡机制**：DeathResolver 落库式地标记死亡并产出公开事件。

## Phase 0 明确未实现（按文档归属后续阶段）

| 内容                                           | 归属    |
| ---------------------------------------------- | ------- |
| 三个具体板型（预女猎白 / 骑士狼美人 / 狼王守卫）| Phase 1 |
| RandomController                               | Phase 1 |
| 夜晚 / 白天流程规则、技能结算顺序              | Phase 1 |
| 投票计票、放逐、死亡触发技能（猎人开枪等）     | Phase 1 |
| SQLite、Event 持久化、Game/Event Repository    | Phase 1 |
| Fastify app/server、React Web UI               | Phase 1 |
| LLMController、PlayerMemory                    | Phase 3 |
| Observer（独立观察层）                         | Phase 4 |
| 真人语音分析                                   | Phase 5 |

## 与架构文档的差异（均为必要补充，非新增抽象）

1. **`GameEvent.to`**：§10 只给了 `id/type/phase/visibility/payload`。
   没有受众就没有办法把 `private` 事件投递给正确的人，§7 的信息隔离会失效。
   因此补一个可选的 `to`。
2. **`BoardDefinition.id`**：§12 的板型示例没有 id，但 §6 的 `GameState.board`
   是字符串、§13 要求可以选择板型与回放，所以板型需要一个标识。
3. **`WIN_CHECK → NIGHT_START` 回边**：§8 把阶段画成一条以 `GAME_END` 结束的线。
   未分胜负时必须再打一夜，而 §6 的 `round` 是轮次计数、§13 要求自动打完整局，
   所以回边是文档隐含要求的。判定胜负的位置就在 WIN_CHECK。
4. **板型角色 id 大小写归一化**：§12 用 `"WOLF"`，§4 用 `"wolf_king"`。
   查找统一转小写，避免文档自身的两种写法互相冲突。
5. **roles/ 目录补 `Villager.ts`**：§3 的文件清单漏了平民，
   但 §5 与 §12 的所有板型都需要平民。

## 已知待确认（Phase 1 前需要拍板）

- §8 没有 `GUARD_ACTION` 阶段，但 §5 的「狼王守卫」「骑士狼美人」板型都含守卫。
  守卫/骑士/狼美人行动需要哪些阶段，需要在实现 Phase 2 板型前确定。

## 刻意没有添加的东西

为避免提前建设，Phase 0 没有创建：`PlayerMemory`（§5 可选字段，形状要等 LLM
阶段才确定）、`observer/`、`storage/`、`app/`、具体板型文件、RandomController、
`GameEngine.run()`（在没有结算规则和 controller 之前，循环只会空转）。

## Commands

```bash
npm test           # vitest run
npm run typecheck  # tsc --noEmit
```

## Rules

每次开发完成后必须更新此文件。

此文件作为项目当前进度来源。
