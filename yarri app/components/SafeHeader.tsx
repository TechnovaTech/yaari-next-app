import { ReactNode } from 'react'

interface SafeHeaderProps {
  children: ReactNode
  className?: string
}

export default function SafeHeader({ children, className = '' }: SafeHeaderProps) {
  return (
    <div className={`safe-area-top ${className}`}>
      {children}
    </div>
  )
}
