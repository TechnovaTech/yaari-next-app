'use client'

import { ReactNode } from 'react'
import { useSafeArea } from '../hooks/useSafeArea'

interface SafeAreaWrapperProps {
  children: ReactNode
  className?: string
  applyTop?: boolean
  applyBottom?: boolean
  applyLeft?: boolean
  applyRight?: boolean
  extraBottomPadding?: number
}

export default function SafeAreaWrapper({ 
  children, 
  className = '',
  applyTop = true,
  applyBottom = true,
  applyLeft = true,
  applyRight = true,
  extraBottomPadding = 0,
}: SafeAreaWrapperProps) {
  const { insets, systemBarInfo } = useSafeArea()

  // Add extra padding if navigation bar is transparent
  const bottomPadding = applyBottom 
    ? insets.bottom + extraBottomPadding + (systemBarInfo.isNavigationBarTransparent ? 16 : 0)
    : 0

  return (
    <div 
      className={className}
      style={{
        paddingTop: applyTop ? insets.top : 0,
        paddingBottom: bottomPadding,
        paddingLeft: applyLeft ? insets.left : 0,
        paddingRight: applyRight ? insets.right : 0,
      }}
    >
      {children}
    </div>
  )
}
