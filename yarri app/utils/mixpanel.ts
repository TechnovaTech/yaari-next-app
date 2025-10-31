import mixpanel from 'mixpanel-browser'

let initialized = false

const MIXPANEL_FALLBACK_TOKEN = 'b19e0189e8c34fe2a980f09ba1ceeedc'

const getToken = (): string | undefined => {
  const envToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
  if (envToken && envToken.trim().length > 0) return envToken.trim()
  // Use inline fallback token when env is not available
  return MIXPANEL_FALLBACK_TOKEN
}

export const initMixpanel = (token?: string) => {
  if (initialized) return
  const finalToken = (token || getToken())
  if (!finalToken) {
    console.warn('Mixpanel token missing. Set NEXT_PUBLIC_MIXPANEL_TOKEN in .env.local')
    return
  }
  mixpanel.init(finalToken, { debug: true, track_pageview: false })
  initialized = true
  console.log('Mixpanel initialized')
}

export const mixpanelTrack = (eventName: string, props?: Record<string, any>) => {
  try {
    initMixpanel()
    if (!initialized) return
    if (props && Object.keys(props).length > 0) {
      mixpanel.track(eventName, props)
    } else {
      mixpanel.track(eventName)
    }
  } catch (e) {
    console.log('Mixpanel track error:', e)
  }
}

export const mixpanelIdentify = (identity: string) => {
  try {
    initMixpanel()
    if (!initialized) return
    mixpanel.identify(identity)
  } catch (e) {
    console.log('Mixpanel identify error:', e)
  }
}

export const mixpanelPeopleSet = (props: Record<string, any>) => {
  try {
    initMixpanel()
    if (!initialized) return
    mixpanel.people.set(props)
  } catch (e) {
    console.log('Mixpanel people.set error:', e)
  }
}