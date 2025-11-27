# CleverTap Integration - Quick Checklist ✅

## Pre-Deployment Checklist

### 1. Configuration ✅
- [x] CleverTap credentials in `android/gradle.properties`
- [x] CleverTap meta-data in `AndroidManifest.xml`
- [x] CleverTap account ID in `utils/clevertap.ts`
- [x] Region set to `eu1`

### 2. Code Changes ✅
- [x] Enhanced `utils/clevertap.ts`
- [x] Created `utils/userTracking.ts`
- [x] Updated `components/CleverTapInit.tsx`
- [x] Updated `components/OTPScreen.tsx`
- [x] Updated `components/LoginScreen.tsx`
- [x] Updated `components/UserListScreen.tsx`
- [x] Updated `components/audiocallscreen.tsx`

### 3. Build & Deploy
- [ ] Run `npm run build`
- [ ] Run `npx cap sync android`
- [ ] Build APK: `cd android && gradlew assembleDebug`
- [ ] Install on device: `adb install -r app/build/outputs/apk/debug/app-debug.apk`

## Testing Checklist

### 4. Test New User Registration
- [ ] Open app on device
- [ ] Register with new phone number
- [ ] Complete OTP verification
- [ ] Check console for: `✅ CleverTap user login tracked`
- [ ] Wait 2-3 minutes
- [ ] Check CleverTap dashboard → Segments → All Users
- [ ] Verify user appears with complete profile

### 5. Test Existing User Login
- [ ] Login with existing account
- [ ] Check console for: `👤 Found existing user, tracking login`
- [ ] Wait 2-3 minutes
- [ ] Check CleverTap dashboard
- [ ] Verify user profile is updated

### 6. Test Event Tracking
- [ ] View a user profile
- [ ] Check console for: `✅ Event tracked: Profile Viewed`
- [ ] Initiate a call
- [ ] Check console for: `✅ Event tracked: Call Initiated`
- [ ] End the call
- [ ] Check console for: `✅ Event tracked: Call Ended`
- [ ] Wait 2-3 minutes
- [ ] Check CleverTap → Analytics → Events
- [ ] Verify events appear

### 7. Test Profile Data
- [ ] Go to CleverTap → Segments → All Users
- [ ] Click on a user
- [ ] Verify these fields are present:
  - [ ] Identity (user ID)
  - [ ] Name
  - [ ] Email (if available)
  - [ ] Phone
  - [ ] Gender
  - [ ] Coins Balance
  - [ ] User Type
  - [ ] Profile Picture URL

### 8. Test Segments
- [ ] Go to CleverTap → Segments → Create Segment
- [ ] Create segment: "Active Users (Last 7 Days)"
  - [ ] Condition: "App Open" event in last 7 days
- [ ] Create segment: "Low Balance Users"
  - [ ] Condition: Coins Balance < 50
- [ ] Create segment: "Male Users"
  - [ ] Condition: Gender = "male"
- [ ] Verify segments show correct users

## Verification Checklist

### 9. Console Logs Verification
Check for these logs in console/logcat:
- [ ] `🚀 Initializing CleverTap Native SDK...`
- [ ] `✅ CleverTap Native SDK ready`
- [ ] `👤 Found existing user, tracking login: [user_id]`
- [ ] `✅ CleverTap user login tracked: [user_id]`
- [ ] `✅ CleverTap profile updated`
- [ ] `✅ Event tracked: [Event Name]`
- [ ] No errors related to CleverTap

### 10. CleverTap Dashboard Verification
- [ ] Login to: https://eu1.dashboard.clevertap.com/
- [ ] Navigate to Segments → All Users
- [ ] Verify users are appearing
- [ ] Click on a user and verify complete profile
- [ ] Navigate to Analytics → Events
- [ ] Verify events are appearing:
  - [ ] App Open
  - [ ] User Login
  - [ ] Screen View
  - [ ] Profile Viewed
  - [ ] Call Initiated
  - [ ] Call Ended
  - [ ] OTP Requested
  - [ ] OtpVerified

## Troubleshooting Checklist

### If No Users Appear:
- [ ] Check CleverTap credentials are correct
- [ ] Verify app is calling `trackUserLogin()` after login
- [ ] Check console for errors
- [ ] Wait full 2-3 minutes for data sync
- [ ] Try registering a new user
- [ ] Check internet connection

### If Events Not Showing:
- [ ] Check console for event tracking logs
- [ ] Verify events are being called
- [ ] Wait 2-3 minutes for sync
- [ ] Check for errors in console
- [ ] Try triggering events again

### If Profile Data Missing:
- [ ] Check localStorage has user data
- [ ] Verify `syncUserToCleverTap()` is called
- [ ] Check console for profile update logs
- [ ] Try logging out and back in

## Optional: Web Testing
- [ ] Open `test-clevertap.html` in browser
- [ ] Click "Initialize CleverTap"
- [ ] Fill in test user details
- [ ] Click "Track User Login"
- [ ] Click event buttons
- [ ] Check browser console for logs
- [ ] Wait 2-3 minutes
- [ ] Verify in CleverTap dashboard

## Final Verification

### All Systems Go! ✅
- [ ] Users appearing in dashboard
- [ ] User profiles complete
- [ ] Events tracking correctly
- [ ] Segments working
- [ ] No console errors
- [ ] Documentation reviewed

## Quick Reference

### Important URLs
- **CleverTap Dashboard**: https://eu1.dashboard.clevertap.com/
- **Account ID**: 775-RZ7-W67Z
- **Region**: eu1

### Important Files
- `utils/clevertap.ts` - Core functions
- `utils/userTracking.ts` - Helper functions
- `components/CleverTapInit.tsx` - Initialization
- `android/gradle.properties` - Android config

### Key Commands
```bash
# Build
npm run build

# Sync Capacitor
npx cap sync android

# Build APK
cd android && gradlew assembleDebug

# Install APK
adb install -r app/build/outputs/apk/debug/app-debug.apk

# View logs
adb logcat | grep -i clevertap
```

### Expected Timeline
- **Code changes**: ✅ Complete
- **Build & deploy**: 5-10 minutes
- **Testing**: 15-20 minutes
- **Data sync to CleverTap**: 2-3 minutes per action
- **Total**: ~30 minutes

## Notes
- Always wait 2-3 minutes after an action before checking CleverTap dashboard
- Check console logs first if something doesn't work
- CleverTap data is not real-time, expect slight delays
- Test with multiple users for better verification

---

**Status**: Ready for Testing
**Last Updated**: 2024
