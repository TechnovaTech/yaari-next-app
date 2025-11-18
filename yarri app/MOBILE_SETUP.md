# Mobile Setup Guide

This guide will help you convert the Yaari Next.js app to a native mobile app using Capacitor.

## Prerequisites

- Node.js installed
- Android Studio (for Android)
- Xcode (for iOS, macOS only)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Build the Next.js App

```bash
npm run build
```

This creates a static export in the `out` folder.

## Step 3: Install Capacitor (When Ready)

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
```

## Step 4: Add Mobile Platforms

### For Android:
```bash
npm install @capacitor/android
npx cap add android
npx cap sync android
npx cap open android
```

### For iOS (macOS only):
```bash
npm install @capacitor/ios
npx cap add ios
npx cap sync ios
npx cap open ios
```

## Step 5: Update After Changes

Whenever you make changes to your web app:

```bash
npm run build
npx cap sync
```

## Mobile-Specific Features

The app is already optimized for mobile with:

- ✅ Responsive design (100% width/height)
- ✅ Touch-optimized tap targets
- ✅ Native keyboard support
- ✅ Viewport meta tags
- ✅ No zoom on input focus
- ✅ Safe area support
- ✅ Status bar configuration

## Testing on Mobile

### Browser Testing:
1. Run `npm run dev`
2. Open Chrome DevTools
3. Toggle device toolbar (Ctrl+Shift+M)
4. Select mobile device

### Real Device Testing:
1. Build the app: `npm run build`
2. Add platform: `npx cap add android` or `npx cap add ios`
3. Sync: `npx cap sync`
4. Open in IDE: `npx cap open android` or `npx cap open ios`
5. Run on device from Android Studio or Xcode

## App Configuration

Edit `capacitor.config.json` to customize:
- App ID
- App Name
- Splash Screen
- Status Bar
- Keyboard behavior

## Icon & Splash Screen

Place your assets in:
- `public/icon.png` (1024x1024)
- `public/splash.png` (2732x2732)

Then run:
```bash
npm install @capacitor/assets --save-dev
npx capacitor-assets generate
```

## Troubleshooting

### Keyboard Issues:
- Ensure `font-size: 16px` on inputs (prevents zoom on iOS)
- Use `inputMode="numeric"` for number inputs

### Layout Issues:
- Use `100dvh` for dynamic viewport height
- Test on real devices, not just emulators

### Build Issues:
- Clear Next.js cache: `rm -rf .next`
- Rebuild: `npm run build`
- Sync Capacitor: `npx cap sync`
