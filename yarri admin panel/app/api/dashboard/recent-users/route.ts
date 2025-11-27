import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('yarri')
    
    const users = await db.collection('users')
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray()
    
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json([])
  }
}
