# 多人抢答游戏 · 实现计划

> **For agentic workers:** 使用 subagent-driven-development 或 executing-plans 逐步实施。

**目标：** 构建一个局域网多人抢答游戏，支持 3-6 名玩家，主机大屏展示，各手机抢答

**架构：** 前端 React SPA + 后端 Node.js WebSocket 服务器，房间码配对，状态全量同步

**技术栈：** React 18 + TypeScript + Vite + Tailwind + Zustand + ws (WebSocket)

---

## 文件结构

```
d:\文档\qdyx\
├── api/                          # 后端
│   ├── package.json
│   ├── server.ts                 # WebSocket 服务器
│   └── types.ts                  # 共享类型（也供前端导入）

├── src/
│   ├── App.tsx                   # 重构：根据角色渲染 Lobby/Host/Player/Result
│   ├── store/
│   │   ├── gameStore.ts          # 重构：多人游戏状态
│   │   └── wsStore.ts            # NEW：WebSocket 连接状态
│   ├── pages/
│   │   ├── LobbyPage.tsx         # NEW：主页（创建/加入房间）
│   │   ├── HostPage.tsx          # NEW：主机大屏
│   │   ├── PlayerPage.tsx        # NEW：手机端页面
│   │   ├── ResultPage.tsx        # 重构：多人结果页
│   │   ├── StartPage.tsx         # 删除（合并到 LobbyPage）
│   │   └── GamePage.tsx          # 删除（拆分为 HostPage + PlayerPage）
│   ├── components/
│   │   ├── Timer.tsx             # 保留
│   │   ├── QuestionCard.tsx       # 保留
│   │   ├── OptionButton.tsx      # 保留
│   │   ├── PWABanner.tsx         # 保留
│   │   ├── ScoreBoard.tsx        # NEW：多人实时分数板
│   │   ├── RoomLobby.tsx         # NEW：等待大厅
│   │   ├── ConfigPanel.tsx       # NEW：房主难度配置
│   │   └── PlayerList.tsx        # NEW：在线玩家列表
│   ├── hooks/
│   │   └── useWebSocket.ts        # NEW：WebSocket 连接 hook
│   └── data/
│       └── questions.ts           # 保留
```

---

## 实施步骤

### Task 1: 后端基础 — WebSocket 服务器

**Files:**
- Create: `api/package.json`
- Create: `api/types.ts`
- Create: `api/server.ts`

- [ ] **Step 1: 创建 api/package.json**

```json
{
  "name": "qdyx-multiplayer-api",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "ws": "^8.18.0"
  }
}
```

- [ ] **Step 2: 创建 api/types.ts（共享类型）**

```typescript
// 玩家信息
export interface Player {
  id: string
  nickname: string
  score: number
  isHost: boolean
  isReady: boolean
  isConnected: boolean
  color: string  // 分配的颜色 hex
}

// 房间配置
export interface RoomConfig {
  timePerQuestion: 5 | 10 | 15
  wrongAnswerPenalty: 0 | 50 | 100
  totalRounds: number
}

// 房间状态
export interface RoomState {
  roomCode: string
  players: Player[]
  phase: 'waiting' | 'playing' | 'result'
  currentRound: number
  config: RoomConfig
  currentQuestion: import('./questions.js').Question | null
  answererId: string | null    // 当前抢到答题权的人 ID
  roundPhase: 'question' | 'race' | 'answer' | 'feedback'
  roundStartTime: number | null
}

// 消息方向
export type ClientToServer =
  | { type: 'create_room'; nickname: string; config: RoomConfig }
  | { type: 'join_room'; roomCode: string; nickname: string }
  | { type: 'toggle_ready' }
  | { type: 'start_game' }
  | { type: 'race_answer' }
  | { type: 'submit_answer'; selectedIndex: number }
  | { type: 'leave_room' }

export type ServerToClient =
  | { type: 'room_state'; state: RoomState }
  | { type: 'error'; message: string }
  | { type: 'joined'; playerId: string; state: RoomState }
  | { type: 'race_won'; playerId: string }
  | { type: 'round_result'; correct: boolean; correctIndex: number; scores: Record<string, number>; playerScores: Record<string, number> }
```

- [ ] **Step 3: 创建 api/server.ts**

实现以下逻辑：
1. 启动 ws 服务器，监听 8080 端口
2. 生成 4 位房间码（A-Z, 0-9，排除易混淆字符）
3. 房间数据结构 Map<roomCode, RoomState>
4. 处理 6 种消息：create_room / join_room / toggle_ready / start_game / race_answer / submit_answer / leave_room
5. 广播 room_state 到所有房间成员
6. 游戏流程状态机：waiting → playing（10轮）→ result → waiting
7. 首个玩家创建房间时自动成为 host
8. host 离开则房间解散

- [ ] **Step 4: 安装后端依赖并测试**

```bash
cd api && npm install
node server.js
# 确认输出：WebSocket server running on ws://0.0.0.0:8080
```

---

### Task 2: WebSocket 连接层 — useWebSocket Hook + wsStore

**Files:**
- Create: `src/store/wsStore.ts`
- Create: `src/hooks/useWebSocket.ts`

- [ ] **Step 1: 创建 src/store/wsStore.ts**

Zustand store 管理：
- `connected: boolean` — 是否已连接服务器
- `currentRoom: string | null` — 当前房间码
- `myPlayerId: string | null` — 我的玩家 ID
- `nickname: string` — 我的昵称
- `isHost: boolean` — 是否房主
- `error: string | null` — 错误信息
- `connect(url: string)` — 连接服务器
- `disconnect()` — 断开连接

- [ ] **Step 2: 创建 src/hooks/useWebSocket.ts**

- useEffect 中建立 WebSocket 连接
- 自动重连（3 次失败后停止）
- 将收到的消息派发到 gameStore 更新状态
- 提供 `send(msg)` 方法供各页面调用
- 组件卸载时清理连接

---

### Task 3: 重构 gameStore 为多人模式

**Files:**
- Modify: `src/store/gameStore.ts`（完全重写）

- [ ] **Step 1: 重写 gameStore.ts**

新的状态结构：
```typescript
interface MultiGameState {
  // 来自 wsStore 的派生（只读）
  roomState: RoomState | null

  // 本地 UI 状态
  myNickname: string
  myPlayerId: string | null
  isHost: boolean

  // 游戏 UI 状态
  selectedAnswer: number | null
  hasRaced: boolean         // 本轮是否已抢答
  roundResultShown: boolean // 本轮结果是否已显示
  roundResult: { correct: boolean; correctIndex: number } | null

  // Action
  setRoomState: (state: RoomState) => void
  setMyInfo: (id: string, nickname: string, isHost: boolean) => void
  selectAnswer: (index: number) => void
  setRaced: (v: boolean) => void
  setRoundResult: (r: any) => void
  resetRoundUI: () => void
}
```

---

### Task 4: 主页 — LobbyPage

**Files:**
- Create: `src/pages/LobbyPage.tsx`

- [ ] **Step 1: 创建 LobbyPage.tsx**

布局：
- 顶部 Logo + 标题
- 两个大按钮：**「创建房间」** 和 **「加入房间」**
- 创建房间：输入昵称 → ConfigPanel（难度选择）→ 连接 WS → 创建房间 → 跳转 HostPage
- 加入房间：输入房间码 + 昵称 → 连接 WS → 加入房间 → 跳转 PlayerPage
- 底部 PWA 横幅

---

### Task 5: 主机大屏 — HostPage

**Files:**
- Create: `src/pages/HostPage.tsx`
- Create: `src/components/ScoreBoard.tsx`
- Create: `src/components/RoomLobby.tsx`

- [ ] **Step 1: 创建 HostPage.tsx**

三区域布局（响应式）：
- **左侧 20%**：在线玩家列表（RoomLobby 组件）
- **中央 60%**：题目展示 / 等待界面 / 结果界面（根据 phase）
- **右侧 20%**：实时分数板（ScoreBoard 组件）

phase='waiting' 时：显示等待大厅 + 准备状态 + 开始按钮（需至少 2 人就绪才可开始）

phase='playing' 时：
- 顶部：房间码 + 当前题目进度
- 中央：QuestionCard
- 底部：Timer + answerer 提示（"⚡ 张三 正在作答"）
- 答题阶段：显示 4 个选项按钮

phase='result' 时：结果排名

- [ ] **Step 2: 创建 ScoreBoard.tsx**

- 显示所有玩家昵称 + 分数
- 当前答题者高亮
- 分数变化时数字跳动动画
- 排名顺序实时排列
- 每个玩家用分配的颜色标识

- [ ] **Step 3: 创建 RoomLobby.tsx**

- 显示所有玩家（昵称 + 颜色块 + 状态徽章）
- 房主视角：显示「X/Y 人已准备」+ 「开始游戏」按钮
- 非房主视角：显示等待提示

---

### Task 6: 手机端 — PlayerPage

**Files:**
- Create: `src/pages/PlayerPage.tsx`
- Create: `src/components/PlayerList.tsx`（简化版玩家列表）

- [ ] **Step 1: 创建 PlayerPage.tsx**

根据 roomState.phase 分三视图：

**waiting 阶段**：
- 房间码显示
- 玩家列表
- 「已准备」/「取消准备」切换按钮
- 房主：额外显示「开始游戏」按钮

**抢答阶段（roundPhase='race'）**：
- 全屏超大「⚡ 抢答！」按钮（占屏幕 60%，圆圈脉冲动画）
- 抢答成功后：显示「你抢到了！」提示，然后进入作答阶段

**作答阶段（roundPhase='answer'）**：
- 显示题目文本
- 4 个选项按钮
- 倒计时（与主机同步）
- 提交后进入反馈

**反馈阶段（roundPhase='feedback'）**：
- 显示对/错
- 本轮得分变化
- 等待下一题

- [ ] **Step 2: 创建 PlayerList.tsx**

简化的水平玩家列表，横向排列，带颜色标识

---

### Task 7: 重构 App.tsx 路由

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 重构 App.tsx**

根据 wsStore 和 gameStore 决定渲染：
```typescript
// 无连接 → LobbyPage
// 已连接 + isHost → HostPage
// 已连接 + !isHost → PlayerPage
// phase === 'result' → ResultPage（通用）
```

---

### Task 8: 更新配置脚本

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 更新 package.json scripts**

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:client": "vite",
    "dev:server": "cd api && node --watch server.js",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "start": "npm run dev"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

---

### Task 9: 整体测试

- [ ] **Step 1: 启动后端服务器**

```bash
cd api && npm install && node server.js
# 确认：WebSocket server running on ws://0.0.0.0:8080
```

- [ ] **Step 2: 启动前端开发服务器**

```bash
npm install && npm run dev
# 确认：http://localhost:5173/
```

- [ ] **Step 3: 手动测试流程**

1. 浏览器打开 http://localhost:5173/ → 点击「创建房间」→ 输入昵称 → 配置难度 → 创建
2. 确认跳转到 HostPage，显示房间码
3. 另一个浏览器/标签页 → 输入房间码和昵称加入
4. 确认两边玩家列表同步显示
5. 主机点击「开始游戏」
6. 确认双方进入 playing 状态
7. 手机端点击「抢答」
8. 确认主机显示答题者
9. 答题并确认反馈同步

---

## 依赖安装总览

```bash
# 后端
cd api && npm install

# 前端
cd .. && npm install
npm install -D concurrently  # 可选：同时启动前后端
```
