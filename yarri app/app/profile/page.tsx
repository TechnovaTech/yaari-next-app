'use client'
import { useRouter } from 'next/navigation'
import ProfileMenuScreen from '@/components/ProfileMenuScreen'
import PageLayout from '@/components/PageLayout'

export default function ProfilePage() {
  const router = useRouter()
  
  return (
    <PageLayout>
      <ProfileMenuScreen 
        onBack={() => router.back()}
        onCallHistory={() => router.push('/call-history')}
        onTransactionHistory={() => router.push('/transaction-history')}
        onCustomerSupport={() => router.push('/customer-support')}
        onEditProfile={() => router.push('/edit-profile')}
        onPrivacySecurity={() => router.push('/privacy-security')}
      />
    </PageLayout>
  )
}
