'use client'
import { useState, useEffect, useRef } from 'react'
import AgoraRTC, { IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng'
import { agoraConfig } from '../config/agora'
import { useSocket } from '../contexts/SocketContext'
import { useRouter } from 'next/navigation'
import { useBackButton } from '../hooks/useBackButton'
import { trackEvent, trackScreenView } from '@/utils/clevertap'
import { trackCallEvent, syncUserToCleverTap } from '@/utils/userTracking'
import { deductCoins } from '@/utils/coinDeduction'
import { Capacitor } from '@capacitor/core'
import AudioRouting from '@/utils/audioRouting'
import AvatarCircle from './call-ui/AvatarCircle'
import CallStats from './call-ui/CallStats'
import ControlsBar from './call-ui/ControlsBar'

// Add error handling wrapper for AudioRouting
const safeAudioRouting = {
  enterCommunicationMode: async () => {
    try {
      return await AudioRouting.enterCommunicationMode()
    } catch (error) {
      console.warn('AudioRouting.enterCommunicationMode failed:', error)
      return null
    }
  },
  setSpeakerphoneOn: async (options: { on: boolean }) => {
    try {
      return await AudioRouting.setSpeakerphoneOn(options)
    } catch (error) {
      console.warn('AudioRouting.setSpeakerphoneOn failed:', error)
      return null
    }
  },
  resetAudio: async () => {
    try {
      return await AudioRouting.resetAudio()
    } catch (error) {
      console.warn('AudioRouting.resetAudio failed:', error)
      return null
    }
  }
}

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
  const [isSpeakerOn, setIsSpeakerOn] = useState(false)
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null)
  const [client] = useState(() => AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }))
  const [coinDeductionStarted, setCoinDeductionStarted] = useState(false)
  const [remainingBalance, setRemainingBalance] = useState<number | null>(null)
  const stabilizerTimer = useRef<NodeJS.Timeout | null>(null)

  // Helper to ensure earpiece routing sticks, with retries
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  const ensureEarpieceRoute = async () => {
    try {
      console.log('[AudioRouting] Ensuring earpiece route (enter comms + speaker OFF)')
      await safeAudioRouting.enterCommunicationMode()
      await safeAudioRouting.setSpeakerphoneOn({ on: false })
      // Retry a couple times to enforce routing after WebView/Agora attaches audio
      await delay(250)
      await safeAudioRouting.setSpeakerphoneOn({ on: false })
      await delay(750)
      await safeAudioRouting.setSpeakerphoneOn({ on: false })
      console.log('[AudioRouting] Earpiece route attempts completed')
    } catch (e) {
      console.warn('[AudioRouting] ensureEarpieceRoute failed:', e)
    }
  }

  // Extra reinforcement for first few seconds of call and after toggles
  const startEarpieceStabilizer = () => {
    if (stabilizerTimer.current) clearInterval(stabilizerTimer.current as unknown as number)
    let attempts = 0
    stabilizerTimer.current = setInterval(async () => {
      attempts += 1
      if (attempts > 6) {
        if (stabilizerTimer.current) clearInterval(stabilizerTimer.current as unknown as number)
        stabilizerTimer.current = null
        return
      }
      if (!isSpeakerOn && Capacitor.isNativePlatform()) {
        await ensureEarpieceRoute()
      }
    }, 500) as unknown as NodeJS.Timeout
  }

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

        // BEFORE joining/creating tracks, enforce earpiece routing
        await ensureEarpieceRoute()
        
        await client.join(agoraConfig.appId, channelName, token, null)
        
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack()
        setLocalAudioTrack(audioTrack)
        
        // Enable loudspeaker by default
        audioTrack.setVolume(100)
        
        await client.publish([audioTrack])

        // After publish, reinforce earpiece routing again
        await ensureEarpieceRoute()
        startEarpieceStabilizer()

        // Log call start
        const callData = sessionStorage.getItem('callData')
        if (callData) {
          const data = JSON.parse(callData)
          const user = localStorage.getItem('user')
          const userData = user ? JSON.parse(user) : null
          
          if (userData?.id && data.otherUserId) {
            try {
              console.log('📤 Logging audio call start:', { callerId: userData.id, receiverId: data.otherUserId })
              const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://admin.yaari.me'
              const endpoint = (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.())
                ? `${API_BASE}/api/call-log`
                : '/api/call-log'
              const response = await fetch(endpoint, {
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
        // Reinforce earpiece routing once remote audio starts playing
        await ensureEarpieceRoute()
      }
    })

    init()
    
    // Track screen view and call start
    trackScreenView('Audio Call')
    
    // Track call accepted event
    const callData = sessionStorage.getItem('callData')
    if (callData) {
      const data = JSON.parse(callData)
      trackCallEvent('audio', 'accepted', data.otherUserId).catch(err => console.log('Tracking error:', err))
    }

    return () => {
      localAudioTrack?.close()
      client.leave()
      try { safeAudioRouting.resetAudio() } catch {}
    }
  }, [])

  const toggleMute = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(isMuted)
      setIsMuted(!isMuted)
    }
  }

  const toggleSpeaker = async () => {
    const next = !isSpeakerOn
    setIsSpeakerOn(next)
    
    try {
      // Keep communication mode active when toggling routes
      await safeAudioRouting.enterCommunicationMode()
      await safeAudioRouting.setSpeakerphoneOn({ on: next })
      if (!next) {
        // Stabilize earpiece routing immediately after toggle
        await ensureEarpieceRoute()
        startEarpieceStabilizer()
      }
      console.log(`Speaker ${next ? 'ON' : 'OFF'}`)
    } catch (e) {
      console.warn('Failed to toggle speakerphone:', e)
    }
  }

  const handleEndCall = async () => {
    console.log('🔴 USER CLICKED END CALL BUTTON')
    const callData = sessionStorage.getItem('callData')
    console.log('Call data:', callData)
    
    // Track call end event
    const cost = Math.ceil(duration / 60) * rate
    const callDataParsed = callData ? JSON.parse(callData) : {}
    
    trackCallEvent('audio', 'ended', callDataParsed.otherUserId, duration).catch(err => console.log('Tracking error:', err))
    
    trackEvent('Call Ended', {
      'Call Type': 'audio',
      'Duration': duration,
      'Cost': cost,
      'Ended By': 'User',
      'Receiver': userName,
      'Receiver ID': callDataParsed.otherUserId
    }).catch(err => console.log('Tracking error:', err))
    
    // Sync updated coin balance to CleverTap
    syncUserToCleverTap().catch(err => console.log('Sync error:', err))

    // Log call end to database
    if (callData) {
      const data = JSON.parse(callData)
      const user = localStorage.getItem('user')
      const userData = user ? JSON.parse(user) : null
      
      if (userData?.id && data.otherUserId) {
        try {
          console.log('📤 Logging audio call end:', { callerId: userData.id, receiverId: data.otherUserId, duration, cost })
          const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://admin.yaari.me'
          const endpoint = (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.())
            ? `${API_BASE}/api/call-log`
            : '/api/call-log'
          const response = await fetch(endpoint, {
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

    // Reset audio routing
    try { await safeAudioRouting.resetAudio() } catch {}
    
    console.log('Navigating back to users page')
    // Navigate back
    window.location.href = '/users'
  }

  const cost = Math.ceil(duration / 60) * rate

  return (
    <div className="full-screen-page bg-gradient-to-b from-primary to-orange-600 flex flex-col items-center justify-center p-8">
      <div className="flex-1 flex flex-col items-center justify-center">
        <AvatarCircle src={userAvatar} alt={userName} />
        <CallStats userName={userName} duration={duration} cost={cost} remainingBalance={remainingBalance} rate={rate} />
      </div>
      <ControlsBar
        isSpeakerOn={isSpeakerOn}
        isMuted={isMuted}
        onToggleSpeaker={toggleSpeaker}
        onToggleMute={toggleMute}
        onEndCall={handleEndCall}
      />
    </div>
  )
}
