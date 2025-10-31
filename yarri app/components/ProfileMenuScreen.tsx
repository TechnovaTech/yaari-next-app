import { ChevronLeft, List, Phone, Shield, Headphones, LogOut, User, Edit2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../utils/translations'
import { trackScreenView, trackEvent } from '../utils/clevertap'

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

  useEffect(() => {
    trackScreenView('Profile Menu')
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setUserName(userData.name || 'User Name')
      setPhone(userData.phone || '')
      setEmail(userData.email || '')
      
      // Priority: 1. Uploaded profile pic (non-Google URL), 2. Google profile pic, 3. None
      if (userData.profilePic) {
        setProfilePic(userData.profilePic)
      }
    }
  }, [])

  const handleLogout = () => {
    trackEvent('LogoutClicked')
    localStorage.clear()
    window.location.href = '/login'
  }
  
  const menuItems = [
    { icon: List, label: t.transactionHistory, key: 'transaction', bgColor: 'bg-orange-50' },
    { icon: Phone, label: t.callHistory, key: 'call', bgColor: 'bg-orange-50' },
    { icon: Shield, label: t.privacySecurity, key: 'privacy', bgColor: 'bg-orange-50' },
    { icon: Headphones, label: t.customerSupport, key: 'support', bgColor: 'bg-orange-50' },
    { icon: LogOut, label: t.logOut, key: 'logout', bgColor: 'bg-orange-50' },
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
              className={`w-full flex items-center space-x-4 p-4 ${item.bgColor} rounded-2xl transition-colors hover:bg-orange-100`}
            >
              <item.icon size={20} className="text-gray-800 flex-shrink-0" style={{ marginTop: '2px' }} />
              <span className="text-gray-800 font-medium" style={{ marginTop: '10px' }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
