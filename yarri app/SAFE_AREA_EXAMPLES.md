# Safe Area Usage Examples

## Example 1: Screen with Fixed Bottom Button

```tsx
export default function MyScreen() {
  return (
    <div className="h-full flex flex-col">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4">
        <h1>My Content</h1>
        {/* Your content here */}
      </div>
      
      {/* Fixed bottom button with safe area */}
      <div className="pb-safe-bottom px-4 py-3 bg-white border-t">
        <button className="w-full bg-primary text-white py-3 rounded-lg">
          Continue
        </button>
      </div>
    </div>
  )
}
```

## Example 2: Full Screen with Bottom Navigation

```tsx
export default function DashboardScreen() {
  return (
    <div className="h-full flex flex-col">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* Content */}
      </div>
      
      {/* Bottom navigation with safe area */}
      <nav className="flex justify-around pb-safe-bottom pt-2 bg-white border-t">
        <button>Home</button>
        <button>Profile</button>
        <button>Settings</button>
      </nav>
    </div>
  )
}
```

## Example 3: Using SafeAreaWrapper Component

```tsx
import SafeAreaWrapper from '@/components/SafeAreaWrapper'

export default function ProfileScreen() {
  return (
    <SafeAreaWrapper applyBottom={true} className="h-full">
      <div className="p-4">
        <h1>Profile</h1>
        {/* Content */}
      </div>
    </SafeAreaWrapper>
  )
}
```

## Example 4: Modal with Safe Bottom

```tsx
export default function BottomSheet({ isOpen, onClose }) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end">
      <div className="bg-white w-full rounded-t-2xl pb-safe-bottom">
        <div className="p-4">
          <h2>Modal Title</h2>
          {/* Modal content */}
        </div>
        <button 
          onClick={onClose}
          className="w-full p-4 bg-primary text-white"
        >
          Close
        </button>
      </div>
    </div>
  )
}
```

## Example 5: Using the Hook for Dynamic Styles

```tsx
'use client'
import { useSafeArea } from '@/hooks/useSafeArea'

export default function CustomComponent() {
  const { bottom } = useSafeArea()
  
  return (
    <div 
      style={{ 
        paddingBottom: `${Math.max(bottom, 16)}px` 
      }}
    >
      {/* Content */}
    </div>
  )
}
```

## Quick Reference

| Use Case | Solution |
|----------|----------|
| Fixed bottom button | `pb-safe-bottom` on container |
| Bottom navigation | `pb-safe-bottom` on nav element |
| Full screen content | Use `.mobile-container` (already has safe area) |
| Modal/Bottom sheet | `pb-safe-bottom` on modal container |
| Custom padding | Use `useSafeArea()` hook |
