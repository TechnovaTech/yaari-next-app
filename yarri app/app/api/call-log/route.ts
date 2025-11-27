import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// CORS preflight
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

// Proxy call-log to Admin API to avoid local DB dependency
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Basic validation for required fields
    const { callerId, receiverId, callType, action } = body || {}
    if (!callerId || !receiverId || !callType || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
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
        const res = await fetch(`${base}/api/call-log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        const data = await res
          .json()
          .catch(() => ({ error: 'Invalid JSON from upstream' }))

        if (!res.ok) {
          lastError = { status: res.status, data }
          continue
        }

        return NextResponse.json(data, {
          headers: { 'Access-Control-Allow-Origin': '*'}
        })
      } catch (err) {
        lastError = err
        continue
      }
    }

    // If all candidates failed
    const status = typeof lastError?.status === 'number' ? lastError.status : 500
    const message = lastError?.data?.error || 'Failed to log call'
    return NextResponse.json({ error: message }, {
      status,
      headers: { 'Access-Control-Allow-Origin': '*'}
    })
  } catch (error) {
    console.error('Call log proxy error:', error)
    return NextResponse.json({ error: 'Failed to log call' }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}