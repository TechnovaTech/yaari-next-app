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

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('yarri')
    
    const users = await db.collection('users')
      .find({}, {
        projection: {
          _id: 1,
          name: 1,
          about: 1,
          profilePic: 1,
          gender: 1,
          callAccess: 1
        }
      })
      .toArray()
    
    const usersWithDefaults = users.map(user => ({
      ...user,
      callAccess: user.callAccess || 'full'
    }))
    
    return NextResponse.json(usersWithDefaults, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}
