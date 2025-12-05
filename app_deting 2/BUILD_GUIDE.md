# Android Signed Build Guide

## Current Configuration

### Keystore Details
- **File**: `app-release-key.jks` (located in `android/app/`)
- **Alias**: `app-release-key`
- **Store Password**: `YaariDevP@ssword123`
- **Key Password**: `YaariDevP@ssword123`

### Build Configuration
- **Application ID**: `com.yaari.play`
- **Min SDK**: 24
- **Target SDK**: Latest Flutter SDK version
- **Build Type**: Release (minified, shrunk resources)

## Generate AAB for Play Console

### Option 1: Using Script (Recommended)
```bash
cd android
chmod +x build_release.sh
./build_release.sh
```

### Option 2: Manual Build
```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

### Output Location
AAB file will be generated at:
```
build/app/outputs/bundle/release/app-release.aab
```

## Verify Build
```bash
# Check AAB details
bundletool build-apks --bundle=build/app/outputs/bundle/release/app-release.aab --output=app.apks --mode=universal

# Extract and verify
unzip -l build/app/outputs/bundle/release/app-release.aab
```

## Upload to Play Console
1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Navigate to: Release → Production → Create new release
4. Upload `app-release.aab`
5. Complete release notes and submit

## Troubleshooting

### If keystore not found:
- Ensure `app-release-key.jks` is in `android/app/` directory
- Verify `key.properties` has correct path: `storeFile=app-release-key.jks`

### If build fails:
```bash
cd android
./gradlew clean
flutter clean
flutter pub get
./gradlew bundleRelease
```

### Generate New Keystore (if needed):
```bash
keytool -genkey -v -keystore app-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias app-release-key
```

## Important Notes
- ⚠️ **NEVER commit** `key.properties` or `.jks` files to version control
- 🔒 Store keystore and passwords securely (use password manager)
- 📋 Keep backup of keystore file - losing it means you cannot update the app
- 🔑 Upload key fingerprint is required for Play Console
