import { useEffect, useState } from 'react'

export function useNavigationBar() {
  const [navBarHeight, setNavBarHeight] = useState(48)

  useEffect(() => {
    const updateNavBarHeight = () => {
      const safeBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0')
      const height = safeBottom > 0 ? safeBottom : 48
      setNavBarHeight(height)
    }

    updateNavBarHeight()
    window.addEventListener('resize', updateNavBarHeight)
    return () => window.removeEventListener('resize', updateNavBarHeight)
  }, [])

  return navBarHeight
}
