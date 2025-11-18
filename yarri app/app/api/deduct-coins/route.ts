import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId, coins, callType } = await request.json()
    
    const res = await fetch(`https://admin.yaari.me/api/users/${userId}/deduct-coins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coins, callType })
    })
    
    const data = await res.json()
    
    if (!res.ok) {
      return NextResponse.json({ error: data.error || 'Failed to deduct coins' }, { status: res.status })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Deduct coins error:', error)
    return NextResponse.json({ error: 'Failed to deduct coins' }, { status: 500 })
  }
}
