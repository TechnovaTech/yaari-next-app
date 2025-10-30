import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

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
    const { email, name, googleId, profilePic } = await request.json()
    
    const client = await clientPromise
    const db = client.db('yarri')
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    let user = await db.collection('users').findOne({ email })
    
    if (!user) {
      // Fetch signup bonus setting
      const bonusDoc = await db.collection('settings').findOne({ key: 'signup_bonus' })
      const signupBonus = Number((bonusDoc as any)?.amount || 0)
      const initialBalance = Number.isFinite(signupBonus) ? Math.max(0, Math.floor(signupBonus)) : 0

      const result = await db.collection('users').insertOne({
        email,
        name,
        googleId,
        profilePic,
        createdAt: new Date(),
        isActive: true,
        balance: initialBalance,
        loginMethod: 'google',
      })
      user = { 
        _id: result.insertedId, 
        email, 
        name, 
        googleId, 
        profilePic, 
        balance: initialBalance, 
        isActive: true, 
        createdAt: new Date(),
        loginMethod: 'google',
      }
    } else {
      await db.collection('users').updateOne(
        { email },
        { 
          $set: { 
            name, 
            googleId, 
            profilePic,
            lastLogin: new Date() 
          } 
        }
      )
    }
    
    console.log(`✅ User logged in via Google: ${email}\n`)
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        gender: user.gender,
        about: user.about,
        hobbies: user.hobbies,
        profilePic: user.profilePic,
        gallery: user.gallery,
        balance: user.balance || 0,
        phone: user.phone,
      }
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Google login error:', error)
    return NextResponse.json({ error: 'Failed to login with Google' }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}
