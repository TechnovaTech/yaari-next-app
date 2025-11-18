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
  const audioCtxRef = useRef<AudioContext | null>(null)
  const oscRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  const ensureWebAudioAlive = async () => {
    try {
      const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!Ctx) return
      if (!audioCtxRef.current) {
        audioCtxRef.current = new Ctx()
        const ctx = audioCtxRef.current!
        // Create a silent oscillator to keep the context alive
        gainRef.current = ctx.createGain()
        gainRef.current.gain.value = 0
        oscRef.current = ctx.createOscillator()
        oscRef.current.type = 'sine'
        oscRef.current.frequency.value = 240
        oscRef.current.connect(gainRef.current)
        gainRef.current.connect(ctx.destination)
        try { oscRef.current.start() } catch {}
      }
      const ctx2 = audioCtxRef.current
      if (ctx2 && ctx2.state === 'suspended') {
        await ctx2.resume()
        console.log('WebAudio AudioContext resumed after route change')
      }
    } catch (err) {
      console.warn('ensureWebAudioAlive failed:', err)
    }
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
        // Detect if current user is caller or receiver (incoming call)
        const callDataRaw = sessionStorage.getItem('callData')
        // Force initial speaker ON for all calls (caller and receiver)
        const initialSpeakerOn = true

        // Set audio routing for mobile (earpiece by default)
        if (Capacitor.isNativePlatform()) {
          try {
            await AudioRouting.enterCommunicationMode()
            await AudioRouting.setSpeakerphoneOn({ on: initialSpeakerOn })
            setIsSpeakerOn(initialSpeakerOn)
            console.log(`Audio routing set to ${initialSpeakerOn ? 'speaker' : 'earpiece'} (initial)`) 
            await ensureWebAudioAlive()
          } catch (e) {
            console.warn('Failed to set initial earpiece routing:', e)
          }
        }

        // Configure Agora Web SDK audio for speech/meeting and default to earpiece
        try {
          ;(AgoraRTC as any)?.setAudioProfile?.('speech_low_quality')
          ;(AgoraRTC as any)?.setAudioScenario?.('meeting')
          ;(AgoraRTC as any)?.setEnableSpeakerphone?.(initialSpeakerOn)
          console.log(`Agora audio profile/scenario set; speakerphone ${initialSpeakerOn ? 'ON' : 'OFF'} via Agora`)
          await ensureWebAudioAlive()
        } catch (err) {
          console.warn('Agora audio profile/scenario setup failed or unavailable:', err)
        }

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
        await ensureWebAudioAlive()
        // Attempt to enumerate audio output devices for debugging/selection
        try {
          const devices = await (AgoraRTC as any)?.getDevices?.()
          const audioOutputs = Array.isArray(devices) ? devices.filter((d: any) => d.kind === 'audiooutput') : []
          console.log('Agora audio output devices:', audioOutputs)
          // If sink selection is supported, we could choose a device here.
          // Example (commented): user.audioTrack?.setPlaybackDevice?.(desiredDeviceId)
        } catch (err) {
          console.warn('Enumerating audio output devices failed or unavailable:', err)
        }
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
      if (Capacitor.isNativePlatform()) {
        AudioRouting.resetAudio().catch(() => {})
      }
      try {
        oscRef.current?.stop()
        oscRef.current = null
        gainRef.current = null
        audioCtxRef.current?.close()
        audioCtxRef.current = null
      } catch {}
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
    // Prefer native routing on Android; use Agora toggle on web
    if (!Capacitor.isNativePlatform()) {
      try {
        ;(AgoraRTC as any)?.setEnableSpeakerphone?.(next)
        console.log(`AgoraRTC.setEnableSpeakerphone(${next}) called`)
      } catch (err) {
        console.warn('AgoraRTC.setEnableSpeakerphone failed or unavailable:', err)
      }
    }
    if (Capacitor.isNativePlatform()) {
      await AudioRouting.setSpeakerphoneOn({ on: next })
      console.log(`Speaker ${next ? 'ON' : 'OFF'}`)
    }
    await ensureWebAudioAlive()
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
    if (Capacitor.isNativePlatform()) {
      try { await AudioRouting.resetAudio() } catch {}
    }
    sessionStorage.removeItem('callData')
    sessionStorage.removeItem('channelName')


    
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
