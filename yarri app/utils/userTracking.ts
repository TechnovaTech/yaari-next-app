import { trackUserLogin, updateUserProfile, trackEvent } from './clevertap'

/**
 * Sync user data to CleverTap whenever user profile is updated
 */
export const syncUserToCleverTap = async () => {
  try {
    const storedUser = localStorage.getItem('user')
    if (!storedUser) return

    const user = JSON.parse(storedUser)
    const identity = user?.id || user?._id || user?.phone

    if (!identity) {
      console.log('⚠️ No user identity found, skipping CleverTap sync')
      return
    }

    console.log('🔄 Syncing user to CleverTap:', identity)

    await updateUserProfile({
      Identity: identity,
      Name: user?.name,
      Email: user?.email,
      Phone: user?.phone,
      Gender: user?.gender,
      Age: user?.age,
      City: user?.city,
      'Profile Picture': user?.profilePic,
      'Coins Balance': user?.coins || 0,
      'User Type': user?.isPremium ? 'Premium' : 'Free',
      'Last Updated': new Date().toISOString()
    })

    console.log('✅ User synced to CleverTap successfully')
  } catch (error) {
    console.error('❌ Error syncing user to CleverTap:', error)
  }
}

/**
 * Track coin purchase
 */
export const trackCoinPurchase = async (amount: number, coins: number, paymentMethod: string) => {
  await trackEvent('Coin Purchase', {
    Amount: amount,
    Coins: coins,
    'Payment Method': paymentMethod,
    'Purchase Date': new Date().toISOString()
  })
  
  // Update user profile with new coin balance
  await syncUserToCleverTap()
}

/**
 * Track call events
 */
export const trackCallEvent = async (callType: 'audio' | 'video', action: 'initiated' | 'received' | 'accepted' | 'rejected' | 'ended', otherUserId?: string, duration?: number) => {
  await trackEvent(`Call ${action}`, {
    'Call Type': callType,
    'Other User ID': otherUserId,
    Duration: duration,
    Timestamp: new Date().toISOString()
  })
}

/**
 * Track profile updates
 */
export const trackProfileUpdate = async (updatedFields: string[]) => {
  await trackEvent('Profile Updated', {
    'Updated Fields': updatedFields.join(', '),
    Timestamp: new Date().toISOString()
  })
  
  // Sync updated profile to CleverTap
  await syncUserToCleverTap()
}
