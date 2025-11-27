import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

// Single OPTIONS handler defined above to avoid duplicate export errors

export async function POST(request: Request) {
  try {
    console.log('📞 Call log endpoint hit')
    const body = await request.json()
    console.log('📞 Request body:', body)
    const { callerId, receiverId, callType, action, duration, cost, status, channelName } = body

    const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }

    if (!callerId || !receiverId || !callType || !action) {
      console.log('❌ Missing required fields')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders })
    }

    if (!['audio', 'video'].includes(String(callType))) {
      return NextResponse.json({ error: 'Invalid callType' }, { status: 400, headers: corsHeaders })
    }

    console.log('🔌 Connecting to database...')
    const client = await clientPromise
    const db = client.db('yarri')
    console.log('✅ Database connected')

    if (action === 'start') {
      const callSession = {
        callerId,
        receiverId,
        callType,
        startTime: new Date(),
        channelName,
        status: 'active',
        createdAt: new Date()
      }
      
      const result = await db.collection('activeCalls').insertOne(callSession)
      console.log('✅ Call session started in DB:', result.insertedId)
      
      return NextResponse.json({ success: true, message: 'Call started', sessionId: result.insertedId }, { headers: corsHeaders })
    }

    if (action === 'end') {
      console.log('🔚 Ending call...')
      
      const activeCall = await db.collection('activeCalls').findOne({
        $or: [
          { callerId, receiverId },
          { callerId: receiverId, receiverId: callerId }
        ],
        status: 'active'
      })

      const startTime = activeCall?.startTime || new Date(Date.now() - (duration || 0) * 1000)
      const endTime = new Date()

      const callRecord = {
        callerId,
        receiverId,
        callType,
        duration: duration || 0,
        status: status || 'completed',
        cost: cost || 0,
        startTime,
        endTime,
        createdAt: new Date(),
        participants: [callerId, receiverId]
      }
      
      console.log('💾 Saving call to history:', callRecord)
      
      const result = await db.collection('callHistory').insertOne(callRecord)
      console.log('✅ Call saved with ID:', result.insertedId)
      
      if (activeCall) {
        await db.collection('activeCalls').deleteOne({ _id: activeCall._id })
        console.log('✅ Removed active call session')
      }
      
      const savedCall = await db.collection('callHistory').findOne({ _id: result.insertedId })
      if (!savedCall) {
        throw new Error('Failed to verify call was saved')
      }
      console.log('✅ Verified saved call')
      
      return NextResponse.json({ success: true, message: 'Call logged', id: result.insertedId, verified: true }, { headers: corsHeaders })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers: corsHeaders })
  } catch (error) {
    console.error('❌ Call log error:', error)
    return NextResponse.json({ error: 'Failed to log call', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } })
  }
}

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
