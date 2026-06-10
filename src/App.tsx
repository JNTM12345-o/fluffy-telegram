import { useCallback } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import LobbyPage from './pages/LobbyPage'
import HostPage from './pages/HostPage'
import PlayerPage from './pages/PlayerPage'

export default function App() {
  const { roomState, myPlayerId, connected, connecting, send, disconnect } = useWebSocket()

  const handleLeave = useCallback(() => {
    send({ type: 'leave_room' })
    setTimeout(() => {
      disconnect()
    }, 100)
  }, [send, disconnect])

  // 1) 连接中
  if (!connected) {
    return (
      <div className="min-h-screen bg-game flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="text-5xl mb-4 animate-pulse">⚡</div>
          <div className="text-white font-display text-lg">
            {connecting ? '正在连接服务器...' : '已断开连接'}
          </div>
          <div className="text-slate-500 text-xs mt-2">ws://localhost:8080</div>
          {connecting && (
            <div className="mt-6 w-32 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-neon-cyan animate-pulse" style={{ width: '60%' }} />
            </div>
          )}
        </div>
      </div>
    )
  }

  // 2) 已连接但尚未进入房间 → 显示大厅
  if (!roomState) {
    return <LobbyPage send={send} />
  }

  // 3) 已进入房间 → 根据角色渲染主机或玩家页面
  const isHost = roomState.players.find((p) => p.id === myPlayerId)?.isHost ?? false

  return (
    <>
      <button
        onClick={handleLeave}
        className="fixed top-4 right-4 z-[100] px-4 py-2 rounded-xl glass text-sm text-slate-300 hover:text-white transition-all hover:scale-105 active:scale-95 min-w-[80px] h-[44px] flex items-center justify-center"
      >
        ← 退出
      </button>

      {isHost ? <HostPage send={send} /> : <PlayerPage send={send} />}
    </>
  )
}
