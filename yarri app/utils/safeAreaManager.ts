import { Capacitor } from '@capacitor/core'
import { StatusBar } from '@capacitor/status-bar'

export interface SafeAreaInsets {
  top: number
  bottom: number
  left: number
  right: number
}

export interface SystemBarInfo {
  statusBarHeight: number
  navigationBarHeight: number
  isStatusBarTransparent: boolean
  isNavigationBarTransparent: boolean
  hasGestureNavigation: boolean
}

class SafeAreaManager {
  private insets: SafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 }
  private systemBarInfo: SystemBarInfo = {
    statusBarHeight: 0,
    navigationBarHeight: 0,
    isStatusBarTransparent: false,
    isNavigationBarTransparent: false,
    hasGestureNavigation: false,
  }
  private listeners: Array<() => void> = []

  async initialize() {
    if (!Capacitor.isNativePlatform()) {
      this.setWebDefaults()
      return
    }

    await this.detectSafeArea()
    await this.detectSystemBars()
    this.injectCSSVariables()
    this.setupListeners()
  }

  private async detectSafeArea() {
    try {
      // Use CSS env() values first
      const root = document.documentElement
      const computedStyle = getComputedStyle(root)
      
      const envTop = parseInt(computedStyle.getPropertyValue('--sat').replace('px', '')) || 0
      const envBottom = parseInt(computedStyle.getPropertyValue('--sab').replace('px', '')) || 0
      const envLeft = parseInt(computedStyle.getPropertyValue('--sal').replace('px', '')) || 0
      const envRight = parseInt(computedStyle.getPropertyValue('--sar').replace('px', '')) || 0
      
      // If env() values are available, use them
      if (envTop > 0 || envBottom > 0) {
        this.insets = {
          top: envTop,
          bottom: envBottom,
          left: envLeft,
          right: envRight,
        }
        return
      }
      
      // Fallback to StatusBar API
      const info: any = await StatusBar.getInfo()
      if (info?.height) {
        this.insets.top = info.height
      }
      
      // Detect bottom inset based on platform
      const platform = Capacitor.getPlatform()
      if (platform === 'android') {
        // Android: detect gesture nav (usually 20-24px) vs button nav (48px)
        const screenHeight = window.innerHeight
        const visualHeight = window.visualViewport?.height || screenHeight
        const bottomInset = screenHeight - visualHeight
        this.insets.bottom = bottomInset > 0 ? bottomInset : 0
      } else if (platform === 'ios') {
        // iOS: use default for devices with home indicator
        this.insets.bottom = 34
      }
      
      // If still no insets, use defaults
      if (this.insets.top === 0 && this.insets.bottom === 0) {
        this.setNativeDefaults()
      }
    } catch (e) {
      console.warn('Safe area detection failed:', e)
      this.setNativeDefaults()
    }
  }

  private async detectSystemBars() {
    const platform = Capacitor.getPlatform()
    
    try {
      const statusBarInfo: any = await StatusBar.getInfo()
      this.systemBarInfo.statusBarHeight = statusBarInfo?.height || this.insets.top || 24
      
      // Detect if bars are transparent (overlaying content)
      this.systemBarInfo.isStatusBarTransparent = statusBarInfo?.overlays === true
      
      // Android-specific navigation bar detection
      if (platform === 'android') {
        // If bottom inset is very small (< 30px), likely gesture navigation
        this.systemBarInfo.hasGestureNavigation = this.insets.bottom > 0 && this.insets.bottom < 30
        this.systemBarInfo.navigationBarHeight = this.insets.bottom || (this.systemBarInfo.hasGestureNavigation ? 20 : 48)
        
        // Check if navigation bar is transparent
        this.systemBarInfo.isNavigationBarTransparent = this.insets.bottom === 0
      } else if (platform === 'ios') {
        // iOS home indicator
        this.systemBarInfo.navigationBarHeight = this.insets.bottom || 34
        this.systemBarInfo.hasGestureNavigation = true
      }
    } catch (e) {
      console.warn('System bar detection failed:', e)
    }
  }

  private setWebDefaults() {
    this.insets = { top: 0, bottom: 0, left: 0, right: 0 }
    this.injectCSSVariables()
  }

  private setNativeDefaults() {
    const platform = Capacitor.getPlatform()
    if (platform === 'android') {
      this.insets = { top: 24, bottom: 48, left: 0, right: 0 }
    } else if (platform === 'ios') {
      this.insets = { top: 44, bottom: 34, left: 0, right: 0 }
    }
  }

  private injectCSSVariables() {
    const root = document.documentElement
    root.style.setProperty('--safe-area-top', `${this.insets.top}px`)
    root.style.setProperty('--safe-area-bottom', `${this.insets.bottom}px`)
    root.style.setProperty('--safe-area-left', `${this.insets.left}px`)
    root.style.setProperty('--safe-area-right', `${this.insets.right}px`)
    root.style.setProperty('--statusbar-height', `${this.systemBarInfo.statusBarHeight}px`)
    root.style.setProperty('--navbar-height', `${this.systemBarInfo.navigationBarHeight}px`)
    
    // Extra padding for transparent bars
    const extraBottom = this.systemBarInfo.isNavigationBarTransparent ? 16 : 0
    root.style.setProperty('--safe-bottom-extra', `${this.insets.bottom + extraBottom}px`)
  }

  private setupListeners() {
    if (!Capacitor.isNativePlatform()) return

    // Re-detect on orientation change or resize
    window.addEventListener('resize', () => this.handleResize())
    window.addEventListener('orientationchange', () => this.handleResize())
  }

  private async handleResize() {
    await this.detectSafeArea()
    await this.detectSystemBars()
    this.injectCSSVariables()
    this.notifyListeners()
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb())
  }

  subscribe(callback: () => void) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback)
    }
  }

  getInsets(): SafeAreaInsets {
    return { ...this.insets }
  }

  getSystemBarInfo(): SystemBarInfo {
    return { ...this.systemBarInfo }
  }

  // Toggle navigation bar transparency (Android only)
  async setNavigationBarTransparent(transparent: boolean) {
    if (Capacitor.getPlatform() !== 'android') return

    try {
      // Use StatusBar overlay mode as alternative
      await StatusBar.setOverlaysWebView({ overlay: transparent })
      await this.handleResize()
    } catch (e) {
      console.warn('Failed to set navigation bar transparency:', e)
    }
  }

  // Set status bar style dynamically
  async setStatusBarStyle(style: 'light' | 'dark', backgroundColor?: string) {
    if (!Capacitor.isNativePlatform()) return

    try {
      await StatusBar.setStyle({ style: style === 'light' ? 'LIGHT' as any : 'DARK' as any })
      if (backgroundColor) {
        await StatusBar.setBackgroundColor({ color: backgroundColor })
      }
    } catch (e) {
      console.warn('Failed to set status bar style:', e)
    }
  }
}

export const safeAreaManager = new SafeAreaManager()
