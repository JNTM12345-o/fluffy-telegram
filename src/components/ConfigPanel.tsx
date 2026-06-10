import type { RoomConfig } from '../types'

interface Props {
  config: RoomConfig
  onChange: (c: RoomConfig) => void
}

export default function ConfigPanel({ config, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-display tracking-wider text-slate-400 uppercase mb-2">
          👥 人数限制
        </label>
        <div className="grid grid-cols-4 gap-2">
          {([3, 4, 5, 6] as const).map((n) => (
            <button
              key={n}
              onClick={() => onChange({ ...config, maxPlayers: n })}
              className={`py-2.5 rounded-xl font-display font-bold text-sm border transition ${
                config.maxPlayers === n
                  ? 'bg-neon-purple/20 border-neon-purple text-neon-purple'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'
              }`}
            >
              {n}人
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-display tracking-wider text-slate-400 uppercase mb-2">
          ⏱️ 每题时间
        </label>
        <div className="grid grid-cols-3 gap-2">
          {([5, 10, 15] as const).map((t) => (
            <button
              key={t}
              onClick={() => onChange({ ...config, timePerQuestion: t })}
              className={`py-2.5 rounded-xl font-display font-bold text-sm border transition ${
                config.timePerQuestion === t
                  ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'
              }`}
            >
              {t}s
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-display tracking-wider text-slate-400 uppercase mb-2">
          💥 答错扣分
        </label>
        <div className="grid grid-cols-3 gap-2">
          {([0, 50, 100] as const).map((p) => (
            <button
              key={p}
              onClick={() => onChange({ ...config, wrongAnswerPenalty: p })}
              className={`py-2.5 rounded-xl font-display font-bold text-sm border transition ${
                config.wrongAnswerPenalty === p
                  ? 'bg-neon-pink/20 border-neon-pink text-neon-pink'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'
              }`}
            >
              {p === 0 ? '无' : `-${p}`}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 space-y-1">
        <div className="flex justify-between">
          <span>答对</span>
          <span className="text-neon-lime">+100 + 时间奖励</span>
        </div>
        <div className="flex justify-between">
          <span>答错/超时</span>
          <span className="text-rose-400">-{config.wrongAnswerPenalty}</span>
        </div>
      </div>
    </div>
  )
}
