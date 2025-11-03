import { ArrowLeft, Phone, User as UserIcon, Video } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../utils/translations'
import { useRouter } from 'next/navigation'
import { useSocket } from '../contexts/SocketContext'
import CallConfirmationScreen from './CallConfirmationScreen'
import PermissionModal from './PermissionModal'
import PermissionDeniedModal from './PermissionDeniedModal'
import { trackEvent, trackScreenView, trackProfileView } from '@/utils/clevertap'

interface UserDetailScreenProps {
  onBack: () => void
  userId: string
  onStartCall: (data: { userName: string; userAvatar: string; rate: number; type: 'video' | 'audio' }) => void
}

export default function UserDetailScreen({ onBack, userId, onStartCall }: UserDetailScreenProps) {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userStatus, setUserStatus] = useState<'online' | 'offline'>('offline')
  const router = useRouter()
  const { socket } = useSocket()
  const [showCallModal, setShowCallModal] = useState(false)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [showPermissionDenied, setShowPermissionDenied] = useState(false)
  const [permissionType, setPermissionType] = useState<'video' | 'audio'>('video')
  const [selectedCall, setSelectedCall] = useState<{ userName: string; userAvatar: string; rate: number; type: 'video' | 'audio' } | null>(null)
  const [isRinging, setIsRinging] = useState(false)

  useEffect(() => {
    fetchUser()
    
    // Track screen view and profile view
    trackScreenView('User Detail')
    trackProfileView(userId)
  }, [userId])

  useEffect(() => {
    if (!socket) return

    const handleUserStatusChange = ({ userId: statusUserId, status }: { userId: string; status: string }) => {
      if (statusUserId === userId) {
        setUserStatus(status === 'online' ? 'online' : 'offline')
      }
    }

    const handleOnlineUsers = (userStatuses: { userId: string; status: string }[]) => {
      const userStatusData = userStatuses.find(us => us.userId === userId)
      if (userStatusData) {
        setUserStatus(userStatusData.status === 'online' ? 'online' : 'offline')
      }
    }

    socket.on('online-users', handleOnlineUsers)
    socket.on('user-status-change', handleUserStatusChange)
    socket.emit('get-online-users')

    socket.on('call-accepted', ({ channelName }) => {
      setIsRinging(false)
      sessionStorage.setItem('channelName', channelName)
      const callData = sessionStorage.getItem('callData')
      if (callData) {
        const data = JSON.parse(callData)
        setTimeout(() => {
          router.push(data.type === 'video' ? '/video-call' : '/audio-call')
        }, 100)
      }
    })

    socket.on('call-declined', () => {
      setIsRinging(false)
      sessionStorage.removeItem('callData')
      alert('Call declined by user')
    })

    socket.on('call-ended', () => {
      setIsRinging(false)
      sessionStorage.removeItem('callData')
      router.push('/users')
    })

    socket.on('call-busy', ({ message }) => {
      setIsRinging(false)
      sessionStorage.removeItem('callData')
      alert(message)
    })

    return () => {
      socket.off('call-accepted')
      socket.off('call-declined')
      socket.off('call-ended')
      socket.off('call-busy')
      socket.off('online-users', handleOnlineUsers)
      socket.off('user-status-change', handleUserStatusChange)
    }
  }, [socket, router])

  const fetchUser = async () => {
    try {
      const res = await fetch(`https://admin.yaari.me/api/users/${userId}`)
      const data = await res.json()
      
      // Fix localhost URLs
      if (data.profilePic && data.profilePic.includes('localhost')) {
        data.profilePic = data.profilePic.replace(/https?:\/\/0\.0\.0\.0:\d+/, 'https://admin.yaari.me')
      }
      
      if (data.gallery && Array.isArray(data.gallery)) {
        data.gallery = data.gallery.map((url: string) => 
          url.includes('localhost') ? url.replace(/https?:\/\/0\.0\.0\.0:\d+/, 'https://admin.yaari.me') : url
        )
      }
      
      setUser(data)
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">User not found</p>
      </div>
    )
  }


  const handleCallClick = (type: 'video' | 'audio', rate: number) => {
    const userName = user?.name || 'User'
    const userAvatar = user?.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
    const permissionsGranted = localStorage.getItem('mediaPermissionsGranted')

    setSelectedCall({ userName, userAvatar, rate, type })
    if (permissionsGranted === 'true') {
      setShowCallModal(true)
    } else {
      setPermissionType(type)
      setShowPermissionModal(true)
    }
  }

  const handlePermissionAllow = () => {
    localStorage.setItem('mediaPermissionsGranted', 'true')
    setShowPermissionModal(false)
    setShowCallModal(true)
  }

  const handlePermissionDeny = () => {
    setShowPermissionModal(false)
    setSelectedCall(null)
    setShowPermissionDenied(true)
  }

  const handleConfirmCall = () => {
    if (!selectedCall || !socket) return

    setShowCallModal(false)
    setIsRinging(true)

    const user = localStorage.getItem('user')
    const userData = user ? JSON.parse(user) : null
    const channelName = `call_${Date.now()}`

    sessionStorage.setItem('callData', JSON.stringify({
      userName: selectedCall.userName,
      userAvatar: selectedCall.userAvatar,
      rate: selectedCall.rate,
      type: selectedCall.type,
      channelName,
      otherUserId: userId
    }))

    socket.emit('call-user', {
      callerId: userData?.id,
      callerName: userData?.name || 'User',
      receiverId: userId,
      callType: selectedCall.type,
      channelName
    })
  }

  // Allow cancelling outgoing call while ringing
  const handleCancelRinging = () => {
    try {
      const callData = sessionStorage.getItem('callData')
      const user = localStorage.getItem('user')
      const userData = user ? JSON.parse(user) : null
      if (socket && callData && userData?.id) {
        const data = JSON.parse(callData)
        if (data?.otherUserId) {
          socket.emit('end-call', {
            userId: userData.id,
            otherUserId: data.otherUserId,
          })
        }
      }
    } catch (_) {}
    setIsRinging(false)
    sessionStorage.removeItem('callData')
    sessionStorage.removeItem('channelName')
  }
  const userName = user.name || 'User'
  const userAvatar = user.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
  return (
    <div className="min-h-screen bg-white">
      <div className="p-4">
        <button onClick={onBack}>
          <ArrowLeft size={24} className="text-gray-800" />
        </button>
      </div>

      <div className="px-6 pb-32">
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-3">
            <div className="w-32 h-32 bg-gray-300 rounded-full overflow-hidden flex items-center justify-center">
              {user.profilePic ? (
                <img src={user.profilePic} alt="User" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={64} className="text-gray-500" />
              )}
            </div>
            <div className="absolute top-2 -right-4 bg-white px-2 py-1 rounded-full flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${userStatus === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className={`text-xs font-medium ${userStatus === 'online' ? 'text-green-500' : 'text-gray-400'}`}>
                {userStatus === 'online' ? t.online : t.offline}
              </span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900">{userName}</h2>
        </div>

        {user.about && (
          <div className="mb-6">
            <h3 className="text-primary font-semibold text-lg mb-2">{t.aboutMe}</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              {user.about}
            </p>
          </div>
        )}

        {user.gallery && user.gallery.length > 0 && (
          <div className="mb-6">
            <h3 className="text-primary font-semibold text-lg mb-3">{t.photoGallery}</h3>
            <div className="grid grid-cols-3 gap-2">
              {user.gallery.map((img: string, i: number) => (
                <img key={i} src={img} alt={`Gallery ${i}`} className="aspect-square object-cover rounded-lg" />
              ))}
            </div>
          </div>
        )}

        {user.hobbies && user.hobbies.length > 0 && (
          <div className="mb-6">
            <h3 className="text-primary font-semibold text-lg mb-3">{t.hobbies}</h3>
            <div className="flex flex-wrap gap-2">
              {user.hobbies.map((hobby: string, i: number) => (
                <span key={i} className="bg-orange-50 text-gray-800 px-4 py-2 rounded-lg text-sm border border-gray-200">
                  {hobby}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
        <div className="flex space-x-3">
          <button 
            onClick={() => handleCallClick('video', 10)}
              className="flex-1 bg-primary text-white py-4 rounded-full font-semibold flex items-center justify-center gap-2"
          >
            <Video size={18} />
            <span className="flex items-center gap-0.5" style={{ marginTop: '10px' }}>
                      10
                      <img src="/images/coinicon.png" alt="coin" className="w-3 h-3 object-contain inline rounded-full border border-white mb-2.5"/>
                      / min
                    </span>
          </button>
          <button 
            onClick={() => handleCallClick('audio', 5)}
            className="flex-1 bg-primary text-white py-4 rounded-full font-semibold flex items-center justify-center gap-2"
          >
            <Phone size={18} />
            <span className="flex items-center gap-0.5" style={{ marginTop: '10px' }}>
                      5
                      <img src="/images/coinicon.png" alt="coin" className="w-3 h-3 object-contain inline rounded-full border border-white mb-2.5"/>
                      / min
                    </span>
          </button>
        </div>
      </div>

      {showPermissionModal && (
        <PermissionModal
          type={permissionType}
          onAllow={handlePermissionAllow}
          onDeny={handlePermissionDeny}
        />
      )}

      {showPermissionDenied && (
        <PermissionDeniedModal
          onClose={() => {
            setShowPermissionDenied(false)
            setSelectedCall(null)
          }}
          onRetry={() => {
            setShowPermissionDenied(false)
            setShowPermissionModal(true)
          }}
        />
      )}

      {showCallModal && selectedCall && (
        <CallConfirmationScreen
          onClose={() => setShowCallModal(false)}
          onConfirm={handleConfirmCall}
          userName={selectedCall.userName}
          callType={selectedCall.type}
          rate={selectedCall.rate}
          userAvatar={selectedCall.userAvatar}
        />
      )}

      {isRinging && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-24 h-24 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
              <Phone size={40} className="text-white" />
            </div>
            <p className="text-white text-xl">Ringing...</p>
            <button
              onClick={handleCancelRinging}
              className="mt-6 px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              Terminate Call
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
