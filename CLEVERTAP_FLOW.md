# CleverTap Data Flow Diagram

## 📊 How Data Flows to CleverTap

```
┌─────────────────────────────────────────────────────────────────┐
│                         YAARI APP                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERACTIONS                             │
├─────────────────────────────────────────────────────────────────┤
│  • App Open                                                      │
│  • User Login (OTP/Google)                                       │
│  • View Profile                                                  │
│  • Initiate Call                                                 │
│  • End Call                                                      │
│  • Purchase Coins                                                │
│  • Update Profile                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   TRACKING FUNCTIONS                             │
├─────────────────────────────────────────────────────────────────┤
│  utils/clevertap.ts:                                             │
│    • trackUserLogin()                                            │
│    • trackEvent()                                                │
│    • updateUserProfile()                                         │
│    • trackScreenView()                                           │
│                                                                  │
│  utils/userTracking.ts:                                          │
│    • syncUserToCleverTap()                                       │
│    • trackCallEvent()                                            │
│    • trackCoinPurchase()                                         │
│    • trackProfileUpdate()                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLEVERTAP SDK                                  │
├─────────────────────────────────────────────────────────────────┤
│  Native (Android):                                               │
│    • @awesome-cordova-plugins/clevertap                          │
│    • clevertap-cordova                                           │
│                                                                  │
│  Web:                                                            │
│    • CleverTap Web SDK                                           │
│    • https://static.clevertap.com/js/clevertap.min.js           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLEVERTAP SERVERS                              │
├─────────────────────────────────────────────────────────────────┤
│  Region: EU1                                                     │
│  Account ID: 775-RZ7-W67Z                                        │
│  Processing Time: 2-3 minutes                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLEVERTAP DASHBOARD                            │
├─────────────────────────────────────────────────────────────────┤
│  https://eu1.dashboard.clevertap.com/                            │
│                                                                  │
│  • Segments → All Users                                          │
│  • Analytics → Events                                            │
│  • Segments → Create Segment                                     │
│  • Campaigns                                                     │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 User Login Flow

```
User Opens App
      │
      ▼
CleverTapInit.tsx
      │
      ├─→ Check localStorage for user
      │
      ├─→ If user exists:
      │     │
      │     ├─→ Extract user data
      │     │
      │     ├─→ Call trackUserLogin()
      │     │     │
      │     │     ├─→ Set Identity
      │     │     ├─→ Set Profile Properties
      │     │     ├─→ Set MSG flags
      │     │     └─→ Send to CleverTap
      │     │
      │     └─→ Call updateUserProfile()
      │           └─→ Update all properties
      │
      └─→ If no user:
            └─→ Wait for login
```

## 📱 Login Flow (OTP)

```
User Enters Phone
      │
      ▼
LoginScreen.tsx
      │
      ├─→ Request OTP
      │
      ├─→ Track "OTP Requested" event
      │
      ▼
OTPScreen.tsx
      │
      ├─→ User enters OTP
      │
      ├─→ Verify OTP
      │
      ├─→ Get user data from backend
      │
      ├─→ Save to localStorage
      │
      ├─→ Call trackUserLogin()
      │     │
      │     ├─→ Identity: user.id
      │     ├─→ Name, Email, Phone
      │     ├─→ Gender, Age, City
      │     ├─→ Coins Balance
      │     ├─→ User Type
      │     └─→ Send to CleverTap
      │
      └─→ Track "OtpVerified" event
```

## 🎯 Event Tracking Flow

```
User Views Profile
      │
      ▼
UserListScreen.tsx
      │
      ├─→ onClick handler
      │
      ├─→ Call trackEvent()
      │     │
      │     ├─→ Event: "Profile Viewed"
      │     ├─→ Data: {
      │     │     "Viewed User ID": "...",
      │     │     "Source": "User List",
      │     │     "User Name": "...",
      │     │     "User Status": "online",
      │     │     "timestamp": "...",
      │     │     "platform": "mobile"
      │     │   }
      │     │
      │     └─→ Send to CleverTap
      │
      └─→ Navigate to profile
```

## 📞 Call Tracking Flow

```
User Initiates Call
      │
      ▼
UserListScreen.tsx
      │
      ├─→ handleCallClick()
      │
      ├─→ Track "Call Initiated" event
      │     │
      │     └─→ Data: {
      │           "Call Type": "audio/video",
      │           "Receiver ID": "...",
      │           "Rate": 5,
      │           "Source": "User List"
      │         }
      │
      ▼
AudioCallScreen.tsx
      │
      ├─→ Call connects
      │
      ├─→ Track "Call Accepted" event
      │
      ├─→ Call duration increases
      │
      ├─→ Coins deducted
      │
      ├─→ User ends call
      │
      ├─→ Track "Call Ended" event
      │     │
      │     └─→ Data: {
      │           "Call Type": "audio",
      │           "Duration": 120,
      │           "Cost": 10,
      │           "Ended By": "User",
      │           "Receiver": "...",
      │           "Receiver ID": "..."
      │         }
      │
      └─→ Call syncUserToCleverTap()
            │
            └─→ Update Coins Balance in profile
```

## 🔄 Profile Sync Flow

```
User Data Changes
      │
      ├─→ Coins deducted
      ├─→ Profile updated
      ├─→ Premium purchased
      │
      ▼
syncUserToCleverTap()
      │
      ├─→ Get user from localStorage
      │
      ├─→ Extract all properties
      │
      ├─→ Call updateUserProfile()
      │     │
      │     ├─→ Identity
      │     ├─→ Name, Email, Phone
      │     ├─→ Gender, Age, City
      │     ├─→ Profile Picture
      │     ├─→ Coins Balance (updated)
      │     ├─→ User Type
      │     ├─→ Last Updated timestamp
      │     │
      │     └─→ Send to CleverTap
      │
      └─→ Profile updated in dashboard
```

## 📊 Data Structure

### User Profile Object
```javascript
{
  Identity: "user_123",              // Required: Unique user ID
  Name: "John Doe",                  // User's name
  Email: "john@example.com",         // User's email
  Phone: "+919876543210",            // E.164 format
  Gender: "male",                    // male/female
  Age: 25,                           // User's age
  City: "Mumbai",                    // User's city
  "Profile Picture": "https://...",  // Profile pic URL
  "Coins Balance": 100,              // Current balance
  "User Type": "Free",               // Free/Premium
  "Account Created": "2024-01-01",   // ISO date
  "MSG-push": true,                  // Push notification flag
  "MSG-email": true,                 // Email notification flag
  "MSG-sms": true                    // SMS notification flag
}
```

### Event Object
```javascript
{
  // Event name: "Profile Viewed", "Call Initiated", etc.
  
  // Event properties:
  "Viewed User ID": "user_456",      // Context-specific data
  "Source": "User List",             // Where event occurred
  "timestamp": "2024-01-01T12:00:00Z", // ISO timestamp
  "platform": "mobile"               // mobile/web
}
```

## ⏱️ Timeline

```
Action                    →  Processing  →  Dashboard
─────────────────────────────────────────────────────
User logs in              →  Instant     →  2-3 min
Event triggered           →  Instant     →  2-3 min
Profile updated           →  Instant     →  2-3 min
Segment created           →  N/A         →  Instant
Campaign sent             →  N/A         →  Instant
```

## 🎯 Key Points

1. **All tracking is non-blocking** - Won't freeze UI
2. **Automatic retries** - If network fails, will retry
3. **Timeout protection** - Won't hang indefinitely
4. **Detailed logging** - Easy to debug
5. **Consistent identity** - Uses user ID, not phone
6. **Complete profiles** - All user data included
7. **Rich events** - Context and metadata included
8. **Real-time sync** - Updates immediately sent

## 🔍 Debugging Flow

```
Issue Reported
      │
      ▼
Check Console Logs
      │
      ├─→ Look for "✅" success messages
      ├─→ Look for "❌" error messages
      ├─→ Look for "⚠️" warning messages
      │
      ▼
Verify Data
      │
      ├─→ Check localStorage has user data
      ├─→ Check sessionStorage for call data
      ├─→ Check CleverTap credentials
      │
      ▼
Test Flow
      │
      ├─→ Open test-clevertap.html
      ├─→ Test individual functions
      ├─→ Check browser console
      │
      ▼
Verify Dashboard
      │
      ├─→ Wait 2-3 minutes
      ├─→ Check Segments → All Users
      ├─→ Check Analytics → Events
      │
      ▼
Issue Resolved ✅
```

---

**This flow ensures all user data and events are properly tracked and sent to CleverTap!** 🚀
