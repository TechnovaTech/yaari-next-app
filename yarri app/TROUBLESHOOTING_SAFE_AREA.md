# Safe Area Troubleshooting Guide

## 🔍 Common Issues & Solutions

### Issue 1: Bottom content still cut off on some devices

**Symptoms:**
- Bottom buttons hidden behind navigation bar
- Content not visible on gesture navigation devices

**Diagnosis:**
```tsx
// Add debug component to see actual values
import SafeAreaDemo from '@/components/SafeAreaDemo'
<SafeAreaDemo />
```

**Solutions:**

1. **Use `pb-safe-bottom-extra` instead of `pb-safe-bottom`:**
   ```tsx
   <div className="pb-safe-bottom-extra">
     {/* This includes extra padding for transparent bars */}
   </div>
   ```

2. **Check if SafeAreaInit is loaded:**
   ```tsx
   // In layout.tsx, ensure SafeAreaInit is BEFORE other components
   <SafeAreaInit />
   <StatusBarInit />
   ```

3. **Verify Capacitor config:**
   ```json
   "StatusBar": {
     "overlaysWebView": false  // ← Must be false
   }
   ```

---

### Issue 2: CSS variables are 0px

**Symptoms:**
- `--safe-area-bottom` shows 0px in DevTools
- Padding not applied

**Diagnosis:**
```javascript
// In browser console
console.log(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-bottom'))
```

**Solutions:**

1. **Ensure SafeAreaManager is initialized:**
   ```tsx
   // Check if SafeAreaInit is in layout.tsx
   import SafeAreaInit from '../components/SafeAreaInit'
   ```

2. **Verify StatusBar plugin:**
   ```bash
   npm list @capacitor/status-bar
   npm run cap:sync
   ```

3. **Verify viewport meta tag:**
   ```tsx
   // In layout.tsx, check viewport export
   export const viewport = {
     viewportFit: 'cover',  // ← Required
   }
   ```

---

### Issue 3: Status bar overlaps content

**Symptoms:**
- Top content hidden behind status bar
- Header not visible

**Solutions:**

1. **Add top safe area padding:**
   ```tsx
   <header className="pt-safe-top">
     {/* Header content */}
   </header>
   ```

2. **Use SafeAreaWrapper:**
   ```tsx
   <SafeAreaWrapper applyTop={true}>
     <YourContent />
   </SafeAreaWrapper>
   ```

3. **Check StatusBar config:**
   ```json
   "StatusBar": {
     "overlaysWebView": false  // ← Should be false for consistent behavior
   }
   ```

---

### Issue 4: Different behavior on Android vs iOS

**Symptoms:**
- Works on iOS, broken on Android
- Inconsistent padding

**Solutions:**

1. **Use CSS variables instead of env():**
   ```css
   /* ❌ Don't use env() directly on Android */
   padding-bottom: env(safe-area-inset-bottom);
   
   /* ✅ Use CSS variables set by SafeAreaManager */
   padding-bottom: var(--safe-area-bottom);
   ```

2. **Check Android WebView version:**
   ```bash
   # In Android Studio or via adb
   adb shell dumpsys webview
   ```
   Update WebView if version < 90.

3. **Test with overlaysWebView: false:**
   ```json
   "StatusBar": {
     "overlaysWebView": false
   }
   ```

---

### Issue 5: Insets not updating on orientation change

**Symptoms:**
- Padding correct in portrait, wrong in landscape
- Values don't update on rotation

**Solutions:**

1. **SafeAreaManager handles this automatically**, but verify:
   ```typescript
   // Check if listeners are set up (in safeAreaManager.ts)
   window.addEventListener('resize', () => this.handleResize())
   window.addEventListener('orientationchange', () => this.handleResize())
   ```

2. **Force re-render in your component:**
   ```tsx
   const { insets } = useSafeArea()
   // This hook automatically subscribes to updates
   ```

---

### Issue 6: Keyboard pushes content up incorrectly

**Symptoms:**
- Content jumps when keyboard opens
- Bottom padding too large with keyboard

**Solutions:**

1. **Check Keyboard plugin config:**
   ```json
   "Keyboard": {
     "resize": "native"  // ← Use native resize behavior
   }
   ```

2. **Use viewport units:**
   ```css
   height: 100dvh;  /* Dynamic viewport height */
   ```

---

### Issue 7: Xiaomi/Samsung specific issues

**Symptoms:**
- Works on Pixel, broken on Xiaomi/Samsung
- Gesture bar height incorrect

**Solutions:**

1. **SafeAreaManager handles OEM quirks automatically** via CSS env() and viewport detection.

2. **Test with debug component:**
   ```tsx
   <SafeAreaDemo />
   // Check if "Gesture Nav" shows correct value
   ```

3. **Manual override if needed:**
   ```tsx
   const { insets, systemBarInfo } = useSafeArea()
   const bottomPadding = systemBarInfo.hasGestureNavigation 
     ? Math.max(insets.bottom, 20)  // Min 20px for gesture bar
     : Math.max(insets.bottom, 48)  // Min 48px for button bar
   ```

---

### Issue 8: Transparent navigation bar not detected

**Symptoms:**
- `isNavigationBarTransparent` always false
- Extra padding not applied

**Solutions:**

1. **Check StatusBar config:**
   ```json
   "StatusBar": {
     "overlaysWebView": false
   }
   ```

2. **Manually toggle transparency:**
   ```tsx
   import { safeAreaManager } from '@/utils/safeAreaManager'
   
   await safeAreaManager.setNavigationBarTransparent(true)
   ```

---

## 🧪 Testing Checklist

### Before Releasing

- [ ] Test on Android with gesture navigation
- [ ] Test on Android with button navigation
- [ ] Test on iPhone with notch (X, 11, 12, 13, 14, 15)
- [ ] Test on iPhone without notch (SE, 8)
- [ ] Test portrait and landscape orientations
- [ ] Test with keyboard open
- [ ] Test on Xiaomi device (MIUI)
- [ ] Test on Samsung device (One UI)
- [ ] Test on Google Pixel (stock Android)
- [ ] Test full-screen video call UI
- [ ] Test scrollable content pages
- [ ] Test fixed bottom navigation

### Debug Commands

```bash
# Sync Capacitor
npm run cap:sync

# Build and open Android Studio
npm run android

# Check WebView version on device
adb shell dumpsys webview

# View logs
adb logcat | grep -i capacitor

# Remote debug
chrome://inspect
```

---

## 🆘 Still Having Issues?

### 1. Check Installation

```bash
cd "yarri app"
npm list @capacitor/status-bar
```

Should be installed. If not:
```bash
npm install @capacitor/status-bar
npm run cap:sync
```

### 2. Verify File Structure

Ensure these files exist:
- ✅ `utils/safeAreaManager.ts`
- ✅ `hooks/useSafeArea.ts`
- ✅ `components/SafeAreaInit.tsx`
- ✅ `components/SafeAreaWrapper.tsx`
- ✅ `capacitor.config.json` (with SafeArea plugin config)

### 3. Check Initialization Order

In `layout.tsx`:
```tsx
<SafeAreaInit />      {/* 1. Initialize safe area detection */}
<StatusBarInit />     {/* 2. Set status bar style */}
<NativeStatusBar />   {/* 3. Other status bar logic */}
```

### 4. Inspect CSS Variables

In Chrome DevTools (remote debugging):
```javascript
// Check if variables are set
const root = document.documentElement
console.log('Top:', root.style.getPropertyValue('--safe-area-top'))
console.log('Bottom:', root.style.getPropertyValue('--safe-area-bottom'))
console.log('Extra:', root.style.getPropertyValue('--safe-bottom-extra'))
```

### 5. Force Rebuild

```bash
cd "yarri app"
rm -rf node_modules package-lock.json
npm install
npm run build
npm run cap:sync
```

---

## 📞 Quick Fixes

### Fix 1: Force minimum bottom padding

```tsx
<div style={{ 
  paddingBottom: `max(var(--safe-area-bottom), 48px)` 
}}>
  Content
</div>
```

### Fix 2: Use SafeAreaWrapper everywhere

```tsx
// Wrap all page content
<SafeAreaWrapper applyBottom={true} extraBottomPadding={16}>
  <YourPageContent />
</SafeAreaWrapper>
```

### Fix 3: Use opaque bars

```json
// In capacitor.config.json
"StatusBar": {
  "overlaysWebView": false
}
```

This forces opaque bars, which are more predictable.

---

## 🎯 Expected Values by Device

| Device | Top Inset | Bottom Inset | Notes |
|--------|-----------|--------------|-------|
| iPhone 14 Pro | 59px | 34px | Dynamic Island |
| iPhone 13 | 47px | 34px | Notch |
| iPhone SE | 20px | 0px | No notch |
| Pixel 7 (gesture) | 24px | 20px | Gesture bar |
| Pixel 7 (buttons) | 24px | 48px | Button nav |
| Samsung S23 (gesture) | 28px | 24px | One UI gesture |
| Xiaomi 13 (gesture) | 30px | 20px | MIUI gesture |

Use these values to verify your device is reporting correctly.
