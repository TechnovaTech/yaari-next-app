# SMS OTP Service — Yaari Admin Panel

## Overview
- Purpose: Send and verify SMS OTPs for user login.
- Provider: Gupshup Enterprise (`/GatewayAPI/rest`).
- Storage: MongoDB collection `otps` for temporary OTP records.
- Expiry: 5 minutes per OTP.

## Components
- `lib/sms-service.ts` — Gupshup client wrapper (userid/password/mask/DLT params, request building, response parsing).
- `app/api/auth/send-otp/route.ts` — Generates OTP, sends via SMS, persists tracking info.
- `app/api/auth/verify-otp/route.ts` — Validates OTP, creates user if needed, returns profile.

## Configuration
- `GUPSHUP_USERID` — Gupshup account user ID.
- `GUPSHUP_PASSWORD` — Gupshup account password.
- `GUPSHUP_BASE_URL` — Default `https://enterprise.smsgupshup.com`.
- `GUPSHUP_MASK` — Sender ID (e.g., `YAARIP`).
- `DLT_TEMPLATE_ID` — Registered DLT template ID.
- `DLT_ENTITY_ID` — Registered DLT entity ID.

These are read in `sms-service.ts` and appended to every request when present.

## Message Format
- Text used for OTP: `Dear Yaari User, The OTP for login is <OTP>. Bitesize Learning Private Limited.`
- Phone normalization: If number doesn’t start with `91`, it is converted to `91XXXXXXXXXX`.

## Data Model (`otps`)
- `phone` — normalized phone string.
- `otp` — 6-digit string.
- `createdAt` — timestamp.
- `expiresAt` — timestamp (createdAt + 5 minutes).
- `provider` — `gupshup`.
- `messageId` — provider message ID when available.

## API Endpoints

### Send OTP
- Method: `POST`
- URL: `https://admin.yaari.me/api/auth/send-otp`
- Body JSON:
  - `phone` — string, minimum 10 digits; may be `91XXXXXXXXXX` or local `XXXXXXXXXX`.
- Success response:
  - `{ "success": true, "message": "OTP sent successfully", "messageId": "<optional>" }`
- CORS: `Access-Control-Allow-Origin: *`

Example cURL:
```bash
curl -X POST \
  'https://admin.yaari.me/api/auth/send-otp' \
  -H 'Content-Type: application/json' \
  -d '{"phone":"9876543210"}'
```

Notes:
- Even if SMS provider returns failure, API responds with `success: true` to avoid leaking system state; error is logged and may include `error` in body.

### Verify OTP
- Method: `POST`
- URL: `https://admin.yaari.me/api/auth/verify-otp`
- Body JSON:
  - `phone` — string
  - `otp` — 6-digit string
- Success response:
  - `{ "success": true, "user": { "id": "...", "phone": "...", "balance": <number>, ... } }`
- Error responses:
  - `400` — `OTP not found` | `OTP expired` | `Invalid OTP`
  - `500` — `Failed to verify OTP`
- Side effects:
  - Deletes the `otps` record on successful verification.
  - Creates user with signup bonus when not present.

Example cURL:
```bash
curl -X POST \
  'https://admin.yaari.me/api/auth/verify-otp' \
  -H 'Content-Type: application/json' \
  -d '{"phone":"9876543210","otp":"123456"}'
```

## Request Construction (Provider)
- Endpoint: `${GUPSHUP_BASE_URL}/GatewayAPI/rest`
- Method: `POST`
- Headers: `Content-Type: application/x-www-form-urlencoded`
- Form fields:
  - `userid`, `password`, `send_to`, `msg`, `method=sendMessage`, `msg_type=text`, `format=json`, `auth_scheme=plain`, `v=1.1`
  - Optional: `mask`, `dlt_template_id`, `dlt_entity_id`

## Client Usage (Flutter App)
- File: `app_deting 2/lib/services/auth_api.dart`
- `sendOtp(phone)` → POST to `.../api/auth/send-otp`
- `verifyOtp(phone, otp)` → POST to `.../api/auth/verify-otp`
- Both using `Content-Type: application/json` and decoding JSON response.

## Operational Notes
- DLT compliance requires exact template text and registered sender ID.
- Keep credentials and IDs in environment variables; do not hardcode in code.
- OTP TTL configured to 5 minutes in the API.
- CORS headers allow mobile/web clients to call directly.

## References
- `yarri admin panel/lib/sms-service.ts:21–29` — Config initialization.
- `yarri admin panel/lib/sms-service.ts:32–60` — OTP message and request params.
- `yarri admin panel/lib/sms-service.ts:61–93` — Provider call and response handling.
- `yarri admin panel/app/api/auth/send-otp/route.ts:32–53` — OTP generation and storage.
- `yarri admin panel/app/api/auth/send-otp/route.ts:69–88` — API responses and CORS.
- `yarri admin panel/app/api/auth/verify-otp/route.ts:24–42` — OTP checks.
- `yarri admin panel/app/api/auth/verify-otp/route.ts:44–59` — User creation and bonus.
- `yarri admin panel/app/api/auth/verify-otp/route.ts:61–79` — Cleanup and response.
- `app_deting 2/lib/services/auth_api.dart:7–13` — Send OTP request.
- `app_deting 2/lib/services/auth_api.dart:25–31` — Verify OTP request.
