import type { Player } from '../types'

interface Props {
  players: Player[]
  isHost: boolean
  onStart?: () => void
  onToggleReady?: () => void
  myPlayerId: string | null
  maxPlayers?: number
}

export default function RoomLobby({ players, isHost, onStart, onToggleReady, myPlayerId, maxPlayers = 4 }: Props) {
  const readyCount = players.filter((p) => p.isHost || p.isReady).length
  const minPlayers = 2
  const canStart = isHost && readyCount >= minPlayers && players.length >= minPlayers

  return (
    <div className="space-y-4">
      {/* 玩家列表 */}
      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.id}
            className="flex items-center gap-3 p-3 rounded-xl glass"
          >
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: player.color }}
            />
            <div className="flex-1 min-w-0">
              <span className="text-white font-medium truncate">
                {player.nickname}
                {player.isHost && <span className="ml-2 text-xs text-neon-cyan">房主</span>}
                {player.id === myPlayerId && <span className="ml-2 text-xs text-slate-400">(你)</span>}
              </span>
            </div>
            <div>
              {player.isHost || player.isReady ? (
                <span className="text-xs text-neon-lime font-display">✓ 已准备</span>
              ) : (
                <span className="text-xs text-slate-500 font-display">等待中</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="space-y-2">
        {!isHost && onToggleReady && (
          <button
            onClick={onToggleReady}
            className="w-full py-3 rounded-xl bg-white/5 border border-white/20 text-white font-bold hover:border-neon-cyan transition"
          >
            {players.find((p) => p.id === myPlayerId)?.isReady ? '取消准备' : '已准备'}
          </button>
        )}

        {isHost && (
          <button
            onClick={onStart}
            disabled={!canStart}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-slate-900 font-black text-lg btn-neon shadow-neon-cyan disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {canStart ? `🚀 开始游戏 (${readyCount}/${players.length})` : `等待玩家加入 (${players.length}/${maxPlayers})`}
          </button>
        )}
      </div>
    </div>
  )
}
