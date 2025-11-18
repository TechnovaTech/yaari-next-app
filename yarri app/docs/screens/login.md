Login Screen

Purpose

- Authenticate users via Google OAuth (web/native) or phone OTP.
- Establish local user session in `localStorage` and drive onboarding.

APIs

- `POST https://admin.yaari.me/api/auth/google-login`
  - Body: `{ access_token: string }` (Google OAuth token)
  - Returns: user profile incl. `id`, `name`, `email`, `profilePic`, `coins`.
- `POST https://admin.yaari.me/api/auth/send-otp`
  - Body: `{ phone: string }`
  - Returns: `{ success: boolean, message?: string }`

Workflow

- Detect platform via Capacitor; initialize GoogleAuth on native.
- Google login:
  - Obtain access token; POST to `google-login`; store returned user in `localStorage`.
  - Track login via CleverTap `trackUserLogin`, `trackEvent`.
  - Navigate to next onboarding screen.
- OTP login:
  - Validate phone; trigger `send-otp` API; store phone in `localStorage` and navigate to OTP screen.

Backend

- Authentication lives on Admin API (`admin.yaari.me`). No local Next.js proxy is used for these endpoints.

Tracking

- Uses `utils/clevertap.ts` for `trackUserLogin` and general events.