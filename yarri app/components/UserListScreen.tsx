import { Heart, User as UserIcon, Video, Phone } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import CallConfirmationScreen from './CallConfirmationScreen'
import IncomingCallModal from './IncomingCallModal'
import PermissionModal from './PermissionModal'
import PermissionDeniedModal from './PermissionDeniedModal'
import InsufficientCoinsModal from './InsufficientCoinsModal'
import AdBanner from './AdBanner'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../utils/translations'
import { useSocket } from '../contexts/SocketContext'
import { useRouter } from 'next/navigation'
import { trackEvent, trackScreenView } from '@/utils/clevertap'

interface UserListScreenProps {
  onNext: () => void
  onProfileClick: () => void
  onCoinClick: () => void
  onUserClick: (userId: string) => void
  onStartCall: (data: { userName: string; userAvatar: string; rate: number; type: 'video' | 'audio' }) => void
}

interface User {
  id: string
  name: string
  attributes: string
  status: 'online' | 'offline' | 'busy'
  statusColor: string
  profilePic?: string
  googleProfilePic?: string
  gender?: string
  callAccess?: 'none' | 'audio' | 'video' | 'full'
}

export default function UserListScreen({ onNext, onProfileClick, onCoinClick, onUserClick, onStartCall }: UserListScreenProps) {
  const { lang } = useLanguage()
  const t = translations[lang]
  const router = useRouter()
  const { socket } = useSocket()
  const [showCallModal, setShowCallModal] = useState(false)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [showPermissionDenied, setShowPermissionDenied] = useState(false)
  const [permissionType, setPermissionType] = useState<'video' | 'audio'>('video')
  const [selectedCall, setSelectedCall] = useState<{ user: User; type: 'video' | 'audio'; rate: number } | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState(0)
  const [incomingCall, setIncomingCall] = useState<{ callerId: string; callerName: string; callType: 'video' | 'audio'; channelName: string } | null>(null)
  const [isRinging, setIsRinging] = useState(false)
  const [useFallbackIcon, setUseFallbackIcon] = useState(false)
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all')
  const [audioCallRate, setAudioCallRate] = useState(5)
  const [videoCallRate, setVideoCallRate] = useState(10)
  const [showInsufficientCoins, setShowInsufficientCoins] = useState(false)
  const [currentUserProfilePic, setCurrentUserProfilePic] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [touchStart, setTouchStart] = useState(0)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      if (userData.gender === 'male') {
        setGenderFilter('female')
      } else if (userData.gender === 'female') {
        setGenderFilter('male')
      }
      
      if (userData.id) {
        fetch(`https://admin.yaari.me/api/users/${userData.id}/images`)
          .then(res => res.json())
          .then(data => {
            if (data.profilePic) {
              setCurrentUserProfilePic(data.profilePic.replace(/https?:\/\/(localhost|0\.0\.0\.0):\d+/g, 'https://admin.yaari.me'))
            }
          })
          .catch(() => {})
      }
    }
    
    fetchBalance()
    fetchCallRates()
    trackScreenView('User List')
  }, [])

  const fetchCallRates = async () => {
    try {
      const res = await fetch('https://admin.yaari.me/api/settings')
      const data = await res.json()
      if (data.audioCallRate) setAudioCallRate(data.audioCallRate)
      if (data.videoCallRate) setVideoCallRate(data.videoCallRate)
    } catch (error) {
      console.error('Error fetching call rates:', error)
    }
  }

  useEffect(() => {
    if (!socket) return

    // Fetch users first
    fetchUsers()

    // Emit user online status when component mounts
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      socket.emit('user-online', { userId: userData.id, status: 'online' })
    }

    // ===== Call events =====


    socket.on('call-accepted', ({ channelName }) => {
      console.log('Call accepted, navigating to call screen')
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
      console.log('Call declined')
      setIsRinging(false)
      sessionStorage.removeItem('callData')
      alert('Call declined')
    })

    socket.on('call-ended', () => {
      console.log('Call ended')
      setIsRinging(false)
      sessionStorage.removeItem('callData')
      router.push('/users')
    })

    socket.on('call-busy', ({ message }) => {
      console.log('Call busy:', message)
      setIsRinging(false)
      sessionStorage.removeItem('callData')
      alert(message)
    })

    // ===== Presence events =====
    const handleOnlineUsers = (userStatuses: { userId: string; status: string }[]) => {
      setUsers(prev => prev.map(u => {
        const userStatus = userStatuses.find(us => us.userId === u.id)
        if (userStatus) {
          const statusColor = userStatus.status === 'online' ? 'bg-green-500' : 
                             userStatus.status === 'busy' ? 'bg-yellow-500' : 'bg-gray-400'
          return { ...u, status: userStatus.status as 'online' | 'offline' | 'busy', statusColor }
        }
        return { ...u, status: 'offline', statusColor: 'bg-gray-400' }
      }))
    }

    const handleUserStatusChange = ({ userId, status }: { userId: string; status: string }) => {
      setUsers(prev => prev.map(u => {
        if (u.id === userId) {
          const statusColor = status === 'online' ? 'bg-green-500' : 
                             status === 'busy' ? 'bg-yellow-500' : 'bg-gray-400'
          return { ...u, status: status as 'online' | 'offline' | 'busy', statusColor }
        }
        return u
      }))
    }

    socket.on('online-users', handleOnlineUsers)
    socket.on('user-status-change', handleUserStatusChange)

    // Request initial online users list AFTER listeners are attached
    socket.emit('get-online-users')

    // Also re-request on reconnect to prevent stale presence and missed events
    const handleReconnect = () => {
      const user = localStorage.getItem('user')
      if (user) {
        const userData = JSON.parse(user)
        socket.emit('user-online', { userId: userData.id, status: 'online' })
      }
      socket.emit('get-online-users')
    }
    socket.on('connect', handleReconnect)
    return () => {

      socket.off('call-accepted')
      socket.off('call-declined')
      socket.off('call-ended')
      socket.off('call-busy')
      socket.off('online-users', handleOnlineUsers)
      socket.off('user-status-change', handleUserStatusChange)
      socket.off('connect', handleReconnect)
    }
  }, [socket, selectedCall, router])

  const fetchBalance = async () => {
    try {
      const user = localStorage.getItem('user')
      if (user) {
        const userData = JSON.parse(user)
        const res = await fetch(`https://admin.yaari.me/api/users/${userData.id}/balance`)
        const data = await res.json()
        if (res.ok) {
          setBalance(data.balance || 0)
        }
      }
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const currentUser = localStorage.getItem('user')
      const currentUserId = currentUser ? JSON.parse(currentUser).id : null
      
      const res = await fetch('https://admin.yaari.me/api/users-list')
      const data = await res.json()
      
      const formattedUsers = data
        .filter((user: any) => user._id !== currentUserId)
        .map((user: any) => {
          let displayPic = user.profilePic
          
          // Fix localhost and 0.0.0.0 URLs
          if (displayPic) {
            displayPic = displayPic
              .replace(/https?:\/\/localhost:\d+/, 'https://admin.yaari.me')
              .replace(/https?:\/\/0\.0\.0\.0:\d+/, 'https://admin.yaari.me')
          }
          
          if (!displayPic || displayPic.includes('googleusercontent.com')) {
            displayPic = displayPic || null
          }
          
          return {
            id: user._id,
            name: user.name || 'User',
            attributes: user.about || 'No description',
            status: 'offline',
            statusColor: 'bg-gray-400',
            profilePic: displayPic,
            googleProfilePic: displayPic && displayPic.includes('googleusercontent.com') ? displayPic : null,
            gender: user.gender,
            callAccess: user.callAccess || 'full',
          }
        })
      
      setUsers(formattedUsers)
      
      // Request online users after setting users
      if (socket) {
        socket.emit('get-online-users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCallClick = async (user: User, type: 'video' | 'audio', rate: number, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (balance < rate) {
      setShowInsufficientCoins(true)
      return
    }
    
    const permissionsGranted = localStorage.getItem('mediaPermissionsGranted')
    
    if (permissionsGranted === 'true') {
      setSelectedCall({ user, type, rate })
      setShowCallModal(true)
    } else {
      setSelectedCall({ user, type, rate })
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
  }

  const handleConfirmCall = () => {
    if (selectedCall && socket) {
      setShowCallModal(false)
      setIsRinging(true)
      
      const user = localStorage.getItem('user')
      const userData = user ? JSON.parse(user) : null
      const channelName = `call_${Date.now()}`
      
      console.log('Calling user:', {
        callerId: userData?.id,
        callerName: userData?.name,
        receiverId: selectedCall.user.id,
        callType: selectedCall.type
      })
      
      // Track call initiation event
      trackEvent('Call Initiated', {
        'Call Type': selectedCall.type,
        'Receiver ID': selectedCall.user.id,
        'Rate': selectedCall.rate,
        'Source': 'User List'
      })
      
      sessionStorage.setItem('callData', JSON.stringify({
        userName: selectedCall.user.name,
        userAvatar: selectedCall.user.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedCall.user.id}`,
        rate: selectedCall.rate,
        type: selectedCall.type,
        channelName,
        otherUserId: selectedCall.user.id
      }))
      
      socket.emit('call-user', {
        callerId: userData?.id,
        callerName: userData?.name || 'User',
        receiverId: selectedCall.user.id,
        callType: selectedCall.type,
        channelName
      })
    }
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

  const handleAcceptCall = () => {
    if (incomingCall && socket) {
      console.log('Accepting call from:', incomingCall.callerId)
      
      sessionStorage.setItem('channelName', incomingCall.channelName)
      sessionStorage.setItem('callData', JSON.stringify({
        userName: incomingCall.callerName,
        userAvatar: '',
        rate: incomingCall.callType === 'video' ? videoCallRate : audioCallRate,
        type: incomingCall.callType,
        channelName: incomingCall.channelName,
        otherUserId: incomingCall.callerId
      }))
      
      socket.emit('accept-call', {
        callerId: incomingCall.callerId,
        channelName: incomingCall.channelName,
        callType: incomingCall.callType,
      })
      
      setIncomingCall(null)
      setTimeout(() => {
        router.push(incomingCall.callType === 'video' ? '/video-call' : '/audio-call')
      }, 100)
    }
  }

  const handleDeclineCall = () => {
    if (incomingCall && socket) {
      console.log('Declining call from:', incomingCall.callerId)
      
      socket.emit('decline-call', { callerId: incomingCall.callerId })
      setIncomingCall(null)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchUsers(), fetchBalance()])
    setRefreshing(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setTouchStart(e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart > 0 && window.scrollY === 0) {
      const touchCurrent = e.touches[0].clientY
      if (touchCurrent - touchStart > 80 && !refreshing) {
        handleRefresh()
        setTouchStart(0)
      }
    }
  }

  const handleTouchEnd = () => {
    setTouchStart(0)
  }

  return (
    <div className="min-h-screen bg-gray-50" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <div className="fixed top-0 left-0 right-0 z-50 bg-white p-4 pt-safe-top flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2" style={{ alignItems: 'center' }}>
          <Heart className="text-primary" size={24} fill="#FF6B35" style={{ marginTop: '4px' }} />
          <h1 className="text-2xl font-bold text-primary mt-5" style={{ lineHeight: '24px' }}>Yaari</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={onCoinClick}
            className="flex items-center gap-2 border-2 border-orange-500 px-3 py-0 rounded-lg mt-2.5"
            style={{ alignItems: 'center' }}
          >
            {useFallbackIcon ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700" style={{ marginTop: '2px' }}>
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
              </svg>
            ) : (
              <img
                src="/images/coinicon.png"
                alt="coin"
                className="w-5 h-5 object-contain"
                style={{ marginTop: '0px' }}
                onError={() => setUseFallbackIcon(true)}
              />
            )}
            <span className="text-gray-800 font-bold text-base mt-3" style={{ lineHeight: '20px' }}>{balance}</span>
          </button>
          <button 
            onClick={onProfileClick}
            className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center mt-2.5 overflow-hidden"
          >
            {currentUserProfilePic ? (
              <img src={currentUserProfilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="text-white" size={20} />
            )}
          </button>
        </div>
      </div>

      <div className="p-4" style={{ paddingTop: 'calc(5rem + env(safe-area-inset-top))' }}>
        {refreshing && (
          <div className="flex justify-center py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}
        <AdBanner />
        


        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No users found
          </div>
        ) : (
        <div className="space-y-3">
          {users
            .filter((user) => genderFilter === 'all' || user.gender === genderFilter)
            .sort((a, b) => {
              // Sort by status: online first, then busy, then offline
              const statusOrder = { online: 0, busy: 1, offline: 2 }
              return statusOrder[a.status] - statusOrder[b.status]
            })
            .map((user) => (
            <div 
              key={user.id} 
              onClick={() => {
                // Track profile view
                trackEvent('Profile Viewed', {
                  'Viewed User ID': user.id,
                  'Source': 'User List',
                  'User Name': user.name,
                  'User Status': user.status
                })
                onUserClick(user.id)
              }}
              className="bg-white rounded-2xl p-4 flex items-center space-x-4 shadow-sm cursor-pointer active:bg-gray-50"
            >
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 bg-gray-300 rounded-full overflow-hidden">
                  {user.profilePic ? (
                    <img src={user.profilePic} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt="User" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 ${user.statusColor} rounded-full text-white text-xs font-medium flex items-center space-x-1`}>
                  <div className="w-1 h-1  bg-white rounded-full"></div>
                  <span className="capitalize mt-2.5">{user.status === 'online' ? t.online : user.status === 'offline' ? t.offline : t.busy}</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-primary font-bold text-lg mb-0.5">{user.name}</h3>
                <p className="text-gray-500 text-sm mb-3 line-clamp-1 overflow-hidden">
                  {user.attributes && user.attributes.length > 50 
                    ? `${user.attributes.slice(0, 50)}......` 
                    : user.attributes
                  }
                </p>
                {user.callAccess !== 'none' && (
                  <div className="flex gap-2">
                    {(user.callAccess === 'video' || user.callAccess === 'full') && (
                      <button 
                        onClick={(e) => handleCallClick(user, 'video', videoCallRate, e)}
                        className="flex-1 bg-primary text-white py-2 rounded-full flex items-center justify-center gap-1"
                        style={{ alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Video size={16} fill="white" strokeWidth={0} />
                        <span className="flex items-center gap-0.5 mt-2.5">
                          {videoCallRate}
                          <img src="/images/coinicon.png" alt="coin" className="w-3 h-3 object-contain inline rounded-full border border-white mb-2.5"/>
                          / min
                        </span>
                      </button>
                    )}
                    {(user.callAccess === 'audio' || user.callAccess === 'full') && (
                      <button 
                        onClick={(e) => handleCallClick(user, 'audio', audioCallRate, e)}
                        className="flex-1 bg-primary text-white py-2 rounded-full flex items-center justify-center gap-1"
                        style={{ alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Phone size={16} strokeWidth={2} />
                        <span className="flex items-center gap-0.5 mt-2.5">
                          {audioCallRate}
                          <img src="/images/coinicon.png" alt="coin" className="w-3 h-3 object-contain inline rounded-full border border-white mb-2.5"/>
                          / min
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
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

      {showInsufficientCoins && (
        <InsufficientCoinsModal
          onClose={() => setShowInsufficientCoins(false)}
          onRecharge={() => {
            setShowInsufficientCoins(false)
            onCoinClick()
          }}
        />
      )}

      {showCallModal && selectedCall && (
        <CallConfirmationScreen
          onClose={() => setShowCallModal(false)}
          onConfirm={handleConfirmCall}
          userName={selectedCall.user.name}
          callType={selectedCall.type}
          rate={selectedCall.rate}
          userAvatar={selectedCall.user.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedCall.user.id}`}
        />
      )}


      {isRinging && selectedCall && (
        <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center z-50 p-6">
          <div className="flex flex-col items-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-20"></div>
              <div className="relative w-32 h-32 bg-gray-300 rounded-full overflow-hidden border-4 border-primary">
                {selectedCall.user.profilePic ? (
                  <img src={selectedCall.user.profilePic} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedCall.user.id}`} alt="User" className="w-full h-full object-cover" />
                )}
              </div>
            </div>
            
            <h2 className="text-white text-2xl font-bold mb-2">{selectedCall.user.name}</h2>
            <p className="text-gray-400 text-lg mb-8">Calling...</p>
            
            <div className="flex items-center space-x-2 mb-12">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            
            <button
              onClick={handleCancelRinging}
              className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition"
            >
              <Phone size={32} className="text-white transform rotate-135" style={{ transform: 'rotate(135deg)' }} />
            </button>
            <p className="text-white text-sm mt-4">End Call</p>
          </div>
        </div>
      )}
    </div>
  )
}
