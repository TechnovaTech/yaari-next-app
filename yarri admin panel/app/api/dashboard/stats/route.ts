import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('yarri')
    
    const totalUsers = await db.collection('users').countDocuments()
    const activeUsers = await db.collection('users').countDocuments({ isActive: true })
    
    const payments = await db.collection('payments').find({ status: 'success' }).toArray()
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    
    const totalCalls = await db.collection('calls').countDocuments()
    
    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalRevenue,
      totalCalls,
    })
  } catch (error) {
    return NextResponse.json({
      totalUsers: 0,
      activeUsers: 0,
      totalRevenue: 0,
      totalCalls: 0,
    })
  }
}
