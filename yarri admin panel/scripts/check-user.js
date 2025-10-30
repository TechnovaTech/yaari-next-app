const { MongoClient } = require('mongodb')

async function checkUser() {
  const client = new MongoClient('mongodb://72.60.218.7:27017/yarri')
  
  try {
    await client.connect()
    const db = client.db('yarri')
    
    const users = await db.collection('users').find({}).toArray()
    
    console.log('\n📊 Users in database:', users.length)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    users.forEach((user, i) => {
      console.log(`User ${i + 1}:`)
      console.log(`  ID: ${user._id}`)
      console.log(`  Phone: ${user.phone}`)
      console.log(`  Name: ${user.name || 'Not set'}`)
      console.log(`  Gender: ${user.gender || 'Not set'}`)
      console.log(`  About: ${user.about ? user.about.substring(0, 50) + '...' : 'Not set'}`)
      console.log(`  Hobbies: ${user.hobbies ? user.hobbies.join(', ') : 'Not set'}`)
      console.log(`  Profile Pic: ${user.profilePic ? 'Yes' : 'No'}`)
      console.log(`  Gallery: ${user.gallery ? user.gallery.length + ' images' : 'No images'}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.close()
  }
}

checkUser()
