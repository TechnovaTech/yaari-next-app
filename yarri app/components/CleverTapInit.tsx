'use client';

import { useEffect } from 'react';
import { CleverTap } from '@awesome-cordova-plugins/clevertap';
import { Capacitor } from '@capacitor/core';

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
          console.log('CleverTap initialized')
        } catch (error) {
          console.error('CleverTap initialization failed:', error)
        }
      } else {
        console.log('CleverTap skipped - web platform')
      }
    };

    initializeCleverTap();
  }, []);

  return null; // This component doesn't render anything
}