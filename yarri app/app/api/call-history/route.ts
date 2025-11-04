import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

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
    
    // Fetch call history for the user (both incoming and outgoing calls)
    // Remove duplicates by grouping by participants and timestamp
    const calls = await db.collection('calls').aggregate([
      {
        $match: {
          $or: [
            { callerId: userId },
            { receiverId: userId }
          ]
        }
      },
      {
        $addFields: {
          // Create a consistent participant pair identifier
          participantPair: {
            $cond: [
              { $lt: ['$callerId', '$receiverId'] },
              { $concat: ['$callerId', '_', '$receiverId'] },
              { $concat: ['$receiverId', '_', '$callerId'] }
            ]
          },
          // Round timestamp to nearest minute to group calls that started at same time
          roundedTime: {
            $subtract: [
              '$createdAt',
              { $mod: [{ $toLong: '$createdAt' }, 60000] }
            ]
          },
          otherUserId: {
            $cond: [
              { $eq: ['$callerId', userId] },
              '$receiverId',
              '$callerId'
            ]
          },
          isOutgoing: { $eq: ['$callerId', userId] }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        // Group by participant pair and rounded timestamp to eliminate duplicates
        $group: {
          _id: {
            participants: '$participantPair',
            time: '$roundedTime'
          },
          // Take the call record from the current user's perspective
          call: {
            $first: {
              $cond: [
                { $eq: ['$callerId', userId] },
                '$$ROOT',
                {
                  $mergeObjects: [
                    '$$ROOT',
                    { isOutgoing: false }
                  ]
                }
              ]
            }
          }
        }
      },
      {
        $replaceRoot: { newRoot: '$call' }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $lookup: {
          from: 'users',
          let: { otherUserId: '$otherUserId' },
          pipeline: [
            {
              $match: {
                $expr: { 
                  $eq: [
                    { $toString: '$_id' }, 
                    '$$otherUserId'
                  ] 
                }
              }
            },
            {
              $project: {
                name: 1,
                profilePic: 1,
                about: 1
              }
            }
          ],
          as: 'otherUser'
        }
      },
      {
        $addFields: {
          otherUserInfo: { $arrayElemAt: ['$otherUser', 0] }
        }
      },
      {
        $project: {
          _id: 1,
          callType: { $ifNull: ['$callType', 'audio'] },
          duration: { $ifNull: ['$duration', 0] },
          status: { $ifNull: ['$status', 'completed'] },
          startTime: { $ifNull: ['$startTime', '$createdAt'] },
          endTime: { $ifNull: ['$endTime', '$createdAt'] },
          cost: { $ifNull: ['$cost', 0] },
          isOutgoing: 1,
          otherUserName: { $ifNull: ['$otherUserInfo.name', 'Unknown User'] },
          otherUserAvatar: '$otherUserInfo.profilePic',
          otherUserAbout: { $ifNull: ['$otherUserInfo.about', 'No description'] },
          createdAt: 1
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 50
      }
    ]).toArray()

    return NextResponse.json(calls, {
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