# Firebase Integration Setup

## Step 1: Install FlutterFire CLI

Run these commands in your terminal:

```bash
# Install FlutterFire CLI
dart pub global activate flutterfire_cli

# Or if dart is not in PATH, use:
flutter pub global activate flutterfire_cli
```

## Step 2: Configure Firebase

Navigate to the app directory and run:

```bash
cd "app_deting 2"
flutterfire configure --project=yaari-ff378
```

This will:
- Connect to your Firebase project `yaari-ff378`
- Generate `lib/firebase_options.dart` with actual credentials
- Register Android/iOS apps automatically

## Step 3: Update Dependencies

```bash
flutter pub get
```

## Step 4: Integrate Events

### Payment Done Event
In `lib/screens/coins_screen.dart`, after successful payment:

```dart
import '../services/firebase_analytics_service.dart';

await FirebaseAnalyticsService.instance.logPaymentDone(
  packId: isPlan ? _selectedPlan!.id : 'custom',
  packValue: amountRupees.toDouble(),
  transactionId: payment['razorpay_payment_id'] ?? '',
  paymentGateway: 'razorpay',
  status: 'success',
);
```

### Registration Done Event
In `lib/screens/otp_screen.dart`, after successful signup:

```dart
import '../services/firebase_analytics_service.dart';

await FirebaseAnalyticsService.instance.logRegistrationDone(
  userId: userId,
  method: 'phone',
  referralCode: referralCode, // if available
);
```

### Video Call CTA Clicked
In `lib/screens/user_detail_screen.dart`, when video call button is clicked:

```dart
import '../services/firebase_analytics_service.dart';

await FirebaseAnalyticsService.instance.logVideoCallCtaClicked(
  creatorId: receiverId,
  ratePerMin: _settings.videoCallRate,
  walletBalance: _coinBalance,
);
```

### Audio Call CTA Clicked
In `lib/screens/user_detail_screen.dart`, when audio call button is clicked:

```dart
import '../services/firebase_analytics_service.dart';

await FirebaseAnalyticsService.instance.logAudioCallCtaClicked(
  creatorId: receiverId,
  ratePerMin: _settings.audioCallRate,
  walletBalance: _coinBalance,
);
```

## Files Created

1. ✅ `lib/firebase_options.dart` - Firebase configuration (placeholder)
2. ✅ `lib/services/firebase_analytics_service.dart` - Analytics service with custom events
3. ✅ `pubspec.yaml` - Updated with Firebase dependencies
4. ✅ `lib/main.dart` - Firebase initialization added

## Next Steps

1. Run `flutterfire configure --project=yaari-ff378` to generate actual credentials
2. Add event tracking calls in the appropriate screens
3. Test the app and verify events in Firebase Console

## Events Summary

| Event Name | Trigger | Parameters |
|------------|---------|------------|
| `paymentDone` | Successful transaction | packId, packValue, transactionId, paymentGateway, status |
| `registrationDone` | Successful signup | userId, method, referralCode |
| `videoCallCtaClicked` | Video call CTA click | creatorId, ratePerMin, walletBalance |
| `audioCallCtaClicked` | Audio call CTA click | creatorId, ratePerMin, walletBalance |
