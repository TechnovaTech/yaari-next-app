'use client'
import { useEffect } from 'react'
import { initStatusBar } from '@/utils/statusBar'

export default function StatusBarInit() {
  useEffect(() => {
    initStatusBar()
  }, [])
  return null
}
