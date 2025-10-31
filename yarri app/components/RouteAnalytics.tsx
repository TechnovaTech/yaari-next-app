'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackScreenView } from '@/utils/clevertap'

export default function RouteAnalytics() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    trackScreenView(pathname)
  }, [pathname])

  return null
}