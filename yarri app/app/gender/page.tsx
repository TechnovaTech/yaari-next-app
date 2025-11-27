'use client'
import { useRouter } from 'next/navigation'
import GenderScreen from '@/components/GenderScreen'

export default function GenderPage() {
  const router = useRouter()
  
  return <GenderScreen onNext={() => router.push('/edit-profile')} />
}
