# CleverTap Integration Guide for Yaari App

## Overview
This guide explains the CleverTap integration in the Yaari app and how to verify that data is flowing correctly to your CleverTap dashboard.

## What Was Fixed

### 1. **User Profile Tracking**
- Added comprehensive user profile properties including:
  - Identity (user ID)
  - Name, Email, Phone
  - Gender, Age, City
  - Profile Picture
  - Coins Balance
  - User Type (Premium/Free)
  - Account Created date
- Added messaging flags (MSG-push, MSG-email, MSG-sms) required by CleverTap

### 2. **User Login Tracking**
- Enhanced `trackUserLogin()` to send complete user profile
- Properly set user identity on login (both OTP and Google)
- Added automatic profile sync after login

### 3. **Event Tracking Enhancement**
- All events now include:
  - Timestamp
  - Platform (mobile/web)
  - Relevant user context
- Added specific tracking for:
  - Profile views
  - Call events (initiated, accepted, ended)
  - Coin purchases
  - Profile updates

### 4. **CleverTap Initialization**
- Enhanced CleverTapInit component to:
  - Load existing user data on app start
  - Properly identify users
  - Send complete profile data
  - Add detailed logging for debugging

## Configuration

### Android Configuration
The CleverTap credentials are configured in:

**File: `android/gradle.properties`**
```properties
clevertapAccountId=775-RZ7-W67Z
clevertapToken=a12-5aa
clevertapRegion=eu1
```

**File: `android/app/src/main/AndroidManifest.xml`**
```xml
<meta-data android:name="CLEVERTAP_ACCOUNT_ID" android:value="${CLEVERTAP_ACCOUNT_ID}" />
<meta-data android:name="CLEVERTAP_TOKEN" android:value="${CLEVERTAP_TOKEN}" />
<meta-data android:name="CLEVERTAP_REGION" android:value="${CLEVERTAP_REGION}" />
```

### Web Configuration
**File: `utils/clevertap.ts`**
```typescript
const CLEVERTAP_ACCOUNT_ID = '775-RZ7-W67Z'
const CLEVERTAP_REGION = 'eu1'
```

## How to Verify Data in CleverTap Dashboard

### Step 1: Check User Data
1. Go to CleverTap Dashboard → **Segments** → **All Users**
2. You should see users appearing here after they:
   - Complete OTP verification
   - Login with Google
   - Open the app (if already logged in)

### Step 2: View Individual User Profiles
1. Click on any user in the "All Users" segment
2. You should see:
   - **Identity**: User ID or phone number
   - **Name**: User's name
   - **Email**: User's email (if available)
   - **Phone**: User's phone number
   - **Gender**: male/female
   - **Coins Balance**: Current coin balance
   - **User Type**: Premium or Free
   - **Profile Picture**: URL to profile picture

### Step 3: Check Events
1. Go to **Analytics** → **Events**
2. You should see events like:
   - `App Open` - When user opens the app
   - `User Login` - When user logs in
   - `Screen View` - When user navigates to different screens
   - `Profile Viewed` - When user views another profile
   - `Call Initiated` - When user starts a call
   - `Call Ended` - When call ends
   - `Coin Purchase` - When user buys coins
   - `OTP Requested` - When user requests OTP
   - `OtpVerified` - When OTP is verified

### Step 4: Create Custom Segments
1. Go to **Segments** → **Create Segment**
2. Example segments you can create:
   - **Active Users (Last 7 Days)**: Users who opened app in last 7 days
   - **Low Balance Users**: Users with Coins Balance < 50
   - **Premium Users**: Users where User Type = "Premium"
   - **Male Users**: Users where Gender = "male"
   - **Users Who Made Calls**: Users who performed "Call Initiated" event

## Testing the Integration

### Test 1: New User Registration
1. Install the app on a device
2. Register a new user with OTP
3. Check CleverTap dashboard after 2-3 minutes
4. User should appear in "All Users" with complete profile

### Test 2: Existing User Login
1. Login with an existing account
2. Check CleverTap dashboard
3. User profile should be updated with latest data

### Test 3: Event Tracking
1. Perform actions in the app:
   - View a profile
   - Initiate a call
   - Purchase coins
2. Go to Analytics → Events
3. Events should appear within 2-3 minutes

### Test 4: Real-time Debugging
1. Open browser console (for web) or logcat (for Android)
2. Look for CleverTap logs:
   - `🚀 Initializing CleverTap...`
   - `✅ CleverTap initialized successfully`
   - `👤 Found existing user, tracking login`
   - `✅ Event tracked: [Event Name]`
   - `✅ CleverTap profile updated`

## Common Issues and Solutions

### Issue 1: No Users Appearing in Dashboard
**Solution:**
1. Check that CleverTap credentials are correct
2. Verify app is calling `trackUserLogin()` after login
3. Check browser console/logcat for errors
4. Wait 2-3 minutes for data to sync

### Issue 2: User Profile Missing Data
**Solution:**
1. Ensure user data is stored in localStorage
2. Check that `syncUserToCleverTap()` is being called
3. Verify user object has all required fields

### Issue 3: Events Not Showing
**Solution:**
1. Check that `trackEvent()` is being called
2. Verify event names don't have special characters
3. Check CleverTap dashboard after 2-3 minutes
4. Look for errors in console/logcat

### Issue 4: Duplicate Users
**Solution:**
1. Ensure consistent identity is used (user ID, not phone)
2. Call `trackUserLogin()` with same identity each time
3. Don't create new identity on each login

## Key Files Modified

1. **`utils/clevertap.ts`** - Core CleverTap functions
2. **`utils/userTracking.ts`** - Helper functions for user tracking
3. **`components/CleverTapInit.tsx`** - Initialization component
4. **`components/LoginScreen.tsx`** - Login tracking
5. **`components/OTPScreen.tsx`** - OTP verification tracking
6. **`components/UserListScreen.tsx`** - Profile view tracking
7. **`components/audiocallscreen.tsx`** - Call tracking

## Next Steps

### 1. Build and Deploy
```bash
cd "yarri app"
npm run build
npx cap sync android
cd android
gradlew assembleDebug
```

### 2. Install APK on Device
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### 3. Test User Flow
1. Register new user
2. Login
3. View profiles
4. Make a call
5. Purchase coins

### 4. Verify in CleverTap
1. Wait 2-3 minutes
2. Check Segments → All Users
3. Check Analytics → Events
4. Create custom segments

## Support

If you encounter issues:
1. Check console logs for errors
2. Verify CleverTap credentials
3. Ensure internet connection is active
4. Wait 2-3 minutes for data sync
5. Check CleverTap status page for outages

## Additional Features to Track

Consider adding tracking for:
- User profile updates
- Settings changes
- App crashes
- Payment failures
- Search queries
- Filter usage
- Message sends (if you add messaging)
- Match events (if you add matching)

## CleverTap Dashboard URLs

- **EU Region Dashboard**: https://eu1.dashboard.clevertap.com/
- **Account ID**: 775-RZ7-W67Z
- **Region**: eu1

## Conclusion

Your CleverTap integration is now complete and should be sending:
- User profiles with complete data
- User login events
- Screen view events
- Call events
- Coin purchase events
- Profile view events

All data should appear in your CleverTap dashboard within 2-3 minutes of the event occurring.
