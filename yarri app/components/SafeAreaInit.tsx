'use client'
import { useEffect } from 'react'
import { safeAreaManager } from '@/utils/safeAreaManager'

export default function SafeAreaInit() {
  useEffect(() => {
    safeAreaManager.initialize()
  }, [])
  
  return null
}
