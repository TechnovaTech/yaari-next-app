# Set environment variables
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"

Write-Host "Building Next.js app..."
npm run build

Write-Host "Syncing with Capacitor..."
npx cap sync android

Write-Host "Building Android APK..."
cd android
.\gradlew.bat assembleDebug
cd ..

Write-Host "APK Built Successfully!"
Write-Host "APK Location: android\app\build\outputs\apk\debug\app-debug.apk"