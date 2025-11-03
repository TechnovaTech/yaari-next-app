import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../utils/translations'
import { useEffect } from 'react'
import { ChevronLeft } from 'lucide-react'
import { trackScreenView } from '../utils/clevertap'
import { Capacitor } from '@capacitor/core'

interface CustomerSupportScreenProps {
  onBack: () => void
}

export default function CustomerSupportScreen({ onBack }: CustomerSupportScreenProps) {
  const { lang } = useLanguage()
  const t = translations[lang]
  useEffect(() => {
    trackScreenView('Customer Support')
  }, [])
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="p-4">
        <button onClick={onBack} className="mb-6">
          <ChevronLeft size={24} className="text-gray-800" />
        </button>
      </div>

      {/* Title */}
      <div className="px-4 pb-6">
        <h1 className="text-3xl font-bold text-black">{t.customerSupport}</h1>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center justify-center px-8 mt-20">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{t.gotQuery}</h2>
          <h2 className="text-xl font-semibold text-gray-800 mb-6">{t.assistance}</h2>
          
          <p className="text-gray-600 text-base leading-relaxed mb-2">
            {t.hereToHelp}
          </p>
          <a
            href="mailto:support@yaari.me"
            className="text-primary font-medium text-base mb-2 underline cursor-pointer inline-block"
          >
            support@yaari.me
          </a>
          <p className="text-gray-600 text-base leading-relaxed">
            {t.supportTeam}
          </p>
        </div>
      </div>
    </div>
  )
}