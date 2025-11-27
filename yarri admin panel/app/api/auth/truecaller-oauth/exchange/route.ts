import { NextResponse } from 'next/server'

const TOKEN_URL = process.env.TRUECALLER_TOKEN_URL || 'https://auth-idp-noneu.truecaller.com/v1/token'
const USERINFO_URL = process.env.TRUECALLER_USERINFO_URL || 'https://auth-noneu.truecaller.com/v1/userinfo'
const CLIENT_ID = process.env.TRUECALLER_CLIENT_ID || ''

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const authorizationCode: string | undefined = body?.authorizationCode
    const codeVerifier: string | undefined = body?.codeVerifier

    if (!authorizationCode || !codeVerifier) {
      return NextResponse.json({ message: 'authorizationCode and codeVerifier are required' }, { status: 400 })
    }
    if (!CLIENT_ID) {
      return NextResponse.json({ message: 'Server missing TRUECALLER_CLIENT_ID' }, { status: 500 })
    }

    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authorizationCode,
        code_verifier: codeVerifier,
        client_id: CLIENT_ID,
      }),
    })

    const tokenJson = await tokenRes.json().catch(() => ({}))
    if (!tokenRes.ok || !tokenJson?.access_token) {
      return NextResponse.json({ message: 'Truecaller token exchange failed', details: tokenJson }, { status: 502 })
    }

    const userRes = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    })
    const userJson = await userRes.json().catch(() => ({}))
    if (!userRes.ok) {
      return NextResponse.json({ message: 'Truecaller userinfo failed', details: userJson }, { status: 502 })
    }

    const phone = (userJson?.phone_number || userJson?.phoneNumber || userJson?.phone || '').toString()
    return NextResponse.json({ phone, raw: userJson })
  } catch (e: any) {
    return NextResponse.json({ message: 'Exchange error', error: e?.message || String(e) }, { status: 500 })
  }
}
