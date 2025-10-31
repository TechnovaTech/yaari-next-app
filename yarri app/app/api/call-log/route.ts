import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

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
    const body = await request.json()
    const { 
      callerId, 
      receiverId, 
      callType, 
      action, 
      duration, 
      cost,
      channelName,
      status 
    } = body

    if (!callerId || !receiverId || !callType || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    const client = await clientPromise
    const db = client.db('yarri')
    
    if (action === 'start') {
      // Create new call record
      const callRecord = {
        callerId,
        receiverId,
        callType, // 'video' or 'audio'
        channelName: channelName || null,
        status: 'started',
        startTime: new Date(),
        endTime: null,
        duration: 0,
        cost: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const result = await db.collection('calls').insertOne(callRecord)
      
      return NextResponse.json({ 
        success: true, 
        callId: result.insertedId 
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      })
    } 
    else if (action === 'end') {
      // Update existing call record
      const filter = {
        $or: [
          { callerId, receiverId },
          { callerId: receiverId, receiverId: callerId }
        ],
        status: { $in: ['started', 'connected'] }
      }
      
      const update = {
        $set: {
          status: status || 'completed',
          endTime: new Date(),
          duration: duration || 0,
          cost: cost || 0,
          updatedAt: new Date()
        }
      }
      
      const result = await db.collection('calls').updateOne(filter, update, { 
        sort: { createdAt: -1 } 
      })
      
      if (result.matchedCount === 0) {
        // If no existing call found, create a completed call record
        const callRecord = {
          callerId,
          receiverId,
          callType,
          channelName: channelName || null,
          status: status || 'completed',
          startTime: new Date(Date.now() - (duration * 1000 || 0)),
          endTime: new Date(),
          duration: duration || 0,
          cost: cost || 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        await db.collection('calls').insertOne(callRecord)
      }
      
      return NextResponse.json({ 
        success: true,
        updated: result.matchedCount > 0
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      })
    }
    else {
      return NextResponse.json({ error: 'Invalid action' }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      })
    }
  } catch (error) {
    console.error('Call log error:', error)
    return NextResponse.json({ error: 'Failed to log call' }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}