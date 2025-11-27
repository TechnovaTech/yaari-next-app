'use client'
import { Phone, Video } from 'lucide-react'

interface IncomingCallModalProps {
  callerName: string
  callType: 'video' | 'audio'
  onAccept: () => void
  onDecline: () => void
  callerAvatar?: string
  callerId?: string
}

export default function IncomingCallModal({ callerName, callType, onAccept, onDecline, callerAvatar, callerId }: IncomingCallModalProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center z-50 p-6">
      <div className="flex flex-col items-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
          <div className="relative w-32 h-32 bg-gray-300 rounded-full overflow-hidden border-4 border-green-500">
            {callerAvatar ? (
              <img src={callerAvatar} alt="Caller" className="w-full h-full object-cover" />
            ) : (
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${callerId || callerName}`} alt="Caller" className="w-full h-full object-cover" />
            )}
          </div>
        </div>
        
        <h2 className="text-white text-2xl font-bold mb-2">{callerName}</h2>
        <p className="text-gray-400 text-lg mb-2">Incoming {callType} call...</p>
        
        <div className="flex items-center space-x-2 mb-12">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        
        <div className="flex items-center gap-12">
          <div className="flex flex-col items-center">
            <button
              onClick={onDecline}
              className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition mb-2"
            >
              <Phone size={32} className="text-white transform rotate-135" style={{ transform: 'rotate(135deg)' }} />
            </button>
            <p className="text-white text-sm">Decline</p>
          </div>
          
          <div className="flex flex-col items-center">
            <button
              onClick={onAccept}
              className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center shadow-lg hover:bg-green-700 transition mb-2 animate-pulse"
            >
              {callType === 'video' ? (
                <Video size={32} className="text-white" />
              ) : (
                <Phone size={32} className="text-white" />
              )}
            </button>
            <p className="text-white text-sm">Accept</p>
          </div>
        </div>
      </div>
    </div>
  )
}
