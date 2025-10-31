'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  incomingCall: { callerId: string; callerName: string; callType: 'video' | 'audio'; channelName: string } | null
  setIncomingCall: (call: { callerId: string; callerName: string; callType: 'video' | 'audio'; channelName: string } | null) => void
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false, incomingCall: null, setIncomingCall: () => {} })

export const useSocket = () => useContext(SocketContext)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [incomingCall, setIncomingCall] = useState<{ callerId: string; callerName: string; callType: 'video' | 'audio'; channelName: string } | null>(null)

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://https://acsgroup.cloud0' : 'https://acsgroup.cloud')
    console.log('🔌 Attempting to connect to Socket.io server:', socketUrl)
    
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected successfully')
      setIsConnected(true)
      
      const user = localStorage.getItem('user')
      if (user) {
        try {
          const userData = JSON.parse(user)
          console.log('👤 Registering user:', userData.id)
          socketInstance.emit('register', userData.id)
        } catch (error) {
          console.error('❌ Error parsing user data:', error)
        }
      }
    })

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error)
      setIsConnected(false)
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason)
      setIsConnected(false)
    })

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts')
      setIsConnected(true)
    })

    socketInstance.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection error:', error)
    })

    // Global incoming call listener
    socketInstance.on('incoming-call', ({ callerId, callerName, callType, channelName }) => {
      console.log('📥 Incoming call (global):', { callerId, callerName, callType, channelName })
      setIncomingCall({ callerId, callerName, callType, channelName })
    })

    // NEW: Global call-accepted handler to ensure navigation for audio/video calls
    socketInstance.on('call-accepted', ({ channelName, callType }: { channelName: string; callType?: 'audio' | 'video' }) => {
      console.log('✅ Call accepted (global):', { channelName, callType })
      try {
        if (channelName) {
          sessionStorage.setItem('channelName', channelName)
        }
        const cd = sessionStorage.getItem('callData')
        let type: 'audio' | 'video' = callType || 'audio'
        if (cd) {
          try {
            const parsed = JSON.parse(cd)
            if (parsed?.type === 'video' || parsed?.type === 'audio') {
              type = parsed.type
            }
          } catch (_) {}
        } else if (callType) {
          // Create minimal callData so downstream screens can proceed
          const minimal = {
            userName: '',
            userAvatar: '',
            rate: callType === 'video' ? 10 : 5,
            type: callType,
            channelName,
            otherUserId: '',
          }
          sessionStorage.setItem('callData', JSON.stringify(minimal))
        }
        const target = type === 'video' ? '/video-call' : '/audio-call'
        if (typeof window !== 'undefined') {
          window.location.href = target
        }
      } catch (err) {
        console.error('Error handling global call-accepted:', err)
      }
    })

    // Handle call busy status
    socketInstance.on('call-busy', ({ message }) => {
      console.log('📵 Call busy:', message)
      alert(message)
    })

    // NEW: Clear incoming call if caller ends during ringing
    socketInstance.on('call-ended', () => {
      console.log('🛑 Call ended (global) — clearing incomingCall')
      setIncomingCall(null)
    })

    setSocket(socketInstance)

    return () => {
      console.log('🧹 Cleaning up socket connection')
      socketInstance.off('incoming-call')
      socketInstance.off('call-accepted')
      socketInstance.off('call-busy')
      socketInstance.off('call-ended')
      socketInstance.off('connect')
      socketInstance.off('connect_error')
      socketInstance.off('disconnect')
      socketInstance.off('reconnect')
      socketInstance.off('reconnect_error')
      socketInstance.disconnect()
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket, isConnected, incomingCall, setIncomingCall }}>
      {children}
    </SocketContext.Provider>
  )
}
