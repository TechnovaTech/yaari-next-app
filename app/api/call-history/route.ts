import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'

// Single OPTIONS handler defined above to avoid duplicate export errors

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      })
    }

    const client = await clientPromise
    const db = client.db('yarri')
    
    console.log('Fetching call history for userId:', userId)
    
    // Get all calls where user is either caller or receiver
    const callHistory = await db.collection('callHistory')
      .find({
        $or: [
          { callerId: userId },
          { receiverId: userId }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    console.log('Found calls:', callHistory.length)
    console.log('Sample call:', callHistory[0])

    const enrichedHistory = await Promise.all(
      callHistory.map(async (call) => {
        // Determine if this is an outgoing call
        const isOutgoing = String(call.callerId) === String(userId)
        const otherUserId = isOutgoing ? call.receiverId : call.callerId
        
        console.log('Processing call:', { 
          callerId: call.callerId, 
          receiverId: call.receiverId, 
          userId, 
          isOutgoing, 
          otherUserId 
        })
        
        // Try to find the other user
        let otherUser = null
        
        // First try as string (most common)
        otherUser = await db.collection('users').findOne(
          { _id: otherUserId },
          { projection: { name: 1, profilePic: 1, about: 1 } }
        )
        
        // If not found, try as ObjectId
        if (!otherUser) {
          try {
            otherUser = await db.collection('users').findOne(
              { _id: new ObjectId(otherUserId) },
              { projection: { name: 1, profilePic: 1, about: 1 } }
            )
          } catch (err) {
            console.log('Could not find user:', otherUserId)
          }
        }

        const enrichedCall = {
          _id: call._id,
          callType: call.callType || 'audio',
          duration: call.duration || 0,
          status: call.status || 'completed',
          startTime: call.startTime || call.createdAt,
          endTime: call.endTime || call.createdAt,
          cost: call.cost || 0,
          isOutgoing,
          otherUserName: otherUser?.name || 'Unknown User',
          otherUserAvatar: otherUser?.profilePic || '',
          otherUserAbout: otherUser?.about || '',
          createdAt: call.createdAt
        }
        
        console.log('Enriched call:', enrichedCall)
        return enrichedCall
      })
    )

    console.log('Returning enriched history:', enrichedHistory.length)
    return NextResponse.json(enrichedHistory, { headers: { 'Access-Control-Allow-Origin': '*' } })
  } catch (error) {
    console.error('Call history error:', error)
    return NextResponse.json({ error: 'Failed to fetch call history' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { callerId, receiverId, callType, duration, status, cost } = body

    if (!callerId || !receiverId) {
      return NextResponse.json({ error: 'callerId and receiverId are required' }, { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      })
    }

    const client = await clientPromise
    const db = client.db('yarri')
    
    const result = await db.collection('callHistory').insertOne({
      callerId,
      receiverId,
      callType: callType || 'audio',
      duration: duration || 0,
      status: status || 'completed',
      cost: cost || 0,
      startTime: new Date(),
      endTime: new Date(),
      createdAt: new Date()
    })

    return NextResponse.json({ success: true, id: result.insertedId }, { headers: { 'Access-Control-Allow-Origin': '*' } })
  } catch (error) {
    console.error('Create call history error:', error)
    return NextResponse.json({ error: 'Failed to create call history' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
