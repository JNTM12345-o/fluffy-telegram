import { useEffect, useRef } from 'react'
import type { Player } from '../types'

interface Props {
  players: Player[]
  answererId: string | null
  myPlayerId: string | null
}

export default function ScoreBoard({ players, answererId, myPlayerId }: Props) {
  // 按分数排序
  const sorted = [...players].sort((a, b) => b.score - a.score)

  return (
    <div className="glass rounded-2xl p-4 space-y-2">
      <div className="font-display text-xs tracking-widest uppercase text-slate-400 mb-3 text-center">
        🏆 实时积分
      </div>
      <div className="space-y-1.5">
        {sorted.map((player, index) => (
          <div
            key={player.id}
            className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
              player.id === answererId
                ? 'bg-white/15 border-2'
                : player.id === myPlayerId
                  ? 'bg-white/5'
                  : ''
            }`}
            style={player.id === answererId ? { borderColor: player.color } : {}}
          >
            <div className="w-6 text-center font-display font-bold text-sm text-slate-400">
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
            </div>
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: player.color }}
            />
            <div className="flex-1 min-w-0">
              <span className="text-white text-sm font-medium truncate block">
                {player.nickname}
                {player.id === myPlayerId && <span className="ml-1 text-xs text-slate-400">(你)</span>}
              </span>
              {player.id === answererId && (
                <span className="text-xs" style={{ color: player.color }}>
                  ⚡ 正在作答
                </span>
              )}
            </div>
            <AnimatedScore score={player.score} color={player.color} />
          </div>
        ))}
      </div>
    </div>
  )
}

function AnimatedScore({ score, color }: { score: number; color: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prevRef = useRef(score)

  useEffect(() => {
    if (prevRef.current !== score && ref.current) {
      ref.current.classList.remove('animate-pop-in')
      void ref.current.offsetWidth // 触发重排
      ref.current.classList.add('animate-pop-in')
    }
    prevRef.current = score
  }, [score])

  return (
    <span
      ref={ref}
      className="font-display font-bold text-lg"
      style={{ color }}
    >
      {score}
    </span>
  )
}
