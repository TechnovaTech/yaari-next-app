import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yarri'

async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  return client.db('yarri')
}

// GET - Fetch active ads for the main app
export async function GET() {
  try {
    const db = await connectToDatabase()
    const ads = await db.collection('ads')
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .toArray()
    
    return NextResponse.json({ success: true, ads })
  } catch (error) {
    console.error('Error fetching ads:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch ads' }, { status: 500 })
  }
}