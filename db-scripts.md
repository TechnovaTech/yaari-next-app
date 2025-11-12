# MongoDB Database Scripts - Yaari Dating App

## Database Connection
```javascript
use yarri
```

## 1. Create Users Collection
```javascript
db.createCollection("users")
db.users.createIndex({ "phone": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { sparse: true })
```

## 2. Create Plans Collection
```javascript
db.createCollection("plans")
db.plans.createIndex({ "isActive": 1 })
```

## 3. Create Call History Collection
```javascript
db.createCollection("callHistory")
db.callHistory.createIndex({ "callerId": 1 })
db.callHistory.createIndex({ "receiverId": 1 })
db.callHistory.createIndex({ "createdAt": -1 })
```

## 4. Create Transactions Collection
```javascript
db.createCollection("transactions")
db.transactions.createIndex({ "userId": 1 })
db.transactions.createIndex({ "orderId": 1 })
db.transactions.createIndex({ "createdAt": -1 })
```

## 5. Create Settings Collection
```javascript
db.createCollection("settings")
db.settings.createIndex({ "type": 1 }, { unique: true })
```

## 6. Create Ads Collection
```javascript
db.createCollection("ads")
db.ads.createIndex({ "isActive": 1 })
```

## 7. Create Admins Collection
```javascript
db.createCollection("admins")
db.admins.createIndex({ "email": 1 }, { unique: true })
```

## Insert Default Settings
```javascript
db.settings.insertOne({
  type: "app",
  appName: "Yaari",
  audioCallRate: 10,
  videoCallRate: 20,
  minRecharge: 100,
  maxRecharge: 10000,
  commission: 20,
  coinsPerRupee: 1,
  signupBonus: 0,
  updatedAt: new Date()
})
```

## Insert Sample Plans
```javascript
db.plans.insertMany([
  {
    title: "Starter Pack",
    coins: 100,
    price: 99,
    originalPrice: 149,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Popular Pack",
    coins: 500,
    price: 449,
    originalPrice: 699,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Premium Pack",
    coins: 1000,
    price: 799,
    originalPrice: 1299,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
])
```

## Complete Setup Script
```javascript
// Run this entire script to set up the database
use yarri

// Collections
db.createCollection("users")
db.createCollection("plans")
db.createCollection("callHistory")
db.createCollection("transactions")
db.createCollection("settings")
db.createCollection("ads")
db.createCollection("admins")

// Indexes
db.users.createIndex({ "phone": 1 }, { unique: true })
db.plans.createIndex({ "isActive": 1 })
db.callHistory.createIndex({ "callerId": 1 })
db.callHistory.createIndex({ "receiverId": 1 })
db.callHistory.createIndex({ "createdAt": -1 })
db.transactions.createIndex({ "userId": 1 })
db.transactions.createIndex({ "orderId": 1 })
db.transactions.createIndex({ "createdAt": -1 })
db.settings.createIndex({ "type": 1 }, { unique: true })
db.ads.createIndex({ "isActive": 1 })
db.admins.createIndex({ "email": 1 }, { unique: true })

// Default Data
db.settings.insertOne({
  type: "app",
  appName: "Yaari",
  audioCallRate: 10,
  videoCallRate: 20,
  minRecharge: 100,
  maxRecharge: 10000,
  commission: 20,
  coinsPerRupee: 1,
  signupBonus: 0,
  updatedAt: new Date()
})

db.plans.insertMany([
  { title: "Starter Pack", coins: 100, price: 99, originalPrice: 149, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { title: "Popular Pack", coins: 500, price: 449, originalPrice: 699, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { title: "Premium Pack", coins: 1000, price: 799, originalPrice: 1299, isActive: true, createdAt: new Date(), updatedAt: new Date() }
])

print("Database setup completed successfully!")
```
