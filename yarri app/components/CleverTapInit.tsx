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
          console.log('🚀 Initializing CleverTap Native SDK...')
          await CleverTap.setDebugLevel(3)
          await CleverTap.notifyDeviceReady()
          console.log('✅ CleverTap Native SDK ready')
          
          await trackAppOpen()
          
          try {
            const storedUser = localStorage.getItem('user')
            const storedPhone = localStorage.getItem('phone')
            
            if (storedUser) {
              const user = JSON.parse(storedUser)
              const identity = user?.id || user?.phone || user?._id
              
              if (identity) {
                console.log('👤 Found existing user, tracking login:', identity)
                await trackUserLogin(identity, {
                  Name: user?.name,
                  Email: user?.email,
                  Phone: user?.phone,
                  Gender: user?.gender,
                  Age: user?.age,
                  City: user?.city,
                  'Profile Picture': user?.profilePic,
                  'Coins Balance': user?.coins || 0,
                  'User Type': user?.isPremium ? 'Premium' : 'Free'
                })
              }
            } else if (storedPhone) {
              console.log('📱 Found phone number, tracking login:', storedPhone)
              await trackUserLogin(storedPhone, {
                Phone: storedPhone
              })
            }
          } catch (e) {
            console.log('Error loading user data:', e)
          }
          
          console.log('✅ CleverTap initialized successfully')
        } catch (error) {
          console.error('❌ CleverTap initialization failed:', error)
        }
      } else {
        console.log('🌐 Initializing CleverTap Web SDK...')
        await trackAppOpen()
        initMixpanel()
        
        try {
          const storedUser = localStorage.getItem('user')
          const storedPhone = localStorage.getItem('phone')
          
          if (storedUser) {
            const user = JSON.parse(storedUser)
            const identity = user?.id || user?.phone || user?._id
            
            if (identity) {
              console.log('👤 Found existing user, tracking login:', identity)
              await trackUserLogin(identity, {
                Name: user?.name,
                Email: user?.email,
                Phone: user?.phone,
                Gender: user?.gender,
                Age: user?.age,
                City: user?.city,
                'Profile Picture': user?.profilePic,
                'Coins Balance': user?.coins || 0,
                'User Type': user?.isPremium ? 'Premium' : 'Free'
              })
              
              mixpanelIdentify(String(identity))
              mixpanelPeopleSet({
                Name: user?.name,
                Email: user?.email,
                Phone: user?.phone,
                Gender: user?.gender,
                Age: user?.age,
                City: user?.city
              })
            }
          } else if (storedPhone) {
            console.log('📱 Found phone number, tracking login:', storedPhone)
            await trackUserLogin(storedPhone, {
              Phone: storedPhone
            })
          }
          
          console.log('✅ Web CleverTap initialized successfully')
        } catch (e) {
          console.log('Web CleverTap onUserLogin error:', e)
        }
      }
    };

    initializeCleverTap();
  }, []);

  return null;
}