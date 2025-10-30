"use client"

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

export default function NativeStatusBar() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Light }).catch(() => {})
      StatusBar.setBackgroundColor({ color: '#FF6B35' }).catch(() => {})
      StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {})
    }
  }, [])
  return null
}