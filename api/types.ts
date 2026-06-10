// 玩家信息
export interface Player {
  id: string
  nickname: string
  score: number
  isHost: boolean
  isReady: boolean
  isConnected: boolean
  color: string // 分配的颜色 hex
}

// 房间配置
export interface RoomConfig {
  timePerQuestion: 5 | 10 | 15
  wrongAnswerPenalty: 0 | 50 | 100
  totalRounds: number
}

// 题目（与前端共用）
export interface Question {
  id: number
  text: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  category: string
}

// 房间状态
export interface RoomState {
  roomCode: string
  players: Player[]
  phase: 'waiting' | 'playing' | 'result'
  currentRound: number // 当前题目索引（0-9），-1 表示等待中
  config: RoomConfig
  currentQuestion: Question | null
  answererId: string | null // 当前抢到答题权的人 ID
  roundPhase: 'race' | 'answer' | 'feedback'
  roundStartTime: number | null
  roundResult: {
    correct: boolean
    correctIndex: number
    scores: Record<string, number>
  } | null
}

// 客户端→服务端消息
export type ClientToServer =
  | { type: 'create_room'; nickname: string; config: RoomConfig }
  | { type: 'join_room'; roomCode: string; nickname: string }
  | { type: 'toggle_ready' }
  | { type: 'start_game' }
  | { type: 'race_answer' }
  | { type: 'submit_answer'; selectedIndex: number }
  | { type: 'leave_room' }

// 服务端→客户端消息
export type ServerToClient =
  | { type: 'room_state'; state: RoomState }
  | { type: 'error'; message: string }
  | { type: 'joined'; playerId: string; state: RoomState }
  | { type: 'race_won'; playerId: string }
  | { type: 'round_result'; correct: boolean; correctIndex: number; scores: Record<string, number> }
