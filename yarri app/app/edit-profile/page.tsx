'use client'
import { useRouter } from 'next/navigation'
import EditProfileScreen from '@/components/EditProfileScreen'

export default function EditProfilePage() {
  const router = useRouter()
  
  return <EditProfileScreen onBack={() => router.back()} />
}
