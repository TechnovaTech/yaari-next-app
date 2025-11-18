@echo off
set "JAVA_HOME=%~dp0temp_jdk\jdk-17.0.13+11"
set "PATH=%JAVA_HOME%\bin;%PATH%"
cd android
call gradlew.bat clean assembleDebug
cd ..
copy android\app\build\outputs\apk\debug\app-debug.apk yaari-app-rebuilt.apk
echo APK rebuilt: yaari-app-rebuilt.apk
pause
