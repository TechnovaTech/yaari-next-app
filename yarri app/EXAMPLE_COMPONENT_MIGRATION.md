# Example: Migrating Components to Use Safe Areas

## 🎯 Real-World Examples from Your App

### Example 1: Video Call Screen

#### Before (Hardcoded Padding)

```tsx
export default function VideoCallScreen() {
  return (
    <div className="fixed inset-0 bg-black">
      <div className="w-full h-full">
        <video className="w-full h-full object-cover" />
      </div>
      
      {/* ❌ Hardcoded pb-20 - will be cut off on some devices */}
      <div className="absolute bottom-0 left-0 right-0 pb-20">
        <div className="flex justify-center gap-4 py-4">
          <button className="bg-red-500 rounded-full p-4">
            End Call
          </button>
        </div>
      </div>
    </div>
  )
}
```

#### After (Safe Area Aware)

```tsx
export default function VideoCallScreen() {
  return (
    <div className="fixed inset-0 bg-black">
      <div className="w-full h-full">
        <video className="w-full h-full object-cover" />
      </div>
      
      {/* ✅ Uses safe area - adapts to all devices */}
      <div className="absolute bottom-0 left-0 right-0 pb-safe-bottom-extra">
        <div className="flex justify-center gap-4 py-4">
          <button className="bg-red-500 rounded-full p-4">
            End Call
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

### Example 2: Dashboard with Bottom Navigation

#### Before

```tsx
export default function DashboardScreen() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
      <div className="p-4 pb-24">
        <h1>Dashboard</h1>
        {/* Content */}
      </div>
      
      {/* ❌ Fixed bottom nav without safe area */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="flex justify-around py-3">
          <button>Home</button>
          <button>Profile</button>
        </div>
      </nav>
    </div>
  )
}
```

#### After

```tsx
export default function DashboardScreen() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ Content with safe bottom padding */}
      <div className="p-4 pb-safe-bottom-extra">
        <h1>Dashboard</h1>
        {/* Content */}
      </div>
      
      {/* ✅ Bottom nav with safe area */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t pb-safe-bottom">
        <div className="flex justify-around py-3">
          <button>Home</button>
          <button>Profile</button>
        </div>
      </nav>
    </div>
  )
}
```

---

### Example 3: User List with Scrolling

#### Before

```tsx
export default function UserListScreen() {
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-orange-500 text-white p-4">
        <h1>Users</h1>
      </header>
      
      {/* ❌ List without safe areas */}
      <div className="flex-1 overflow-y-auto pb-16">
        {users.map(user => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  )
}
```

#### After

```tsx
export default function UserListScreen() {
  return (
    <div className="h-screen flex flex-col">
      {/* ✅ Header with top safe area */}
      <header className="bg-orange-500 text-white p-4 pt-safe-top">
        <h1>Users</h1>
      </header>
      
      {/* ✅ List with bottom safe area */}
      <div className="flex-1 overflow-y-auto pb-safe-bottom-extra">
        {users.map(user => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  )
}
```

---

### Example 4: Modal with Bottom Button

#### Before

```tsx
export default function ConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end">
      <div className="bg-white rounded-t-2xl w-full p-6">
        <h2>Confirm Action</h2>
        <p>Are you sure?</p>
        
        {/* ❌ Buttons without safe area */}
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  )
}
```

#### After (Option 1: Tailwind Class)

```tsx
export default function ConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end">
      {/* ✅ Modal with safe bottom padding */}
      <div className="bg-white rounded-t-2xl w-full p-6 pb-safe-bottom-extra">
        <h2>Confirm Action</h2>
        <p>Are you sure?</p>
        
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  )
}
```

#### After (Option 2: SafeAreaWrapper)

```tsx
import SafeAreaWrapper from '@/components/SafeAreaWrapper'

export default function ConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end">
      <SafeAreaWrapper 
        applyTop={false} 
        applyBottom={true}
        extraBottomPadding={16}
        className="bg-white rounded-t-2xl w-full p-6"
      >
        <h2>Confirm Action</h2>
        <p>Are you sure?</p>
        
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onConfirm}>Confirm</button>
        </div>
      </SafeAreaWrapper>
    </div>
  )
}
```

---

### Example 5: Full-Screen Page with Header and Footer

#### Before

```tsx
export default function ProfilePage() {
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-orange-500 text-white p-4">
        <h1>Profile</h1>
      </header>
      
      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4">
        <ProfileForm />
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t p-4">
        <button className="w-full bg-orange-500 text-white py-3 rounded">
          Save Changes
        </button>
      </footer>
    </div>
  )
}
```

#### After

```tsx
export default function ProfilePage() {
  return (
    <div className="h-screen flex flex-col">
      {/* ✅ Header with top safe area */}
      <header className="bg-orange-500 text-white p-4 pt-safe-top">
        <h1>Profile</h1>
      </header>
      
      {/* Content - no safe area needed (scrollable) */}
      <main className="flex-1 overflow-y-auto p-4">
        <ProfileForm />
      </main>
      
      {/* ✅ Footer with bottom safe area */}
      <footer className="bg-white border-t p-4 pb-safe-bottom-extra">
        <button className="w-full bg-orange-500 text-white py-3 rounded">
          Save Changes
        </button>
      </footer>
    </div>
  )
}
```

---

### Example 6: Dynamic Padding with Hook

When you need more control:

```tsx
'use client'

import { useSafeArea } from '@/hooks/useSafeArea'

export default function CustomComponent() {
  const { insets, systemBarInfo } = useSafeArea()
  
  // Calculate custom padding based on device
  const bottomPadding = systemBarInfo.hasGestureNavigation
    ? insets.bottom + 8  // Less padding for gesture nav
    : insets.bottom + 16 // More padding for button nav
  
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-white"
      style={{ paddingBottom: bottomPadding }}
    >
      <button>Action Button</button>
    </div>
  )
}
```

---

### Example 7: Conditional Safe Area (Only on Mobile)

```tsx
'use client'

import { Capacitor } from '@capacitor/core'

export default function ResponsiveComponent() {
  const isMobile = Capacitor.isNativePlatform()
  
  return (
    <div className={`
      p-4 
      ${isMobile ? 'pb-safe-bottom-extra' : 'pb-4'}
    `}>
      {/* Content */}
    </div>
  )
}
```

---

### Example 8: Agora Video Call Integration

#### Before

```tsx
import AgoraRTC from 'agora-rtc-sdk-ng'

export default function AgoraCallScreen() {
  return (
    <div className="fixed inset-0 bg-black">
      {/* Remote video */}
      <div id="remote-video" className="w-full h-full" />
      
      {/* Local video (small) */}
      <div 
        id="local-video" 
        className="absolute top-4 right-4 w-32 h-48 rounded-lg overflow-hidden"
      />
      
      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-8">
        <div className="flex justify-center gap-4">
          <button className="bg-red-500 rounded-full p-4">
            End
          </button>
          <button className="bg-gray-700 rounded-full p-4">
            Mute
          </button>
        </div>
      </div>
    </div>
  )
}
```

#### After

```tsx
import AgoraRTC from 'agora-rtc-sdk-ng'

export default function AgoraCallScreen() {
  return (
    <div className="fixed inset-0 bg-black">
      {/* Remote video */}
      <div id="remote-video" className="w-full h-full" />
      
      {/* ✅ Local video with top safe area */}
      <div 
        id="local-video" 
        className="absolute right-4 w-32 h-48 rounded-lg overflow-hidden"
        style={{ top: 'calc(var(--safe-area-top) + 16px)' }}
      />
      
      {/* ✅ Controls with bottom safe area */}
      <div className="absolute bottom-0 left-0 right-0 pb-safe-bottom-extra">
        <div className="flex justify-center gap-4 py-4">
          <button className="bg-red-500 rounded-full p-4">
            End
          </button>
          <button className="bg-gray-700 rounded-full p-4">
            Mute
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 🔄 Migration Pattern Summary

### Step 1: Identify Fixed Elements

Look for:
- `fixed bottom-0`
- `absolute bottom-0`
- Hardcoded `pb-16`, `pb-20`, `pb-24`
- Headers with `fixed top-0`

### Step 2: Replace with Safe Area Classes

| Old | New |
|-----|-----|
| `pb-16` | `pb-safe-bottom-extra` |
| `pb-20` | `pb-safe-bottom-extra` |
| `pb-24` | `pb-safe-bottom-extra` |
| `pt-4` (header) | `pt-safe-top` |
| `fixed bottom-0` | `fixed bottom-0 pb-safe-bottom-extra` |
| `fixed top-0` | `fixed top-0 pt-safe-top` |

### Step 3: Test on Device

1. Build: `npm run build`
2. Sync: `npm run cap:sync`
3. Test on real device
4. Add `<SafeAreaDemo />` if values look wrong

---

## 🎨 Quick Reference

### When to Use Each Class

| Scenario | Class | Why |
|----------|-------|-----|
| Fixed bottom button | `pb-safe-bottom-extra` | Includes extra padding for transparent bars |
| Scrollable content | `pb-safe-bottom` | Standard bottom padding |
| Fixed header | `pt-safe-top` | Avoids status bar overlap |
| Full-screen video | `pb-safe-bottom-extra` | Controls need extra space |
| Modal from bottom | `pb-safe-bottom-extra` | Buttons need to be visible |
| Bottom navigation | `pb-safe-bottom` | Standard padding sufficient |

### CSS Variable Usage

```tsx
// Direct CSS variable
<div style={{ paddingBottom: 'var(--safe-bottom-extra)' }}>

// With calc()
<div style={{ paddingBottom: 'calc(var(--safe-area-bottom) + 16px)' }}>

// With max()
<div style={{ paddingBottom: 'max(var(--safe-area-bottom), 48px)' }}>
```

---

## ✅ Migration Checklist

For each component:

- [ ] Identify fixed/absolute positioned elements
- [ ] Replace hardcoded padding with safe area classes
- [ ] Test in portrait orientation
- [ ] Test in landscape orientation
- [ ] Test with keyboard open (if applicable)
- [ ] Verify on device with gesture navigation
- [ ] Verify on device with button navigation

---

**Ready to migrate?** Start with your most-used screens (video call, dashboard, user list) and work your way through the app! 🚀
