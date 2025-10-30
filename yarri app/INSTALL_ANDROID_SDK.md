# Install Android SDK (Required for APK Build)

## Quick Install - Android Studio

1. **Download Android Studio:**
   https://developer.android.com/studio

2. **Install:**
   - Run installer
   - Choose "Standard" installation
   - Wait for SDK download (5-10 minutes)

3. **Set Environment Variable:**
   - Open: System Properties → Environment Variables
   - Add new System Variable:
     - Name: `ANDROID_HOME`
     - Value: `C:\Users\YourUsername\AppData\Local\Android\Sdk`

4. **Build APK:**
   ```bash
   build-apk.bat
   ```

## Alternative - Command Line Tools Only

1. **Download SDK Command Line Tools:**
   https://developer.android.com/studio#command-tools

2. **Extract to:**
   ```
   C:\Android\cmdline-tools\latest\
   ```

3. **Install SDK:**
   ```bash
   cd C:\Android\cmdline-tools\latest\bin
   sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"
   ```

4. **Set Environment:**
   ```
   ANDROID_HOME=C:\Android
   ```

5. **Build APK:**
   ```bash
   build-apk.bat
   ```

## Verify Installation

```bash
echo %ANDROID_HOME%
```

Should show SDK path.

## Then Build

```bash
build-apk.bat
```

APK will be at: `android\app\build\outputs\apk\debug\app-debug.apk`
