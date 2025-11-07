import React from 'react'

interface PageLayoutProps {
  children: React.ReactNode
  hasHeader?: boolean
  className?: string
}

export default function PageLayout({ children, hasHeader = false, className }: PageLayoutProps) {
  return (
    <div
      className={className}
      style={{
        // Add safe-area top padding only when the page does not have a colored header
        paddingTop: hasHeader ? 0 : 'env(safe-area-inset-top)'
      }}
    >
      {children}
    </div>
  )
}