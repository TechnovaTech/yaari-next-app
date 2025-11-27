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
          email: 1,
          gender: 1,
          balance: 1,
          isActive: 1,
          profilePic: 1,
          createdAt: 1,
          callAccess: 1,
          about: 1,
          hobbies: 1,
          gallery: 1
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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const client = await clientPromise
    const db = client.db('yarri')
    
    const result = await db.collection('users').insertOne({
      ...body,
      createdAt: new Date(),
      isActive: true,
      balance: 0,
    })
    
    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
