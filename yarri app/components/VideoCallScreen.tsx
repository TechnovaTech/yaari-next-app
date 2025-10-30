'use client'
import { Phone, Mic, Video, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import AgoraRTC, { IAgoraRTCRemoteUser, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng'
import { agoraConfig } from '../config/agora'
import { useSocket } from '../contexts/SocketContext'
import { useRouter } from 'next/navigation'
import { useBackButton } from '../hooks/useBackButton'

interface VideoCallScreenProps {
  userName: string
  userAvatar: string
  rate: number
  onEndCall: () => void
}

export default function VideoCallScreen({ userName, userAvatar, rate, onEndCall }: VideoCallScreenProps) {
  const router = useRouter()
  const { socket } = useSocket()
  useBackButton(() => handleEndCall())
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [currentCamera, setCurrentCamera] = useState<'user' | 'environment'>('user')
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null)
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null)
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([])
  const [client] = useState(() => AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }))

  useEffect(() => {
    const timer = setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!socket) {
      console.log('Socket not available in video call')
      return
    }

    console.log('Setting up call-ended listener in video call')

    const handleRemoteCallEnd = () => {
      console.log('🔴 CALL ENDED BY OTHER USER - CLOSING VIDEO CALL')
      
      // Close tracks and leave channel WITHOUT emitting end-call again
      try {
        if (localVideoTrack) {
          console.log('Closing local video track')
          localVideoTrack.close()
        }
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
  }, [socket, localVideoTrack, localAudioTrack, client, router])

  useEffect(() => {
    const init = async () => {
      try {
        const channelName = sessionStorage.getItem('channelName') || `call_${Date.now()}`
        
        // Get Agora token from backend
        const tokenRes = await fetch('https://acsgroup.cloud/api/agora/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelName }),
        })
        const { token } = await tokenRes.json()
        console.log('Got Agora token')
        
        await client.join(agoraConfig.appId, channelName, token, null)
        
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack()
        const videoTrack = await AgoraRTC.createCameraVideoTrack()
        
        setLocalAudioTrack(audioTrack)
        setLocalVideoTrack(videoTrack)
        
        await client.publish([audioTrack, videoTrack])
        
        videoTrack.play('local-video')
      } catch (error) {
        console.error('Agora init error:', error)
      }
    }

    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType)
      if (mediaType === 'video') {
        setRemoteUsers(prev => [...prev, user])
        setTimeout(() => user.videoTrack?.play('remote-video'), 100)
      }
      if (mediaType === 'audio') {
        user.audioTrack?.play()
      }
    })

    client.on('user-unpublished', (user) => {
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid))
    })

    init()

    return () => {
      localVideoTrack?.close()
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

  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(isVideoOff)
      setIsVideoOff(!isVideoOff)
    }
  }

  const flipCamera = async () => {
    try {
      if (localVideoTrack) {
        // Close current video track
        localVideoTrack.close()
        
        // Create new video track with opposite camera
        const newCamera = currentCamera === 'user' ? 'environment' : 'user'
        const newVideoTrack = await AgoraRTC.createCameraVideoTrack({
          facingMode: newCamera
        })
        
        // Unpublish old track and publish new one
        await client.unpublish([localVideoTrack])
        await client.publish([newVideoTrack])
        
        // Update state
        setLocalVideoTrack(newVideoTrack)
        setCurrentCamera(newCamera)
        
        // Play new video
        newVideoTrack.play('local-video')
        
        console.log('Camera flipped to:', newCamera)
      }
    } catch (error) {
      console.error('Error flipping camera:', error)
      alert('Could not flip camera. Make sure you have multiple cameras.')
    }
  }

  const handleEndCall = () => {
    console.log('🔴 USER CLICKED END CALL BUTTON')
    const callData = sessionStorage.getItem('callData')
    console.log('Call data:', callData)
    
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
    if (localVideoTrack) {
      localVideoTrack.close()
    }
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
    <div className="full-screen-page bg-gray-900 flex flex-col">
      <div className="flex-1 relative">
        <div id="remote-video" className="absolute inset-0 bg-gray-800">
          {remoteUsers.length === 0 && (
            <div className="absolute inset-0" />
          )}
        </div>
        
        <div className="absolute top-8 left-0 right-0 text-center text-white z-10">
          <h2 className="text-2xl font-bold mb-2">{userName}</h2>
          <p className="text-lg">{formatTime(duration)}</p>
          <p className="text-sm text-gray-400 mt-1">₹{cost}</p>
        </div>

        <div className="absolute bottom-32 left-4 z-10">
          <div id="local-video" className="w-24 h-32 bg-gray-800 rounded-lg overflow-hidden" />
          <button
            onClick={flipCamera}
            className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
          >
            <RefreshCw className="text-white" size={16} />
          </button>
        </div>
      </div>

      <div className="p-8 flex justify-center items-center space-x-4">
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-500' : 'bg-gray-700'}`}
        >
          <Mic className="text-white" size={24} />
        </button>
        
        <button
          onClick={handleEndCall}
          className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
        >
          <Phone className="text-white rotate-[135deg]" size={28} />
        </button>
        
        <button
          onClick={toggleVideo}
          className={`w-14 h-14 rounded-full flex items-center justify-center ${isVideoOff ? 'bg-red-500' : 'bg-gray-700'}`}
        >
          <Video className="text-white" size={24} />
        </button>
      </div>
    </div>
  )
}
