import { useState, useRef, useCallback, useEffect } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import RoomLobby from '../components/RoomLobby'
import ScoreBoard from '../components/ScoreBoard'
import QuestionCard from '../components/QuestionCard'
import OptionButton from '../components/OptionButton'
import type { ClientToServer } from '../types'

interface Props {
  send: (msg: ClientToServer) => void
}

export default function HostPage({ send }: Props) {
  const { roomState, myPlayerId } = useWebSocket()
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [hasRaced, setHasRaced] = useState(false)
  const lastRoundRef = useRef<number>(-2)

  if (!roomState) return null
  const { players, phase, currentRound, currentQuestion, answererId, roundPhase, roundResult, config } = roomState
  const hostFlag = roomState.players.find((p) => p.id === myPlayerId)?.isHost ?? false

  useEffect(() => {
    if (lastRoundRef.current !== currentRound) {
      lastRoundRef.current = currentRound
      setHasRaced(false)
    }
    if (roundPhase === 'race' && !answererId) {
      setHasRaced(false)
    }
  }, [currentRound, roundPhase, answererId])

  const handleRace = useCallback(() => {
    if (hasRaced) return
    setHasRaced(true)
    send({ type: 'race_answer' })
  }, [send, hasRaced])

  const handleSubmitAnswer = useCallback(
    (index: number) => {
      setSelectedAnswer(index)
      setTimeout(() => {
        send({ type: 'submit_answer', selectedIndex: index })
        setSelectedAnswer(null)
      }, 300)
    },
    [send]
  )

  // 等待阶段
  if (phase === 'waiting') {
    return (
      <div className="min-h-screen bg-game relative overflow-hidden flex">
        <div className="absolute inset-0 grid-floor pointer-events-none opacity-30" />
        <div className="w-full max-w-2xl mx-auto p-6 relative z-10">
          <div className="text-center mb-6">
            <div className="font-display text-sm tracking-widest text-slate-400 uppercase mb-2">房间码</div>
            <div className="font-display text-5xl font-black text-neon-cyan text-stroke-cyan tracking-[0.3em]">
              {roomState.roomCode}
            </div>
            <div className="text-slate-400 text-xs mt-2">分享给其他玩家加入</div>
          </div>
          <div className="glass rounded-2xl p-5">
            <RoomLobby
              players={players}
              isHost={hostFlag}
              myPlayerId={myPlayerId}
              onStart={() => send({ type: 'start_game' })}
              maxPlayers={config.maxPlayers}
            />
          </div>
        </div>
      </div>
    )
  }

  // 结果阶段
  if (phase === 'result') {
    const sorted = [...players].sort((a, b) => b.score - a.score)
    return (
      <div className="min-h-screen bg-game relative overflow-hidden flex items-center justify-center px-4 py-10">
        <div className="absolute inset-0 grid-floor pointer-events-none opacity-20" />
        <div className="relative z-10 max-w-2xl w-full text-center">
          <div className="text-6xl mb-4 animate-float">🏆</div>
          <h1 className="font-display text-4xl font-black text-white mb-2">游戏结束</h1>
          <div className="space-y-3 mt-8">
            {sorted.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center gap-4 p-4 rounded-2xl glass ${i === 0 ? 'border border-neon-cyan/50' : ''}`}
              >
                <span className="font-display text-2xl font-bold w-10 text-slate-400">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                </span>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="flex-1 text-left text-white font-medium">{p.nickname}</span>
                <span className="font-display font-bold text-xl" style={{ color: p.color }}>
                  {p.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 游戏进行中
  const answerer = players.find((p) => p.id === answererId)
  const isMyTurn = answererId === myPlayerId

  return (
    <div className="min-h-screen bg-game relative overflow-hidden">
      <div className="absolute inset-0 grid-floor pointer-events-none opacity-20" />

      {/* 顶部栏 */}
      <div className="relative z-10 p-4 flex items-center justify-between">
        <div className="glass rounded-xl px-4 py-2">
          <span className="font-display text-xs text-slate-400 uppercase tracking-widest">房间码</span>
          <div className="font-display text-xl font-bold text-neon-cyan">{roomState.roomCode}</div>
        </div>
        <div className="text-center">
          <div className="font-display text-xs text-slate-400 uppercase tracking-widest">
            第 {currentRound + 1} / {config.totalRounds} 题
          </div>
          <div className="h-2 w-48 rounded-full bg-white/5 mt-1 overflow-hidden border border-white/10">
            <div
              className="h-full scroll-track transition-all"
              style={{ width: `${((currentRound + 1) / config.totalRounds) * 100}%` }}
            />
          </div>
        </div>
        <div className="glass rounded-xl px-4 py-2 text-right">
          <div className="font-display text-xs text-slate-400 uppercase tracking-widest">配置</div>
          <div className="text-xs text-white">⏱️{config.timePerQuestion}s · 💥-{config.wrongAnswerPenalty}</div>
        </div>
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-80px)] gap-4 p-4">
        {/* 左侧：玩家列表 */}
        <div className="w-56 shrink-0">
          <RoomLobby
              players={players}
              isHost={hostFlag}
              myPlayerId={myPlayerId}
              onStart={() => send({ type: 'start_game' })}
              onToggleReady={() => send({ type: 'toggle_ready' })}
              maxPlayers={config.maxPlayers}
            />
        </div>

        {/* 中央：题目区 */}
        <div className="flex-1 flex flex-col gap-4 items-center justify-center">
          {currentQuestion && <QuestionCard question={currentQuestion} index={currentRound} total={config.totalRounds} />}

          {roundPhase === 'race' && !answererId && (
            <div className="text-center">
              <button
                onClick={handleRace}
                disabled={hasRaced}
                className={`w-48 h-48 rounded-full font-display font-black text-2xl text-slate-900 flex flex-col items-center justify-center select-none transition-all active:scale-95 shadow-neon-cyan ${
                  hasRaced
                    ? 'bg-slate-500/40 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-br from-neon-cyan to-neon-lime hover:scale-105 animate-pulse-glow'
                }`}
              >
                <span className="text-5xl mb-2">⚡</span>
                {hasRaced ? '已抢答' : '抢答！'}
              </button>
              <div className="text-slate-400 text-sm mt-6">
                {hasRaced ? '等待其他玩家...' : '第一个按下的人获得答题权'}
              </div>
            </div>
          )}

          {roundPhase === 'race' && answererId && answerer && (
            <div className="text-center animate-pop-in">
              <div
                className="inline-block rounded-2xl px-8 py-4 border-2"
                style={{ borderColor: answerer.color, background: `${answerer.color}22` }}
              >
                <div className="text-3xl mb-2">⚡</div>
                <div className="font-display text-xl font-bold" style={{ color: answerer.color }}>
                  {answerer.nickname} 抢到答题权！
                </div>
              </div>
            </div>
          )}

          {roundPhase === 'answer' && currentQuestion && (
            <div className="w-full max-w-3xl animate-pop-in">
              {answerer && (
                <div className="flex items-center gap-3 mb-4 justify-center">
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{ background: `${answerer.color}22`, border: `1px solid ${answerer.color}44` }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: answerer.color }} />
                    <span className="text-sm font-medium" style={{ color: answerer.color }}>
                      {answerer.nickname} 作答中
                    </span>
                  </div>
                </div>
              )}
              {isMyTurn ? (
                <div className="grid grid-cols-2 gap-3">
                  {currentQuestion.options.map((opt, i) => (
                    <OptionButton
                      key={i}
                      option={opt}
                      index={i}
                      locked={selectedAnswer !== null}
                      state={selectedAnswer === i ? 'correct' : 'idle'}
                      onClick={() => handleSubmitAnswer(i)}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {currentQuestion.options.map((opt, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 text-white opacity-80"
                    >
                      <span className="font-display text-sm text-neon-cyan mr-2">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {roundPhase === 'feedback' && roundResult && currentQuestion && (
            <div className="text-center animate-pop-in py-4">
              {roundResult.correct ? (
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neon-lime/20 border border-neon-lime text-neon-lime font-bold text-xl">
                  ⚡ 正确！
                </div>
              ) : (
                <div className="inline-flex flex-col items-center gap-2 px-6 py-3 rounded-full bg-rose-500/20 border border-rose-500 text-rose-300 font-bold">
                  <div>💥 错误！</div>
                  <div className="text-sm font-normal">
                    正确答案：{['A', 'B', 'C', 'D'][roundResult.correctIndex]} -{' '}
                    {currentQuestion.options[roundResult.correctIndex]}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 右侧：分数板 */}
        <div className="w-56 shrink-0">
          <ScoreBoard players={players} answererId={answererId} myPlayerId={myPlayerId} />
        </div>
      </div>
    </div>
  )
}
