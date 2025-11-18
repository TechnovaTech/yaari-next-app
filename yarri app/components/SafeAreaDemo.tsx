'use client'

import { useSafeArea } from '@/hooks/useSafeArea'
import { safeAreaManager } from '@/utils/safeAreaManager'

export default function SafeAreaDemo() {
  const { insets, systemBarInfo } = useSafeArea()

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-3 rounded-lg max-w-xs z-50">
      <div className="font-bold mb-2">Safe Area Debug</div>
      <div>Top: {insets.top}px</div>
      <div>Bottom: {insets.bottom}px</div>
      <div>Left: {insets.left}px</div>
      <div>Right: {insets.right}px</div>
      <div className="mt-2 pt-2 border-t border-white/30">
        <div>Status Bar: {systemBarInfo.statusBarHeight}px</div>
        <div>Nav Bar: {systemBarInfo.navigationBarHeight}px</div>
        <div>Gesture Nav: {systemBarInfo.hasGestureNavigation ? 'Yes' : 'No'}</div>
        <div>Transparent Nav: {systemBarInfo.isNavigationBarTransparent ? 'Yes' : 'No'}</div>
      </div>
      <button 
        onClick={() => safeAreaManager.setNavigationBarTransparent(true)}
        className="mt-2 bg-blue-500 px-2 py-1 rounded text-xs w-full"
      >
        Toggle Nav Transparent
      </button>
    </div>
  )
}
