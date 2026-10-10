AIWerewolf v2 Architecture
1. 总体架构
AIWerewolf

                Web UI
                  |
                  |
             Game Service
                  |
        --------------------
        |                  |
   Game Engine        Analysis Layer
        |
        |
   Player Controller
        |
 -----------------
 |       |        |
Random  LLM    HumanReplay

核心：
- Engine 管规则。
- Controller 管决策。
- Analysis 管观察。
- UI 管展示。
四层完全隔离。
2. 技术栈
Backend
Node.js
TypeScript
Fastify
Frontend
React + Vite
Storage
SQLite
Test
Vitest
3. 项目结构
不要 monorepo。
个人项目没必要。
AIWerewolf/

src/

├── app/
│   ├── server.ts
│   └── routes/


├── domain/
│
│   ├── player.ts
│   ├── role.ts
│   ├── faction.ts
│   ├── phase.ts
│   ├── action.ts
│   └── event.ts


├── engine/
│
│   ├── GameEngine.ts
│   ├── GameState.ts
│   ├── PhaseMachine.ts
│   ├── ActionResolver.ts
│   ├── DeathResolver.ts
│   └── VictoryChecker.ts


├── boards/
│
│   ├── BoardDefinition.ts
│   ├── PreWolfHunterIdiot.ts
│   ├── KnightWolfBeauty.ts
│   └── WolfKingGuard.ts


├── roles/
│
│   ├── Wolf.ts
│   ├── Seer.ts
│   ├── Witch.ts
│   ├── Hunter.ts
│   ├── Idiot.ts
│   ├── Guard.ts
│   ├── WolfKing.ts
│   ├── WolfBeauty.ts
│   └── Knight.ts


├── controller/

│   ├── PlayerController.ts
│   ├── RandomController.ts
│   └── LLMController.ts


├── observer/

│   ├── Observer.ts
│   └── Analysis.ts


├── storage/

│   ├── Database.ts
│   ├── GameRepository.ts
│   └── EventRepository.ts


├── web/

│   └── React frontend


tests/

docs/


4. 核心对象设计
Role
不要 enum。
错误：
Role.WOLF

原因：
未来扩展困难。
改：
interface Role {

 id:string;

 name:string;

 faction:Faction;

 abilities:Ability[];

}

例如：
{
"id":"wolf_king",
"name":"狼王",
"faction":"wolf",
"abilities":[
 "kill",
 "revenge_shot"
]
}

5. Player
interface Player {

 id:string;

 seat:number;

 role:Role;

 alive:boolean;

 controller:PlayerController;

 memory?:PlayerMemory;

}

注意：
role 存在真实状态。
但是 AI 不直接读取。
6. GameState
唯一真实状态。
interface GameState {


id:string;


board:string;


round:number;


phase:Phase;


players:PlayerState[];


pendingActions:Action[];


events:GameEvent[];


winner?:Faction;


}

7. 信息隔离
这是整个项目最重要部分。
不要给 AI：
gameState

而是：
engine.createView(playerId)

例如：
狼人：
{
role:"wolf",
teammates:[3,7],
publicEvents:[]
}

预言家：
{
role:"seer",
checkResults:{
5:"wolf"
}
}

平民：
{
role:"villager"
}

Observer：
{
publicEvents:[]
}

8. 游戏流程
Phase Machine:
GAME_START


NIGHT_START


WOLF_ACTION

WITCH_ACTION

SEER_ACTION


NIGHT_RESOLVE


DAY_START


DEATH_ANNOUNCE


SPEECH


DISCUSSION


VOTE


EXECUTION


DEATH_TRIGGER


WIN_CHECK


GAME_END


9. Action 系统
所有行为统一：
interface Action {


type:string;


actor:string;


target?:string;


data?:unknown;


}

例如：
狼人：
{
type:"kill",
actor:"wolf1",
target:"player5"
}

投票：
{
type:"vote",
actor:"player2",
target:"player8"
}

10. Event 系统
不用字符串日志。
统一：
interface Event {


id:string;


type:string;


phase:Phase;


visibility:Visibility;


payload:any;


}

Visibility:
enum Visibility {

PUBLIC,

PRIVATE,

GOD

}

11. Controller
核心接口：
interface PlayerController {


decide(
context:PlayerContext
):Promise<Action>


}

第一阶段：
RandomController

第二阶段：
LLMController

第三阶段：
HumanReplayController

12. Board设计
板型不是代码。
是配置。
例如：
const PreWolfHunterIdiot={


players:12,


roles:[

"WOLF",
"WOLF",
"WOLF",
"WOLF",

"SEER",

"WITCH",

"HUNTER",

"IDIOT",

"VILLAGER",
"VILLAGER",
"VILLAGER",
"VILLAGER"

]


}

13. 第一版本功能
必须完成
游戏
✅ 三板型
✅ 夜晚流程
✅ 白天流程
✅ 投票
✅ 死亡
✅ 技能
UI
✅ 创建游戏
✅ 查看状态
✅ 查看事件
✅ 回放
数据
✅ SQLite
✅ Event保存
14. 不实现
明确禁止：
❌ 在线房间
❌ 真人操作
❌ 排位
❌ 匹配
❌ 自定义角色编辑器
❌ 通用插件系统
❌ 复杂 AI Memory
15. AI阶段设计
接入时：
不是修改 Engine。
新增：
LLMController

输入：
角色身份
+
公开信息
+
私有信息
+
历史记忆

输出：
Action

+
Speech

+
Internal Belief

16. Observer设计
独立：
不是玩家。
输入：
Public Events
+
Speech
+
Votes

输出：
{
players:{
5:{
wolf_probability:0.65,
possible_motives:[
"fake attack",
"real suspicion"
]
}
}
}

17. 开发顺序
Phase 0 重建
删除旧 src。
重新建立：
domain
engine
roles
controller
Phase 1
完成：
预女猎白
Random Controller
Web UI
Phase 2
增加：
狼王守卫
骑士狼美人
Phase 3
LLM Controller
Phase 4
Observer
Phase 5
真人语音分析
