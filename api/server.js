import { WebSocketServer, WebSocket } from 'ws'
import http from 'http'

// ============ 题库 ============
const QUESTION_BANK = [
  { id: 1, text: '世界上最大的海洋是哪一个？', options: ['大西洋', '印度洋', '太平洋', '北冰洋'], correctIndex: 2, category: '地理' },
  { id: 2, text: '人体最大的器官是？', options: ['肝脏', '皮肤', '大脑', '心脏'], correctIndex: 1, category: '科学' },
  { id: 3, text: '一年中最长的月份有多少天？', options: ['28天', '30天', '31天', '32天'], correctIndex: 2, category: '常识' },
  { id: 4, text: '光在真空中的速度约为？', options: ['每秒3万公里', '每秒30万公里', '每秒300万公里', '每秒3亿公里'], correctIndex: 1, category: '科学' },
  { id: 5, text: '"海内存知己，天涯若比邻"出自哪位诗人之手？', options: ['李白', '杜甫', '王勃', '白居易'], correctIndex: 2, category: '文学' },
  { id: 6, text: '世界上最高的山峰是？', options: ['乔戈里峰', '珠穆朗玛峰', '干城章嘉峰', '洛子峰'], correctIndex: 1, category: '地理' },
  { id: 7, text: 'HTML 代表什么？', options: ['Hyper Trainer Marking Language', 'Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language'], correctIndex: 1, category: '编程' },
  { id: 8, text: '太阳系中距离太阳最近的行星是？', options: ['金星', '火星', '水星', '地球'], correctIndex: 2, category: '科学' },
  { id: 9, text: '中国古代四大发明中，不包括下列哪一项？', options: ['造纸术', '火药', '印刷术', '瓷器'], correctIndex: 3, category: '历史' },
  { id: 10, text: '一部电影时长 120 分钟，它合多少小时？', options: ['1小时', '1.5小时', '2小时', '2.5小时'], correctIndex: 2, category: '常识' },
  { id: 11, text: 'JavaScript 中哪个关键字用于声明常量？', options: ['var', 'let', 'const', 'static'], correctIndex: 2, category: '编程' },
  { id: 12, text: '世界上面积最小的大洲是？', options: ['欧洲', '南极洲', '大洋洲', '北美洲'], correctIndex: 2, category: '地理' },
  { id: 13, text: '下列哪种动物不是哺乳动物？', options: ['鲸鱼', '蝙蝠', '企鹅', '海豚'], correctIndex: 2, category: '科学' },
  { id: 14, text: '"路漫漫其修远兮，吾将上下而求索"出自？', options: ['《诗经》', '《离骚》', '《论语》', '《庄子》'], correctIndex: 1, category: '文学' },
  { id: 15, text: '奥运会多少年举办一届？', options: ['每2年', '每3年', '每4年', '每5年'], correctIndex: 2, category: '常识' },
  { id: 16, text: '计算机的 CPU 指的是？', options: ['存储器', '中央处理器', '显卡', '主板'], correctIndex: 1, category: '编程' },
  { id: 17, text: '中国的首都是？', options: ['上海', '北京', '广州', '深圳'], correctIndex: 1, category: '地理' },
  { id: 18, text: '一公里等于多少米？', options: ['100米', '500米', '1000米', '10000米'], correctIndex: 2, category: '常识' },
  { id: 19, text: '地球围绕什么旋转？', options: ['月亮', '太阳', '银河系', '北极星'], correctIndex: 1, category: '科学' },
  { id: 20, text: '"天生我材必有用"是哪位诗人的名句？', options: ['李白', '苏轼', '辛弃疾', '陆游'], correctIndex: 0, category: '文学' },
]

const PLAYER_COLORS = ['#22d3ee', '#f472b6', '#a78bfa', '#a3e635', '#fb923c', '#f87171']

// ============ 房间管理 ============
const rooms = new Map()
const clientRooms = new Map()

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  if (rooms.has(code)) return generateRoomCode()
  return code
}

function generatePlayerId() {
  return Math.random().toString(36).substring(2, 10)
}

function pickRandomQuestions(n) {
  const shuffled = [...QUESTION_BANK].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(n, QUESTION_BANK.length))
}

function send(ws, msg) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg))
}

function broadcast(room, msg, excludeId) {
  room.clients.forEach((clientWs, playerId) => {
    if (playerId !== excludeId) send(clientWs, msg)
  })
}

function broadcastAll(room, msg) {
  broadcast(room, msg, undefined)
}

function broadcastState(room) {
  broadcastAll(room, { type: 'room_state', state: room.state })
}

function getRoomOf(ws) {
  const info = clientRooms.get(ws)
  if (!info) return null
  return rooms.get(info.roomCode) ?? null
}

function clearRoomTimers(room) {
  if (room.raceTimer) {
    clearTimeout(room.raceTimer)
    room.raceTimer = null
  }
  if (room.answerTimer) {
    clearTimeout(room.answerTimer)
    room.answerTimer = null
  }
  if (room.feedbackTimer) {
    clearTimeout(room.feedbackTimer)
    room.feedbackTimer = null
  }
}

function startRacePhase(room) {
  clearRoomTimers(room)
  room.state.roundPhase = 'race'
  room.state.answererId = null
  room.state.roundStartTime = Date.now()
  broadcastState(room)
  
  const timeoutMs = room.state.config.timePerQuestion * 1000
  room.raceTimer = setTimeout(() => {
    if (!rooms.has(room.state.roomCode)) return
    if (room.state.roundPhase !== 'race') return
    
    const connectedPlayers = room.state.players.filter(p => p.isConnected)
    if (connectedPlayers.length === 0) {
      room.state.phase = 'result'
      broadcastState(room)
      return
    }
    
    const randomPlayer = connectedPlayers[Math.floor(Math.random() * connectedPlayers.length)]
    room.state.answererId = randomPlayer.id
    room.state.roundPhase = 'answer'
    room.state.roundStartTime = Date.now()
    broadcastAll(room, { type: 'race_won', playerId: randomPlayer.id })
    broadcastState(room)
    
    startAnswerPhase(room)
  }, timeoutMs)
}

function startAnswerPhase(room) {
  clearRoomTimers(room)
  room.state.roundPhase = 'answer'
  room.state.roundStartTime = Date.now()
  broadcastState(room)
  
  const timeoutMs = room.state.config.timePerQuestion * 1000
  room.answerTimer = setTimeout(() => {
    if (!rooms.has(room.state.roomCode)) return
    if (room.state.roundPhase !== 'answer') return
    
    handleSubmitAnswer(room, room.state.answererId, -1)
  }, timeoutMs)
}

function handleSubmitAnswer(room, playerId, selectedIndex) {
  clearRoomTimers(room)
  
  const question = room.state.currentQuestion
  if (!question) return
  
  const player = room.state.players.find((p) => p.id === playerId)
  if (!player) return
  
  const correct = selectedIndex >= 0 && selectedIndex === question.correctIndex
  const timeUsed = room.state.roundStartTime ? (Date.now() - room.state.roundStartTime) / 1000 : room.state.config.timePerQuestion
  const baseScore = correct ? 100 : 0
  const bonus = correct ? Math.max(0, Math.floor((room.state.config.timePerQuestion - timeUsed) * 10)) : 0
  const gained = baseScore + bonus
  const penalty = !correct ? room.state.config.wrongAnswerPenalty : 0
  
  if (player.isConnected) {
    player.score += gained - penalty
  }
  
  room.state.roundResult = {
    correct,
    correctIndex: question.correctIndex,
    scores: Object.fromEntries(room.state.players.map((p) => [p.id, p.score])),
  }
  room.state.roundPhase = 'feedback'
  broadcastState(room)
  
  room.feedbackTimer = setTimeout(() => {
    if (!rooms.has(room.state.roomCode)) return
    
    room.state.answererId = null
    room.state.roundResult = null
    
    if (room.state.currentRound + 1 >= room.currentQuestions.length) {
      room.state.phase = 'result'
      broadcastState(room)
    } else {
      room.state.currentRound++
      room.state.currentQuestion = room.currentQuestions[room.state.currentRound]
      startRacePhase(room)
    }
  }, 3000)
}

// ============ 消息处理 ============
function handleMessage(ws, raw) {
  let msg
  try {
    msg = JSON.parse(raw)
  } catch {
    send(ws, { type: 'error', message: '无效的消息格式' })
    return
  }

  switch (msg.type) {
    case 'create_room': {
      if (clientRooms.has(ws)) {
        send(ws, { type: 'error', message: '请先离开当前房间' })
        return
      }
      const roomCode = generateRoomCode()
      const playerId = generatePlayerId()
      const player = {
        id: playerId,
        nickname: (msg.nickname || '玩家1').substring(0, 6),
        score: 0,
        isHost: true,
        isReady: true,
        isConnected: true,
        color: PLAYER_COLORS[0],
      }
      const room = {
        state: {
          roomCode,
          players: [player],
          phase: 'waiting',
          currentRound: -1,
          config: { ...msg.config, totalRounds: 10 },
          currentQuestion: null,
          answererId: null,
          roundPhase: 'race',
          roundStartTime: null,
          roundResult: null,
        },
        clients: new Map([[playerId, ws]]),
        currentQuestions: [],
        raceTimer: null,
        answerTimer: null,
        feedbackTimer: null,
      }
      rooms.set(roomCode, room)
      clientRooms.set(ws, { roomCode, playerId })
      send(ws, { type: 'joined', playerId, state: room.state })
      break
    }

    case 'join_room': {
      if (clientRooms.has(ws)) {
        send(ws, { type: 'error', message: '请先离开当前房间' })
        return
      }
      const room = rooms.get((msg.roomCode || '').toUpperCase())
      if (!room) {
        send(ws, { type: 'error', message: '房间不存在' })
        return
      }
      if (room.state.phase !== 'waiting') {
        send(ws, { type: 'error', message: '游戏已开始，无法加入' })
        return
      }
      if (room.state.players.length >= room.state.config.maxPlayers) {
        send(ws, { type: 'error', message: `房间已满（限${room.state.config.maxPlayers}人）` })
        return
      }
      if (room.state.players.some((p) => p.nickname === msg.nickname)) {
        send(ws, { type: 'error', message: '昵称已被使用' })
        return
      }
      const playerId = generatePlayerId()
      const player = {
        id: playerId,
        nickname: (msg.nickname || '玩家1').substring(0, 6),
        score: 0,
        isHost: false,
        isReady: false,
        isConnected: true,
        color: PLAYER_COLORS[room.state.players.length % PLAYER_COLORS.length],
      }
      room.state.players.push(player)
      room.clients.set(playerId, ws)
      clientRooms.set(ws, { roomCode: room.state.roomCode, playerId })
      send(ws, { type: 'joined', playerId, state: room.state })
      broadcast(room, { type: 'room_state', state: room.state }, playerId)
      break
    }

    case 'toggle_ready': {
      const room = getRoomOf(ws)
      if (!room) return
      const info = clientRooms.get(ws)
      const player = room.state.players.find((p) => p.id === info.playerId)
      if (!player || player.isHost) return
      player.isReady = !player.isReady
      broadcastState(room)
      break
    }

    case 'start_game': {
      const room = getRoomOf(ws)
      if (!room) return
      const info = clientRooms.get(ws)
      const player = room.state.players.find((p) => p.id === info.playerId)
      if (!player?.isHost) {
        send(ws, { type: 'error', message: '只有房主可以开始游戏' })
        return
      }
      const connectedPlayers = room.state.players.filter(p => p.isConnected)
      if (connectedPlayers.length < 2) {
        send(ws, { type: 'error', message: '至少需要 2 名玩家' })
        return
      }
      room.currentQuestions = pickRandomQuestions(room.state.config.totalRounds)
      room.state.phase = 'playing'
      room.state.currentRound = 0
      room.state.answererId = null
      room.state.roundResult = null
      room.state.currentQuestion = room.currentQuestions[0]
      room.state.players.forEach((p) => { p.score = 0; p.isReady = false })
      startRacePhase(room)
      break
    }

    case 'race_answer': {
      const room = getRoomOf(ws)
      if (!room) return
      const info = clientRooms.get(ws)
      if (room.state.phase !== 'playing') return
      if (room.state.roundPhase !== 'race') return
      if (room.state.answererId !== null) return
      
      const player = room.state.players.find(p => p.id === info.playerId)
      if (!player?.isConnected) return
      
      clearRoomTimers(room)
      room.state.answererId = info.playerId
      room.state.roundPhase = 'answer'
      room.state.roundStartTime = Date.now()
      broadcastAll(room, { type: 'race_won', playerId: info.playerId })
      broadcastState(room)
      
      startAnswerPhase(room)
      break
    }

    case 'submit_answer': {
      const room = getRoomOf(ws)
      if (!room) return
      const info = clientRooms.get(ws)
      if (room.state.phase !== 'playing') return
      if (room.state.roundPhase !== 'answer') return
      if (room.state.answererId !== info.playerId) return
      
      const player = room.state.players.find(p => p.id === info.playerId)
      if (!player?.isConnected) return
      
      handleSubmitAnswer(room, info.playerId, msg.selectedIndex)
      break
    }

    case 'leave_room':
      handleLeave(ws)
      break
  }
}

function handleLeave(ws) {
  const info = clientRooms.get(ws)
  if (!info) return
  
  clientRooms.delete(ws)
  const room = rooms.get(info.roomCode)
  if (!room) return
  
  room.clients.delete(info.playerId)
  
  if (room.state.phase === 'waiting') {
    room.state.players = room.state.players.filter((p) => p.id !== info.playerId)
    if (room.state.players.length === 0) {
      clearRoomTimers(room)
      rooms.delete(info.roomCode)
      return
    }
    if (!room.state.players.some((p) => p.isHost)) {
      room.state.players[0].isHost = true
      room.state.players[0].isReady = true
    }
  } else {
    const player = room.state.players.find((p) => p.id === info.playerId)
    if (player) player.isConnected = false
    
    if (room.state.answererId === info.playerId && room.state.roundPhase === 'answer') {
      room.state.answererId = null
      room.state.roundPhase = 'race'
      room.state.roundStartTime = Date.now()
      broadcastState(room)
      startRacePhase(room)
    }
    
    const connectedPlayers = room.state.players.filter(p => p.isConnected)
    if (connectedPlayers.length === 0) {
      clearRoomTimers(room)
      rooms.delete(info.roomCode)
      return
    }
  }
  
  broadcastState(room)
}

// ============ 启动 ============
const PORT = process.env.PORT || 8080

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('OK')
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('多人抢答游戏服务器')
  }
})

const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (ws) => {
  console.log(`[+] 连接 | 当前房间数: ${rooms.size}`)
  ws.on('message', (data) => handleMessage(ws, data.toString()))
  ws.on('close', () => { handleLeave(ws); console.log(`[-] 断开 | 当前房间数: ${rooms.size}`) })
  ws.on('error', (err) => { console.error('WS错误:', err.message); handleLeave(ws) })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log('')
  console.log('  🎮  多人抢答服务器')
  console.log(`  📡  WebSocket: ws://localhost:${PORT}`)
  console.log(`  🌐  局域网:   ws://<本机IP>:${PORT}`)
console.log(`  ☁️  云端:     ws://<你的域名>:${PORT}`)
console.log('')
