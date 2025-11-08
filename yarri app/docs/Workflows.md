# Workflows

## Login
- Options: Phone login or Google login via `@codetrix-studio/capacitor-google-auth` (native) or web flow.
- On success: `localStorage.setItem('user', ...)` and route to onboarding.
- Analytics: `trackUserLogin`, Mixpanel/CleverTap identify and people set.

## OTP
- Screen: `OTPScreen.tsx`.
- Validates 6-digit OTP; on success continues onboarding.

## Onboarding (Language/Gender)
- Language: `LanguageScreen.tsx` updates `users/:id` via `PUT`.
- Gender: `GenderScreen.tsx` saves gender via `PUT /api/users/:id`.
- After completion: route to `/users`.

## Browsing Users
- Screen: `UserListScreen.tsx`.
- Fetch rates: `GET /api/settings` for `audioCallRate`/`videoCallRate`.
- Fetch users list: `GET /api/users-list` and normalize profile pictures.
- Presence: Socket.io emits `user-online`, listens for `online-users` and `user-status-change`.

## Call Initiation
- From list/detail: prepare `callData` in `sessionStorage` with `{ otherUserId, userName, userAvatar, type: 'audio'|'video', rate }`.
- Emit socket events to initiate ringing; listen for `call-accepted`, `call-declined`, `call-busy`, `call-ended`.
- On `call-accepted`: save `channelName` and navigate to `/audio-call` or `/video-call`.

## Call Session (Agora)
- Acquire token via `POST /api/agora/token`.
- Join channel with `agoraConfig.appId`, create/publish tracks.
- Audio routing: speaker enabled by default; toggle speaker/mute via UI and native plugin.
- Logging: `POST /api/call-log` on start and end with duration/cost.

## Coins and Purchases
- `CoinPurchaseScreen.tsx` displays `GET /api/plans`.
- Balance: `GET /api/users/:id/balance`.
- Deduction: helper `deductCoins` performs periodic deductions during calls.
- Analytics: track purchase, balances, and call costs.

## Call History
- Fetch: `GET /api/call-history?userId=...` (internal route in dev; remote on native).
- Display enriched records with avatars normalized to `admin.yaari.me`.

## Profile Editing
- Fetch images: `GET /api/users/:id/images`.
- Upload photo: `POST /api/upload-photo`.
- Delete photo: `POST /api/delete-photo`.
- Update profile: `PUT /api/users/:id` fields.