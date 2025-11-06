import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

export function useBackButton(onBack?: () => void) {
  const router = useRouter()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let listenerHandle: any = null

    const setupListener = async () => {
      listenerHandle = await App.addListener('backButton', ({ canGoBack }) => {
        console.log('Back button pressed, canGoBack:', canGoBack)
        if (onBack) {
          onBack()
        } else if (canGoBack) {
          router.back()
        } else {
          App.exitApp()
        }
      })
    }

    setupListener()

    return () => {
      if (listenerHandle) {
        listenerHandle.remove()
      }
    }
  }, [onBack, router])
}
