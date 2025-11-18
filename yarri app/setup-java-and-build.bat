@echo off
echo Downloading portable Java 17...
mkdir temp_jdk 2>nul
curl -L "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.13%2B11/OpenJDK17U-jdk_x64_windows_hotspot_17.0.13_11.zip" -o temp_jdk\jdk17.zip
echo Extracting...
tar -xf temp_jdk\jdk17.zip -C temp_jdk
set JAVA_HOME=%CD%\temp_jdk\jdk-17.0.13+11
set PATH=%JAVA_HOME%\bin;%PATH%
echo Building APK...
cd android
gradlew.bat assembleDebug
cd ..
echo APK location: android\app\build\outputs\apk\debug\app-debug.apk
pause
