'use client'
import { Phone, Mic, Volume2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import AgoraRTC, { IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng'
import { agoraConfig } from '../config/agora'
import { useSocket } from '../contexts/SocketContext'
import { useRouter } from 'next/navigation'
import { useBackButton } from '../hooks/useBackButton'
import { trackEvent, trackScreenView } from '@/utils/clevertap'
import { deductCoins } from '@/utils/coinDeduction'

interface AudioCallScreenProps {
  userName: string
  userAvatar: string
  rate: number
  onEndCall: () => void
}

export default function AudioCallScreen({ userName, userAvatar, rate, onEndCall }: AudioCallScreenProps) {
  const router = useRouter()
  const { socket } = useSocket()
  useBackButton(() => handleEndCall())
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null)
  const [client] = useState(() => AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }))
  const [coinDeductionStarted, setCoinDeductionStarted] = useState(false)
  const [remainingBalance, setRemainingBalance] = useState<number | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleCoinDeduction = async () => {
    try {
      const callData = sessionStorage.getItem('callData')
      console.log('Call data from session:', callData)
      if (!callData) return
      const data = JSON.parse(callData)
      console.log('Parsed call data:', data)
      console.log('isCaller value:', data.isCaller)
      
      const user = localStorage.getItem('user')
      if (!user) return
      const userData = JSON.parse(user)
      
      if (data.isCaller === false) {
        console.log('Receiver - not deducting coins')
        return
      }
      
      console.log('Caller - deducting coins')
      console.log(`Attempting to deduct ${rate} coins at ${duration}s`)
      const result = await deductCoins(userData.id, rate, 'audio')
      console.log(`Successfully deducted ${rate} coins`)
      if (result?.newBalance !== undefined) {
        setRemainingBalance(result.newBalance)
      }
    } catch (error: any) {
      console.error('Coin deduction failed:', error)
      if (error.message?.includes('Insufficient')) {
        alert('Insufficient coins! Call will end.')
        handleEndCall()
      }
    }
  }

  useEffect(() => {
    if (duration === 10 && !coinDeductionStarted) {
      console.log('First deduction at 10 seconds')
      setCoinDeductionStarted(true)
      handleCoinDeduction()
    } else if (coinDeductionStarted && duration > 10 && (duration - 10) % 60 === 0) {
      console.log(`Deduction at ${duration} seconds`)
      handleCoinDeduction()
    }
  }, [duration])

  useEffect(() => {
    if (!socket) {
      console.log('Socket not available in audio call')
      return
    }

    console.log('Setting up call-ended listener in audio call')

    const handleRemoteCallEnd = () => {
      console.log('🔴 CALL ENDED BY OTHER USER - CLOSING AUDIO CALL')
      
      // Close tracks and leave channel WITHOUT emitting end-call again
      try {
        if (localAudioTrack) {
          console.log('Closing local audio track')
          localAudioTrack.close()
        }
        console.log('Leaving Agora channel')
        client.leave()
        
        console.log('Clearing session data')
        sessionStorage.removeItem('callData')
        sessionStorage.removeItem('channelName')
        
        console.log('Navigating to /users')
        // Use window.location for guaranteed navigation
        window.location.href = '/users'
      } catch (error) {
        console.error('Error during call cleanup:', error)
        router.push('/users')
      }
    }

    socket.on('call-ended', handleRemoteCallEnd)
    console.log('call-ended listener registered')

    return () => {
      console.log('Removing call-ended listener')
      socket.off('call-ended', handleRemoteCallEnd)
    }
  }, [socket, localAudioTrack, client, router])

  useEffect(() => {
    const init = async () => {
      try {
        const channelName = sessionStorage.getItem('channelName') || `audio_${Date.now()}`
        
        // Get Agora token from backend
        const tokenRes = await fetch('https://admin.yaari.me/api/agora/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelName }),
        })
        const { token } = await tokenRes.json()
        console.log('Got Agora token')
        
        await client.join(agoraConfig.appId, channelName, token, null)
        
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack()
        setLocalAudioTrack(audioTrack)
        
        // Enable loudspeaker by default
        audioTrack.setVolume(100)
        
        await client.publish([audioTrack])

        // Log call start
        const callData = sessionStorage.getItem('callData')
        if (callData) {
          const data = JSON.parse(callData)
          const user = localStorage.getItem('user')
          const userData = user ? JSON.parse(user) : null
          
          if (userData?.id && data.otherUserId) {
            try {
              console.log('📤 Logging audio call start:', { callerId: userData.id, receiverId: data.otherUserId })
              const response = await fetch('/api/call-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  callerId: userData.id,
                  receiverId: data.otherUserId,
                  callType: 'audio',
                  action: 'start',
                  channelName: channelName
                })
              })
              if (!response.ok) {
                throw new Error(`Failed to log call start: ${response.status}`)
              }
              const result = await response.json()
              if (result.sessionId) {
                sessionStorage.setItem('callSessionId', result.sessionId)
              }
              console.log('✅ Audio call start logged:', result)
            } catch (error) {
              console.error('❌ Failed to log audio call start:', error)
              alert('Warning: Call logging failed. Call may not appear in history.')
            }
          }
        }
      } catch (error) {
        console.error('Agora audio init error:', error)
      }
    }

    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType)
      if (mediaType === 'audio') {
        user.audioTrack?.play()
        // Enable loudspeaker by default
        user.audioTrack?.setVolume(100)
      }
    })

    init()
    
    // Track screen view
    trackScreenView('Audio Call')

    return () => {
      localAudioTrack?.close()
      client.leave()
    }
  }, [])

  const toggleMute = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(isMuted)
      setIsMuted(!isMuted)
    }
  }

  const handleEndCall = async () => {
    console.log('🔴 USER CLICKED END CALL BUTTON')
    const callData = sessionStorage.getItem('callData')
    console.log('Call data:', callData)
    
    // Track call end event
    const cost = Math.ceil(duration / 60) * rate
    trackEvent('Call Ended', {
      'Call Type': 'audio',
      'Duration': duration,
      'Cost': cost,
      'Ended By': 'User',
      'Receiver': userName
    })

    // Log call end to database
    if (callData) {
      const data = JSON.parse(callData)
      const user = localStorage.getItem('user')
      const userData = user ? JSON.parse(user) : null
      
      if (userData?.id && data.otherUserId) {
        try {
          console.log('📤 Logging audio call end:', { callerId: userData.id, receiverId: data.otherUserId, duration, cost })
          const response = await fetch('/api/call-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callerId: userData.id,
              receiverId: data.otherUserId,
              callType: 'audio',
              action: 'end',
              duration: duration,
              cost: cost,
              status: 'completed'
            })
          })
          if (!response.ok) {
            throw new Error(`Failed to log call end: ${response.status}`)
          }
          const result = await response.json()
          if (!result.verified) {
            console.warn('⚠️ Call saved but verification failed')
          }
          console.log('✅ Audio call end logged:', result)
        } catch (error) {
          console.error('❌ Failed to log audio call end:', error)
          alert('Warning: Failed to save call to history.')
        }
      }
    }
    
    // Notify other user FIRST before cleanup
    if (callData && socket) {
      const data = JSON.parse(callData)
      const user = localStorage.getItem('user')
      const userData = user ? JSON.parse(user) : null
      
      console.log('Current user:', userData?.id)
      console.log('Other user:', data.otherUserId)
      
      if (data.otherUserId && userData?.id) {
        console.log('📤 EMITTING end-call TO:', data.otherUserId)
        socket.emit('end-call', {
          userId: userData.id,
          otherUserId: data.otherUserId
        })
        console.log('end-call event emitted successfully')
      } else {
        console.log('Missing otherUserId or current userId')
      }
    } else {
      console.log('No call data or socket not available')
    }
    
    // Then cleanup local resources
    console.log('Cleaning up local resources')
    if (localAudioTrack) {
      localAudioTrack.close()
    }
    client.leave()
    sessionStorage.removeItem('callData')
    sessionStorage.removeItem('channelName')
    
    console.log('Navigating back to users page')
    // Navigate back
    window.location.href = '/users'
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const cost = Math.ceil(duration / 60) * rate

  return (
    <div className="full-screen-page bg-gradient-to-b from-primary to-orange-600 flex flex-col items-center justify-center p-8">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-40 h-40 rounded-full overflow-hidden bg-white/20 mb-8">
          <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-4">{userName}</h2>
        <p className="text-2xl text-white mb-2">{formatTime(duration)}</p>
        <p className="text-lg text-white/80">₹{cost}</p>
        {remainingBalance !== null && remainingBalance <= rate && (
          <div className="mt-4 bg-red-500/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
            <img src="/images/coinicon.png" alt="coin" className="w-4 h-4 object-contain" />
            <span className="text-white font-semibold mt-2.5">{remainingBalance} coins left</span>
          </div>
        )}
      </div>

      <div className="flex justify-center items-center space-x-6 mb-8">
        <button
          onClick={() => setIsSpeakerOn(!isSpeakerOn)}
          className={`w-14 h-14 rounded-full flex items-center justify-center ${isSpeakerOn ? 'bg-white' : 'bg-white/30'}`}
        >
          <Volume2 className={isSpeakerOn ? 'text-primary' : 'text-white'} size={24} />
        </button>

        <button
          onClick={handleEndCall}
          className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
        >
          <Phone className="text-white rotate-[135deg]" size={28} />
        </button>
        
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-500' : 'bg-white/30'}`}
        >
          <Mic className="text-white" size={24} />
        </button>
      </div>
    </div>
  )
}
