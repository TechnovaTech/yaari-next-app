import { useState, useRef, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { trackScreenView, trackEvent, trackUserLogin } from '../utils/clevertap'

interface OTPScreenProps {
  onNext: () => void
}

export default function OTPScreen({ onNext }: OTPScreenProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [phone, setPhone] = useState('')
  const [resendTimer, setResendTimer] = useState(30)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const savedPhone = localStorage.getItem('phone') || ''
    setPhone(savedPhone)
    trackScreenView('OTP Verification')
  }, [])

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [resendTimer])

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      alert('Please enter complete OTP')
      return
    }

    if (!isConfirmed) {
      alert('Please confirm that you are 18+')
      return
    }

    setIsVerifying(true)
    try {
      trackEvent('OtpVerifyAttempt', { phone })
      const endpoint = Capacitor.isNativePlatform()
        ? `${process.env.NEXT_PUBLIC_API_URL || 'https://acsgroup.cloud'}/api/auth/verify-otp`
        : `/api/auth/verify-otp`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otpCode }),
      })

      const data = await res.json()

      if (res.ok) {
        setIsVerified(true)
        trackEvent('OtpVerified', { phone })
        localStorage.setItem('user', JSON.stringify(data.user))
        // Set CleverTap identity to verified phone (OTP login)
        await trackUserLogin(phone, {
          'Login Method': 'OTP',
          Phone: phone,
          Name: data.user?.name,
          Email: data.user?.email,
        })
        
        if (!data.user.name || !data.user.gender) {
          setTimeout(() => onNext(), 500)
        } else {
          window.location.href = '/users'
        }
      } else {
        trackEvent('OtpVerifyFailed', { phone, error: data.error })
        alert(data.error || 'Invalid OTP')
        setIsVerifying(false)
      }
    } catch (error) {
      trackEvent('OtpVerifyError', { phone })
      alert('Error verifying OTP')
      setIsVerifying(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)
      
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleResendOTP = async () => {
    if (!canResend) return
    
    try {
      const endpoint = Capacitor.isNativePlatform()
        ? `${process.env.NEXT_PUBLIC_API_URL || 'https://acsgroup.cloud'}/api/auth/send-otp`
        : `/api/auth/send-otp`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      
      if (res.ok) {
        setResendTimer(30)
        setCanResend(false)
        setOtp(['', '', '', '', '', ''])
        trackEvent('OTP Resent', { phone })
        alert('OTP sent successfully')
      } else {
        alert('Failed to resend OTP')
      }
    } catch (error) {
      alert('Error resending OTP')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative p-4">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/loginScreenBackgroundImage.png)' }}
      />
      
      <div className="relative z-10 bg-white rounded-3xl p-6 shadow-lg max-w-sm w-full">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-primary mb-2">Enter OTP sent to</h2>
          <p className="text-gray-600 text-sm">+91 {phone}</p>
        </div>
        
        <div className="flex justify-center space-x-2 mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-11 h-11 border-2 border-gray-300 rounded-lg text-center text-lg font-semibold focus:outline-none focus:border-primary bg-white"
            />
          ))}
        </div>
        
        <button
          onClick={handleResendOTP}
          disabled={!canResend}
          className={`text-center text-sm w-full mb-4 ${
            canResend ? 'text-primary cursor-pointer' : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          {canResend ? 'Resend OTP' : `Resend OTP in ${resendTimer}s`}
        </button>
        
        <button 
          onClick={handleVerifyOTP}
          disabled={isVerifying || isVerified}
          className="w-full bg-primary text-white py-4 rounded-full font-semibold text-base mb-3 flex items-center justify-center relative overflow-hidden mt-2.5"
        >
          {isVerifying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {isVerified && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          <span className={isVerifying || isVerified ? 'opacity-0' : 'opacity-100'}>
            Verify & Continue
          </span>
        </button>
        
        <button 
          onClick={() => { const next = !isConfirmed; setIsConfirmed(next); trackEvent('AgeConfirmToggled', { confirmed: next }) }}
          className="text-center text-xs text-gray-600 flex items-center justify-center w-full mb-3 mt-2.5"
        >
          <span className={`inline-block w-4 h-4 rounded-sm mr-2 flex items-center justify-center text-white text-xs border-2 transition-colors ${
            isConfirmed ? 'bg-primary border-primary' : 'bg-white border-gray-300'
          }`}>
            {isConfirmed && <span className="mt-2.5">✓</span>}
          </span>
          I Confirm I'm 18+
        </button>
      </div>
    </div>
  )
}