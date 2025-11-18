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

// Normalize profile props to Mixpanel reserved keys so Users page shows email/name/phone
const normalizePeopleProps = (props: Record<string, any>): Record<string, any> => {
  const out: Record<string, any> = { ...props }
  const name = props.Name ?? props.name
  const email = props.Email ?? props.email
  const phone = props.Phone ?? props.phone

  if (name) {
    out.$name = String(name)
    delete out.Name
    delete out.name
  }
  if (email) {
    out.$email = String(email)
    delete out.Email
    delete out.email
  }
  if (phone) {
    out.$phone = String(phone)
    delete out.Phone
    delete out.phone
  }

  return out
}

export const mixpanelPeopleSet = (props: Record<string, any>) => {
  try {
    initMixpanel()
    if (!initialized) return
    const normalized = normalizePeopleProps(props)
    mixpanel.people.set(normalized)
  } catch (e) {
    console.log('Mixpanel people.set error:', e)
  }
}