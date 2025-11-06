import { registerPlugin } from '@capacitor/core'

export interface AudioRoutingPlugin {
  enterCommunicationMode(): Promise<{ status: string }>
  setSpeakerphoneOn(options: { on: boolean }): Promise<{ status: string; speakerOn: boolean }>
  resetAudio(): Promise<{ status: string }>
}

// Always register the plugin; on web, calls will reject and are caught by callers
const AudioRouting = registerPlugin<AudioRoutingPlugin>('AudioRouting')

export default AudioRouting