import { useEffect, useState } from 'react'

export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({ top: 0, bottom: 0 })

  useEffect(() => {
    const updateSafeArea = () => {
      const top = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0')
      const bottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0')
      setSafeArea({ top, bottom })
    }

    updateSafeArea()
    window.addEventListener('resize', updateSafeArea)
    return () => window.removeEventListener('resize', updateSafeArea)
  }, [])

  return safeArea
}
