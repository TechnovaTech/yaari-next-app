import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../utils/translations'
import { useEffect } from 'react'
import { trackScreenView } from '../utils/clevertap'

interface CallHistoryScreenProps {
  onBack: () => void
}

export default function CallHistoryScreen({ onBack }: CallHistoryScreenProps) {
  const { lang } = useLanguage()
  const t = translations[lang]
  useEffect(() => {
    trackScreenView('Call History')
  }, [])
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center p-4 pt-8">
        <button onClick={onBack} className="mr-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Title */}
      <div className="px-4 pb-6">
        <h1 className="text-3xl font-bold text-black">{t.callHistoryTitle}</h1>
      </div>

      {/* Call List */}
      <div>
        {Array.from({ length: 7 }).map((_, index) => {
          const seed = `User${index + 1}`
          return (
          <div key={index} className="flex items-center px-4 py-4">
            <div className="mr-4">
              <div className="w-14 h-14 rounded-full overflow-hidden">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                  alt="User" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs text-green-500 font-medium">● {t.online}</span>
              </div>
              <h3 className="font-semibold text-black text-lg">{t.userName}</h3>
              <p className="text-sm text-gray-500">{t.attributes}</p>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-black font-medium">7:40 AM</p>
              <p className="text-sm text-gray-500">04:32</p>
            </div>
          </div>
        )})}
      </div>
    </div>
  )
}