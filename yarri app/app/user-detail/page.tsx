"use client"
import { useRouter, useSearchParams } from 'next/navigation'
import UserDetailScreen from '@/components/UserDetailScreen'
import PageLayout from '@/components/PageLayout'

export default function UserDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams?.get('id') ?? ''

  if (!id) {
    router.replace('/users')
    return null
  }

  return (
    <PageLayout>
      <UserDetailScreen 
        userId={id}
        onBack={() => router.back()}
        onStartCall={(data) => {
          sessionStorage.setItem('callData', JSON.stringify(data))
          router.push(data.type === 'video' ? '/video-call' : '/audio-call')
        }}
      />
    </PageLayout>
  )
}