'use client'

import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { StatusBar } from '@capacitor/status-bar'

export function useSafeArea() {
  const [insets, setInsets] = useState({ top: 0, bottom: 0, left: 0, right: 0 })

  useEffect(() => {
    const getSafeArea = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const info = await StatusBar.getInfo()
          setInsets(info.safeArea)
        } catch (e) {
          console.error('Error getting safe area insets', e)
          // Fallback for older Capacitor versions or browser
          setInsets({ top: 20, bottom: 20, left: 0, right: 0 })
        }
      } else {
        // Provide default values for web
        setInsets({ top: 0, bottom: 0, left: 0, right: 0 })
      }
    }

    getSafeArea()

    const resizeListener = () => getSafeArea()
    window.addEventListener('resize', resizeListener)

    return () => {
      window.removeEventListener('resize', resizeListener)
    }
  }, [])

  return insets
}
