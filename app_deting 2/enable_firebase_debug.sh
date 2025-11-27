#!/bin/bash

echo "Enabling Firebase Analytics Debug Mode..."

# Enable debug mode for Android
adb shell setprop debug.firebase.analytics.app com.example.app_deting

echo "✅ Debug mode enabled!"
echo "Now run: flutter run"
echo ""
echo "To view events:"
echo "1. Go to Firebase Console"
echo "2. Navigate to Analytics > DebugView"
echo "3. Select your device from dropdown"
echo ""
echo "To disable debug mode later, run:"
echo "adb shell setprop debug.firebase.analytics.app .none."
