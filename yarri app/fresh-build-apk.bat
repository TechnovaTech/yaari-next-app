@echo off
setlocal

echo [1/5] Building Next.js (production)...
call npm run build
if errorlevel 1 (
  echo Next build failed.
  exit /b 1
)

if not exist out (
  echo ERROR: Next export output folder "out" not found.
  echo Ensure next.config.js is configured to output 'export' in production.
  exit /b 1
)

echo [2/5] Refreshing Capacitor www assets with latest Next export...
REM Ensure www exists; avoid deletion issues on OneDrive by mirroring instead
if not exist www (
  mkdir www
)
REM Use robocopy if available for reliability; fallback to xcopy
where robocopy >nul 2>nul
if %errorlevel%==0 (
  robocopy out www /MIR >nul
) else (
  xcopy out www /E /H /C /I /Y >nul
)

echo [3/5] Syncing Capacitor project (Android)...
call npx cap sync android
if errorlevel 1 (
  echo Capacitor sync failed.
  exit /b 1
)

echo [4/5] Cleaning and assembling Android debug APK...
pushd android
call gradlew.bat clean assembleDebug
if errorlevel 1 (
  popd
  echo Gradle build failed.
  exit /b 1
)
popd

echo [5/5] Exporting APK to yaari-app-fresh.apk...
set APK_PATH=android\app\build\outputs\apk\debug\app-debug.apk
if not exist "%APK_PATH%" (
  echo ERROR: Debug APK not found at %APK_PATH%.
  exit /b 1
)
copy /Y "%APK_PATH%" "yaari-app-fresh.apk" >nul

echo Done. Fresh APK: yaari-app-fresh.apk
exit /b 0