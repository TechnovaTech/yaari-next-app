# Build Yaari Android APK

## Method 1: Android Studio (Recommended)
1. Run: `npx cap open android`
2. In Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s)
3. APK location: `android\app\build\outputs\apk\debug\app-debug.apk`

## Method 2: Command Line (Requires Java 17)
1. Install Java 17 from: https://adoptium.net/temurin/releases/?version=17
2. Set JAVA_HOME to Java 17 path
3. Run: `cd android && gradlew.bat assembleDebug`
4. APK location: `android\app\build\outputs\apk\debug\app-debug.apk`

## Sync Changes
Before building, sync Capacitor:
```
npx cap sync android
```
