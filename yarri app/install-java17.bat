@echo off
echo Downloading Java 17...
curl -L "https://aka.ms/download-jdk/microsoft-jdk-17.0.13-windows-x64.msi" -o "%TEMP%\jdk17.msi"
echo Installing Java 17...
msiexec /i "%TEMP%\jdk17.msi" /qn
echo Java 17 installed!
pause
