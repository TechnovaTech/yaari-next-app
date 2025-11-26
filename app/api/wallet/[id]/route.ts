import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { action, amount } = await request.json()
    const client = await clientPromise
    const db = client.db('yarri')
    
    const user = await db.collection('users').findOne({ _id: new ObjectId(params.id) })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const settings = await db.collection('settings').findOne({ type: 'app' })
    const coinsPerRupee = settings?.coinsPerRupee || 1
    
    const currentBalance = user.balance || 0
    const coins = amount * coinsPerRupee
    let newBalance = currentBalance
    
    if (action === 'add') {
      newBalance = currentBalance + coins
    } else if (action === 'deduct') {
      newBalance = Math.max(0, currentBalance - coins)
    }
    
    await db.collection('users').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { balance: newBalance, updatedAt: new Date() } }
    )
    
    await db.collection('transactions').insertOne({
      userId: new ObjectId(params.id),
      type: action,
      amountInRupees: amount,
      coins,
      coinsPerRupee,
      previousBalance: currentBalance,
      newBalance,
      createdAt: new Date(),
    })
    
    return NextResponse.json({ success: true, newBalance })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 })
  }
}
