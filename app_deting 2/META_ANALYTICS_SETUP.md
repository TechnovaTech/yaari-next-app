# Meta (Facebook) Analytics Setup

## Overview
Meta Analytics has been integrated to track the same 4 events as Firebase Analytics:
1. **registrationDone** - User registration completion
2. **videoCallCtaClicked** - Video call button clicks
3. **audioCallCtaClicked** - Audio call button clicks
4. **paymentDone** - Payment completion

## Configuration

### App ID
- **Meta App ID**: `1422337229258362`

### Android Setup
1. ✅ Added `facebook_app_events: ^0.19.2` to `pubspec.yaml`
2. ✅ Created `android/app/src/main/res/values/strings.xml` with App ID
3. ✅ Added Meta SDK configuration to `AndroidManifest.xml`

### iOS Setup
1. ✅ Added Meta App ID to `ios/Runner/Info.plist`
2. ✅ Added required URL schemes for Facebook SDK

## Implementation

### Service File
- **Location**: `lib/services/meta_analytics_service.dart`
- **Pattern**: Singleton instance with 4 tracking methods matching Firebase Analytics

### Integration Points
All 4 events are tracked in parallel to Firebase Analytics:

1. **registrationDone** - `lib/screens/edit_profile_screen.dart`
   - Triggered when user completes profile setup during onboarding
   - Parameters: userId, method, referralCode (optional)

2. **videoCallCtaClicked** - `lib/screens/home_screen.dart`
   - Triggered when user clicks video call button
   - Parameters: creatorId, ratePerMin, walletBalance

3. **audioCallCtaClicked** - `lib/screens/home_screen.dart`
   - Triggered when user clicks audio call button
   - Parameters: creatorId, ratePerMin, walletBalance

4. **paymentDone** - `lib/screens/coins_screen.dart`
   - Triggered when payment is successfully completed
   - Parameters: packId, packValue, transactionId, paymentGateway, status

## Testing

### Test Screen
- Navigate to `/test_analytics` route
- Click buttons to trigger test events
- Events are sent to both Firebase and Meta simultaneously

### Verify Events in Meta Events Manager

1. **Go to Meta Events Manager**
   - URL: https://business.facebook.com/events_manager2/list/app/1422337229258362
   - Or: Facebook Business Suite > Events Manager

2. **View Test Events**
   - Select "Test Events" tab
   - Use test device or enable test mode
   - Events should appear within a few minutes

3. **View Live Events**
   - Go to "Overview" tab
   - Events may take up to 24 hours to appear in production dashboard
   - Use "Activity" section for real-time monitoring

## Event Parameters

All events follow the same parameter structure as Firebase Analytics:

```dart
// registrationDone
{
  'userId': String,
  'method': String,
  'referralCode': String? (optional)
}

// videoCallCtaClicked & audioCallCtaClicked
{
  'creatorId': String,
  'ratePerMin': int,
  'walletBalance': int
}

// paymentDone
{
  'packId': String,
  'packValue': num,
  'transactionId': String,
  'paymentGateway': String,
  'status': String
}
```

## Installation Steps

1. **Install dependencies**:
   ```bash
   flutter pub get
   ```

2. **Run the app**:
   ```bash
   flutter run
   ```

3. **Test events**:
   - Navigate to test analytics screen
   - Click test buttons
   - Verify in Meta Events Manager

## Notes

- Meta Analytics is initialized alongside Firebase Analytics in `main.dart`
- All events are tracked automatically when users perform actions
- Events are sent to Meta, Firebase, and Mixpanel/CleverTap simultaneously
- No additional configuration needed for production - App ID is already set
