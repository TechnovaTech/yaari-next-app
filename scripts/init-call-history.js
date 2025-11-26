const { MongoClient } = require('mongodb')

const uri = process.env.MONGODB_URI || 'mongodb://Yarridb:Yaari%402%4025@52.66.231.233:27017/yaari?authSource=admin'

async function initCallHistory() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')
    
    const db = client.db('yaari')
    
    // Create callHistory collection if it doesn't exist
    const collections = await db.listCollections({ name: 'callHistory' }).toArray()
    if (collections.length === 0) {
      await db.createCollection('callHistory')
      console.log('✅ Created callHistory collection')
    } else {
      console.log('✅ callHistory collection already exists')
    }
    
    // Create activeCalls collection if it doesn't exist
    const activeCallsCollections = await db.listCollections({ name: 'activeCalls' }).toArray()
    if (activeCallsCollections.length === 0) {
      await db.createCollection('activeCalls')
      console.log('✅ Created activeCalls collection')
    } else {
      console.log('✅ activeCalls collection already exists')
    }
    
    // Create indexes for better query performance
    await db.collection('callHistory').createIndex({ callerId: 1, createdAt: -1 })
    await db.collection('callHistory').createIndex({ receiverId: 1, createdAt: -1 })
    await db.collection('callHistory').createIndex({ createdAt: -1 })
    console.log('✅ Created indexes on callHistory')
    
    await db.collection('activeCalls').createIndex({ callerId: 1, receiverId: 1 })
    await db.collection('activeCalls').createIndex({ status: 1 })
    console.log('✅ Created indexes on activeCalls')
    
    // Test insert and retrieve
    const testCall = {
      callerId: 'test-user-1',
      receiverId: 'test-user-2',
      callType: 'video',
      duration: 120,
      status: 'completed',
      cost: 10,
      startTime: new Date(),
      endTime: new Date(),
      createdAt: new Date()
    }
    
    const result = await db.collection('callHistory').insertOne(testCall)
    console.log('✅ Test call inserted with ID:', result.insertedId)
    
    const retrieved = await db.collection('callHistory').findOne({ _id: result.insertedId })
    console.log('✅ Test call retrieved:', retrieved ? 'SUCCESS' : 'FAILED')
    
    // Clean up test data
    await db.collection('callHistory').deleteOne({ _id: result.insertedId })
    console.log('✅ Test call cleaned up')
    
    console.log('\n✅ Call history database initialization complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

initCallHistory()
