import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import path from 'path'
import fs from 'fs/promises'

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

function getExtensionFromMime(mime: string): string {
  if (mime === 'image/jpeg') return '.jpg'
  if (mime === 'image/png') return '.png'
  if (mime === 'image/webp') return '.webp'
  if (mime === 'image/gif') return '.gif'
  return ''
}

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const file = form.get('photo') as File | null
    const userId = String(form.get('userId') || '')
    const isProfilePic = String(form.get('isProfilePic') || 'false') === 'true'

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing photo or userId' }, {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.mkdir(uploadsDir, { recursive: true })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const ext = getExtensionFromMime(file.type) || (file.name ? path.extname(file.name) : '.jpg')
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    const filePath = path.join(uploadsDir, filename)
    await fs.writeFile(filePath, buffer)

    const reqUrl = new URL(request.url)
    const origin = `${reqUrl.protocol}//${reqUrl.host}`
    const photoUrl = `${origin}/uploads/${filename}`

    const client = await clientPromise
    const db = client.db('yarri')

    if (isProfilePic) {
      await db.collection('users').updateOne(
        { _id: new (await import('mongodb')).ObjectId(userId) },
        { $set: { profilePic: photoUrl, updatedAt: new Date() } }
      )
    } else {
      await db.collection('users').updateOne(
        { _id: new (await import('mongodb')).ObjectId(userId) },
        { $push: { gallery: photoUrl } as any, $set: { updatedAt: new Date() } }
      )
    }

    return NextResponse.json({ photoUrl }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Failed to upload photo' }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  }
}