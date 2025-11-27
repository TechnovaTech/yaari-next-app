import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('yarri')
    
    const users = await db.collection('users')
      .find({}, {
        projection: {
          _id: 1,
          name: 1,
          phone: 1,
          gender: 1,
          profilePic: 1,
          callAccess: 1
        }
      })
      .toArray()
    
    const usersWithDefaults = users.map(user => ({
      ...user,
      callAccess: user.callAccess || 'full'
    }))
    
    return NextResponse.json(usersWithDefaults)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
