'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const VideoCallScreen = dynamic(() => import('@/components/VideoCallScreen'), { ssr: false })

export default function VideoCallPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
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
    <VideoCallScreen
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
