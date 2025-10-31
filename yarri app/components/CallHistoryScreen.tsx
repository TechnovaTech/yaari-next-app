import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../utils/translations'
import { useEffect, useState } from 'react'
import { trackScreenView } from '../utils/clevertap'

interface CallRecord {
  _id: string
  callType: string
  duration: number
  status: string
  startTime: string
  endTime: string
  cost: number
  isOutgoing: boolean
  otherUserName: string
  otherUserAvatar?: string
  otherUserAbout: string
  createdAt: string
}

interface CallHistoryScreenProps {
  onBack: () => void
}

export default function CallHistoryScreen({ onBack }: CallHistoryScreenProps) {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [calls, setCalls] = useState<CallRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    trackScreenView('Call History')
    fetchCallHistory()
  }, [])

  const fetchCallHistory = async () => {
    try {
      const userRaw = localStorage.getItem('user')
      if (!userRaw) {
        setError('User not logged in')
        setLoading(false)
        return
      }

      const user = JSON.parse(userRaw)
      if (!user.id) {
        setError('User not logged in')
        setLoading(false)
        return
      }

      const response = await fetch(`/api/call-history?userId=${user.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch call history')
      }

      const data = await response.json()
      setCalls(data)
    } catch (err) {
      console.error('Error fetching call history:', err)
      setError('Failed to load call history')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getCallTypeIcon = (callType: string, isOutgoing: boolean) => {
    const color = isOutgoing ? 'text-green-500' : 'text-blue-500'
    if (callType === 'video') {
      return (
        <svg className={`w-4 h-4 ${color}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
        </svg>
      )
    } else {
      return (
        <svg className={`w-4 h-4 ${color}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
        </svg>
      )
    }
  }
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center p-4 pt-8">
        <button onClick={onBack} className="mr-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Title */}
      <div className="px-4 pb-6">
        <h1 className="text-3xl font-bold text-black">{t.callHistoryTitle}</h1>
      </div>

      {/* Call List */}
      <div>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        ) : error ? (
          <div className="px-4 py-8 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={fetchCallHistory}
              className="bg-pink-500 text-white px-4 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : calls.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
            </svg>
            <p className="text-gray-500 text-lg">No call history yet</p>
            <p className="text-gray-400 text-sm mt-2">Your call history will appear here</p>
          </div>
        ) : (
          calls.map((call) => (
            <div key={call._id} className="flex items-center px-4 py-4 border-b border-gray-100">
              <div className="mr-4">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200">
                  <img 
                    src={call.otherUserAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${call.otherUserName}`}
                    alt={call.otherUserName} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  {getCallTypeIcon(call.callType, call.isOutgoing)}
                  <span className={`text-xs font-medium ${call.isOutgoing ? 'text-green-500' : 'text-blue-500'}`}>
                    {call.isOutgoing ? 'Outgoing' : 'Incoming'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    call.status === 'completed' ? 'bg-green-100 text-green-800' :
                    call.status === 'missed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {call.status}
                  </span>
                </div>
                <h3 className="font-semibold text-black text-lg">{call.otherUserName}</h3>
                <p className="text-sm text-gray-500">{call.otherUserAbout}</p>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-black font-medium">
                  {formatTime(call.startTime)}
                </p>
                <p className="text-sm text-gray-500">
                  {call.duration > 0 ? formatDuration(call.duration) : '--:--'}
                </p>
                {call.cost > 0 && (
                  <p className="text-xs text-pink-500 font-medium">
                    ₹{call.cost.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}