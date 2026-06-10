import { useState } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import ConfigPanel from '../components/ConfigPanel'
import type { RoomConfig } from '../types'

interface Props {
  send: (msg: any) => void
}

export default function LobbyPage({ send }: Props) {
  const { error } = useWebSocket()
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice')
  const [nickname, setNickname] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [config, setConfig] = useState<RoomConfig>({
    timePerQuestion: 10,
    wrongAnswerPenalty: 50,
    totalRounds: 10,
    maxPlayers: 4,
  })

  const handleCreate = () => {
    const name = nickname.trim().substring(0, 6) || '玩家1'
    send({ type: 'create_room', nickname: name, config })
  }

  const handleJoin = () => {
    const name = nickname.trim().substring(0, 6) || '玩家1'
    const code = roomCode.trim().toUpperCase()
    if (!code || code.length !== 4) return
    send({ type: 'join_room', roomCode: code, nickname: name })
  }

  return (
    <div className="min-h-screen w-full bg-game relative overflow-hidden flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 grid-floor pointer-events-none opacity-40" />
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-neon-purple/30 blur-3xl blob pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-neon-cyan/20 blur-3xl blob pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 max-w-md w-full">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl sm:text-5xl font-black text-white text-stroke-cyan">
            极速抢答
          </h1>
          <p className="text-slate-400 mt-2 text-sm">多人对战 · 局域网版</p>
        </div>

        {/* 连接错误 */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-sm text-center">
            ⚠️ {error}
          </div>
        )}

        {mode === 'choice' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full py-5 px-6 rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-purple text-slate-900 font-black text-xl btn-neon shadow-neon-cyan"
            >
              <span className="text-2xl mr-2">🎮</span> 创建房间
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full py-5 px-6 rounded-2xl bg-white/5 border border-white/20 text-white font-black text-xl btn-neon glass hover:border-neon-pink/50"
            >
              <span className="text-2xl mr-2">🔗</span> 加入房间
            </button>

            <div className="text-center text-slate-500 text-xs mt-6">
              <p>需在同一 WiFi 网络下</p>
              <p>房主创建房间后，其他玩家输入房间码加入</p>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <button onClick={() => setMode('choice')} className="text-slate-400 text-sm hover:text-white transition">
              ← 返回
            </button>

            <div className="glass rounded-2xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-display tracking-widest text-slate-400 uppercase mb-2">你的昵称</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="最多6字符"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-neon-cyan focus:outline-none transition"
                />
              </div>

              <ConfigPanel config={config} onChange={setConfig} />

              <button
                onClick={handleCreate}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-slate-900 font-black text-lg btn-neon shadow-neon-cyan"
              >
                创建房间
              </button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <button onClick={() => setMode('choice')} className="text-slate-400 text-sm hover:text-white transition">
              ← 返回
            </button>

            <div className="glass rounded-2xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-display tracking-widest text-slate-400 uppercase mb-2">房间码</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="4位字母"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-2xl font-display tracking-[0.3em] placeholder-slate-500 focus:border-neon-pink focus:outline-none transition uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-display tracking-widest text-slate-400 uppercase mb-2">你的昵称</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="最多6字符"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-neon-pink focus:outline-none transition"
                />
              </div>

              <button
                onClick={handleJoin}
                disabled={roomCode.length !== 4}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-slate-900 font-black text-lg btn-neon shadow-neon-pink disabled:opacity-50"
              >
                加入房间
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
