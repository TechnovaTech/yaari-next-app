# 📋 Release Build Checklist

## ✅ Current Status

### Signing Configuration
- [x] Keystore file exists: `app-release-key.jks` (2.7KB)
- [x] Key properties configured
- [x] Build.gradle signing config set up
- [x] Passwords configured

### Build Setup
- [x] Application ID: `com.yaari.play`
- [x] Min SDK: 24
- [x] ProGuard enabled
- [x] Resource shrinking enabled
- [x] Debug symbols: FULL

## 🚀 Generate AAB for Play Console

### Step 1: Build AAB
```bash
cd android
./build_release.sh
```

### Step 2: Locate Output
```
build/app/outputs/bundle/release/app-release.aab
```

### Step 3: Get SHA Fingerprints (for Play Console)
```bash
keytool -list -v -keystore android/app/app-release-key.jks -alias app-release-key
```
Enter password: `YourStorePassword123`

### Step 4: Upload to Play Console
1. Navigate to [Play Console](https://play.google.com/console)
2. Select Yaari app
3. Go to Release → Production
4. Create new release
5. Upload AAB file
6. Add release notes
7. Submit for review

## 📝 Build Flavors

Currently using single production build:
- **Flavor**: Production
- **Build Type**: Release
- **Output**: AAB (Android App Bundle)
- **Optimizations**: Enabled (minify + shrink)

## 🔑 Required Passwords

All passwords needed for signed build:
- Store Password: `YaariDevP@ssword123`
- Key Password: `YaariDevP@ssword123`
- Key Alias: `app-release-key`

## 🛠️ Troubleshooting

### Build fails?
```bash
flutter clean
cd android
./gradlew clean
./gradlew bundleRelease
```

### Need new keystore?
```bash
keytool -genkey -v -keystore app-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias app-release-key
```

### Verify AAB integrity
```bash
bundletool build-apks \
  --bundle=build/app/outputs/bundle/release/app-release.aab \
  --output=test.apks \
  --mode=universal
```

## 📦 Files Created

1. `BUILD_GUIDE.md` - Comprehensive build documentation
2. `SIGNING_INFO.md` - Quick reference for signing details
3. `build_release.sh` - Automated build script
4. `.gitignore` - Protects sensitive files

## ⚠️ Important Notes

- **NEVER** commit keystore files to git
- **BACKUP** keystore file securely (losing it = cannot update app)
- **STORE** passwords in secure password manager
- **VERIFY** AAB before uploading to Play Console
- **TEST** on multiple devices after release

## 🎯 Next Steps

1. Run `./build_release.sh` to generate AAB
2. Get SHA fingerprints for Play Console
3. Upload AAB to Play Console
4. Complete release information
5. Submit for review
