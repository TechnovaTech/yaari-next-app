'use client'

import { Capacitor } from '@capacitor/core'
import AudioRouting from './audioRouting'

type Route = 'speaker' | 'earpiece' | 'bluetooth' | 'headset'

export const AudioRoute = {
  async setRoute({ route }: { route: Route }) {
    if (!Capacitor.isNativePlatform()) return
    try {
      if (route === 'speaker') {
        await AudioRouting.setSpeakerphoneOn({ on: true })
      } else if (route === 'earpiece') {
        await AudioRouting.setSpeakerphoneOn({ on: false })
      } else {
        // For bluetooth/headset, disable speakerphone and let Android pick the connected device
        await AudioRouting.setSpeakerphoneOn({ on: false })
      }
    } catch (e) {
      console.warn('AudioRoute.setRoute failed:', e)
    }
  },
}

export default AudioRoute