# 🔐 Yaari App Signing Information

## Keystore Details
```
File: app-release-key.jks
Location: android/app/app-release-key.jks
Alias: app-release-key
Store Password: YaariDevP@ssword123
Key Password: YaariDevP@ssword123
```

## Quick Build Commands

### Generate AAB (Android App Bundle)
```bash
cd android
./build_release.sh
```

### Manual Build
```bash
cd android
./gradlew bundleRelease
```

### Output
```
build/app/outputs/bundle/release/app-release.aab
```

## Get Key Fingerprints (for Play Console)
```bash
keytool -list -v -keystore android/app/app-release-key.jks -alias app-release-key
```
Password: `YourStorePassword123`

## ⚠️ Security Checklist
- [ ] Keystore file backed up securely
- [ ] Passwords stored in password manager
- [ ] `key.properties` NOT in git
- [ ] `.jks` file NOT in git
- [ ] Team members have secure access to credentials

## 📦 Build Flavors
Current: Single production flavor
- Application ID: `com.yaari.play`
- Build Type: Release (minified + shrunk)

## 🚀 Play Console Upload
1. Build AAB: `./build_release.sh`
2. Go to Play Console
3. Upload `app-release.aab`
4. Submit for review
