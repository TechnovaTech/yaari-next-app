const { MongoClient } = require('mongodb');

async function debugGoogleLogin() {
  try {
    console.log('🔍 Starting Google login debug...');
    
    // Test MongoDB connection
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yarri';
    console.log('📡 Connecting to MongoDB:', uri);
    
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('yarri');
    
    // Check signup bonus setting
    console.log('🎁 Checking signup bonus setting...');
    const bonusDoc = await db.collection('settings').findOne({ key: 'signup_bonus' });
    console.log('Bonus document:', bonusDoc);
    
    const signupBonus = Number((bonusDoc)?.amount || 0);
    const initialBalance = Number.isFinite(signupBonus) ? Math.max(0, Math.floor(signupBonus)) : 0;
    console.log('Calculated initial balance:', initialBalance);
    
    // Test user creation
    const testUser = {
      email: 'debug@example.com',
      name: 'Debug User',
      googleId: 'debug123',
      profilePic: 'https://example.com/pic.jpg',
      createdAt: new Date(),
      isActive: true,
      balance: initialBalance,
      loginMethod: 'google',
    };
    
    console.log('👤 Creating test user:', testUser);
    
    // Check if user exists first
    const existingUser = await db.collection('users').findOne({ email: testUser.email });
    if (existingUser) {
      console.log('🗑️ Deleting existing test user...');
      await db.collection('users').deleteOne({ email: testUser.email });
    }
    
    const result = await db.collection('users').insertOne(testUser);
    console.log('✅ User created with ID:', result.insertedId);
    
    // Verify user was created
    const createdUser = await db.collection('users').findOne({ email: testUser.email });
    console.log('🔍 Verified user in database:', createdUser);
    
    await client.close();
    console.log('✅ Debug completed successfully');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugGoogleLogin();