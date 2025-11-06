'use client'

import { ReactNode } from 'react'
import { useSafeArea } from '../hooks/useSafeArea'

interface SafeAreaWrapperProps {
  children: ReactNode
  className?: string
}

export default function SafeAreaWrapper({ 
  children, 
  className = ''
}: SafeAreaWrapperProps) {
  const insets = useSafeArea()

  return (
    <div 
      className={className}
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      {children}
    </div>
  )
}
