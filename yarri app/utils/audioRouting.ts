import { Capacitor, registerPlugin } from '@capacitor/core'

export interface AudioRoutingPlugin {
  enterCommunicationMode(): Promise<{ status: string }>
  setSpeakerphoneOn(options: { on: boolean }): Promise<{ status: string; speakerOn: boolean }>
  resetAudio(): Promise<{ status: string }>
}

// Provide a safe Noop on web to avoid "plugin not implemented" errors
const Noop: AudioRoutingPlugin = {
  async enterCommunicationMode() { return { status: 'noop' } },
  async setSpeakerphoneOn() { return { status: 'noop', speakerOn: false } },
  async resetAudio() { return { status: 'noop' } },
}

const AudioRouting = Capacitor.isNativePlatform()
  ? registerPlugin<AudioRoutingPlugin>('AudioRouting')
  : Noop

export default AudioRouting