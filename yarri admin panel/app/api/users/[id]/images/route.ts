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

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db('yarri')

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(params.id) },
      { projection: { profilePic: 1, gallery: 1 } }
    )

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, {
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }

    const gallery = Array.isArray(user.gallery) 
      ? user.gallery.filter((url: string) => url && url.trim())
      : []

    console.log('Fetching images for user:', params.id, 'Gallery count:', gallery.length)

    return NextResponse.json({
      profilePic: user.profilePic || '',
      gallery,
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  } catch (error) {
    console.error('Error fetching images:', error)
    return NextResponse.json({ error: 'Failed to fetch images' }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  }
}