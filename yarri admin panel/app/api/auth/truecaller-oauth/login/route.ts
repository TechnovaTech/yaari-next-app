import { NextResponse } from 'next/server'

const TOKEN_URL = process.env.TRUECALLER_TOKEN_URL || 'https://oauth.truecaller.com/v1/token'
const USERINFO_URL = process.env.TRUECALLER_USERINFO_URL || 'https://oauth.truecaller.com/v1/userinfo'
const CLIENT_ID = process.env.TRUECALLER_CLIENT_ID || ''

export const runtime = 'nodejs'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Client-Id, x-client-id',
    },
  })
}

export async function POST(req: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Client-Id, x-client-id',
  }
  try {
    const body = await req.json()
    const authorizationCode: string | undefined = body?.authorizationCode
    const codeVerifier: string | undefined = body?.codeVerifier
    const headerClientId = req.headers.get('x-client-id') || req.headers.get('X-Client-Id') || ''
    const clientId: string = (process.env.TRUECALLER_CLIENT_ID || body?.clientId || body?.client_id || headerClientId || '').toString()

    if (!authorizationCode || !codeVerifier) {
      return NextResponse.json({ message: 'authorizationCode and codeVerifier are required' }, { status: 400, headers: corsHeaders })
    }
    if (!clientId) {
      return NextResponse.json({ message: 'server_missing_client_id' }, { status: 500, headers: corsHeaders })
    }

    // Exchange authorization code with timeout and retry
    let tokenRes;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      tokenRes = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: authorizationCode,
          code_verifier: codeVerifier,
          client_id: clientId,
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      const errorMsg = fetchError?.message || String(fetchError);
      console.error('Truecaller token fetch failed:', {
        error: errorMsg,
        url: TOKEN_URL,
        clientId: clientId,
        cause: fetchError?.cause?.code
      });
      
      // DNS resolution failure - instruct client to use direct exchange
      if (errorMsg.includes('getaddrinfo') || errorMsg.includes('ENOTFOUND') || errorMsg.includes('resolve')) {
        return NextResponse.json({ 
          message: 'Server DNS issue - use client-side exchange', 
          error: 'DNS_RESOLUTION_FAILED',
          useClientSide: true
        }, { status: 503, headers: corsHeaders })
      }
      
      return NextResponse.json({ 
        message: 'Cannot connect to Truecaller service', 
        error: 'NETWORK_ERROR',
        useClientSide: true
      }, { status: 503, headers: corsHeaders })
    }
    const tokenJson = await tokenRes.json().catch(() => ({}))
    if (!tokenRes.ok || !tokenJson?.access_token) {
      console.error('Truecaller token exchange failed:', {
        status: tokenRes.status,
        statusText: tokenRes.statusText,
        response: tokenJson,
        clientId: clientId,
        url: TOKEN_URL
      })
      return NextResponse.json({ 
        message: 'Truecaller token exchange failed', 
        details: tokenJson,
        status: tokenRes.status,
        clientId: clientId
      }, { status: 502, headers: corsHeaders })
    }

    // Fetch user info
    const userRes = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${tokenJson.access_token}` } })
    const userJson = await userRes.json().catch(() => ({}))
    if (!userRes.ok) {
      console.error('Truecaller userinfo failed:', {
        status: userRes.status,
        statusText: userRes.statusText,
        response: userJson,
        accessToken: tokenJson.access_token
      })
      return NextResponse.json({ 
        message: 'Truecaller userinfo failed', 
        details: userJson,
        status: userRes.status
      }, { status: 502, headers: corsHeaders })
    }

    const phoneRaw = (userJson?.phone_number || userJson?.phoneNumber || userJson?.phone || '').toString()
    const phone = phoneRaw.replace(/^\+91\s*/i, '').replace(/\s+/g, '')
    if (!/^[0-9]{10}$/.test(phone)) {
      return NextResponse.json({ message: 'Invalid phone in Truecaller profile', details: { phone: phoneRaw } }, { status: 422, headers: corsHeaders })
    }

    const user = {
      phone,
      name: (userJson?.name || userJson?.given_name || '').toString() || undefined,
      tcScopes: userJson?.scopes || undefined,
    }
    return NextResponse.json({ success: true, data: user }, { headers: corsHeaders })
  } catch (e: any) {
    console.error('Truecaller login unhandled error:', {
      error: e?.message || String(e),
      stack: e?.stack,
      body: await req.text().catch(() => 'Unable to read body')
    })
    return NextResponse.json({ 
      message: 'Truecaller login error', 
      error: e?.message || String(e),
      stack: e?.stack
    }, { status: 500, headers: corsHeaders })
  }
}
