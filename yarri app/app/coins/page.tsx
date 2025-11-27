'use client'
import { useRouter } from 'next/navigation'
import CoinPurchaseScreen from '@/components/CoinPurchaseScreen'
import PageLayout from '@/components/PageLayout'

export default function CoinsPage() {
  const router = useRouter()
  
  return (
    <PageLayout>
      <CoinPurchaseScreen onBack={() => router.back()} />
    </PageLayout>
  )
}
