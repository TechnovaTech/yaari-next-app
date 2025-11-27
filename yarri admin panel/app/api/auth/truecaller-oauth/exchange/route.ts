import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

const TOKEN_URL = process.env.TRUECALLER_TOKEN_URL || 'https://oauth-account-noneu.truecaller.com/v1/token'
const USERINFO_URL = process.env.TRUECALLER_USERINFO_URL || 'https://oauth-account-noneu.truecaller.com/v1/userinfo'
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
        redirect_uri: 'tc://login',
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

    const rawPhone = (userJson?.phone_number || userJson?.phoneNumber || userJson?.phone || '').toString()
    const normalizePhone = (p: string) => {
      let s = String(p || '').replace(/[\s\-\(\)]/g, '')
      if (!s) return ''
      if (s.startsWith('+')) return s
      if (s.startsWith('00')) s = s.slice(2)
      s = s.replace(/^0+/, '')
      if (/^91\d{10}$/.test(s)) return `+${s}`
      if (/^\d{10}$/.test(s)) return `+91${s}`
      if (/^\d+$/.test(s)) return `+${s}`
      return s
    }
    const phone = normalizePhone(rawPhone)

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (!phone) {
      return NextResponse.json({ message: 'Missing phone in Truecaller profile', details: userJson }, { status: 422, headers: corsHeaders })
    }

    const client = await clientPromise
    const db = client.db('yarri')

    let user = await db.collection('users').findOne({ phone })

    if (!user) {
      const bonusDoc = await db.collection('settings').findOne({ key: 'signup_bonus' })
      const signupBonus = Number((bonusDoc as any)?.amount || 0)
      const initialBalance = Number.isFinite(signupBonus) ? Math.max(0, Math.floor(signupBonus)) : 0

      const name = (userJson?.given_name || userJson?.name || '').toString() || undefined
      const email = (userJson?.email || '').toString() || undefined
      const profilePic = (userJson?.picture || userJson?.avatarUrl || '').toString() || undefined

      const result = await db.collection('users').insertOne({
        phone,
        name,
        email,
        profilePic,
        createdAt: new Date(),
        isActive: true,
        balance: initialBalance,
        loginMethod: 'truecaller',
      })
      user = { _id: result.insertedId, phone, name, email, profilePic, balance: initialBalance, isActive: true, createdAt: new Date() }
    } else {
      const name = (userJson?.given_name || userJson?.name || user?.name || '').toString() || undefined
      const email = (userJson?.email || user?.email || '').toString() || undefined
      const profilePic = (userJson?.picture || userJson?.avatarUrl || user?.profilePic || '').toString() || undefined
      await db.collection('users').updateOne(
        { _id: new ObjectId(user._id) },
        { $set: { name, email, profilePic, lastLogin: new Date(), loginMethod: 'truecaller' } }
      )
      user = { ...user, name, email, profilePic }
    }

    const responseUser = {
      id: user._id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      gender: user.gender,
      about: user.about,
      hobbies: user.hobbies,
      profilePic: user.profilePic,
      gallery: user.gallery,
      balance: user.balance || 0,
    }

    return NextResponse.json({ success: true, user: responseUser }, { headers: corsHeaders })
  } catch (e: any) {
    return NextResponse.json({ message: 'Exchange error', error: e?.message || String(e) }, { status: 500 })
  }
}
