import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('yarri')

    const users = await db.collection('users').aggregate([
      { $project: { _id: 1, name: 1, phone: 1, balance: 1 } },
      {
        $lookup: {
          from: 'transactions',
          localField: '_id',
          foreignField: 'userId',
          as: 'txs'
        }
      },
      {
        $addFields: {
          totalSpent: { $sum: '$txs.amountInRupees' }
        }
      },
      { $project: { txs: 0 } },
    ]).toArray()

    return NextResponse.json(users.map(u => ({
      ...u,
      userName: u.name || 'User',
      totalSpent: u.totalSpent || 0,
    })))
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 })
  }
}
