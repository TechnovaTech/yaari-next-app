import { useState, useEffect } from 'react'
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'
import { useGoogleLogin } from '@react-oauth/google'
import { Capacitor } from '@capacitor/core'
import { useRouter } from 'next/navigation'
import { trackUserLogin, trackEvent } from '@/utils/clevertap'

interface LoginScreenProps {
  onNext: () => void
}

export default function LoginScreen({ onNext }: LoginScreenProps) {
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [isNative, setIsNative] = useState(false)

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform())
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        clientId: '38963010109-kms7n3hb3dno6m5ol27km954mnmbf0vc.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: false,
      })
    }
  }, [])

  const handleGoogleLoginSuccess = async (email: string, name: string, googleId: string, profilePic: string) => {
    try {
      const res = await fetch('https://acsgroup.cloud/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, googleId, profilePic }),
      })
      
      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('user', JSON.stringify(data.user))
        
        // Track user login with CleverTap
        await trackUserLogin(googleId, {
          Name: name,
          Email: email,
          'Login Method': 'Google',
          'Profile Picture': profilePic
        })
        
        // Track login event
        await trackEvent('User Login', {
          'Login Method': 'Google',
          'User ID': googleId,
          'Email': email
        })
        
        if (data.user.name && data.user.gender) {
          router.push('/users')
        } else {
          router.push('/language')
        }
      } else {
        alert('Failed to login with Google')
      }
    } catch (error) {
      console.error('Google login error:', error)
      alert('Error logging in with Google')
    }
  }

  const webGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        })
        const userInfo = await userInfoRes.json()
        
        await handleGoogleLoginSuccess(
          userInfo.email,
          userInfo.name,
          userInfo.sub,
          userInfo.picture
        )
      } catch (error) {
        console.error('Error fetching user info:', error)
        alert('Failed to get user information')
      } finally {
        setGoogleLoading(false)
      }
    },
    onError: () => {
      setGoogleLoading(false)
      alert('Google Sign-In was cancelled or failed')
    },
  })

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '')
    if (value.startsWith('91')) {
      value = value.slice(2)
    }
    if (value.length <= 10) {
      setPhoneNumber(value)
    }
  }

  const handleSendOTP = async () => {
    if (phoneNumber.length !== 10) {
      alert('Please enter valid 10 digit phone number')
      return
    }
    
    setLoading(true)
    try {
      const endpoint = Capacitor.isNativePlatform()
        ? `${process.env.NEXT_PUBLIC_API_URL || 'https://acsgroup.cloud'}/api/auth/send-otp`
        : `/api/auth/send-otp`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      })
      
      if (res.ok) {
        localStorage.setItem('phone', phoneNumber)
        
        // Track OTP request event
        await trackEvent('OTP Requested', {
          'Login Method': 'Phone',
          'Phone Number': phoneNumber
        })
        
        onNext()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Failed to send OTP')
      }
    } catch (error) {
      alert('Error sending OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    
    if (isNative) {
      try {
        const result = await GoogleAuth.signIn()
        await handleGoogleLoginSuccess(
          result.email,
          result.name,
          result.id,
          result.imageUrl
        )
      } catch (error: any) {
        console.error('Native Google Sign-In error:', error)
        const message = typeof error === 'string' ? error : (error?.message || 'Error signing in with Google')
        // Prefer Capacitor error code; fall back to statusCode/status when present
        const code = (error?.code ?? error?.statusCode ?? error?.status ?? '')
        alert(`Error signing in with Google${code ? ` (code: ${code})` : ''}`)
        // Attempt web-based fallback
        try {
          webGoogleLogin()
        } catch {}
      } finally {
        setGoogleLoading(false)
      }
    } else {
      webGoogleLogin()
    }
  }

  const displayPhone = phoneNumber ? `+91 ${phoneNumber}` : '+91 '

  return (
    <div className="min-h-screen flex flex-col relative">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/loginScreenBackgroundImage.png)' }}
      />
      
      <div 
        className={`absolute left-0 right-0 bg-white rounded-t-3xl p-8 shadow-lg transition-all duration-300 z-10 ${
          isFocused ? 'bottom-0' : 'bottom-0'
        }`}
        style={{
          paddingBottom: isFocused ? 'env(safe-area-inset-bottom, 20px)' : '32px'
        }}
      >
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-primary mb-2">Yaari</h1>
          <p className="text-gray-600 text-sm">Connect with real people</p>
        </div>
        
        <div className="mb-4">
          <input
            type="tel"
            inputMode="numeric"
            placeholder="Enter your Phone Number"
            value={displayPhone}
            onChange={handlePhoneChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full p-4 border border-gray-300 rounded-full text-base focus:outline-none focus:border-primary bg-gray-50"
          />
        </div>
        
        <button 
          onClick={handleSendOTP}
          disabled={loading}
          className="w-full bg-primary text-white py-4 rounded-full font-semibold text-base mb-4 disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? 'Sending...' : 'Get OTP'}
        </button>
        
        <div className="flex items-center mb-4">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-gray-500 text-sm">OR</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>
        
        <button 
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-full font-semibold text-base mb-3 disabled:opacity-50 flex items-center justify-center gap-3 hover:bg-gray-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {googleLoading ? 'Signing in...' : 'Continue with Google'}
        </button>
        
        <a
          href="https://yaari.me/policies/terms-of-service"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-xs text-primary hover:underline"
        >
          Terms & Conditions
        </a>
      </div>
    </div>
  )
}