import { Heart, User as UserIcon, Video, Phone } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import CallConfirmationScreen from './CallConfirmationScreen'
import IncomingCallModal from './IncomingCallModal'
import PermissionModal from './PermissionModal'
import PermissionDeniedModal from './PermissionDeniedModal'
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

  useEffect(() => {
    // Set default gender filter based on user's gender
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      if (userData.gender === 'male') {
        setGenderFilter('female')
      } else if (userData.gender === 'female') {
        setGenderFilter('male')
      }
    }
    
    fetchBalance()
    
    // Track screen view
    trackScreenView('User List')
  }, [])

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
      console.log('Call declined by receiver')
      setIsRinging(false)
      sessionStorage.removeItem('callData')
      alert('Call declined by user')
    })

    socket.on('call-ended', () => {
      console.log('Call ended by other user')
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
        const res = await fetch(`https://acsgroup.cloud/api/users/${userData.id}/balance`)
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
      
      const res = await fetch('https://acsgroup.cloud/api/users')
      const data = await res.json()
      
      const formattedUsers = data
        .filter((user: any) => user._id !== currentUserId)
        .map((user: any) => {
          let displayPic = user.profilePic
          
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
    
    // Check if permissions already granted
    const permissionsGranted = localStorage.getItem('mediaPermissionsGranted')
    
    if (permissionsGranted === 'true') {
      // Permissions already granted, proceed directly
      setSelectedCall({ user, type, rate })
      setShowCallModal(true)
    } else {
      // Ask for permissions first
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
        rate: incomingCall.callType === 'video' ? 10 : 5,
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white p-4 flex items-center justify-between shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
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
            className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center mt-2.5"
          >
            <UserIcon className="text-white" size={20} />
          </button>
        </div>
      </div>

      <div className="p-4" style={{ paddingTop: 'calc(5rem + env(safe-area-inset-top))' }}>
        <AdBanner />
        
        <div className="flex gap-2 my-4">
          <button
            onClick={() => { setGenderFilter('all'); trackEvent('Gender Filter Changed', { filter: 'all' }) }}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              genderFilter === 'all' ? 'bg-primary text-white' : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => { setGenderFilter('male'); trackEvent('Gender Filter Changed', { filter: 'male' }) }}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              genderFilter === 'male' ? 'bg-primary text-white' : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Male
          </button>
          <button
            onClick={() => { setGenderFilter('female'); trackEvent('Gender Filter Changed', { filter: 'female' }) }}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              genderFilter === 'female' ? 'bg-primary text-white' : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Female
          </button>
        </div>

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
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => handleCallClick(user, 'video', 10, e)}
                    className="flex-1 bg-primary text-white py-2 rounded-full flex items-center justify-center gap-1"
                    style={{ alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Video size={16} fill="white" strokeWidth={0} />
                    <span className="flex items-center gap-0.5 mt-2.5">
                      10
                      <img src="/images/coinicon.png" alt="coin" className="w-3 h-3 object-contain inline rounded-full border border-white mb-2.5"/>
                      / min
                    </span>
                  </button>
                  <button 
                    onClick={(e) => handleCallClick(user, 'audio', 5, e)}
                    className="flex-1 bg-primary text-white py-2 rounded-full flex items-center justify-center gap-1"
                    style={{ alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Phone size={16} strokeWidth={2} />
                    <span className="flex items-center gap-0.5 mt-2.5">
                      5
                      <img src="/images/coinicon.png" alt="coin" className="w-3 h-3 object-contain inline rounded-full border border-white mb-2.5"/>
                      / min
                    </span>
                  </button>
                </div>
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
              End Call
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
