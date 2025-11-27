'use client'
import { useRouter } from 'next/navigation'
import CustomerSupportScreen from '@/components/CustomerSupportScreen'
import PageLayout from '@/components/PageLayout'

export default function CustomerSupportPage() {
  const router = useRouter()
  return (
    <PageLayout>
      <CustomerSupportScreen onBack={() => router.back()} />
    </PageLayout>
  )
}
