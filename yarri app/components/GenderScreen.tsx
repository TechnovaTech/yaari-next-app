import { useState, useEffect } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../utils/translations'
import { trackScreenView, trackEvent } from '../utils/clevertap'

interface GenderScreenProps {
  onNext: () => void
}

export default function GenderScreen({ onNext }: GenderScreenProps) {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [selectedGender, setSelectedGender] = useState('female')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    trackScreenView('Gender Select')
  }, [])

  const handleNext = async () => {
    setLoading(true)
    try {
      // Make tracking calls non-blocking
      trackEvent('GenderSaveAttempt', { gender: selectedGender }).catch(error => {
        console.warn('CleverTap tracking failed:', error)
      })
      
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const res = await fetch(`https://acsgroup.cloud/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gender: selectedGender }),
      })
      
      if (res.ok) {
        const updatedUser = { ...user, gender: selectedGender }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        
        // Make tracking calls non-blocking
        trackEvent('GenderSaved', { gender: selectedGender }).catch(error => {
          console.warn('CleverTap tracking failed:', error)
        })
        
        // Use immediate navigation to prevent UI freeze
        setTimeout(() => {
          onNext()
        }, 0)
      } else {
        trackEvent('GenderSaveFailed', { gender: selectedGender }).catch(error => {
          console.warn('CleverTap tracking failed:', error)
        })
        alert('Failed to save gender')
      }
    } catch (error) {
      trackEvent('GenderSaveError', { gender: selectedGender }).catch(trackError => {
        console.warn('CleverTap tracking failed:', trackError)
      })
      alert('Error saving gender')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col p-6">
      <button className="self-start mb-6">
        <ChevronLeft size={24} className="text-gray-800" />
      </button>
      
      <h2 className="text-2xl font-semibold text-gray-800 mb-8">{t.selectGender}</h2>
      
      <div className="flex-1 flex flex-col">
        <div className="flex justify-center space-x-4 mb-auto">
          <button
            onClick={() => { setSelectedGender('male'); trackEvent('GenderSelected', { gender: 'male' }) }}
            className={`px-8 py-3 rounded-full border-2 transition-colors text-base flex items-center justify-center ${
              selectedGender === 'male'
                ? 'border-primary text-primary bg-orange-50'
                : 'border-gray-200 text-gray-700 bg-white'
            }`}
          >
            {t.male}
          </button>
          
          <button
            onClick={() => { setSelectedGender('female'); trackEvent('GenderSelected', { gender: 'female' }) }}
            className={`px-8 py-3 rounded-full border-2 transition-colors text-base flex items-center justify-center ${
              selectedGender === 'female'
                ? 'border-primary text-primary bg-orange-50'
                : 'border-gray-200 text-gray-700 bg-white'
            }`}
          >
            {t.female}
          </button>
        </div>
        
        <button 
          onClick={handleNext}
          disabled={loading}
          className="w-full bg-primary text-white py-4 rounded-full font-semibold text-base mt-8 disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? 'Saving...' : t.next}
        </button>
      </div>
    </div>
  )
}