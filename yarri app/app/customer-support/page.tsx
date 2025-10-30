'use client'
import { useRouter } from 'next/navigation'
import CustomerSupportScreen from '@/components/CustomerSupportScreen'

export default function CustomerSupportPage() {
  const router = useRouter()
  
  return (
    <CustomerSupportScreen onBack={() => router.back()} />
  )
}
