'use client'

interface InsufficientCoinsModalProps {
  onClose: () => void
  onRecharge: () => void
}

export default function InsufficientCoinsModal({ onClose, onRecharge }: InsufficientCoinsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Stay connected 💬</h2>
          <p className="text-gray-600 text-base">
            Recharge now to continue your yaari moments!
          </p>
        </div>
        
        <button
          onClick={onRecharge}
          className="w-full bg-primary text-white py-4 rounded-full font-semibold text-lg hover:bg-orange-600 transition"
        >
          Recharge Now
        </button>
      </div>
    </div>
  )
}
