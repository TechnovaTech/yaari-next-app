'use client'
import { useRouter } from 'next/navigation'
import LanguageScreen from '@/components/LanguageScreen'
import { useLanguage } from '@/contexts/LanguageContext'

export default function LanguagePage() {
  const router = useRouter()
  const { setLang } = useLanguage()
  
  return <LanguageScreen onNext={() => router.push('/gender')} onSelectLanguage={setLang} />
}
