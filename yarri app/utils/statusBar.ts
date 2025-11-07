import { StatusBar, Style } from '@capacitor/status-bar'
import { Capacitor } from '@capacitor/core'

export const initStatusBar = async () => {
  if (!Capacitor.isNativePlatform()) return

  try {
    await StatusBar.setOverlaysWebView({ overlay: true })
    // Use light content (white icons) on brand orange background
    await StatusBar.setStyle({ style: Style.Light })
    await StatusBar.setBackgroundColor({ color: '#FF7A00' })
  } catch (e) {
    console.warn('StatusBar init failed:', e)
  }
}
