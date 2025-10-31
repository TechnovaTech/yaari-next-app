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
    applyTop && 'pt-safe-top',
    applyBottom && 'pb-safe-bottom',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={safeClasses}>
      {children}
    </div>
  )
}
