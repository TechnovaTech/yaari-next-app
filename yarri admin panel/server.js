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

  // Make io globally accessible for API routes
  global.io = io

  const users = new Map()
  const activeCalls = new Map() // userId -> { otherUserId, callType, channelName }
  const pendingCalls = new Map() // callerId -> { receiverId, callType, channelName, timestamp }

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    socket.on('register', (userId) => {
      users.set(userId, socket.id)
      socket.join(userId) // Join room with userId for targeted messages
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

    socket.on('end-call', ({ userId, otherUserId, channelName }) => {
      console.log('Call ended:', { userId, otherUserId, channelName })
      const otherUserSocketId = users.get(otherUserId)
      if (otherUserSocketId) {
        io.to(otherUserSocketId).emit('end-call', { userId, otherUserId, channelName })
        console.log('Call ended notification sent to:', otherUserId)
      }
      // Clear active call state and broadcast availability
      activeCalls.delete(userId)
      activeCalls.delete(otherUserId)
      if (users.has(userId)) {
        io.emit('user-status-change', { userId, status: 'online' })
      }
      if (users.has(otherUserId)) {
        io.emit('user-status-change', { userId: otherUserId, status: 'online' })
      }
    })

    // Provide current list of online user IDs with status
    socket.on('get-online-users', () => {
      const userStatuses = Array.from(users.keys()).map(userId => ({
        userId,
        status: activeCalls.has(userId) ? 'busy' : 'online'
      }))
      socket.emit('online-users', userStatuses)
    })

    socket.on('user-online', ({ userId, status }) => {
      console.log('User online status update:', { userId, status })
      if (status === 'online' && !activeCalls.has(userId)) {
        io.emit('user-status-change', { userId, status: 'online' })
      }
    })

    socket.on('disconnect', () => {
      for (const [userId, socketId] of users.entries()) {
        if (socketId === socket.id) {
          users.delete(userId)
          console.log(`User ${userId} disconnected`)
          // Broadcast presence update
          io.emit('user-status-change', { userId, status: 'offline' })
          // If user was in a call, notify the other user and end the call
          const active = activeCalls.get(userId)
          if (active && active.otherUserId) {
            const otherSocketId = users.get(active.otherUserId)
            if (otherSocketId) {
              io.to(otherSocketId).emit('end-call', { 
                userId: active.otherUserId, 
                otherUserId: userId, 
                channelName: active.channelName 
              })
            }
            activeCalls.delete(active.otherUserId)
            activeCalls.delete(userId)
            if (users.has(active.otherUserId)) {
              io.emit('user-status-change', { userId: active.otherUserId, status: 'online' })
            }
          }
          // Clear any pending calls
          pendingCalls.delete(userId)
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
