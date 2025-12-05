#!/bin/bash

echo "🔑 Getting Keystore Fingerprints for Play Console"
echo "=================================================="
echo ""
echo "Keystore: app/app-release-key.jks"
echo "Alias: app-release-key"
echo "Password: YaariDevP@ssword123"
echo ""
echo "Press Enter to continue..."
read

keytool -list -v -keystore app/app-release-key.jks -alias app-release-key -storepass YaariDevP@ssword123 -keypass YaariDevP@ssword123

echo ""
echo "✅ Copy the SHA-1 and SHA-256 fingerprints above"
echo "📋 You'll need these for Play Console configuration"
