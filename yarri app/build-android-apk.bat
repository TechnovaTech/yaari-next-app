@echo off
echo Building Yaari Android APK...
echo.

echo Step 1: Syncing Capacitor with Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo Failed to sync Capacitor
    exit /b %errorlevel%
)

echo.
echo Step 2: Building Android APK...
cd android
call gradlew assembleDebug
if %errorlevel% neq 0 (
    echo Failed to build APK
    cd ..
    exit /b %errorlevel%
)

cd ..
echo.
echo ========================================
echo APK built successfully!
echo Location: android\app\build\outputs\apk\debug\app-debug.apk
echo ========================================
