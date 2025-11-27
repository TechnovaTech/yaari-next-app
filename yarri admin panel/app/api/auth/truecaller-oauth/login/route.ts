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

    // Exchange authorization code
    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authorizationCode,
        code_verifier: codeVerifier,
        client_id: clientId,
      }),
    })
    const tokenJson = await tokenRes.json().catch(() => ({}))
    if (!tokenRes.ok || !tokenJson?.access_token) {
      return NextResponse.json({ message: 'Truecaller token exchange failed', details: tokenJson }, { status: 502, headers: corsHeaders })
    }

    // Fetch user info
    const userRes = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${tokenJson.access_token}` } })
    const userJson = await userRes.json().catch(() => ({}))
    if (!userRes.ok) {
      return NextResponse.json({ message: 'Truecaller userinfo failed', details: userJson }, { status: 502, headers: corsHeaders })
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
    return NextResponse.json({ message: 'Truecaller login error', error: e?.message || String(e) }, { status: 500, headers: corsHeaders })
  }
}
