'use client'
import { useRouter } from 'next/navigation'
import TransactionHistoryScreen from '@/components/TransactionHistoryScreen'

export default function TransactionHistoryPage() {
  const router = useRouter()
  
  return (
    <TransactionHistoryScreen onBack={() => router.back()} />
  )
}
