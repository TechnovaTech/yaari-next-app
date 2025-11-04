'use client'
import { useSocket } from '../contexts/SocketContext'
import IncomingCallModal from './IncomingCallModal'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function GlobalCallUI() {
  const { socket, incomingCall, setIncomingCall } = useSocket()
  const router = useRouter()
  const [callerAvatar, setCallerAvatar] = useState<string>('')

  useEffect(() => {
    if (incomingCall?.callerId) {
      fetchCallerAvatar(incomingCall.callerId)
    }
  }, [incomingCall?.callerId])

  const fetchCallerAvatar = async (callerId: string) => {
    try {
      const res = await fetch(`https://admin.yaari.me/api/users/${callerId}`)
      const data = await res.json()
      if (data.profilePic) {
        let pic = data.profilePic
          .replace(/https?:\/\/localhost:\d+/, 'https://admin.yaari.me')
          .replace(/https?:\/\/0\.0\.0\.0:\d+/, 'https://admin.yaari.me')
        setCallerAvatar(pic)
      }
    } catch (error) {
      console.error('Error fetching caller avatar:', error)
    }
  }

  if (!incomingCall) return null

  const handleAccept = () => {
    if (!incomingCall || !socket) return

    const { callerId, callerName, callType, channelName } = incomingCall

    sessionStorage.setItem('channelName', channelName)
    sessionStorage.setItem('callData', JSON.stringify({
      userName: callerName,
      userAvatar: '',
      rate: callType === 'video' ? 10 : 5,
      type: callType,
      channelName,
      otherUserId: callerId,
      isCaller: false
    }))

    socket.emit('accept-call', {
      callerId,
      channelName,
      callType,
    })

    setIncomingCall(null)
    setTimeout(() => {
      router.push(callType === 'video' ? '/video-call' : '/audio-call')
    }, 100)
  }

  const handleDecline = () => {
    if (!incomingCall || !socket) return
    socket.emit('decline-call', { callerId: incomingCall.callerId })
    setIncomingCall(null)
  }

  return (
    <IncomingCallModal
      callerName={incomingCall.callerName}
      callType={incomingCall.callType}
      onAccept={handleAccept}
      onDecline={handleDecline}
      callerAvatar={callerAvatar}
      callerId={incomingCall.callerId}
    />
  )
}