import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

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

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { coins, callType } = await request.json()
    
    if (!coins || coins <= 0) {
      return NextResponse.json({ error: 'Invalid coin amount' }, { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      })
    }

    const client = await clientPromise
    const db = client.db('yarri')
    
    const user = await db.collection('users').findOne({ _id: new ObjectId(params.id) })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { 
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*' }
      })
    }
    
    const currentBalance = user.balance || 0
    
    if (currentBalance < coins) {
      return NextResponse.json({ error: 'Insufficient coins' }, { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      })
    }
    
    const newBalance = currentBalance - coins
    
    await db.collection('users').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { balance: newBalance } }
    )
    
    await db.collection('transactions').insertOne({
      userId: params.id,
      type: `${callType}_call`,
      coins: -coins,
      status: 'success',
      description: `${callType} call charge`,
      createdAt: new Date()
    })
    
    return NextResponse.json({ 
      success: true, 
      newBalance,
      deducted: coins
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  } catch (error) {
    console.error('Deduct coins error:', error)
    return NextResponse.json({ error: 'Failed to deduct coins' }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  }
}
