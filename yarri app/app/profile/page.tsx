'use client'
import { useRouter } from 'next/navigation'
import ProfileMenuScreen from '@/components/ProfileMenuScreen'

export default function ProfilePage() {
  const router = useRouter()
  
  return (
    <ProfileMenuScreen 
      onBack={() => router.back()}
      onCallHistory={() => router.push('/call-history')}
      onTransactionHistory={() => router.push('/transaction-history')}
      onCustomerSupport={() => router.push('/customer-support')}
      onEditProfile={() => router.push('/edit-profile')}
      onPrivacySecurity={() => router.push('/privacy-security')}
    />
  )
}
