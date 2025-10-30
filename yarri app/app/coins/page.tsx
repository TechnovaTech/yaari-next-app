'use client'
import { useRouter } from 'next/navigation'
import CoinPurchaseScreen from '@/components/CoinPurchaseScreen'

export default function CoinsPage() {
  const router = useRouter()
  
  return <CoinPurchaseScreen onBack={() => router.back()} />
}
