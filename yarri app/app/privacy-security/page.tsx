'use client'
import { useRouter } from 'next/navigation'
import PrivacySecurityScreen from '@/components/PrivacySecurityScreen'

export default function PrivacySecurityPage() {
  const router = useRouter()
  
  return (
    <PrivacySecurityScreen onBack={() => router.back()} />
  )
}
