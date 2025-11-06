'use client'

import { ReactNode } from 'react'

interface SafeAreaWrapperProps {
  children: ReactNode
  className?: string
  applyTop?: boolean
  applyBottom?: boolean
}

export default function SafeAreaWrapper({ 
  children, 
  className = '',
  applyTop = false,
  applyBottom = true 
}: SafeAreaWrapperProps) {
  const safeClasses = [
    // Match the utility class names defined in globals.css
    applyTop && 'safe-top',
    applyBottom && 'safe-bottom',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={safeClasses}>
      {children}
    </div>
  )
}
