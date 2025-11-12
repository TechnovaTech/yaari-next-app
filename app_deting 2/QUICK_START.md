# Quick Start - Meta Analytics

## ✅ What's Done

Meta (Facebook) Analytics is fully integrated and configured with App ID: **1422337229258362**

## 🚀 Get Started

### 1. Install Dependencies
```bash
cd "/Applications/datting project/dating-app.dev-main 4/app_deting 2"
flutter pub get
```

### 2. Run the App
```bash
flutter run
```

### 3. Test Events
- Navigate to the test screen: `/test_analytics`
- Click the 4 test buttons
- Events are sent to Firebase AND Meta

## 📊 The 4 Events

| Event | Trigger | Location |
|-------|---------|----------|
| **registrationDone** | User completes profile | edit_profile_screen.dart |
| **videoCallCtaClicked** | Video call button click | home_screen.dart |
| **audioCallCtaClicked** | Audio call button click | home_screen.dart |
| **paymentDone** | Payment success | coins_screen.dart |

## 🔍 Verify Events

### Meta Events Manager
1. Go to: https://business.facebook.com/events_manager2/list/app/1422337229258362
2. Click "Test Events" tab
3. Trigger events from the app
4. See events appear in real-time

### Firebase Console
1. Go to Firebase Console > Analytics > DebugView
2. Enable debug mode (see FIREBASE_ANALYTICS_DEBUG.md)
3. See events in real-time

## 📁 Key Files

- **Service**: `lib/services/meta_analytics_service.dart`
- **Android Config**: `android/app/src/main/res/values/strings.xml`
- **iOS Config**: `ios/Runner/Info.plist`
- **Test Screen**: `lib/screens/test_analytics_screen.dart`

## 📖 Documentation

- **Full Setup**: `META_ANALYTICS_SETUP.md`
- **All Analytics**: `ANALYTICS_SUMMARY.md`
- **Firebase Debug**: `FIREBASE_ANALYTICS_DEBUG.md`

## ✨ That's It!

Meta Analytics is ready to use. All events are automatically tracked when users perform actions in the app.
