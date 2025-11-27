import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { smsService } from '@/lib/sms-service'

export const runtime = 'nodejs'

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

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()
    
    // Validate phone number
    if (!phone || phone.length < 10) {
      return NextResponse.json({ error: 'Invalid phone number' }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      })
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    const client = await clientPromise
    const db = client.db('yarri')
    
    // Send OTP via SMS
    const smsResult = await smsService.sendOTP(phone, otp)

    // Store OTP and tracking info in database
    await db.collection('otps').updateOne(
      { phone },
      { 
        $set: { 
          otp, 
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          provider: 'gupshup',
          messageId: smsResult.messageId || null,
        } 
      },
      { upsert: true }
    )
    
    console.log('\n🔐 OTP REQUEST')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📱 Phone: ${phone}`)
    console.log(`🔢 OTP: ${otp}`)
    console.log(`⏰ Valid for: 5 minutes`)
    console.log(`📤 SMS Status: ${smsResult.success ? 'SENT' : 'FAILED'}`)
    if (smsResult.messageId) {
      console.log(`🆔 Gupshup Message ID: ${smsResult.messageId}`)
    }
    if (!smsResult.success) {
      console.log(`❌ SMS Error: ${smsResult.error}`)
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    if (smsResult.success) {
      return NextResponse.json({ success: true, message: 'OTP sent successfully', messageId: smsResult.messageId || undefined }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    } else {
      // Even if SMS fails, we still return success to avoid revealing system details
      // But log the error for debugging
      console.error('SMS sending failed:', smsResult.error)
      return NextResponse.json({ success: true, message: 'OTP sent', error: smsResult.error, messageId: smsResult.messageId || undefined }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    }
  } catch (error) {
    console.error('Send OTP Error:', error)
    return NextResponse.json({ error: 'Failed to send OTP' }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}
