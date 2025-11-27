'use client'
import { useRouter } from 'next/navigation'
import CallHistoryScreen from '@/components/CallHistoryScreen'
import PageLayout from '@/components/PageLayout'

export default function CallHistoryPage() {
  const router = useRouter()
  
  return (
    <PageLayout>
      <CallHistoryScreen onBack={() => router.back()} />
    </PageLayout>
  )
}
