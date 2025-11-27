'use client'
import { useRouter } from 'next/navigation'
import PrivacySecurityScreen from '@/components/PrivacySecurityScreen'
import PageLayout from '@/components/PageLayout'

export default function PrivacySecurityPage() {
  const router = useRouter()
  
  return (
    <PageLayout>
      <PrivacySecurityScreen onBack={() => router.back()} />
    </PageLayout>
  )
}
