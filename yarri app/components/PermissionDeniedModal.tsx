'use client'
import { AlertCircle, X } from 'lucide-react'

interface PermissionDeniedModalProps {
  onClose: () => void
  onRetry: () => void
}

export default function PermissionDeniedModal({ onClose, onRetry }: PermissionDeniedModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400"
        >
          <X size={24} />
        </button>

        <div className="w-20 h-20 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <AlertCircle size={40} className="text-red-500" />
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Permission Denied
        </h2>
        
        <p className="text-gray-600 mb-4 text-sm">
          Camera/Microphone access was blocked. To make calls, please:
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
          <ol className="text-sm text-gray-700 space-y-2">
            <li className="flex gap-2">
              <span className="font-bold">1.</span>
              <span>Click the lock icon in your browser's address bar</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">2.</span>
              <span>Allow Camera and Microphone permissions</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">3.</span>
              <span>Refresh the page or click "Try Again"</span>
            </li>
          </ol>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-full font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onRetry}
            className="flex-1 bg-primary text-white py-3 rounded-full font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  )
}
