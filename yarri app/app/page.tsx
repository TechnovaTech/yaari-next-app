'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        // Use setTimeout to prevent blocking the UI
        setTimeout(() => {
          if (user.name && user.gender) {
            router.push('/users')
          } else {
            router.push('/language')
          }
        }, 100)
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('user')
      }
    } else {
      router.replace('/login')
    }
  }, [])

  return null
}
