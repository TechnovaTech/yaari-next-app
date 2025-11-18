import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    const client = await clientPromise
    const db = client.db('yarri')
    
    // Get all calls where user is either caller or receiver from callHistory collection
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

    const enrichedHistory = await Promise.all(
      callHistory.map(async (call) => {
        // Determine if this is an outgoing call
        const isOutgoing = String(call.callerId) === String(userId)
        const otherUserId = isOutgoing ? call.receiverId : call.callerId
        
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
            // User not found
          }
        }

        return {
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
      })
    )

    return NextResponse.json(enrichedHistory, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Call history fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch call history' }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}