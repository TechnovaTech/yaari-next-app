'use client'
import { useRouter } from 'next/navigation'
import TransactionHistoryScreen from '@/components/TransactionHistoryScreen'
import PageLayout from '@/components/PageLayout'

export default function TransactionHistoryPage() {
  const router = useRouter()
  return (
    <PageLayout>
      <TransactionHistoryScreen onBack={() => router.back()} />
    </PageLayout>
  )
}
