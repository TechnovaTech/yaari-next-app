import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Configure the route to handle larger payloads
export const runtime = 'nodejs'
export const maxDuration = 30

// Configure maximum request body size (50MB)
export const maxRequestBodySize = 50 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    // Check content-length header first
    const contentLength = request.headers.get('content-length')
    const maxSize = 50 * 1024 * 1024 // 50MB
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: 'Request too large. Maximum size is 50MB.' 
      }, { status: 413 })
    }

    // Parse form data with error handling for large payloads
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (error: any) {
      if (error.message?.includes('PayloadTooLargeError') || error.code === 'LIMIT_FILE_SIZE') {
        return NextResponse.json({ 
          success: false, 
          error: 'File too large. Maximum size is 50MB.' 
        }, { status: 413 })
      }
      throw error
    }

    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Only images and videos are allowed.' 
      }, { status: 400 })
    }

    // Check file size (50MB limit)
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: 'File too large. Maximum size is 50MB.' 
      }, { status: 413 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'ads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}_${originalName}`
    const filepath = join(uploadsDir, filename)

    // Write file
    await writeFile(filepath, buffer)

    // Return the public URL
    const fileUrl = `/uploads/ads/${filename}`

    return NextResponse.json({ 
      success: true, 
      url: fileUrl,
      filename: filename,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload file' 
    }, { status: 500 })
  }
}