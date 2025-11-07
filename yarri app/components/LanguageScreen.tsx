import { useState, useEffect } from 'react'
import { trackScreenView, trackEvent } from '../utils/clevertap'
import { Capacitor } from '@capacitor/core'

interface LanguageScreenProps {
  onNext: () => void
  onSelectLanguage: (lang: 'en' | 'hi') => void
}

export default function LanguageScreen({ onNext, onSelectLanguage }: LanguageScreenProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('हिंदी')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    trackScreenView('Language Select')
  }, [])

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://admin.yaari.me'
  const buildApiUrl = (path: string) => {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    const isNative = Capacitor.isNativePlatform()
    return (!isLocal || isNative) ? `${API_BASE}/api${path}` : `/api${path}`
  }

  const handleNext = async () => {
    const lang = selectedLanguage === 'English' ? 'en' : 'hi'
    trackEvent('LanguageNextClicked', { language: lang })
    
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      userData.language = lang
      localStorage.setItem('user', JSON.stringify(userData))
      
      if (userData.id) {
        setLoading(true)
        try {
          await fetch(buildApiUrl(`/users/${userData.id}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: lang }),
          })
        } catch (error) {
          console.error('Error saving language:', error)
        } finally {
          setLoading(false)
        }
      }
    }
    
    onSelectLanguage(lang)
    onNext()
  }

  return (
    <div className="min-h-screen bg-white flex flex-col p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-8 mt-6">Select Language</h2>
      
      <div className="flex-1 flex flex-col">
        <div className="space-y-4 mb-auto">
          {[
            { label: 'English', value: 'English' },
            { label: 'हिंदी', value: 'हिंदी' }
          ].map((language) => (
            <button
              key={language.value}
              onClick={() => { setSelectedLanguage(language.value); trackEvent('LanguageSelected', { language: language.value }) }}
              className={`w-full p-4 rounded-full border-2 transition-colors text-base flex items-center justify-center ${
                selectedLanguage === language.value
                  ? 'border-primary text-primary bg-orange-50'
                  : 'border-gray-200 text-gray-700 bg-white'
              }`}
            >
              {language.label}
            </button>
          ))}
        </div>
        
        <button 
          onClick={handleNext}
          disabled={loading}
          className="w-full bg-primary text-white py-4 rounded-full font-semibold text-base mt-8 flex items-center justify-center disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Next'}
        </button>
      </div>
    </div>
  )
}