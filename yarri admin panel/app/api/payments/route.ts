import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('yarri')

    const payments = await db.collection('payments').aggregate([
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'users',
          let: { uid: '$userId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    '$_id',
                    {
                      $cond: [
                        { $eq: [{ $type: '$$uid' }, 'objectId'] },
                        '$$uid',
                        { $toObjectId: '$$uid' }
                      ]
                    }
                  ]
                }
              }
            },
            { $project: { email: 1, name: 1, phone: 1 } },
          ],
          as: 'userInfo'
        }
      },
      {
        $addFields: {
          userEmail: { $ifNull: [{ $arrayElemAt: ['$userInfo.email', 0] }, null] },
          userName: { $ifNull: [{ $arrayElemAt: ['$userInfo.name', 0] }, null] },
          userPhone: { $ifNull: [{ $arrayElemAt: ['$userInfo.phone', 0] }, null] },
          transactionId: { $ifNull: ['$paymentId', { $ifNull: ['$orderId', null] }] },
        }
      },
      { $project: { userInfo: 0 } },
    ]).toArray()

    return NextResponse.json(payments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}
