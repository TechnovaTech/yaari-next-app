import { StatusBar, Style } from '@capacitor/status-bar'
import { Capacitor } from '@capacitor/core'

export const initStatusBar = async () => {
  if (!Capacitor.isNativePlatform()) return

  try {
    await StatusBar.setOverlaysWebView({ overlay: false })
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#FF6B00' })
  } catch (e) {
    console.warn('StatusBar init failed:', e)
  }
}
