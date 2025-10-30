'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const AudioCallScreen = dynamic(() => import('@/components/AudioCallScreen'), { ssr: false })

export default function AudioCallPage() {
  const router = useRouter()
  const [callData, setCallData] = useState<any>(null)

  useEffect(() => {
    const data = sessionStorage.getItem('callData')
    if (data) {
      setCallData(JSON.parse(data))
    } else {
      router.push('/users')
    }
  }, [router])

  if (!callData) return null

  return (
    <AudioCallScreen
      userName={callData.userName}
      userAvatar={callData.userAvatar}
      rate={callData.rate}
      onEndCall={() => {
        sessionStorage.removeItem('callData')
        router.push('/users')
      }}
    />
  )
}
