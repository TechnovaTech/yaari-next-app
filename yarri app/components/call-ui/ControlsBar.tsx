'use client'
import { Phone, Mic, Volume2 } from 'lucide-react'

interface ControlsBarProps {
  isSpeakerOn: boolean
  isMuted: boolean
  onToggleSpeaker: () => void
  onToggleMute: () => void
  onEndCall: () => void
}

export default function ControlsBar({ isSpeakerOn, isMuted, onToggleSpeaker, onToggleMute, onEndCall }: ControlsBarProps) {
  return (
    <div className="flex justify-center items-center space-x-6 mb-8">
      <button
        onClick={onToggleSpeaker}
        className={`w-14 h-14 rounded-full flex items-center justify-center ${isSpeakerOn ? 'bg-white' : 'bg-white/30'}`}
      >
        <Volume2 className={isSpeakerOn ? 'text-primary' : 'text-white'} size={24} />
      </button>

      <button
        onClick={onEndCall}
        className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
      >
        <Phone className="text-white rotate-[135deg]" size={28} />
      </button>
      
      <button
        onClick={onToggleMute}
        className={`w-14 h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-500' : 'bg-white/30'}`}
      >
        <Mic className="text-white" size={24} />
      </button>
    </div>
  )
}