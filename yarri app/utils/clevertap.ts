// import { CleverTap } from '@awesome-cordova-plugins/clevertap'
// import { Capacitor } from '@capacitor/core'

// Check if CleverTap is available
const isCleverTapAvailable = () => {
  // return Capacitor.isNativePlatform()
  return false // Temporarily disabled for build
}

// Stub functions for build compatibility (CleverTap temporarily disabled)
export const updateUserProfile = async (userProfile: {
  Name?: string
  Email?: string
  Phone?: string
  Gender?: string
  Age?: number
  City?: string
  [key: string]: any
}) => {
  console.log('updateUserProfile (CleverTap disabled):', userProfile)
}

export const trackUserLogin = async (userIdentity: string, userProfile?: any) => {
  console.log('trackUserLogin (CleverTap disabled):', userIdentity, userProfile)
}

export const trackEvent = async (eventName: string, eventData?: any) => {
  console.log('trackEvent (CleverTap disabled):', eventName, eventData)
}

export const trackProfileView = async (viewedUserId: string) => {
  console.log('trackProfileView (CleverTap disabled):', viewedUserId)
}

export const trackLike = async (likedUserId: string) => {
  console.log('trackLike (CleverTap disabled):', likedUserId)
}

export const trackMatch = async (matchedUserId: string) => {
  console.log('trackMatch (CleverTap disabled):', matchedUserId)
}

export const trackMessage = async (recipientUserId: string, messageType: 'text' | 'image' | 'voice') => {
  console.log('trackMessage (CleverTap disabled):', recipientUserId, messageType)
}

export const trackSubscription = async (planName: string, amount: number, currency: string) => {
  console.log('trackSubscription (CleverTap disabled):', planName, amount, currency)
}

export const trackAppOpen = async () => {
  console.log('trackAppOpen (CleverTap disabled)')
}

export const trackScreenView = async (screenName: string) => {
  console.log('trackScreenView (CleverTap disabled):', screenName)
}

export const enablePushNotifications = async () => {
  console.log('enablePushNotifications (CleverTap disabled)')
}

export const updateUserLocation = async (city: string, state?: string, country?: string) => {
  console.log('updateUserLocation (CleverTap disabled):', city, state, country)
}