# Safe Area Implementation Guide

## Overview
This guide explains how safe areas are handled in the Yaari app to prevent UI overlap with system navigation bars on Android and iOS.

## What Was Fixed

### 1. **Tailwind Configuration**
Added safe area utilities to `tailwind.config.js`:
- `pb-safe-bottom` - Padding bottom with safe area
- `pt-safe-top` - Padding top with safe area
- `pl-safe-left` - Padding left with safe area
- `pr-safe-right` - Padding right with safe area

### 2. **Global CSS**
Updated `.mobile-container` to use `max(env(safe-area-inset-bottom), 16px)` ensuring minimum 16px padding even when safe area is 0.

### 3. **Android Configuration**
- Changed `WindowCompat.setDecorFitsSystemWindows(getWindow(), true)` in MainActivity.java
- This ensures Android properly reports safe area insets to the WebView

### 4. **Capacitor Config**
- Added iOS contentInset configuration
- Ensured proper Android window settings

## How to Use

### Method 1: Use Existing CSS Classes
```tsx
<div className="safe-bottom">
  {/* Content with bottom safe area */}
</div>
```

### Method 2: Use Tailwind Utilities
```tsx
<div className="pb-safe-bottom">
  {/* Content with bottom padding */}
</div>
```

### Method 3: Use SafeAreaWrapper Component
```tsx
import SafeAreaWrapper from '@/components/SafeAreaWrapper'

<SafeAreaWrapper applyBottom={true}>
  {/* Your content */}
</SafeAreaWrapper>
```

### Method 4: Use the Hook
```tsx
import { useSafeArea } from '@/hooks/useSafeArea'

const { top, bottom } = useSafeArea()
// Use in inline styles if needed
```

## Testing

1. **Build the app:**
   ```bash
   npm run build
   npx cap sync
   ```

2. **Test on Android:**
   ```bash
   npx cap run android
   ```

3. **Test on iOS:**
   ```bash
   npx cap run ios
   ```

4. **Check these scenarios:**
   - Device with gesture navigation (no buttons)
   - Device with button navigation
   - Different screen sizes
   - Landscape and portrait modes

## Common Patterns

### Fixed Bottom Button
```tsx
<div className="fixed bottom-0 left-0 right-0 pb-safe-bottom bg-white">
  <button className="w-full p-4">Continue</button>
</div>
```

### Scrollable Content with Safe Bottom
```tsx
<div className="h-full overflow-y-auto pb-safe-bottom">
  {/* Scrollable content */}
</div>
```

### Full Screen with Safe Areas
```tsx
<div className="full-screen-page">
  {/* Already has safe area padding */}
</div>
```

## Browser Support

Safe area insets work on:
- ✅ iOS Safari (iPhone X and newer)
- ✅ Android Chrome (with proper WebView configuration)
- ✅ Capacitor apps (Android & iOS)
- ⚠️ Desktop browsers (falls back to 0px)

## Troubleshooting

### Issue: Bottom content still overlaps
**Solution:** Ensure you've rebuilt and synced:
```bash
npm run build
npx cap sync android
npx cap sync ios
```

### Issue: Safe area not detected on Android
**Solution:** Check MainActivity.java has `setDecorFitsSystemWindows(true)`

### Issue: Too much padding on some devices
**Solution:** Use `max()` function: `max(env(safe-area-inset-bottom), 16px)`

## References
- [CSS env() function](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
- [Capacitor Safe Areas](https://capacitorjs.com/docs/guides/screen-orientation)
- [iOS Safe Area](https://developer.apple.com/design/human-interface-guidelines/layout)
