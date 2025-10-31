'use client';

import { useEffect } from 'react';
import { CleverTap } from '@awesome-cordova-plugins/clevertap';
import { Capacitor } from '@capacitor/core';
import { trackAppOpen } from '@/utils/clevertap'

export default function CleverTapInit() {
  useEffect(() => {
    const initializeCleverTap = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await CleverTap.setDebugLevel(3)
          await CleverTap.notifyDeviceReady()
          // Lightweight default profile to ensure SDK starts tracking
          await CleverTap.onUserLogin({
            Name: 'Yaari User',
            Identity: Date.now().toString(),
          })
          // Track initial app open session
          await trackAppOpen()
          console.log('CleverTap initialized')
        } catch (error) {
          console.error('CleverTap initialization failed:', error)
        }
      } else {
        // Initialize web CleverTap and track session
        await trackAppOpen()
        try {
          (window as any).clevertap?.onUserLogin?.push({
            Name: 'Yaari User',
            Identity: Date.now().toString(),
          })
        } catch (e) {
          console.log('Web CleverTap onUserLogin error:', e)
        }
      }
    };

    initializeCleverTap();
  }, []);

  return null; // This component doesn't render anything
}