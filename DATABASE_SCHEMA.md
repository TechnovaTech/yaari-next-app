# Database Schema - Yaari Dating App

**Database Name:** `yarri`  
**Database Type:** MongoDB  
**Connection URI:** `mongodb://72.60.218.7:27017/yarri`

---

## Collections

### 1. users
User profiles and account information.

```javascript
{
  _id: ObjectId | String,           // Unique user identifier
  name: String,                      // User's display name
  phone: String,                     // Phone number (used for login)
  email: String,                     // Email address (optional)
  gender: String,                    // "male" | "female" | "other"
  balance: Number,                   // Current coin balance (default: 0)
  isActive: Boolean,                 // Account status (default: true)
  profilePic: String,                // Profile picture URL
  about: String,                     // User bio/description
  hobbies: Array<String>,            // List of hobbies
  gallery: Array<String>,            // Array of image URLs
  callAccess: String,                // "full" | "restricted" | "blocked" (default: "full")
  createdAt: Date,                   // Account creation timestamp
  updatedAt: Date                    // Last update timestamp
}
```

**Indexes:**
- `_id` (primary)
- `phone` (unique)

---

### 2. plans
Coin purchase plans/packages.

```javascript
{
  _id: ObjectId,                     // Unique plan identifier
  title: String,                     // Plan name/title
  coins: Number,                     // Number of coins in package
  price: Number,                     // Current price in rupees
  originalPrice: Number,             // Original price (for discount display)
  isActive: Boolean,                 // Plan availability (default: true)
  createdAt: Date,                   // Plan creation timestamp
  updatedAt: Date                    // Last update timestamp
}
```

**Indexes:**
- `_id` (primary)
- `isActive`

---

### 3. callHistory
Record of all audio/video calls.

```javascript
{
  _id: ObjectId,                     // Unique call record identifier
  callerId: String | ObjectId,       // User who initiated the call
  receiverId: String | ObjectId,     // User who received the call
  callType: String,                  // "audio" | "video" (default: "audio")
  duration: Number,                  // Call duration in seconds (default: 0)
  status: String,                    // "completed" | "missed" | "rejected" | "cancelled"
  cost: Number,                      // Total coins deducted (default: 0)
  startTime: Date,                   // Call start timestamp
  endTime: Date,                     // Call end timestamp
  createdAt: Date                    // Record creation timestamp
}
```

**Indexes:**
- `_id` (primary)
- `callerId`
- `receiverId`
- `createdAt`

---

### 4. transactions
Payment and coin transaction history.

```javascript
{
  _id: ObjectId,                     // Unique transaction identifier
  userId: String | ObjectId,         // User who made the transaction
  type: String,                      // "purchase" | "deduction" | "bonus" | "refund"
  coins: Number,                     // Number of coins involved
  amountInRupees: Number,            // Amount in rupees (for purchases)
  planId: ObjectId,                  // Reference to plan (if applicable)
  orderId: String,                   // Payment gateway order ID
  paymentId: String,                 // Payment gateway payment ID
  status: String,                    // "pending" | "completed" | "failed"
  description: String,               // Transaction description
  createdAt: Date                    // Transaction timestamp
}
```

**Indexes:**
- `_id` (primary)
- `userId`
- `orderId`
- `createdAt`

---

### 5. settings
Application-wide configuration settings.

```javascript
{
  _id: ObjectId,                     // Unique settings identifier
  type: String,                      // "app" (settings type)
  appName: String,                   // Application name (default: "Yaari")
  audioCallRate: Number,             // Coins per minute for audio calls (default: 10)
  videoCallRate: Number,             // Coins per minute for video calls (default: 20)
  minRecharge: Number,               // Minimum recharge amount (default: 100)
  maxRecharge: Number,               // Maximum recharge amount (default: 10000)
  commission: Number,                // Platform commission percentage (default: 20)
  coinsPerRupee: Number,             // Coin conversion rate (default: 1)
  signupBonus: Number,               // Bonus coins for new users (default: 0)
  updatedAt: Date                    // Last update timestamp
}
```

**Indexes:**
- `_id` (primary)
- `type` (unique)

---

### 6. ads
Advertisement banners and promotional content.

```javascript
{
  _id: ObjectId,                     // Unique ad identifier
  title: String,                     // Ad title
  description: String,               // Ad description (optional)
  mediaType: String,                 // "photo" | "video"
  imageUrl: String,                  // Image URL (for photo ads)
  videoUrl: String,                  // Video URL (for video ads)
  linkUrl: String,                   // Click-through URL (optional)
  isActive: Boolean,                 // Ad visibility status (default: true)
  createdAt: Date,                   // Ad creation timestamp
  updatedAt: Date                    // Last update timestamp
}
```

**Indexes:**
- `_id` (primary)
- `isActive`

---

### 7. admins
Admin user accounts for the admin panel.

```javascript
{
  _id: ObjectId,                     // Unique admin identifier
  email: String,                     // Admin email (for login)
  password: String,                  // Hashed password
  name: String,                      // Admin name
  role: String,                      // "super_admin" | "admin" | "moderator"
  isActive: Boolean,                 // Account status (default: true)
  createdAt: Date,                   // Account creation timestamp
  lastLogin: Date                    // Last login timestamp
}
```

**Indexes:**
- `_id` (primary)
- `email` (unique)

---

## Relationships

```
users (1) ----< (N) transactions
users (1) ----< (N) callHistory (as caller)
users (1) ----< (N) callHistory (as receiver)
plans (1) ----< (N) transactions
```

---

## Common Queries

### Get user with balance
```javascript
db.users.findOne({ _id: userId })
```

### Get user's call history
```javascript
db.callHistory.find({
  $or: [
    { callerId: userId },
    { receiverId: userId }
  ]
}).sort({ createdAt: -1 })
```

### Get user's transactions
```javascript
db.transactions.find({ userId: userId }).sort({ createdAt: -1 })
```

### Get active plans
```javascript
db.plans.find({ isActive: true }).sort({ price: 1 })
```

### Get active ads
```javascript
db.ads.find({ isActive: true }).sort({ createdAt: -1 })
```

### Update user balance
```javascript
db.users.updateOne(
  { _id: userId },
  { $inc: { balance: amount } }
)
```

---

## Initialization Scripts

Located in: `/yarri admin panel/scripts/`

- `create-admin.js` - Create admin user
- `init-call-history.js` - Initialize call history collection
- `check-user.js` - Check user data
- `test-call-history.js` - Test call history functionality
