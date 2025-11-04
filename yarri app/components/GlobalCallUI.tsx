'use client'
import { useSocket } from '../contexts/SocketContext'
import IncomingCallModal from './IncomingCallModal'
import { useRouter } from 'next/navigation'

export default function GlobalCallUI() {
  const { socket, incomingCall, setIncomingCall } = useSocket()
  const router = useRouter()

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
    />
  )
}