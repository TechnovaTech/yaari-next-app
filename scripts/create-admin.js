const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')

async function createAdmin() {
  const client = new MongoClient('mongodb://72.60.218.7:27017/yarri')
  
  try {
    await client.connect()
    const db = client.db('yarri')
    
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    // Delete existing admin if any
    await db.collection('admins').deleteMany({})
    
    await db.collection('admins').insertOne({
      email: 'admin@gmail.com',
      password: hashedPassword,
      name: 'Admin',
      role: 'admin',
      createdAt: new Date(),
    })
    
    console.log('✅ Admin created successfully!')
    console.log('Email: admin@gmail.com')
    console.log('Password: admin123')
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.close()
  }
}

createAdmin()
