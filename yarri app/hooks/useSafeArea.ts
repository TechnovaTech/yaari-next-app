'use client'

import { useState, useEffect } from 'react'
import { safeAreaManager, SafeAreaInsets, SystemBarInfo } from '@/utils/safeAreaManager'

export function useSafeArea() {
  const [insets, setInsets] = useState<SafeAreaInsets>({ top: 0, bottom: 0, left: 0, right: 0 })
  const [systemBarInfo, setSystemBarInfo] = useState<SystemBarInfo>({
    statusBarHeight: 0,
    navigationBarHeight: 0,
    isStatusBarTransparent: false,
    isNavigationBarTransparent: false,
    hasGestureNavigation: false,
  })

  useEffect(() => {
    const updateInsets = () => {
      setInsets(safeAreaManager.getInsets())
      setSystemBarInfo(safeAreaManager.getSystemBarInfo())
    }

    updateInsets()
    const unsubscribe = safeAreaManager.subscribe(updateInsets)

    return unsubscribe
  }, [])

  return { insets, systemBarInfo }
}

// Legacy hook for backward compatibility
export function useSafeAreaLegacy() {
  const [insets, setInsets] = useState<SafeAreaInsets>({ top: 0, bottom: 0, left: 0, right: 0 })
  const [systemBarInfo, setSystemBarInfo] = useState<SystemBarInfo>({
    statusBarHeight: 0,
    navigationBarHeight: 0,
    isStatusBarTransparent: false,
    isNavigationBarTransparent: false,
    hasGestureNavigation: false,
  })

  useEffect(() => {
    const updateInsets = () => {
      setInsets(safeAreaManager.getInsets())
      setSystemBarInfo(safeAreaManager.getSystemBarInfo())
    }

    updateInsets()
    const unsubscribe = safeAreaManager.subscribe(updateInsets)

    return unsubscribe
  }, [])

  return { insets, systemBarInfo }
}
