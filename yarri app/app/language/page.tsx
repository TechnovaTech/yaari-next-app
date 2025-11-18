'use client'
import { useRouter } from 'next/navigation'
import LanguageScreen from '@/components/LanguageScreen'
import { useLanguage } from '@/contexts/LanguageContext'
import PageLayout from '@/components/PageLayout'

export default function LanguagePage() {
  const router = useRouter()
  const { setLang } = useLanguage()
  
  return (
    <PageLayout>
      <LanguageScreen onNext={() => router.push('/gender')} onSelectLanguage={setLang} />
    </PageLayout>
  )
}
