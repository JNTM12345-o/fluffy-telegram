import { useEffect, useRef, useCallback, useReducer } from 'react'
import type { ClientToServer, ServerToClient, RoomState } from '../types'

// ============ 全局单例连接管理 ============
// 使用模块级变量确保整个应用只有一个 WebSocket 连接
let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectCount = 0

// 当前共享状态（所有组件共享）
export const sharedState = {
  connected: false,
  connecting: false,
  roomState: null as RoomState | null,
  myPlayerId: null as string | null,
  error: null as string | null,
}

// 订阅者：需要刷新的组件
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((fn) => fn())
}

function getServerUrl(): string {
  const envUrl = import.meta.env.VITE_WS_URL
  if (envUrl) return envUrl

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const hostname = window.location.hostname

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${window.location.host}/ws`
  }

  return 'wss://fluffy-telegram-production.up.railway.app'
}

let SERVER_URL: string | null = null

function connect() {
  if (ws) {
    const rs = ws.readyState
    if (rs === WebSocket.OPEN || rs === WebSocket.CONNECTING) return
  }

  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  sharedState.connecting = true
  notify()

  // 动态获取服务器地址（确保连接到正确的主机）
  if (!SERVER_URL) {
    SERVER_URL = getServerUrl()
  }
  const socket = new WebSocket(SERVER_URL)
  ws = socket

  socket.onopen = () => {
    if (ws !== socket) return
    sharedState.connected = true
    sharedState.connecting = false
    sharedState.error = null
    reconnectCount = 0
    notify()
  }

  socket.onmessage = (event) => {
    if (ws !== socket) return
    try {
      const msg = JSON.parse(event.data) as ServerToClient
      switch (msg.type) {
        case 'room_state':
          sharedState.roomState = msg.state
          break
        case 'joined':
          sharedState.myPlayerId = msg.playerId
          sharedState.roomState = msg.state
          break
      }
      notify()
    } catch {
      console.error('消息解析失败:', event.data)
    }
  }

  socket.onerror = () => {
    if (ws !== socket) return
    sharedState.error = '连接失败，请检查服务器是否启动'
    notify()
  }

  socket.onclose = () => {
    if (ws !== socket) return
    ws = null
    sharedState.connected = false
    sharedState.connecting = false
    notify()
    // 自动重连（最多 3 次）
    if (reconnectCount < 3) {
      reconnectCount++
      reconnectTimer = setTimeout(connect, 2000 * reconnectCount)
    }
  }
}

function disconnect() {
  reconnectCount = 99
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  sharedState.roomState = null
  sharedState.myPlayerId = null
  sharedState.error = null
  sharedState.connected = false
  sharedState.connecting = false
  notify()
  if (ws) {
    ws.close(1000, 'User disconnected')
    ws = null
  }
}

function send(msg: ClientToServer) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}

// ============ React Hook ============
export function useWebSocket() {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0)

  useEffect(() => {
    const handler = () => forceUpdate()
    listeners.add(handler)

    // 首次挂载时启动连接（仅一次）
    if (!ws) {
      connect()
    }

    return () => {
      listeners.delete(handler)
    }
  }, [])

  const sendMsg = useCallback((msg: ClientToServer) => send(msg), [])
  const disconnectMsg = useCallback(() => disconnect(), [])
  const reconnectMsg = useCallback(() => {
    reconnectCount = 0
    SERVER_URL = null
    connect()
  }, [])

  return {
    connected: sharedState.connected,
    connecting: sharedState.connecting,
    roomState: sharedState.roomState,
    myPlayerId: sharedState.myPlayerId,
    error: sharedState.error,
    send: sendMsg,
    disconnect: disconnectMsg,
    reconnect: reconnectMsg,
  }
}
