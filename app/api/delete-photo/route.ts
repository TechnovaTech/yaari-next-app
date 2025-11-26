import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import path from 'path'
import fs from 'fs/promises'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function DELETE(request: Request) {
  try {
    const { userId, photoUrl, normalizedPhotoUrl } = await request.json()
    
    if (!userId || !photoUrl) {
      return NextResponse.json({ error: 'Missing userId or photoUrl' }, {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }

    const client = await clientPromise
    const db = client.db('yarri')

    const urlsToMatch = [photoUrl]
    if (normalizedPhotoUrl && normalizedPhotoUrl !== photoUrl) {
      urlsToMatch.push(normalizedPhotoUrl)
    }

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) })
    console.log('User found:', !!user, 'Gallery length:', user?.gallery?.length)
    console.log('Gallery before:', user?.gallery)
    console.log('URLs to remove:', urlsToMatch)
    
    if (user && user.gallery) {
      const cleanGallery = user.gallery
        .filter((url: any) => url && typeof url === 'string' && url.trim())
        .filter((url: string) => !urlsToMatch.includes(url))
      
      console.log('Clean gallery length:', cleanGallery.length)
      console.log('Clean gallery:', cleanGallery)
      
      const result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { gallery: cleanGallery, updatedAt: new Date() } }
      )
      console.log('Update result:', result.modifiedCount, 'modified')
    }

    // Remove from profilePic if matching
    if (user && urlsToMatch.includes(user.profilePic)) {
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { profilePic: '' } }
      )
    }

    // Attempt to delete the file from disk if it belongs to our uploads
    const marker = '/uploads/'
    const idx = photoUrl.indexOf(marker)
    if (idx !== -1) {
      const filename = photoUrl.substring(idx + marker.length)
      const filePath = path.join(process.cwd(), 'public', 'uploads', filename)
      try {
        await fs.unlink(filePath)
      } catch (_err) {
        // ignore if not found
      }
    }

    console.log('Delete completed successfully')
    return NextResponse.json({ success: true }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  } catch (error) {
    console.error('Delete photo error:', error)
    return NextResponse.json({ error: 'Failed to delete photo' }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  }
}