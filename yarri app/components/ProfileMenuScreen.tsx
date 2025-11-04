import { ChevronLeft, List, Phone, Shield, Headphones, LogOut, User, Edit2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../utils/translations'
import { trackScreenView, trackEvent } from '../utils/clevertap'
import { Capacitor } from '@capacitor/core'

interface ProfileMenuScreenProps {
  onBack: () => void
  onCallHistory: () => void
  onTransactionHistory: () => void
  onCustomerSupport: () => void
  onEditProfile: () => void
  onPrivacySecurity: () => void
}

export default function ProfileMenuScreen({ onBack, onCallHistory, onTransactionHistory, onCustomerSupport, onEditProfile, onPrivacySecurity }: ProfileMenuScreenProps) {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [userName, setUserName] = useState('User Name')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [profilePic, setProfilePic] = useState('')

  // Build API URL that avoids CORS in local dev; force remote on native
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://admin.yaari.me'
  const buildApiUrl = (path: string) => {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    const isNative = Capacitor.isNativePlatform()
    return (!isLocal || isNative) ? `${API_BASE}/api${path}` : `/api${path}`
  }

  const normalizeUrl = (url: string) =>
    url
      ?.replace(/https?:\/\/localhost:\d+/g, 'https://admin.yaari.me')
      ?.replace(/https?:\/\/0\.0\.0\.0:\d+/g, 'https://admin.yaari.me')

  useEffect(() => {
    trackScreenView('Profile Menu')
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setUserName(userData.name || 'User Name')
      setPhone(userData.phone || '')
      setEmail(userData.email || '')
      
      // Use stored profile pic but normalize any localhost/0.0.0.0 URLs
      if (userData.profilePic) {
        setProfilePic(normalizeUrl(userData.profilePic))
      }

      // Fetch latest profile image from server to avoid stale localStorage
      if (userData.id) {
        fetch(buildApiUrl(`/users/${userData.id}/images`))
          .then(async (res) => {
            if (!res.ok) return null
            try { return await res.json() } catch { return null }
          })
          .then((data) => {
            if (!data) return
            const serverPic = normalizeUrl(data.profilePic || '')
            if (serverPic) {
              setProfilePic(serverPic)
            }
          })
          .catch((err) => {
            console.error('Failed to fetch latest profile image:', err)
          })
      }
    }
  }, [])

  const handleLogout = () => {
    trackEvent('LogoutClicked')
    localStorage.clear()
    window.location.href = '/login'
  }
  
  const menuItems = [
    { icon: List, label: t.transactionHistory, key: 'transaction', bgColor: 'bg-orange-100' },
    { icon: Phone, label: t.callHistory, key: 'call', bgColor: 'bg-orange-100' },
    { icon: Shield, label: t.privacySecurity, key: 'privacy', bgColor: 'bg-orange-100' },
    { icon: Headphones, label: t.customerSupport, key: 'support', bgColor: 'bg-orange-100' },
    { icon: LogOut, label: t.logOut, key: 'logout', bgColor: 'bg-orange-100' },
  ]

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4">
        <button onClick={onBack} className="mb-6">
          <ChevronLeft size={24} className="text-gray-800" />
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={64} className="text-gray-500" />
              )}
            </div>
            <button onClick={() => { trackEvent('EditProfileClicked'); onEditProfile() }} className="absolute -top-1 -right-1 w-8 h-8 bg-white rounded-full border border-gray-300 flex items-center justify-center shadow-sm">
              <Edit2 size={14} className="text-primary" />
            </button>
          </div>
          <h2 className="text-xl font-bold text-gray-800">{userName}</h2>
          {phone && <p className="text-gray-600 text-sm">+91 {phone}</p>}
          {email && !phone && <p className="text-gray-600 text-sm">{email}</p>}
        </div>

        <div className="space-y-3">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                trackEvent('ProfileMenuClick', { item: item.key })
                const action =
                  item.key === 'call' ? onCallHistory :
                  item.key === 'transaction' ? onTransactionHistory :
                  item.key === 'support' ? onCustomerSupport :
                  item.key === 'privacy' ? onPrivacySecurity :
                  item.key === 'logout' ? handleLogout :
                  undefined
                if (action) action()
              }}
              className={`w-full flex items-center space-x-4 p-4 ${item.bgColor} rounded-2xl`}
            >
              <item.icon size={20} className="text-gray-800 flex-shrink-0" style={{ marginTop: '2px' }} />
              <span className="text-gray-800 font-medium mt-2.5">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
