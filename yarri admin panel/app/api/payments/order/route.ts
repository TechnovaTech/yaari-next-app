import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

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
    const { userId, amountRupees, type, planId, coins } = await request.json()

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Razorpay keys not configured' }, { status: 500 })
    }

    const amountPaise = Math.round(Number(amountRupees) * 100)
    const receipt = `order_${Date.now()}`

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

    const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt,
        payment_capture: 1,
        notes: { userId, type, planId: planId || null, coinsRequested: coins || null },
      }),
    })

    const order = await orderRes.json()

    if (!order || !order.id) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    const client = await clientPromise
    const db = client.db('yarri')

    await db.collection('payments').insertOne({
      userId,
      type: type || 'topup',
      planId: planId || null,
      amount: Number(amountRupees),
      coinsRequested: Number(coins) || null,
      currency: 'INR',
      orderId: order.id,
      receipt,
      status: 'pending',
      createdAt: new Date(),
    })

    return NextResponse.json({ orderId: order.id, amountPaise: order.amount, currency: order.currency, keyId }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
  }
}