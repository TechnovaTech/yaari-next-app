'use client'
import { Video, Mic, X } from 'lucide-react'

interface PermissionModalProps {
  type: 'video' | 'audio'
  onAllow: () => void
  onDeny: () => void
}

export default function PermissionModal({ type, onAllow, onDeny }: PermissionModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center relative">
        <button
          onClick={onDeny}
          className="absolute top-4 right-4 text-gray-400"
        >
          <X size={24} />
        </button>

        <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
          {type === 'video' ? (
            <Video size={40} className="text-primary" />
          ) : (
            <Mic size={40} className="text-primary" />
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {type === 'video' ? 'Camera & Microphone' : 'Microphone'} Access
        </h2>
        
        <p className="text-gray-600 mb-6">
          {type === 'video' 
            ? 'Yaari needs access to your camera and microphone to make video calls.'
            : 'Yaari needs access to your microphone to make audio calls.'}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onDeny}
            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-full font-semibold"
          >
            Not Now
          </button>
          <button
            onClick={onAllow}
            className="flex-1 bg-primary text-white py-3 rounded-full font-semibold"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  )
}
