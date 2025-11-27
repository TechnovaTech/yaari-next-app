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

    const plans = await db.collection('plans')
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(plans, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const client = await clientPromise
    const db = client.db('yarri')

    const doc = {
      title: body.title || '',
      coins: Number(body.coins) || 0,
      price: Number(body.price) || 0,
      originalPrice: Number(body.originalPrice) || Number(body.price) || 0,
      isActive: body.isActive !== undefined ? !!body.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('plans').insertOne(doc)

    return NextResponse.json({ success: true, id: result.insertedId }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}