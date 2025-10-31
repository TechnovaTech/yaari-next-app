import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('yarri')
    
    const users = await db.collection('users').find({}).toArray()
    
    return NextResponse.json(users)
  } catch (error) {
    console.error('Failed to fetch users:', error)
    // Return empty array instead of error object to prevent frontend filter errors
    return NextResponse.json([])
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
