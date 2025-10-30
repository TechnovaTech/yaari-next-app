import { X, Video, Phone } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../utils/translations'

interface CallConfirmationScreenProps {
  onClose: () => void
  onConfirm: () => void
  userName: string
  callType: 'video' | 'audio'
  rate: number
  userAvatar: string
}

export default function CallConfirmationScreen({ 
  onClose, 
  onConfirm, 
  userName, 
  callType, 
  rate,
  userAvatar 
}: CallConfirmationScreenProps) {
  const { lang } = useLanguage()
  const t = translations[lang]
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4">
          <X size={24} className="text-gray-600" />
        </button>

        <div className="flex flex-col items-center mt-4">
          <div className="w-24 h-24 bg-gray-300 rounded-full overflow-hidden mb-4">
            <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-2">{userName}</h2>
          
          <div className="flex items-center space-x-2 mb-6">
            {callType === 'video' ? (
              <Video size={20} className="text-primary" />
            ) : (
              <Phone size={20} className="text-primary" />
            )}
            <span className="text-gray-600">
              {callType === 'video' ? t.videoCall : t.audioCall}
            </span>
          </div>

          <div className="bg-orange-50 rounded-2xl p-4 w-full mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">{t.rate}</span>
              <span className="text-xl font-bold text-primary">₹{rate}/min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{t.yourBalance}</span>
              <span className="text-lg font-semibold text-gray-800">₹250</span>
            </div>
          </div>

          <p className="text-sm text-gray-500 text-center mb-6">
            {lang === 'hi' ? `आपसे ₹${rate} प्रति मिनट शुल्क लिया जाएगा` : `You will be charged ₹${rate} per minute for this call`}
          </p>

          <div className="flex gap-3 w-full">
            <button 
              onClick={onClose}
              className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-full font-semibold flex items-center justify-center"
            >
              {t.cancel}
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 py-3 bg-primary text-white rounded-full font-semibold flex items-center justify-center"
            >
              {t.startCall}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
