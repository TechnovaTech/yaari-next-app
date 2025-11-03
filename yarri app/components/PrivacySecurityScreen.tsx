import { ChevronLeft, Shield, Lock } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../utils/translations'
import { useEffect } from 'react'
import { trackScreenView, trackEvent } from '../utils/clevertap'

interface PrivacySecurityScreenProps {
  onBack: () => void
}

export default function PrivacySecurityScreen({ onBack }: PrivacySecurityScreenProps) {
  const { lang } = useLanguage()
  const t = translations[lang]
  useEffect(() => {
    trackScreenView('Privacy & Security')
  }, [])
  return (
    <div className="min-h-screen bg-white">
      <div className="p-4">
        <button onClick={onBack} className="mb-6">
          <ChevronLeft size={24} className="text-gray-800" />
        </button>
        <h1 className="text-3xl font-bold text-black mb-6">{t.privacySecurityTitle}</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase">{t.dataPrivacy}</h2>
          
          <button 
            onClick={() => { trackEvent('PrivacyPolicyClicked'); window.open('https://yaari.me/privacy', '_blank') }}
            className="flex items-center justify-between py-2 w-full"
          >
            <div className="flex items-center space-x-3">
              <Shield className="text-primary" size={20} />
              <p className="font-semibold text-gray-800">{t.privacyPolicy}</p>
            </div>
            <span className="text-gray-400">›</span>
          </button>

          <button 
            onClick={() => { trackEvent('TermsOfServiceClicked'); window.open('https://yaari.me/terms', '_blank') }}
            className="flex items-center justify-between py-2 w-full"
          >
            <div className="flex items-center space-x-3">
              <Lock className="text-primary" size={20} />
              <p className="font-semibold text-gray-800">{t.termsOfService}</p>
            </div>
            <span className="text-gray-400">›</span>
          </button>
        </div>
      </div>
    </div>
  )
}
