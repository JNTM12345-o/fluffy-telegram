import express from 'express'
import { WebSocketServer, WebSocket } from 'ws'
import http from 'http'

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

const rooms = new Map()
const roomCodes = new Set()

function generateRoomCode() {
  let code
  do {
    code = Math.random().toString(36).substring(2, 6).toUpperCase()
  } while (roomCodes.has(code))
  roomCodes.add(code)
  return code
}

function broadcastState(room) {
  const state = {
    code: room.code,
    hostId: room.hostId,
    players: Array.from(room.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      color: p.color,
      isHost: p.id === room.hostId
    })),
    status: room.status,
    currentRound: room.currentRound,
    totalRounds: room.totalRounds,
    question: room.question,
    correctAnswer: room.correctAnswer,
    roundPhase: room.roundPhase,
    timeLeft: room.timeLeft,
    config: room.config,
    winner: room.winner
  }
  room.players.forEach((player) => {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify(state))
    }
  })
}

function handleMessage(ws, data) {
  try {
    const msg = JSON.parse(data)
    const { type, payload } = msg

    switch (type) {
      case 'create_room': {
        const { playerName, config } = payload
        const code = generateRoomCode()
        const player = {
          id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: playerName,
          score: 0,
          color: PLAYER_COLORS[0],
          ws
        }
        const room = {
          code,
          hostId: player.id,
          players: new Map([[player.id, player]]),
          status: 'waiting',
          currentRound: 0,
          totalRounds: config.totalRounds,
          question: null,
          correctAnswer: null,
          roundPhase: 'idle',
          timeLeft: null,
          config,
          winner: null,
          timers: { race: null, answer: null }
        }
        rooms.set(code, room)
        ws.send(JSON.stringify({ type: 'room_created', payload: { code, playerId: player.id } }))
        broadcastState(room)
        break
      }

      case 'join_room': {
        const { code, playerName } = payload
        const room = rooms.get(code)
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', payload: { message: '房间不存在' } }))
          return
        }
        if (room.status !== 'waiting') {
          ws.send(JSON.stringify({ type: 'error', payload: { message: '房间游戏已开始' } }))
          return
        }
        if (room.players.size >= room.config.maxPlayers) {
          ws.send(JSON.stringify({ type: 'error', payload: { message: '房间已满' } }))
          return
        }
        const player = {
          id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: playerName,
          score: 0,
          color: PLAYER_COLORS[room.players.size],
          ws
        }
        room.players.set(player.id, player)
        ws.send(JSON.stringify({ type: 'joined_room', payload: { code, playerId: player.id } }))
        broadcastState(room)
        break
      }

      case 'start_game': {
        const { code } = payload
        const room = rooms.get(code)
        if (!room) return
        room.status = 'playing'
        room.currentRound = 1
        startRound(room)
        broadcastState(room)
        break
      }

      case 'race': {
        const { code, playerId } = payload
        const room = rooms.get(code)
        if (!room || room.roundPhase !== 'racing') return
        if (!room.firstRacer) {
          room.firstRacer = playerId
          room.roundPhase = 'answering'
          clearTimeout(room.timers.race)
          startAnswerPhase(room)
          broadcastState(room)
        }
        break
      }

      case 'answer': {
        const { code, playerId, answerIndex } = payload
        const room = rooms.get(code)
        if (!room || room.roundPhase !== 'answering') return
        if (room.firstRacer !== playerId) {
          ws.send(JSON.stringify({ type: 'error', payload: { message: '不是你抢答成功' } }))
          return
        }
        clearTimeout(room.timers.answer)
        const isCorrect = answerIndex === room.question.correctIndex
        const player = room.players.get(playerId)
        if (isCorrect) {
          player.score += room.config.timePerQuestion * 10 + 50
        } else {
          player.score = Math.max(0, player.score - room.config.wrongAnswerPenalty)
        }
        room.roundPhase = 'result'
        room.correctAnswer = room.question.correctIndex
        broadcastState(room)
        setTimeout(() => {
          nextRound(room)
        }, 3000)
        break
      }

      case 'leave_room': {
        const { code, playerId } = payload
        const room = rooms.get(code)
        if (!room) return
        const player = room.players.get(playerId)
        if (player) {
          room.players.delete(playerId)
          if (playerId === room.hostId) {
            room.players.forEach((p) => {
              if (p.ws.readyState === WebSocket.OPEN) {
                p.ws.send(JSON.stringify({ type: 'host_left' }))
              }
            })
            rooms.delete(code)
            roomCodes.delete(code)
          } else {
            broadcastState(room)
          }
        }
        break
      }

      case 'get_state': {
        const { code } = payload
        const room = rooms.get(code)
        if (room) {
          broadcastState(room)
        }
        break
      }
    }
  } catch (err) {
    console.error('消息处理错误:', err)
  }
}

function startRound(room) {
  const availableQuestions = QUESTION_BANK.filter(q => !room.usedQuestions?.includes(q.id))
  if (availableQuestions.length === 0) {
    room.usedQuestions = []
    room.question = QUESTION_BANK[Math.floor(Math.random() * QUESTION_BANK.length)]
  } else {
    room.question = availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
  }
  room.usedQuestions = room.usedQuestions || []
  room.usedQuestions.push(room.question.id)
  room.correctAnswer = null
  room.firstRacer = null
  room.roundPhase = 'racing'
  room.timeLeft = room.config.timePerQuestion
  startRacePhase(room)
}

function startRacePhase(room) {
  room.timers.race = setTimeout(() => {
    if (room.roundPhase === 'racing') {
      room.roundPhase = 'answering'
      room.firstRacer = null
      startAnswerPhase(room)
      broadcastState(room)
    }
  }, 3000)
}

function startAnswerPhase(room) {
  room.timeLeft = room.config.timePerQuestion
  const timer = setInterval(() => {
    room.timeLeft--
    if (room.timeLeft <= 0) {
      clearInterval(timer)
      room.roundPhase = 'result'
      room.correctAnswer = room.question.correctIndex
      broadcastState(room)
      setTimeout(() => {
        nextRound(room)
      }, 3000)
    } else {
      broadcastState(room)
    }
  }, 1000)
  room.timers.answer = timer
}

function nextRound(room) {
  if (room.currentRound >= room.totalRounds) {
    room.status = 'ended'
    const players = Array.from(room.players.values())
    room.winner = players.reduce((a, b) => a.score > b.score ? a : b)
    broadcastState(room)
  } else {
    room.currentRound++
    startRound(room)
    broadcastState(room)
  }
}

function handleLeave(ws) {
  for (const [code, room] of rooms) {
    for (const [playerId, player] of room.players) {
      if (player.ws === ws) {
        room.players.delete(playerId)
        if (playerId === room.hostId) {
          room.players.forEach((p) => {
            if (p.ws.readyState === WebSocket.OPEN) {
              p.ws.send(JSON.stringify({ type: 'host_left' }))
            }
          })
          rooms.delete(code)
          roomCodes.delete(code)
        } else if (room.players.size === 0) {
          rooms.delete(code)
          roomCodes.delete(code)
        } else {
          broadcastState(room)
        }
        return
      }
    }
  }
}

const app = express()
app.use(express.json())

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

app.get('/health', (req, res) => {
  res.send('OK')
})

app.get('/', (req, res) => {
  res.send('多人抢答游戏服务器')
})

const PORT = process.env.PORT || 8080
const server = http.createServer(app)
const wss = new WebSocketServer({ noServer: true })

server.on('upgrade', (request, socket, head) => {
  if (request.url === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request)
    })
  }
})

wss.on('connection', (ws) => {
  console.log(`[+] 连接 | 当前房间数: ${rooms.size}`)
  ws.on('message', (data) => handleMessage(ws, data.toString()))
  ws.on('close', () => { handleLeave(ws); console.log(`[-] 断开 | 当前房间数: ${rooms.size}`) })
  ws.on('error', (err) => { console.error('WS错误:', err.message); handleLeave(ws) })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log('')
  console.log('  🎮  多人抢答服务器')
  console.log(`  📡  WebSocket: ws://localhost:${PORT}/ws`)
  console.log(`  🌐  局域网:   ws://<本机IP>:${PORT}/ws`)
  console.log(`  ☁️  云端:     wss://<你的域名>/ws`)
  console.log('')
})