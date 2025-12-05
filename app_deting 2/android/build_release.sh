#!/bin/bash

echo "🚀 Building Yaari App Release AAB..."
echo "=================================="

# Check if key.properties exists
if [ ! -f "key.properties" ]; then
    echo "❌ Error: key.properties not found!"
    exit 1
fi

# Check if keystore exists
if [ ! -f "app/app-release-key.jks" ]; then
    echo "❌ Error: app-release-key.jks not found in app/ directory!"
    exit 1
fi

echo "✅ Keystore found"
echo "✅ Key properties found"
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
./gradlew clean

# Build AAB
echo "📦 Building release AAB..."
./gradlew bundleRelease

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo "📍 AAB Location: build/app/outputs/bundle/release/app-release.aab"
    echo ""
    echo "Next steps:"
    echo "1. Upload to Play Console"
    echo "2. Complete release notes"
    echo "3. Submit for review"
else
    echo ""
    echo "❌ Build failed! Check errors above."
    exit 1
fi
