# Firebase Analytics Debug Mode

To see Firebase Analytics events immediately in the Firebase Console, you need to enable debug mode:

## For Android:

Run this command in terminal:
```bash
adb shell setprop debug.firebase.analytics.app com.example.app_deting
```

Replace `com.example.app_deting` with your actual package name.

Then run your app:
```bash
flutter run
```

## For iOS:

Add this to your Xcode scheme:
1. Open iOS project in Xcode
2. Product > Scheme > Edit Scheme
3. Select "Run" from the left menu
4. Select "Arguments" tab
5. Add `-FIRAnalyticsDebugEnabled` to "Arguments Passed On Launch"

Or run from terminal:
```bash
flutter run --dart-define=FIREBASE_ANALYTICS_DEBUG_MODE=true
```

## Verify Events in Firebase Console:

1. Go to Firebase Console > Analytics > DebugView
2. Select your device from the dropdown
3. You should see events in real-time

## Events Being Tracked:

1. **registrationDone** - userId, method, referralCode
2. **videoCallCtaClicked** - creatorId, ratePerMin, walletBalance  
3. **audioCallCtaClicked** - creatorId, ratePerMin, walletBalance
4. **paymentDone** - packId, packValue, transactionId, paymentGateway, status

## Disable Debug Mode:

### Android:
```bash
adb shell setprop debug.firebase.analytics.app .none.
```

### iOS:
Remove the `-FIRAnalyticsDebugEnabled` argument from Xcode scheme.

## Note:
- Events can take up to 24 hours to appear in the main Analytics dashboard
- DebugView shows events immediately
- Make sure Google Analytics is enabled in your Firebase project
