'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import LoginScreen from '@/components/LoginScreen'

export default function LoginPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const user = localStorage.getItem('user')
    if (user) {
      try {
        const userData = JSON.parse(user)
        if (userData.name && userData.gender) {
          router.replace('/users')
        } else {
          router.replace('/language')
        }
      } catch {}
    }
  }, [router])

  if (!mounted) return null
  
  return (
    <GoogleOAuthProvider clientId="38963010109-kms7n3hb3dno6m5ol27km954mnmbf0vc.apps.googleusercontent.com">
      <LoginScreen onNext={() => router.push('/otp')} />
    </GoogleOAuthProvider>
  )
}
