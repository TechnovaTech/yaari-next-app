const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb://72.60.218.7:27017';
const DB_NAME = 'yarri';

async function seedAdmin() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ email: 'admin@gmail.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists!');
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user
    const adminUser = {
      email: 'admin@gmail.com',
      password: hashedPassword,
      name: 'Admin',
      phone: null,
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await usersCollection.insertOne(adminUser);
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@gmail.com');
    console.log('Password: admin123');
    console.log('User ID:', result.insertedId);
    
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

seedAdmin();
