'use client'
import { useRouter } from 'next/navigation'
import OTPScreen from '@/components/OTPScreen'

export default function OTPPage() {
  const router = useRouter()
  
  return <OTPScreen onNext={() => router.push('/language')} />
}
