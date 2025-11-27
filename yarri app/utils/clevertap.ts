import { CleverTap } from '@awesome-cordova-plugins/clevertap'
import { Capacitor } from '@capacitor/core'
import { initMixpanel, mixpanelTrack, mixpanelIdentify, mixpanelPeopleSet } from './mixpanel'

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

// Detect if native CleverTap plugin is actually available
const isNativeCleverTapReady = (): boolean => {
  try {
    // In Capacitor native builds, plugin methods should exist
    return (
      Capacitor.isNativePlatform() &&
      typeof (CleverTap as any)?.notifyDeviceReady === 'function' &&
      typeof (CleverTap as any)?.recordEventWithName === 'function'
    )
  } catch {
    return false
  }
}

// Initialize CleverTap Web SDK when not running natively OR when native plugin is missing
const ensureCleverTapWeb = () => {
  if (typeof window === 'undefined') return
  // If native plugin isn’t ready, fall back to Web SDK even inside WebView
  const shouldUseWebSDK = !isNativeCleverTapReady()
  if (!shouldUseWebSDK) return
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
// Initialize Mixpanel too (web/Capacitor webview)
initMixpanel()

// Check if CleverTap native plugin is available
const isCleverTapAvailable = () => {
  return isNativeCleverTapReady()
}

// Normalize phone to E.164 format expected by CleverTap (+[country][number])
const formatPhoneE164 = (raw?: string): string | undefined => {
  if (!raw) return undefined
  const trimmed = String(raw).trim()
  if (trimmed.startsWith('+')) {
    // Assume already E.164
    return trimmed
  }
  const digits = trimmed.replace(/[^0-9]/g, '')
  // Default to India if 10-digit local number
  if (digits.length === 10) return `+91${digits}`
  // Handle numbers like 91XXXXXXXXXX (12 digits)
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  // Unknown format -> let SDK drop it
  return undefined
}

export const updateUserProfile = async (userProfile: {
  Name?: string
  Email?: string
  Phone?: string
  Gender?: string
  Age?: number
  City?: string
  Identity?: string
  [key: string]: any
}) => {
  const profileForPush = { ...userProfile }
  const normalizedPhone = formatPhoneE164(userProfile.Phone)
  if (normalizedPhone) profileForPush.Phone = normalizedPhone
  else delete profileForPush.Phone

  // Add MSG-push and MSG-email flags for CleverTap
  profileForPush['MSG-push'] = true
  profileForPush['MSG-email'] = true
  profileForPush['MSG-sms'] = true

  // Also push to Mixpanel people
  try {
    mixpanelPeopleSet(profileForPush)
  } catch {}

  if (isCleverTapAvailable()) {
    try {
      await CleverTap.profileSet(profileForPush)
      console.log('✅ CleverTap profile updated:', profileForPush)
    } catch (e) {
      console.log('CleverTap profileSet error:', e)
    }
  } else {
    try {
      window.clevertap?.profile?.push({ Site: profileForPush })
      console.log('✅ Web CleverTap profile updated:', profileForPush)
    } catch (e) {
      console.log('Web CleverTap profile push error:', e)
    }
  }
}

export const trackUserLogin = async (userIdentity: string, userProfile?: any) => {
  const profile = { Identity: userIdentity, ...(userProfile || {}) }
  const normalizedPhone = formatPhoneE164(profile.Phone)
  if (normalizedPhone) profile.Phone = normalizedPhone
  else delete profile.Phone

  // Add MSG-push and MSG-email flags
  profile['MSG-push'] = true
  profile['MSG-email'] = true
  profile['MSG-sms'] = true

  // Forward to Mixpanel: identify and people (non-blocking)
  try {
    mixpanelIdentify(userIdentity)
    if (profile) mixpanelPeopleSet(profile)
  } catch {}

  if (isCleverTapAvailable()) {
    try {
      // Track login event with timeout
      const loginPromise = CleverTap.onUserLogin(profile)
      
      // Set a timeout to prevent hanging
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error('CleverTap login timeout')), 5000)
      })
      
      await Promise.race([loginPromise, timeoutPromise])
      console.log('✅ CleverTap user login tracked:', userIdentity)
      
      // Update user profile after login
      await updateUserProfile(userProfile || {})
    } catch (e) {
      console.log('CleverTap onUserLogin error:', e)
      // Don't throw error to prevent blocking UI
    }
  } else {
    try {
      window.clevertap?.onUserLogin?.push({ Site: profile })
      console.log('✅ Web CleverTap user login tracked:', userIdentity)
      
      // Update user profile after login
      await updateUserProfile(userProfile || {})
    } catch (e) {
      console.log('Web CleverTap onUserLogin error:', e)
    }
  }
}

export const trackEvent = async (eventName: string, eventData: any = {}) => {
  try {
    // Add timestamp to all events
    const enrichedData = {
      ...eventData,
      timestamp: new Date().toISOString(),
      platform: Capacitor.isNativePlatform() ? 'mobile' : 'web'
    }

    // Track with timeout protection
    const trackingPromise = new Promise<void>((resolve, reject) => {
      try {
        if (isCleverTapAvailable()) {
          if (enrichedData && Object.keys(enrichedData).length > 0) {
            CleverTap.recordEventWithNameAndProps(eventName, enrichedData)
          } else {
            CleverTap.recordEventWithName(eventName)
          }
        } else {
          if (enrichedData && Object.keys(enrichedData).length > 0) {
            window.clevertap?.event?.push(eventName, enrichedData)
          } else {
            window.clevertap?.event?.push(eventName)
          }
        }
        resolve()
      } catch (error) {
        reject(error)
      }
    })
    
    // Set a timeout to prevent hanging
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('CleverTap event timeout')), 3000)
    })
    
    await Promise.race([trackingPromise, timeoutPromise])
    
    // Also track with Mixpanel (non-blocking)
    mixpanelTrack(eventName, enrichedData)
    
    console.log(`✅ Event tracked: ${eventName}`, enrichedData)
  } catch (error) {
    console.error('Error tracking event:', error)
    // Don't throw error to prevent blocking UI
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
  // Forward to Mixpanel
  try {
    mixpanelTrack('App Open')
  } catch {}

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