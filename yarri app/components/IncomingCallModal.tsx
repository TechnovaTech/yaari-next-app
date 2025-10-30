'use client'
import { Phone, Video, X } from 'lucide-react'

interface IncomingCallModalProps {
  callerName: string
  callType: 'video' | 'audio'
  onAccept: () => void
  onDecline: () => void
}

export default function IncomingCallModal({ callerName, callType, onAccept, onDecline }: IncomingCallModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center">
        <div className="w-24 h-24 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
          {callType === 'video' ? (
            <Video size={40} className="text-white" />
          ) : (
            <Phone size={40} className="text-white" />
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">{callerName}</h2>
        <p className="text-gray-600 mb-8">
          Incoming {callType} call...
        </p>

        <div className="flex gap-4">
          <button
            onClick={onDecline}
            className="flex-1 bg-red-500 text-white py-4 rounded-full flex items-center justify-center gap-2"
          >
            <X size={24} />
            <span>Decline</span>
          </button>
          <button
            onClick={onAccept}
            className="flex-1 bg-green-500 text-white py-4 rounded-full flex items-center justify-center gap-2"
          >
            <Phone size={24} />
            <span>Accept</span>
          </button>
        </div>
      </div>
    </div>
  )
}
