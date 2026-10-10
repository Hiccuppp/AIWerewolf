# Phase 0 重建说明：旧代码为什么被删除

Phase 0 删除了 v1 的全部 `src/`、`run_tests.ts` 与 `tests/game.test.ts`，
并按 `docs/AIWerewolf_v2_Architecture.md` 重建。

**这些删除是刻意为之，不是清理历史包袱的顺手操作。** 旧代码不是「需要重构」，
而是「结构上与 v2 架构冲突」——保留它意味着 v2 的每一层都要先绕开旧模型的假设。

删除前的状态保留在 git 提交 `ea488d7`（Initial commit），可随时 `git show` 取回。

## 逐文件原因

### `src/types.ts`

| 旧代码 | 冲突点 |
| --- | --- |
| `enum Role { WEREWOLF, VILLAGER, SEER, WITCH, GUARD }` | §4 明确写「不要 enum，原因：未来扩展困难」，要求 `interface Role { id, name, faction, abilities }`。枚举还会把角色硬编码进类型系统，新增角色必须改代码。 |
| `enum GamePhase { NIGHT, DAY, VOTING, END }` | §8 定义了 15 个阶段。4 个阶段无法表达「狼人行动 / 女巫行动 / 预言家行动 / 夜晚结算 / 死亡宣告 / 发言 / 讨论 / 放逐 / 死亡触发 / 胜负判断」。 |
| `interface Player` 含 `isPoisoned` / `isProtected` / `isWitched` | 把「本夜生效的效果」当成玩家的持久字段。效果是行动结算的中间结果，属于 `Action` → 结算流程；挂在玩家身上会让状态无法回放、也无法表达同一夜多个效果的叠加与抵消。 |
| `GameState.logs: string[]` | §10 明确「不用字符串日志」，要求结构化的 `Event`（含 `type` / `phase` / `visibility` / `payload`）。字符串日志无法过滤、无法按可见性隔离、无法给 Observer 用。 |
| 只覆盖 5 个角色 | §5 的三个板型需要预言家、女巫、猎人、白痴、守卫、骑士、狼王、狼美人、平民。 |

### `src/game.ts`

- `WerewolfGame` 把状态构造、阶段流转、胜负判定挤在一个类里。v2 拆成
  `GameState` / `PhaseMachine` / `VictoryChecker` / `GameEngine`（§3）。
- **胜负判定存在真实缺陷**：
  ```ts
  const villagers = alivePlayers.filter((p) => p.role !== Role.WEREWOLF);
  ```
  它用「不是普通狼人」来判定好人阵营。§5 的板型里狼王、狼美人属于狼人阵营，
  在这段逻辑下会被算进好人，胜负会算错。v2 改为按 `Role.faction` 统计
  （`VictoryChecker.countFactions`），新增狼人系角色不需要改判定。
- `nextPhase()` 里没有 `WIN_CHECK`，一轮结束后直接 `VOTING → NIGHT`，
  没有「先判胜负再决定是否继续」的位置。

### `src/player.ts` —— 删除的最主要原因

```ts
export interface PlayerController {
  chooseAction(state: GameState, player: Player): any;
}
```

1. **它把整个 `GameState` 交给了决策方。** §7 写得很直接：「不要给 AI
   `gameState`，而是 `engine.createView(playerId)`」，并称之为「整个项目最重要的部分」。
   旧接口让每个 controller 都能直接读到所有人的身份，信息隔离在架构层面就不可能实现——
   这不是加个检查能补救的，只要签名还传 state，隔离就是空的。
2. **它把规则写进了决策。** `if (player.role === Role.WEREWOLF) ... if (player.role === Role.SEER) ...`
   让 controller 自己判断角色能做什么，违反 §1「Engine 管规则，Controller 管决策，四层完全隔离」。
3. **返回 `any` 与临时对象**（`{ wolfKillId }` / `{ seerInspectId }`）而不是 §9 的统一
   `Action`。每个 controller 都会发明自己的返回形状，引擎无法统一校验。
4. 决策接口不是异步的，而 §11 要求 `Promise<Action>`（LLMController 必须是异步）。
   改签名会波及所有实现，所以它必须现在改，不能等到 Phase 3。

### `src/abilities.ts`

- `executeNightActions()` 把守卫/狼人/女巫/预言家的结算顺序写死成一个巨型参数对象
  和一连串 `if`。§4 要求技能来自角色的 `abilities` 数据，而这段代码每加一个角色就要改函数签名。
- 它直接改玩家字段并只写字符串日志，没有产出任何 `Event`；「谁死了」和「把死亡写进状态」
  也没有分开，无法在死亡触发技能（猎人、狼王）里复用。
- 使用了 `actions.witchTargetId!` 这类非空断言：类型系统无法证明的东西被强行断言，
  真正该做的是在准入阶段校验（现在在 `ActionResolver.validateAction`）。

### `src/web_ui.ts`

这段代码不是产品的一部分：它是给 DSH/Cordis 运行时的 Slot 插件占位符，
引用了并未导入的全局 `React`，注释里也写着「Here we would ideally get the game
state from a shared service / For now, return a placeholder UI」，即从未接上任何状态。

v2 的 UI 是 `src/web/` 的 React + Vite（§3、Phase 1），与这个占位符没有继承关系。
它还是唯一没有测试、也没有任何调用方的文件。

### `run_tests.ts` 与 `tests/game.test.ts`

- `run_tests.ts` 是手写的 `console.log('PASS/FAIL')` 脚本：没有断言库、没有退出码、
  失败不会让 CI 变红，而且断言逻辑写在函数里靠手工调用。
  项目当时没有 `package.json`，也就是**没有任何测试框架**。§2 要求 Vitest，现在已接入。
- `tests/game.test.ts` 用 `describe/it` 写成，但在上面的前提下从未真正被运行过；
  它测试的 `WerewolfGame` 本身也已删除。它的断言方式
  （`game.getState().players[0].isAlive = false` 直接改状态）绕过了引擎行为。

## 旧代码整体缺少的能力

对照 §3 的目录，旧实现完全没有：`boards/`（板型 = 配置）、`Event`（结构化事件）、
`engine.createView`（信息隔离）、`round`（轮次）、`ActionResolver` / `DeathResolver` /
`VictoryChecker` 的分工，以及 `app/` / `storage/` / `observer/` / `web/` 的位置。

因此 Phase 0 选择整体删除重建，而不是就地修改：v1 的 5 个文件里，没有一行能在
v2 的分层中找到不需要改写的归属。
