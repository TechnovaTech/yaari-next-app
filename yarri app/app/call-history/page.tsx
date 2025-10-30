'use client'
import { useRouter } from 'next/navigation'
import CallHistoryScreen from '@/components/CallHistoryScreen'

export default function CallHistoryPage() {
  const router = useRouter()
  
  return (
    <CallHistoryScreen onBack={() => router.back()} />
  )
}
