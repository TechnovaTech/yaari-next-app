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
    console.log('Delete photo request:', { userId, photoUrl, normalizedPhotoUrl })
    
    if (!userId || !photoUrl) {
      return NextResponse.json({ error: 'Missing userId or photoUrl' }, {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }

    const client = await clientPromise
    const db = client.db('yarri')

    // Get current user data to see what's in gallery
    const userBefore = await db.collection('users').findOne({ _id: new ObjectId(userId) })
    console.log('User gallery before delete:', userBefore?.gallery)

    // Try to match both original and normalized URLs
    const urlsToMatch = [photoUrl]
    if (normalizedPhotoUrl && normalizedPhotoUrl !== photoUrl) {
      urlsToMatch.push(normalizedPhotoUrl)
    }
    console.log('URLs to match:', urlsToMatch)

    // Remove from user's gallery (try all URL variations)
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $pull: { gallery: { $in: urlsToMatch } },
        $set: { updatedAt: new Date() },
      }
    )

    // Clean up any empty, null, or whitespace-only values from gallery
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $pull: { gallery: { $in: ['', null, ' '] } }
      }
    )

    // Also remove any remaining falsy values using aggregation
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) })
    if (user && user.gallery) {
      const cleanGallery = user.gallery.filter((url: any) => url && typeof url === 'string' && url.trim())
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { gallery: cleanGallery } }
      )
    }

    // Remove from profilePic if matching
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId), profilePic: { $in: urlsToMatch } },
      { $set: { profilePic: '' } }
    )

    // Get user data after delete to verify
    const userAfter = await db.collection('users').findOne({ _id: new ObjectId(userId) })
    console.log('User gallery after delete:', userAfter?.gallery)
    console.log('Photo deleted:', { userId, photoUrl, matched: updateResult.modifiedCount })

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