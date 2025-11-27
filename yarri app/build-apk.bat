@echo off
echo ========================================
echo Building Yaari Android APK
echo ========================================
echo.

echo [1/4] Building Next.js app...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Next.js build failed
    exit /b 1
)
echo.

echo [2/4] Syncing with Capacitor...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Capacitor sync failed
    exit /b 1
)
echo.

echo [3/4] Building Android APK...
cd android
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo ERROR: Android build failed
    echo.
    echo Make sure Android SDK is installed and ANDROID_HOME is set
    echo Or edit android/local.properties with sdk.dir path
    cd ..
    exit /b 1
)
cd ..
echo.

echo [4/4] APK Built Successfully!
echo.
echo ========================================
echo APK Location:
echo android\app\build\outputs\apk\debug\app-debug.apk
echo ========================================
echo.
echo Install on device: adb install android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause
