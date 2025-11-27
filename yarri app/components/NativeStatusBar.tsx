"use client"

import { useEffect } from 'react'
import { initStatusBar } from '@/utils/statusBar'

export default function NativeStatusBar() {
  useEffect(() => {
    // Delegate to unified status bar initializer to avoid conflicts
    initStatusBar()
  }, [])
  return null
}