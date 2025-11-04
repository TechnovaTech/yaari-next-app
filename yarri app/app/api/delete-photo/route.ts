import { NextResponse } from 'next/server'

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
    const body = await request.json()
    const { userId, photoUrl, normalizedPhotoUrl } = body

    if (!userId || !photoUrl) {
      return NextResponse.json({ error: 'Missing userId or photoUrl' }, {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }

    const candidates = [
      'http://localhost:3002',
      process.env.API_BASE,
      process.env.NEXT_PUBLIC_API_URL,
      'https://admin.yaari.me'
    ].filter(Boolean) as string[]

    let lastError: any = null
    for (const base of candidates) {
      try {
        const res = await fetch(`${base}/api/delete-photo`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, photoUrl, normalizedPhotoUrl }),
        })

        const data = await res.json().catch(() => ({ error: 'Invalid JSON' }))

        if (!res.ok) {
          lastError = { status: res.status, data }
          continue
        }

        return NextResponse.json(data, {
          headers: { 'Access-Control-Allow-Origin': '*' }
        })
      } catch (err) {
        lastError = err
        continue
      }
    }

    const status = typeof lastError?.status === 'number' ? lastError.status : 500
    const message = lastError?.data?.error || 'Failed to delete photo'
    return NextResponse.json({ error: message }, {
      status,
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  } catch (error) {
    console.error('Delete photo proxy error:', error)
    return NextResponse.json({ error: 'Failed to delete photo' }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  }
}
