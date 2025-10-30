'use client';

import { useEffect } from 'react';
// import { CleverTap } from '@awesome-cordova-plugins/clevertap';
// import { Capacitor } from '@capacitor/core';

export default function CleverTapInit() {
  useEffect(() => {
    const initializeCleverTap = async () => {
      // CleverTap temporarily disabled for build
      console.log('CleverTap initialization skipped - building without CleverTap');
      
      // if (Capacitor.isNativePlatform()) {
      //   try {
      //     // Enable debug logging (remove in production)
      //     await CleverTap.setDebugLevel(3)
      //     
      //     // Set user properties
      //     await CleverTap.onUserLogin({
      //       'Name': 'User',
      //       'Identity': Date.now().toString(),
      //       'Email': 'user@example.com'
      //     })
      //     
      //     console.log('CleverTap initialized successfully')
      //   } catch (error) {
      //     console.error('CleverTap initialization failed:', error)
      //   }
      // }
    };

    initializeCleverTap();
  }, []);

  return null; // This component doesn't render anything
}