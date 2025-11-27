import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import crypto from 'crypto'
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

export async function POST(request: Request) {
  try {
    const { orderId, paymentId, signature } = await request.json()

    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
      return NextResponse.json({ error: 'Razorpay key not configured' }, { status: 500 })
    }

    const expectedSignature = crypto.createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('yarri')

    const payment = await db.collection('payments').findOne({ orderId })
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const userId = payment.userId
    const userObjectId = new ObjectId(typeof userId === 'string' ? userId : userId)

    const user = await db.collection('users').findOne({ _id: userObjectId })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const settings = await db.collection('settings').findOne({ type: 'app' })
    const coinsPerRupee = settings?.coinsPerRupee || 1

    let coinsToCredit = 0

    if (payment.type === 'plan' && payment.planId) {
      const plan = await db.collection('plans').findOne({ _id: new ObjectId(payment.planId) })
      coinsToCredit = plan?.coins || 0
    } else {
      if (payment.coinsRequested) {
        coinsToCredit = payment.coinsRequested
      } else {
        coinsToCredit = Math.round((payment.amount || 0) * coinsPerRupee)
      }
    }

    const previousBalance = user.balance || 0
    const newBalance = previousBalance + coinsToCredit

    await db.collection('users').updateOne(
      { _id: userObjectId },
      { $set: { balance: newBalance, updatedAt: new Date() } }
    )

    await db.collection('payments').updateOne(
      { orderId },
      { $set: { status: 'success', paymentId, signature, verifiedAt: new Date(), coinsCredited: coinsToCredit } }
    )

    await db.collection('transactions').insertOne({
      userId: userObjectId,
      type: payment.type === 'plan' ? 'plan_purchase' : 'recharge',
      amountInRupees: payment.amount,
      coins: coinsToCredit,
      coinsPerRupee,
      previousBalance,
      newBalance,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true, newBalance }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}