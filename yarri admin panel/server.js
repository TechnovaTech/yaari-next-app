const { createServer } = require('http')
const { Server } = require('socket.io')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handler = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(handler)
  
  const io = new Server(httpServer, {
    cors: {
      origin: ['https://admin.yaari.me', 'http://https://admin.yaari.me', 'https://admin.yaari.me', 'https://www.admin.yaari.me', 'capacitor://localhost', 'http://localhost'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  })

  const users = new Map()
  const activeCalls = new Map() // userId -> { otherUserId, callType, channelName }
  const pendingCalls = new Map() // callerId -> { receiverId, callType, channelName, timestamp }

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    socket.on('register', (userId) => {
      users.set(userId, socket.id)
      console.log(`User ${userId} registered with socket ${socket.id}`)
      // Broadcast presence update
      io.emit('user-status-change', { userId, status: 'online' })
    })

    socket.on('call-user', ({ callerId, callerName, receiverId, callType, channelName }) => {
      console.log('Call request received:', { callerId, callerName, receiverId, callType })
      console.log('Registered users:', Array.from(users.keys()))
      const receiverSocketId = users.get(receiverId)
      console.log('Receiver socket ID:', receiverSocketId)
      // If receiver is already in an active call, notify caller busy
      if (activeCalls.has(receiverId)) {
        const callerSocketId = users.get(callerId)
        if (callerSocketId) {
          io.to(callerSocketId).emit('call-busy', { message: 'User is busy' })
        }
        return
      }
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('incoming-call', {
          callerId,
          callerName,
          callType,
          channelName
        })
        console.log(`Call sent from ${callerName} to ${receiverId}`)
        pendingCalls.set(callerId, { receiverId, callType, channelName, timestamp: Date.now() })
      } else {
        console.log(`Receiver ${receiverId} not found in registered users`)
        const callerSocketId = users.get(callerId)
        if (callerSocketId) {
          io.to(callerSocketId).emit('call-declined')
        }
      }
    })

    socket.on('accept-call', ({ callerId, channelName, callType }) => {
      console.log('Call accepted by receiver, notifying caller:', callerId)
      const callerSocketId = users.get(callerId)
      const pending = pendingCalls.get(callerId)
      const receiverId = pending?.receiverId
      if (callerSocketId) {
        io.to(callerSocketId).emit('call-accepted', { channelName, callType: callType || pending?.callType })
        console.log('Call accepted notification sent to caller')
      }
      if (receiverId) {
        // Mark both users busy and broadcast
        activeCalls.set(callerId, { otherUserId: receiverId, callType: callType || pending?.callType, channelName })
        activeCalls.set(receiverId, { otherUserId: callerId, callType: callType || pending?.callType, channelName })
        io.emit('user-status-change', { userId: callerId, status: 'busy' })
        io.emit('user-status-change', { userId: receiverId, status: 'busy' })
        pendingCalls.delete(callerId)
      }
    })

    socket.on('decline-call', ({ callerId }) => {
      console.log('Call declined by receiver, notifying caller:', callerId)
      const callerSocketId = users.get(callerId)
      if (callerSocketId) {
        io.to(callerSocketId).emit('call-declined')
        console.log('Call declined notification sent to caller')
      }
      // Clear any pending mapping
      pendingCalls.delete(callerId)
    })

    socket.on('end-call', ({ userId, otherUserId }) => {
      console.log('Call ended, notifying other user:', otherUserId)
      const otherUserSocketId = users.get(otherUserId)
      if (otherUserSocketId) {
        io.to(otherUserSocketId).emit('call-ended')
        console.log('Call ended notification sent')
      }
      // Clear active call state and broadcast availability
      activeCalls.delete(userId)
      activeCalls.delete(otherUserId)
      io.emit('user-status-change', { userId, status: 'online' })
      io.emit('user-status-change', { userId: otherUserId, status: 'online' })
    })

    // Provide current list of online user IDs with status
    socket.on('get-online-users', () => {
      const userStatuses = Array.from(users.keys()).map(userId => ({
        userId,
        status: activeCalls.has(userId) ? 'busy' : 'online'
      }))
      socket.emit('online-users', userStatuses)
    })

    socket.on('disconnect', () => {
      for (const [userId, socketId] of users.entries()) {
        if (socketId === socket.id) {
          users.delete(userId)
          console.log(`User ${userId} disconnected`)
          // Broadcast presence update
          io.emit('user-status-change', { userId, status: 'offline' })
          // If user was in a call, mark the other user available
          const active = activeCalls.get(userId)
          if (active && active.otherUserId) {
            activeCalls.delete(active.otherUserId)
            activeCalls.delete(userId)
            io.emit('user-status-change', { userId: active.otherUserId, status: 'online' })
          }
          break
        }
      }
    })
  })

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> Socket.io server running`)
    })
})
