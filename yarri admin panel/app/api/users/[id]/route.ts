import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db('yarri')
    
    const user = await db.collection('users').findOne({ _id: new ObjectId(params.id) })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { 
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      })
    }
    
    return NextResponse.json(user, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user' }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db('yarri')
    
    await db.collection('users').deleteOne({ _id: new ObjectId(params.id) })
    
    return NextResponse.json({ success: true }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    console.log('Received update for user:', params.id)
    console.log('Update data:', JSON.stringify(body).substring(0, 200))
    
    const client = await clientPromise
    const db = client.db('yarri')
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { ...body, updatedAt: new Date() } }
    )
    
    console.log('Update result:', result.modifiedCount, 'documents modified')
    
    return NextResponse.json({ success: true }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}
