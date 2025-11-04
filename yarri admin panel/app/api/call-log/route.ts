import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

const activeCallSessions = new Map<string, any>()

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(request: Request) {
  try {
    console.log('📞 Call log endpoint hit')
    const body = await request.json()
    console.log('📞 Request body:', body)
    const { callerId, receiverId, callType, action, duration, cost, status, channelName } = body

    if (!callerId || !receiverId || !callType || !action) {
      console.log('❌ Missing required fields')
      return NextResponse.json({ error: 'Missing required fields' }, { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      })
    }

    console.log('🔌 Connecting to database...')
    const client = await clientPromise
    const db = client.db('yarri')
    console.log('✅ Database connected')

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
      
      console.log('✅ Call session started:', sessionKey)
      console.log('📊 Active sessions:', activeCallSessions.size)
      return NextResponse.json({ success: true, message: 'Call started' }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      })
    }

    if (action === 'end') {
      console.log('🔚 Ending call...')
      // Find and remove session
      const sessionKey = `${callerId}-${receiverId}`
      let session = null
      
      console.log('🔍 Looking for session with key pattern:', sessionKey)
      console.log('📊 Current active sessions:', Array.from(activeCallSessions.keys()))
      
      // Find session by matching caller and receiver
      for (const [key, value] of activeCallSessions.entries()) {
        if (key.includes(callerId) && key.includes(receiverId)) {
          session = value
          activeCallSessions.delete(key)
          console.log('✅ Found and removed session:', key)
          break
        }
      }

      if (!session) {
        console.log('⚠️ No session found, using current time')
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
      
      console.log('💾 Saving call to history:', callRecord)
      
      try {
        const result = await db.collection('callHistory').insertOne(callRecord)
        console.log('✅ Call saved successfully with ID:', result.insertedId)
        
        // Verify it was saved
        const savedCall = await db.collection('callHistory').findOne({ _id: result.insertedId })
        console.log('✅ Verified saved call:', savedCall)
        
        return NextResponse.json({ success: true, message: 'Call logged', id: result.insertedId }, {
          headers: { 'Access-Control-Allow-Origin': '*' }
        })
      } catch (dbError) {
        console.error('❌ Database error:', dbError)
        throw dbError
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { 
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  } catch (error) {
    console.error('Call log error:', error)
    return NextResponse.json({ error: 'Failed to log call' }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  }
}
