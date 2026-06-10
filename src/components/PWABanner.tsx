import { useEffect, useState } from 'react'

export default function PWABanner() {
  const [installEvent, setInstallEvent] = useState<any>(null)
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e)
      if (!dismissed) setShow(true)
    }
    const onInstalled = () => {
      setInstallEvent(null)
      setShow(false)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    // PWA 已处于 standalone 模式时不再显示
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    if (isStandalone) setShow(false)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [dismissed])

  if (!show) return null

  const handleInstall = async () => {
    if (!installEvent) return
    installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    if (outcome === 'accepted') {
      setShow(false)
    }
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md animate-pop-in">
      <div className="glass rounded-2xl p-4 flex items-start gap-3 border border-white/20 shadow-xl">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-pink flex items-center justify-center text-lg">
          ⚡
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white">安装到主屏幕</div>
          <div className="text-xs text-slate-300 mt-0.5">
            离线可玩 · 全屏沉浸式体验 · 更快启动
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 rounded-lg bg-neon-cyan text-slate-900 text-xs font-bold hover:brightness-110 transition"
            >
              立即安装
            </button>
            <button
              onClick={() => {
                setDismissed(true)
                setShow(false)
              }}
              className="px-3 py-1.5 rounded-lg bg-white/5 text-white text-xs font-medium hover:bg-white/10 transition"
            >
              稍后
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
