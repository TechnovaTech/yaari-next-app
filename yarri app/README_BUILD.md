# 🚀 Yaari Android App - Build Instructions

## ✅ What's Done

Your app is **100% configured** for Android:
- ✅ Full-screen display (edge-to-edge)
- ✅ Safe area for camera notch
- ✅ Back button navigation (won't close app)
- ✅ All permissions configured
- ✅ Capacitor setup complete

## 📦 Build APK - One Command

```bash
build-apk.bat
```

## ⚠️ First Time Setup

**You need Android SDK installed once.**

### Option 1: Android Studio (Easiest - 15 min)
1. Download: https://developer.android.com/studio
2. Install with default settings
3. Run: `build-apk.bat`

### Option 2: Command Line Tools (5 min)
See: `INSTALL_ANDROID_SDK.md`

## 📱 After Build

APK location:
```
android\app\build\outputs\apk\debug\app-debug.apk
```

Install on phone:
```bash
adb install android\app\build\outputs\apk\debug\app-debug.apk
```

Or copy APK to phone and install manually.

## 🔧 Development Mode (No APK needed)

Test on phone without building APK:

1. Start dev server:
```bash
npm run dev
```

2. Connect phone via USB

3. Run:
```bash
npx cap run android
```

## 📋 Features

- ✅ Full-screen on all Android devices
- ✅ Back button navigates (doesn't close app)
- ✅ Video calls with camera flip
- ✅ Audio calls
- ✅ All permissions handled
- ✅ Safe area for notch/camera

## 🆘 Troubleshooting

**"SDK location not found"**
- Install Android SDK (see above)
- Or set in `android/local.properties`:
  ```
  sdk.dir=C\:\\Users\\YourName\\AppData\\Local\\Android\\Sdk
  ```

**"gradlew not found"**
- Run from project root: `build-apk.bat`

**Build errors**
- Delete `android/.gradle` folder
- Run `build-apk.bat` again

## 🎯 Summary

1. Install Android SDK (one time)
2. Run `build-apk.bat`
3. Get APK from `android/app/build/outputs/apk/debug/`
4. Install on phone

That's it! 🎉
