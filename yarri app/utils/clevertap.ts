import { CleverTap } from '@awesome-cordova-plugins/clevertap'
import { Capacitor } from '@capacitor/core'

// Inline CleverTap credentials (do NOT use env)
const CLEVERTAP_ACCOUNT_ID = '775-RZ7-W67Z'
const CLEVERTAP_PROJECT_TOKEN = 'a12-5aa' // reserved for server-side; not used in web SDK
const CLEVERTAP_PASSCODE = 'UFO-IOX-YEEL' // reserved; not used in web SDK
const CLEVERTAP_REGION = 'eu1'

declare global {
  interface Window {
    clevertap?: any
  }
}

// Initialize CleverTap Web SDK when not running natively
const ensureCleverTapWeb = () => {
  if (typeof window === 'undefined') return
  if (Capacitor.isNativePlatform()) return
  const w = window as any
  if (w.clevertap) return
  w.clevertap = {
    // per official web snippet
    event: [],
    profile: [],
    account: [],
    onUserLogin: [],
    region: CLEVERTAP_REGION,
  }
  // Push account id before SDK loads so clevertap.account[0].id exists
  w.clevertap.account.push({ id: CLEVERTAP_ACCOUNT_ID })

  const s = document.createElement('script')
  s.src = 'https://static.clevertap.com/js/clevertap.min.js'
  s.type = 'text/javascript'
  s.async = true
  s.onload = () => console.log('CleverTap Web SDK loaded')
  s.onerror = (e) => console.error('CleverTap Web SDK load failed:', e)
  const firstScript = document.getElementsByTagName('script')[0]
  ;(firstScript?.parentNode || document.head).insertBefore(s, firstScript || null)
}

ensureCleverTapWeb()

// Check if CleverTap is available on native builds
const isCleverTapAvailable = () => {
  return Capacitor.isNativePlatform()
}

export const updateUserProfile = async (userProfile: {
  Name?: string
  Email?: string
  Phone?: string
  Gender?: string
  Age?: number
  City?: string
  [key: string]: any
}) => {
  if (isCleverTapAvailable()) {
    try {
      await CleverTap.profileSet(userProfile)
    } catch (e) {
      console.log('CleverTap profileSet error:', e)
    }
  } else {
    try {
      window.clevertap?.profile?.push({ Site: userProfile })
    } catch (e) {
      console.log('Web CleverTap profile push error:', e)
    }
  }
}

export const trackUserLogin = async (userIdentity: string, userProfile?: any) => {
  if (isCleverTapAvailable()) {
    try {
      const profile = { Identity: userIdentity, ...(userProfile || {}) }
      await CleverTap.onUserLogin(profile)
    } catch (e) {
      console.log('CleverTap onUserLogin error:', e)
    }
  } else {
    try {
      const profile = { Identity: userIdentity, ...(userProfile || {}) }
      window.clevertap?.onUserLogin?.push({ Site: profile })
    } catch (e) {
      console.log('Web CleverTap onUserLogin error:', e)
    }
  }
}

export const trackEvent = async (eventName: string, eventData?: any) => {
  if (isCleverTapAvailable()) {
    try {
      if (eventData && Object.keys(eventData).length > 0) {
        await CleverTap.recordEventWithNameAndProps(eventName, eventData)
      } else {
        await CleverTap.recordEventWithName(eventName)
      }
    } catch (e) {
      console.log('CleverTap recordEvent error:', e)
    }
  } else {
    try {
      if (eventData && Object.keys(eventData).length > 0) {
        window.clevertap?.event?.push(eventName, eventData)
      } else {
        window.clevertap?.event?.push(eventName)
      }
    } catch (e) {
      console.log('Web CleverTap event push error:', e)
    }
  }
}

export const trackProfileView = async (viewedUserId: string) => {
  await trackEvent('Profile Viewed', { 'Viewed User ID': viewedUserId })
}

export const trackLike = async (likedUserId: string) => {
  await trackEvent('User Liked', { 'Liked User ID': likedUserId })
}

export const trackMatch = async (matchedUserId: string) => {
  await trackEvent('User Matched', { 'Matched User ID': matchedUserId })
}

export const trackMessage = async (recipientUserId: string, messageType: 'text' | 'image' | 'voice') => {
  await trackEvent('Message Sent', { 'Recipient User ID': recipientUserId, 'Message Type': messageType })
}

export const trackSubscription = async (planName: string, amount: number, currency: string) => {
  await trackEvent('Subscription Purchased', { 'Plan Name': planName, Amount: amount, Currency: currency })
}

export const trackAppOpen = async () => {
  if (isCleverTapAvailable()) {
    try {
      await CleverTap.notifyDeviceReady()
      await CleverTap.recordEventWithName('App Open')
    } catch (e) {
      console.log('CleverTap notifyDeviceReady/App Open error:', e)
    }
  } else {
    try {
      window.clevertap?.event?.push('App Open')
    } catch (e) {
      console.log('Web CleverTap App Open error:', e)
    }
  }
}

export const trackScreenView = async (screenName: string) => {
  await trackEvent('Screen View', { 'Screen Name': screenName })
}

export const enablePushNotifications = async () => {
  // Push setup is handled via FCM with google-services.json; no-op here
  console.log('enablePushNotifications: ensure FCM configured (google-services.json)')
}

export const updateUserLocation = async (city: string, state?: string, country?: string) => {
  await trackEvent('Location Updated', { City: city, State: state, Country: country })
}