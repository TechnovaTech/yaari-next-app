import { CleverTap } from '@awesome-cordova-plugins/clevertap'
import { Capacitor } from '@capacitor/core'

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
    console.log('updateUserProfile (web/no-native):', userProfile)
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
    console.log('trackUserLogin (web/no-native):', userIdentity, userProfile)
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
    console.log('trackEvent (web/no-native):', eventName, eventData)
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
    console.log('trackAppOpen (web/no-native)')
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