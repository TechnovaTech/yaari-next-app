import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db('yarri')

    const userObjectId = new ObjectId(params.id)

    const transactions = await db
      .collection('transactions')
      .find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(transactions, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}