import { useState, useEffect } from 'react'
import { trackScreenView, trackEvent } from '../utils/clevertap'

interface WelcomeScreenProps {
  onNext: () => void
}

export default function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  const [phone, setPhone] = useState('')

  useEffect(() => {
    trackScreenView('Welcome')
  }, [])

  const handleGetOtp = () => {
    const cleaned = phone.replace(/[^0-9]/g, '')
    if (cleaned.length !== 10) {
      alert('Please enter a valid 10-digit phone number')
      return
    }
    localStorage.setItem('phone', cleaned)
    trackEvent('GetOtpClicked', { phone: cleaned })
    onNext()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative p-4">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/loginScreenBackgroundImage.png)' }}
      />
      
      <div className="relative z-10 bg-white rounded-3xl p-6 shadow-lg max-w-sm w-full">
        <h2 className="text-xl font-bold text-primary mb-4">Welcome to Yaari</h2>
        <label className="block text-sm text-gray-600 mb-2">Phone Number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter 10-digit number"
          className="w-full border-2 border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:border-primary"
        />
        <button
          onClick={handleGetOtp}
          className="w-full bg-primary text-white py-4 rounded-full font-semibold text-base"
        >
          Get OTP
        </button>
      </div>
    </div>
  )
}