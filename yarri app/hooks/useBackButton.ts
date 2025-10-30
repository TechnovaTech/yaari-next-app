import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { App } from '@capacitor/app'

export function useBackButton(onBack?: () => void) {
  const router = useRouter()

  useEffect(() => {
    const handlerPromise = Promise.resolve(
      App.addListener('backButton', ({ canGoBack }) => {
        if (onBack) {
          onBack()
        } else if (canGoBack) {
          router.back()
        }
      })
    )

    return () => {
      handlerPromise.then((handler) => handler.remove()).catch(() => {})
    }
  }, [onBack, router])
}
