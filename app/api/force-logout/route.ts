import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const io = (global as any).io
    if (io) {
      io.to(userId).emit('force-logout', { reason: 'account_deleted' })
      console.log(`Force logout sent to user: ${userId}`)
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: 'Socket.IO not available' }, { status: 500 })
  } catch (error) {
    console.error('Force logout error:', error)
    return NextResponse.json({ error: 'Failed to send logout' }, { status: 500 })
  }
}
