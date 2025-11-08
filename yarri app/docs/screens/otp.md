OTP Screen

Purpose

- Verify 6-digit OTP for phone-based login; optional age confirmation.

APIs

- `POST https://admin.yaari.me/api/auth/verify-otp`
  - Body: `{ phone: string, otp: string }`
  - Returns: user profile with `id`, coins, etc.
- `POST https://admin.yaari.me/api/auth/send-otp` (resend)
  - Body: `{ phone: string }`

Workflow

- Read phone from `localStorage`; submit OTP to `verify-otp`.
- On success: store user in `localStorage`, track via CleverTap, proceed to onboarding/home.
- Resend OTP: call `send-otp`; show messages.

Backend

- Admin API handles verification. No local proxy.

Tracking

- Uses `utils/clevertap.ts` to track verification and errors.