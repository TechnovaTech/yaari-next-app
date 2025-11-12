# Analytics Implementation Summary

## Overview
The app now tracks analytics events across **3 platforms simultaneously**:
1. **Mixpanel + CleverTap** - All user events
2. **Firebase Analytics** - 4 specific events only
3. **Meta (Facebook) Analytics** - Same 4 specific events as Firebase

## The 4 Special Events

These events are tracked on ALL 3 platforms:

### 1. registrationDone
- **When**: User completes profile setup during first-time registration
- **Where**: `edit_profile_screen.dart`
- **Parameters**:
  - `userId`: User's unique ID
  - `method`: Registration method (e.g., "phone")
  - `referralCode`: Optional referral code

### 2. videoCallCtaClicked
- **When**: User clicks video call button on home screen
- **Where**: `home_screen.dart`
- **Parameters**:
  - `creatorId`: ID of the creator being called
  - `ratePerMin`: Video call rate per minute
  - `walletBalance`: User's current wallet balance

### 3. audioCallCtaClicked
- **When**: User clicks audio call button on home screen
- **Where**: `home_screen.dart`
- **Parameters**:
  - `creatorId`: ID of the creator being called
  - `ratePerMin`: Audio call rate per minute
  - `walletBalance`: User's current wallet balance

### 4. paymentDone
- **When**: Payment is successfully completed
- **Where**: `coins_screen.dart`
- **Parameters**:
  - `packId`: ID of the purchased pack
  - `packValue`: Amount paid
  - `transactionId`: Payment transaction ID
  - `paymentGateway`: Payment gateway used (e.g., "razorpay")
  - `status`: Payment status (e.g., "success")

## Platform Configuration

### Mixpanel + CleverTap
- **Service**: `lib/services/analytics_service.dart`
- **Events**: ALL user events (homepageViewed, profileClicked, walletClicked, etc.)
- **Special**: Also includes `trackCharged()` for revenue tracking

### Firebase Analytics
- **Service**: `lib/services/firebase_analytics_service.dart`
- **Events**: ONLY the 4 events listed above
- **App ID**: Configured in `firebase_options.dart`
- **Documentation**: `FIREBASE_ANALYTICS_DEBUG.md`

### Meta (Facebook) Analytics
- **Service**: `lib/services/meta_analytics_service.dart`
- **Events**: ONLY the 4 events listed above
- **App ID**: `1422337229258362`
- **Documentation**: `META_ANALYTICS_SETUP.md`

## Testing

### Test Screen
- **Route**: `/test_analytics`
- **Purpose**: Manually trigger all 4 events for testing
- **Platforms**: Sends events to Firebase AND Meta simultaneously

### Verification

**Firebase Analytics**:
1. Enable debug mode (see `FIREBASE_ANALYTICS_DEBUG.md`)
2. Go to Firebase Console > Analytics > DebugView
3. Events appear in real-time

**Meta Analytics**:
1. Go to Meta Events Manager
2. Select Test Events tab
3. Events appear within minutes

**Mixpanel/CleverTap**:
1. Check respective dashboards
2. All events including the 4 special ones appear

## Code Pattern

Every special event follows this pattern:

```dart
// Track to Mixpanel/CleverTap
AnalyticsService.instance.track('eventName', {
  'param1': value1,
  'param2': value2,
});

// Track to Firebase Analytics
FirebaseAnalyticsService.instance.trackEventName(
  param1: value1,
  param2: value2,
);

// Track to Meta Analytics
MetaAnalyticsService.instance.trackEventName(
  param1: value1,
  param2: value2,
);
```

## Files Modified

### New Files
- `lib/services/meta_analytics_service.dart` - Meta Analytics service
- `android/app/src/main/res/values/strings.xml` - Meta App ID for Android
- `META_ANALYTICS_SETUP.md` - Meta setup documentation
- `ANALYTICS_SUMMARY.md` - This file

### Modified Files
- `pubspec.yaml` - Added `facebook_app_events: ^0.19.2`
- `lib/main.dart` - Initialize Meta Analytics
- `lib/screens/edit_profile_screen.dart` - Track registrationDone to Meta
- `lib/screens/home_screen.dart` - Track video/audio call CTAs to Meta
- `lib/screens/coins_screen.dart` - Track paymentDone to Meta
- `lib/screens/test_analytics_screen.dart` - Test Meta events
- `android/app/src/main/AndroidManifest.xml` - Meta SDK config
- `ios/Runner/Info.plist` - Meta App ID for iOS

## Next Steps

1. **Install dependencies**:
   ```bash
   flutter pub get
   ```

2. **Test the implementation**:
   - Run the app
   - Navigate to `/test_analytics`
   - Click test buttons
   - Verify events in all 3 platforms

3. **Production deployment**:
   - All configurations are already set
   - Events will automatically track in production
   - Monitor dashboards for all 3 platforms
