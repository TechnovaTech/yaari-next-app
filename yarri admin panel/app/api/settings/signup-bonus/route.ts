import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('yarri')

    const doc = await db.collection('settings').findOne({ key: 'signup_bonus' })
    const amount = (doc && (doc as any).amount) ?? 0

    return NextResponse.json({ amount }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    return NextResponse.json({ amount: 0 }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}

export async function POST(request: Request) {
  try {
    const { amount } = await request.json()
    const client = await clientPromise
    const db = client.db('yarri')

    const parsed = Number(amount)
    const safeAmount = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0

    await db.collection('settings').updateOne(
      { key: 'signup_bonus' },
      { $set: { key: 'signup_bonus', amount: safeAmount, updatedAt: new Date() } },
      { upsert: true }
    )

    return NextResponse.json({ success: true, amount: safeAmount }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update signup bonus' }, { status: 500 })
  }
}