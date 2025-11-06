import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { App } from '@capacitor/app'

export function useBackButton(onBack?: () => void) {
  const router = useRouter()

  useEffect(() => {
    const listener = App.addListener('backButton', () => {
      if (onBack) {
        onBack()
      } else {
        router.back()
      }
    })

    return () => {
      listener.then(h => h.remove())
    }
  }, [onBack, router])
}
