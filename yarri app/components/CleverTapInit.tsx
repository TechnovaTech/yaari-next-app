'use client';

import { useEffect } from 'react';
import { CleverTap } from '@awesome-cordova-plugins/clevertap';
import { Capacitor } from '@capacitor/core';
import { trackAppOpen, trackUserLogin } from '@/utils/clevertap'
import { initMixpanel, mixpanelIdentify, mixpanelPeopleSet } from '@/utils/mixpanel'

export default function CleverTapInit() {
  useEffect(() => {
    const initializeCleverTap = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await CleverTap.setDebugLevel(3)
          await CleverTap.notifyDeviceReady()
          // Track initial app open session
          await trackAppOpen()
          // If we already have a known user, set identity; otherwise skip
          try {
            const stored = localStorage.getItem('user') || localStorage.getItem('phone')
            if (stored) {
              const parsed = (() => { try { return JSON.parse(stored as string) } catch { return {} } })()
              const identity = parsed?.id || parsed?.phone || stored
              await trackUserLogin(identity as string, {
                Name: parsed?.name,
                Email: parsed?.email,
                Phone: parsed?.phone,
              })
            }
          } catch {}
          console.log('CleverTap initialized')
          console.log('CleverTap initialized')
        } catch (error) {
          console.error('CleverTap initialization failed:', error)
        }
      } else {
        // Initialize web CleverTap and track session
        await trackAppOpen()
        initMixpanel()
        try {
          const storedUser = localStorage.getItem('user')
          const storedPhone = localStorage.getItem('phone')
          if (storedUser || storedPhone) {
            const parsed = storedUser ? (() => { try { return JSON.parse(storedUser) } catch { return {} } })() : {}
            const identity = parsed?.id || parsed?.phone || storedPhone
            await trackUserLogin(identity as string, {
              Name: parsed?.name,
              Email: parsed?.email,
              Phone: parsed?.phone,
            })
            // Also identify in Mixpanel
            if (identity) {
              mixpanelIdentify(String(identity))
              mixpanelPeopleSet({ Name: parsed?.name, Email: parsed?.email, Phone: parsed?.phone })
            }
          }
        } catch (e) {
          console.log('Web CleverTap onUserLogin error:', e)
        }
      }
    };

    initializeCleverTap();
  }, []);

  return null; // This component doesn't render anything
}