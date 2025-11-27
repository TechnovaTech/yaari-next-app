import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yarri'

async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  return client.db('yarri')
}

// OPTIONS - Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

// GET - Fetch all ads
export async function GET() {
  try {
    const db = await connectToDatabase()
    const ads = await db.collection('ads').find({}).sort({ createdAt: -1 }).toArray()
    
    return NextResponse.json({ success: true, ads }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  } catch (error) {
    console.error('Error fetching ads:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch ads' }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
}

// POST - Create new ad
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, mediaType, imageUrl, videoUrl, linkUrl, isActive = true } = body



    if (!mediaType || !['photo', 'video'].includes(mediaType)) {
      return NextResponse.json(
        { success: false, message: 'Media type must be either "photo" or "video"' },
        { status: 400 }
      )
    }

    if (mediaType === 'photo' && !imageUrl) {
      return NextResponse.json(
        { success: false, message: 'Image URL is required for photo ads' },
        { status: 400 }
      )
    }

    if (mediaType === 'video' && !videoUrl) {
      return NextResponse.json(
        { success: false, message: 'Video URL is required for video ads' },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()
    const newAd = {
      title,
      description: description || '',
      mediaType,
      imageUrl: mediaType === 'photo' ? imageUrl : '',
      videoUrl: mediaType === 'video' ? videoUrl : '',
      linkUrl: linkUrl || '',
      isActive,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('ads').insertOne(newAd)
    
    return NextResponse.json({
      success: true,
      message: 'Ad created successfully',
      ad: { _id: result.insertedId, ...newAd }
    })
  } catch (error) {
    console.error('Error creating ad:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create ad' },
      { status: 500 }
    )
  }
}

// PUT - Update ad
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, description, mediaType, imageUrl, videoUrl, linkUrl, isActive } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      )
    }

    if (!mediaType || !['photo', 'video'].includes(mediaType)) {
      return NextResponse.json(
        { success: false, message: 'Media type must be either "photo" or "video"' },
        { status: 400 }
      )
    }

    if (mediaType === 'photo' && !imageUrl) {
      return NextResponse.json(
        { success: false, message: 'Image URL is required for photo ads' },
        { status: 400 }
      )
    }

    if (mediaType === 'video' && !videoUrl) {
      return NextResponse.json(
        { success: false, message: 'Video URL is required for video ads' },
        { status: 400 }
      )
    }

    const db = await connectToDatabase()
    const updateData = {
      title,
      description: description || '',
      mediaType,
      imageUrl: mediaType === 'photo' ? imageUrl : '',
      videoUrl: mediaType === 'video' ? videoUrl : '',
      linkUrl: linkUrl || '',
      isActive: isActive !== undefined ? isActive : true,
      updatedAt: new Date()
    }

    const result = await db.collection('ads').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Ad not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Ad updated successfully'
    })
  } catch (error) {
    console.error('Error updating ad:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update ad' },
      { status: 500 }
    )
  }
}

// DELETE - Delete ad
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Ad ID is required' }, { status: 400 })
    }

    const db = await connectToDatabase()
    const result = await db.collection('ads').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Ad not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Ad deleted successfully' })
  } catch (error) {
    console.error('Error deleting ad:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete ad' }, { status: 500 })
  }
}