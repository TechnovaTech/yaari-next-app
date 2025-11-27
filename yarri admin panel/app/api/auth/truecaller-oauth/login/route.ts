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
  
  // Server-side Truecaller disabled due to DNS issues
  // App uses client-side token exchange directly
  return NextResponse.json({ 
    message: 'Use client-side Truecaller exchange', 
    error: 'SERVER_SIDE_DISABLED',
    useClientSide: true
  }, { status: 503, headers: corsHeaders })
}
