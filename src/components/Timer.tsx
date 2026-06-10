import { useEffect, useState } from 'react'

interface TimerProps {
  duration: number
  running: boolean
  onTimeout: () => void
  onTick: (remaining: number) => void
  keySeed: number // 用于重置
}

export default function Timer({ duration, running, onTimeout, onTick, keySeed }: TimerProps) {
  const [remaining, setRemaining] = useState(duration)

  useEffect(() => {
    setRemaining(duration)
  }, [duration, keySeed])

  useEffect(() => {
    if (!running) return
    if (remaining <= 0) return

    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000
      const left = Math.max(0, duration - elapsed)
      setRemaining(left)
      onTick(left)
      if (left <= 0) {
        clearInterval(interval)
        onTimeout()
      }
    }, 50)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, keySeed])

  const percent = Math.max(0, Math.min(1, remaining / duration))
  const color =
    remaining > duration * 0.6
      ? 'from-neon-cyan to-neon-lime'
      : remaining > duration * 0.3
        ? 'from-yellow-300 to-orange-400'
        : 'from-rose-500 to-red-600'

  return (
    <div className="w-full">
      <div className="flex items-end justify-between mb-2">
        <span className="font-display text-xs uppercase tracking-widest text-slate-300">
          ⏱️ 剩余时间
        </span>
        <span
          className={`font-display text-3xl sm:text-4xl font-bold ${
            remaining <= duration * 0.3 ? 'text-rose-400 animate-pulse' : 'text-white'
          }`}
        >
          {remaining.toFixed(1)}s
        </span>
      </div>
      <div className="relative h-3 rounded-full bg-white/5 overflow-hidden border border-white/10">
        <div
          className={`absolute top-0 left-0 h-full bg-gradient-to-r ${color} transition-[width] duration-75 ease-linear`}
          style={{ width: `${percent * 100}%` }}
        />
        <div
          className="absolute top-0 h-full w-2 bg-white/80 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.9)]"
          style={{ left: `calc(${percent * 100}% - 8px)` }}
        />
      </div>
    </div>
  )
}
