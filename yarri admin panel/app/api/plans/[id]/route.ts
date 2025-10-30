import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const client = await clientPromise
    const db = client.db('yarri')

    const update: any = { updatedAt: new Date() }
    if (body.title !== undefined) update.title = body.title
    if (body.coins !== undefined) update.coins = Number(body.coins)
    if (body.price !== undefined) update.price = Number(body.price)
    if (body.originalPrice !== undefined) update.originalPrice = Number(body.originalPrice)
    if (body.isActive !== undefined) update.isActive = !!body.isActive

    await db.collection('plans').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: update }
    )

    return NextResponse.json({ success: true }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db('yarri')

    await db.collection('plans').deleteOne({ _id: new ObjectId(params.id) })

    return NextResponse.json({ success: true }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
  }
}