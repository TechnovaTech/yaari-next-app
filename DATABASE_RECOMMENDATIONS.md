# Database Architecture Recommendations

## Critical Issues & Recommendations

### 1. Users Table - User ID Field

**Issue:** No explicit `userId` field visible in Users table

**Recommendation:**
```sql
ALTER TABLE users ADD COLUMN userId VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID());
CREATE INDEX idx_users_userId ON users(userId);

-- Or if using auto-increment:
-- The primary key `id` should be used as userId
-- Ensure all foreign keys reference users.id
```

**Impact:** 
- Foreign key mapping with Transactions, Calls, Wallet tables
- All tables should reference `users.id` or `users.userId`

---

### 2. Admins Table - Admin ID

**Issue:** Missing `adminId` field for tracking admin activity

**Recommendation:**
```sql
ALTER TABLE admins ADD COLUMN adminId VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID());
CREATE INDEX idx_admins_adminId ON admins(adminId);

-- Create admin activity log table
CREATE TABLE admin_activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  adminId VARCHAR(36) NOT NULL,
  action VARCHAR(100) NOT NULL,
  targetUserId VARCHAR(36),
  details JSON,
  ipAddress VARCHAR(45),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (adminId) REFERENCES admins(adminId),
  INDEX idx_adminId (adminId),
  INDEX idx_createdAt (createdAt)
);
```

---

### 3. User ID Indexing Across All Tables

**Issue:** Not all tables have indexed `userId` field

**Recommendation:**
```sql
-- Add userId and create indexes on all relevant tables
ALTER TABLE transactions ADD INDEX idx_userId (userId);
ALTER TABLE calls ADD INDEX idx_userId (userId);
ALTER TABLE user_profiles ADD INDEX idx_userId (userId);
ALTER TABLE user_wallets ADD INDEX idx_userId (userId);
ALTER TABLE notifications ADD INDEX idx_userId (userId);
ALTER TABLE call_history ADD INDEX idx_userId (userId);

-- Composite indexes for common queries
CREATE INDEX idx_userId_createdAt ON transactions(userId, createdAt);
CREATE INDEX idx_userId_status ON calls(userId, status);
```

---

### 4. Profile Data Storage

**Issue:** Profile data (picture, bio, age, interests) storage location unclear

**Recommendation:** Create separate `user_profiles` table

```sql
CREATE TABLE user_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId VARCHAR(36) UNIQUE NOT NULL,
  profilePicture VARCHAR(500),
  bio TEXT,
  age INT,
  dateOfBirth DATE,
  interests JSON,
  hobbies JSON,
  occupation VARCHAR(100),
  education VARCHAR(100),
  location VARCHAR(200),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  height INT,
  relationshipStatus VARCHAR(50),
  lookingFor VARCHAR(50),
  gallery JSON, -- Array of image URLs
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  INDEX idx_userId (userId),
  INDEX idx_age (age),
  INDEX idx_location (latitude, longitude)
);
```

**Benefits:**
- Cleaner separation of concerns
- Better query performance
- Easier to add profile-specific features
- Reduces users table bloat

---

### 5. User Wallet & Balance Tracking

**Issue:** Balance tracking mechanism unclear

**Recommendation:** Create dedicated wallet system

```sql
-- Main wallet table
CREATE TABLE user_wallets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId VARCHAR(36) UNIQUE NOT NULL,
  balance INT DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'INR',
  lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  INDEX idx_userId (userId)
);

-- Wallet ledger for all balance changes
CREATE TABLE wallet_ledger (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId VARCHAR(36) NOT NULL,
  transactionType ENUM('credit', 'debit') NOT NULL,
  amount INT NOT NULL,
  balanceBefore INT NOT NULL,
  balanceAfter INT NOT NULL,
  reason VARCHAR(100) NOT NULL, -- 'recharge', 'call_charge', 'refund', etc.
  referenceId VARCHAR(100), -- Transaction ID, Call ID, etc.
  referenceType VARCHAR(50), -- 'transaction', 'call', 'refund'
  metadata JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  INDEX idx_userId (userId),
  INDEX idx_createdAt (createdAt),
  INDEX idx_referenceId (referenceId)
);
```

---

### 6. Transactions vs Ledger

**Issue:** Unclear if all credit activities are logged

**Recommendation:** Implement dual-table system

```sql
-- Transactions table (for payments/recharges only)
CREATE TABLE transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transactionId VARCHAR(100) UNIQUE NOT NULL,
  userId VARCHAR(36) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  paymentGateway VARCHAR(50), -- 'razorpay', 'paytm', etc.
  paymentStatus ENUM('pending', 'success', 'failed', 'refunded') NOT NULL,
  orderId VARCHAR(100),
  packId VARCHAR(50),
  coinsAdded INT,
  metadata JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  INDEX idx_userId (userId),
  INDEX idx_transactionId (transactionId),
  INDEX idx_paymentStatus (paymentStatus),
  INDEX idx_createdAt (createdAt)
);

-- Call charges ledger (for per-minute deductions)
CREATE TABLE call_charges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  callId VARCHAR(100) NOT NULL,
  userId VARCHAR(36) NOT NULL,
  chargeType ENUM('per_minute', 'connection_fee', 'bonus') NOT NULL,
  amount INT NOT NULL,
  minutes DECIMAL(5, 2),
  ratePerMinute INT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (callId) REFERENCES calls(callId),
  INDEX idx_callId (callId),
  INDEX idx_userId (userId),
  INDEX idx_timestamp (timestamp)
);
```

---

## Implementation Priority

### High Priority (Immediate):
1. ✅ Add `userId` indexing to all tables
2. ✅ Create `user_wallets` table
3. ✅ Create `wallet_ledger` table
4. ✅ Add `adminId` to admins table

### Medium Priority (Within 1 week):
1. ✅ Create `user_profiles` table
2. ✅ Migrate profile data from users table
3. ✅ Create `call_charges` table
4. ✅ Create `admin_activity_logs` table

### Low Priority (Within 1 month):
1. ✅ Add composite indexes for common queries
2. ✅ Implement data archival strategy
3. ✅ Add database triggers for balance validation

---

## Sample Queries After Implementation

```sql
-- Get user balance
SELECT balance FROM user_wallets WHERE userId = ?;

-- Get user's transaction history
SELECT * FROM wallet_ledger 
WHERE userId = ? 
ORDER BY createdAt DESC 
LIMIT 50;

-- Get call charges for a specific call
SELECT SUM(amount) as totalCharge 
FROM call_charges 
WHERE callId = ?;

-- Track admin activity
SELECT * FROM admin_activity_logs 
WHERE adminId = ? 
ORDER BY createdAt DESC;

-- Get user profile with wallet
SELECT u.*, p.*, w.balance 
FROM users u
LEFT JOIN user_profiles p ON u.id = p.userId
LEFT JOIN user_wallets w ON u.id = w.userId
WHERE u.id = ?;
```

---

## Notes for Backend Team

1. **Data Migration:** Create migration scripts to move existing data to new tables
2. **API Updates:** Update all API endpoints to use new table structure
3. **Transactions:** Use database transactions for wallet operations to prevent race conditions
4. **Validation:** Add triggers to validate balance never goes negative
5. **Audit Trail:** Ensure all balance changes are logged in wallet_ledger
6. **Performance:** Monitor query performance and add indexes as needed
7. **Backup:** Take full database backup before implementing changes

---

## Flutter App Impact

The Flutter app already handles these fields correctly:
- Uses `id` or `_id` as userId
- Expects balance in user object or separate wallet endpoint
- Logs transactions with proper metadata
- Ready for enhanced profile data structure

No Flutter code changes needed if backend maintains API compatibility.
