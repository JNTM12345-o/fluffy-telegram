import { useState, useRef, useCallback, useEffect } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import RoomLobby from '../components/RoomLobby'
import OptionButton from '../components/OptionButton'
import type { ClientToServer } from '../types'

interface Props {
  send: (msg: ClientToServer) => void
}

export default function PlayerPage({ send }: Props) {
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

  const me = players.find((p) => p.id === myPlayerId)
  const isMyTurn = answererId === myPlayerId
  const answerer = players.find((p) => p.id === answererId)

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
      <div className="min-h-screen bg-game relative overflow-hidden flex items-center justify-center px-4">
        <div className="absolute inset-0 grid-floor pointer-events-none opacity-20" />
        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="font-display text-xs tracking-widest text-slate-400 uppercase">房间码</div>
            <div className="font-display text-4xl font-black text-neon-cyan text-stroke-cyan tracking-[0.3em] mt-1">
              {roomState.roomCode}
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <RoomLobby
              players={players}
              isHost={hostFlag}
              myPlayerId={myPlayerId}
              onStart={() => send({ type: 'start_game' })}
              onToggleReady={() => send({ type: 'toggle_ready' })}
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
    const myRank = sorted.findIndex((p) => p.id === myPlayerId) + 1
    const myScore = me?.score ?? 0

    return (
      <div className="min-h-screen bg-game relative overflow-hidden flex items-center justify-center px-4">
        <div className="absolute inset-0 grid-floor pointer-events-none opacity-20" />
        <div className="relative z-10 w-full max-w-md text-center">
          <div className="text-5xl mb-4 animate-float">{myRank === 1 ? '🏆' : '🎉'}</div>
          <h2 className="font-display text-3xl font-black text-white mb-1">
            {myRank === 1 ? '冠军！' : `第 ${myRank} 名`}
          </h2>
          <div className="font-display text-5xl font-black bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent my-4">
            {myScore}
          </div>
          <div className="text-slate-400 text-sm">最终得分</div>
          <div className="mt-6 space-y-2 text-left">
            {sorted.slice(0, 5).map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 p-3 rounded-xl glass ${p.id === myPlayerId ? 'border border-white/20' : ''}`}
              >
                <span className="text-lg w-6">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                </span>
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="flex-1 text-white text-sm">{p.nickname}</span>
                <span className="font-display font-bold text-sm" style={{ color: p.color }}>
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
  return (
    <div className="min-h-screen bg-game relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 grid-floor pointer-events-none opacity-15" />

      {/* 顶部状态 */}
      <div className="relative z-10 p-4 flex items-center justify-between">
        <div className="glass rounded-xl px-3 py-1.5 text-xs text-slate-400">
          第 {currentRound + 1}/{config.totalRounds} 题
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: me?.color }} />
          <span className="text-white text-sm">{me?.nickname}</span>
          <span className="font-display font-bold text-neon-cyan text-sm ml-1">{me?.score}</span>
        </div>
      </div>

      {/* 中央内容 */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-8">
        {/* 抢答阶段：显示大大的抢答按钮 */}
        {roundPhase === 'race' && !answererId && (
          <div className="flex flex-col items-center">
            <button
              onClick={handleRace}
              disabled={hasRaced}
              className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full font-display font-black text-2xl text-slate-900 flex flex-col items-center justify-center select-none transition-all active:scale-95 shadow-neon-cyan ${
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

        {/* 有人抢到了 */}
        {roundPhase === 'race' && answererId && answerer && (
          <div className="text-center animate-pop-in">
            <div
              className="inline-block rounded-2xl px-6 py-3 border-2"
              style={{ borderColor: answerer.color, background: `${answerer.color}22` }}
            >
              <div className="text-3xl mb-2">⚡</div>
              <div className="font-display text-lg font-bold" style={{ color: answerer.color }}>
                {answerer.nickname} 抢到了！
              </div>
              <div className="text-xs text-slate-400 mt-1">等待 TA 作答</div>
            </div>
          </div>
        )}

        {/* 作答阶段 */}
        {roundPhase === 'answer' && currentQuestion && (
          <div className="w-full max-w-md animate-pop-in">
            <div className="text-center mb-2">
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">
                {currentQuestion.category}
              </div>
              <div className="glass rounded-xl p-4 mb-4">
                <div className="text-white text-lg font-medium leading-relaxed">
                  {currentQuestion.text}
                </div>
              </div>
            </div>

            {isMyTurn ? (
              <>
                <div className="grid grid-cols-1 gap-2">
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
                <div className="text-center text-xs text-slate-400 mt-4">
                  点击选项作答
                </div>
              </>
            ) : (
              <div className="text-center animate-pulse">
                <div
                  className="inline-block rounded-xl px-6 py-3 border"
                  style={{ borderColor: `${answerer?.color}44`, background: `${answerer?.color}11` }}
                >
                  <div className="font-display text-base" style={{ color: answerer?.color }}>
                    {answerer?.nickname} 正在作答...
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 反馈阶段 */}
        {roundPhase === 'feedback' && roundResult && currentQuestion && (
          <div className="text-center animate-pop-in">
            {roundResult.correct ? (
              <div className="inline-flex flex-col items-center gap-2 px-6 py-5 rounded-2xl bg-neon-lime/20 border-2 border-neon-lime">
                <div className="text-5xl">⚡</div>
                <div className="font-display text-2xl font-black text-neon-lime">正确！</div>
              </div>
            ) : (
              <div className="inline-flex flex-col items-center gap-2 px-6 py-5 rounded-2xl bg-rose-500/20 border-2 border-rose-500">
                <div className="text-5xl">💥</div>
                <div className="font-display text-2xl font-black text-rose-300">错误！</div>
                <div className="text-sm text-slate-300 mt-2">
                  正确答案：{['A', 'B', 'C', 'D'][roundResult.correctIndex]}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
