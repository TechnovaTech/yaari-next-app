'use client'
import { useRouter } from 'next/navigation'
import UserListScreen from '@/components/UserListScreen'

export const dynamic = 'force-static'

export default function UsersPage() {
  const router = useRouter()

  return (
    <UserListScreen
      onNext={() => router.push('/profile')}
      onProfileClick={() => router.push('/profile')}
      onCoinClick={() => router.push('/coins')}
      onUserClick={(userId) => router.push(`/user-detail?id=${userId}`)}
      onStartCall={(data) => {
        sessionStorage.setItem('callData', JSON.stringify(data))
        router.push(data.type === 'video' ? '/video-call' : '/audio-call')
      }}
    />
  )
}