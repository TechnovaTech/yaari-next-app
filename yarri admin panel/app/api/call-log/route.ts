import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

const activeCallSessions = new Map<string, any>()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { callerId, receiverId, callType, action, duration, cost, status, channelName } = body

    if (!callerId || !receiverId || !callType || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('yarri')

    if (action === 'start') {
      // Store call session
      const sessionKey = `${callerId}-${receiverId}-${channelName}`
      activeCallSessions.set(sessionKey, {
        callerId,
        receiverId,
        callType,
        startTime: new Date(),
        channelName
      })
      
      console.log('Call session started:', sessionKey)
      return NextResponse.json({ success: true, message: 'Call started' })
    }

    if (action === 'end') {
      // Find and remove session
      const sessionKey = `${callerId}-${receiverId}`
      let session = null
      
      // Find session by matching caller and receiver
      for (const [key, value] of activeCallSessions.entries()) {
        if (key.includes(callerId) && key.includes(receiverId)) {
          session = value
          activeCallSessions.delete(key)
          break
        }
      }

      const startTime = session?.startTime || new Date()
      const endTime = new Date()

      // Save to call history
      const callRecord = {
        callerId,
        receiverId,
        callType,
        duration: duration || 0,
        status: status || 'completed',
        cost: cost || 0,
        startTime,
        endTime,
        createdAt: new Date()
      }
      
      console.log('Saving call to history:', callRecord)
      const result = await db.collection('callHistory').insertOne(callRecord)
      console.log('Call saved with ID:', result.insertedId)

      return NextResponse.json({ success: true, message: 'Call logged', id: result.insertedId })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Call log error:', error)
    return NextResponse.json({ error: 'Failed to log call' }, { status: 500 })
  }
}
