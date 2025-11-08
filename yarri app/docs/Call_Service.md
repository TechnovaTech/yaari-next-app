Call Service (Audio & Video)

Overview

- Implements real-time audio and video calling using Agora Web SDK and a Socket.io signaling layer.
- Logs call sessions to the backend, calculates cost client-side, and deducts coins from the caller.
- Handles platform-specific audio routing (web vs Capacitor native).

Architecture

- Client
  - Screens: `components/AudioCallScreen.tsx`, `components/VideoCallScreen.tsx`
  - Context: `contexts/SocketContext.tsx` (connection, global events, navigation)
  - Utils: `utils/audioRouting.ts`, `utils/audioRoute.ts` (native audio), `utils/coinDeduction.ts` (Admin API), `utils/userTracking.ts` (CleverTap)
  - Config: `config/agora.ts` for `agoraConfig.appId`
- Server
  - Local Next.js routes (proxies/services):
    - `POST /api/call-log` — proxy to Admin API for session logging
    - `GET /api/call-history` — fetch MongoDB call history and enrich with user details
    - `DELETE /api/delete-photo` — proxy (used in profile docs; included here for completeness)
    - `POST /api/deduct-coins` — proxy to Admin API (if used)
  - Upstream Admin API:
    - `POST https://admin.yaari.me/api/agora/token` — Agora channel token
    - `POST https://admin.yaari.me/api/call-log` — call session logging
    - `POST https://admin.yaari.me/api/users/{userId}/deduct-coins` — coin deduction
    - `GET https://admin.yaari.me/api/users/{userId}/balance` — coin balance
    - `GET https://admin.yaari.me/api/settings` — rates, pricing, config

Environment & Config

- `NEXT_PUBLIC_API_URL` — base URL for upstream Admin API (default `https://admin.yaari.me`).
- `NEXT_PUBLIC_SOCKET_URL` — Socket.io server URL (default `https://admin.yaari.me`).
- `agoraConfig.appId` — Agora App ID in `config/agora.ts`.
- Platform detection: `Capacitor.isNativePlatform()` toggles native audio routing and API URL behavior.

Socket Events

- Emitted (by client):
  - `register` — sent after connect with current user ID.
  - `user-online` — presence heartbeat `{ userId, status: 'online' }`.
  - `get-online-users` — query current presence list.
  - `end-call` — emitted on user end with `{ userId, otherUserId }`.
- Received (global via `SocketContext`):
  - `incoming-call`: `{ callerId, callerName, callType, channelName }`
  - `call-accepted`: `{ channelName, callType? }` — writes `channelName` to `sessionStorage`, navigates to `/audio-call` or `/video-call`.
  - `call-busy`: `{ message }` — show alert.
  - `call-ended`: cleans up incoming call state and triggers local cleanup on call screens.
- Received (screen-specific):
  - `online-users`, `user-status-change` — presence updates for user list/detail.

Call Flow — Outgoing (Caller)

1) Initiate call from Users/User Detail, confirm type (audio/video) and check coins/rates.
2) On accept (socket `call-accepted`):
   - Save `channelName` and `callData` to `sessionStorage` (includes `otherUserId`, `rate`, `type`, `isCaller: true`).
   - Navigate to `/audio-call` or `/video-call`.
3) Screen init:
   - Fetch Agora token (`POST /api/agora/token` upstream) with `channelName`.
   - Join Agora (`client.join(appId, channelName, token)`), create/publish local tracks.
   - Log call start: `POST /api/call-log` with `{ callerId, receiverId, callType, action: 'start', channelName }`.
4) Coin deduction:
   - At `duration === 10s`, caller deducts `rate` coins via `utils/coinDeduction.ts` → `POST /api/users/{id}/deduct-coins`.
   - Update remaining balance (`result.newBalance`) if returned.
   - If insufficient coins, alert and end call.
5) End call:
   - Compute cost `ceil(duration/60) * rate`.
   - Log call end: `POST /api/call-log` with `{ action: 'end', duration, cost, status: 'completed' }`.
   - Emit `end-call` over socket, cleanup local tracks/session, navigate to `/users`.

Call Flow — Incoming (Receiver)

1) Receiver gets `incoming-call` (global) with `{ callerId, callerName, callType, channelName }`.
2) On accept:
   - `call-accepted` sets `channelName` and minimal `callData` and navigates to target screen.
3) Screen init:
   - Join Agora and publish tracks (receiver does NOT deduct coins).
4) End call:
   - On remote end or local end, perform cleanup and navigate to `/users`.

Endpoints & Contracts

- `POST /api/call-log` (local proxy → Admin API):
  - Start body: `{ callerId: string, receiverId: string, callType: 'audio' | 'video', action: 'start', channelName: string }`
  - End body: `{ callerId: string, receiverId: string, callType: 'audio' | 'video', action: 'end', duration: number, cost: number, status: 'completed' }`
  - Response may include `{ sessionId?: string }` on start.
- `GET /api/call-history?userId={id}` (local service):
  - Returns array: `{ _id, callType, duration, status, startTime, endTime, cost, isOutgoing, otherUserName, otherUserAvatar, otherUserAbout, createdAt }[]`.
- `POST https://admin.yaari.me/api/agora/token`:
  - Body: `{ channelName: string }`. Returns `{ token: string }`.
- `POST https://admin.yaari.me/api/users/{userId}/deduct-coins`:
  - Body: `{ coins: number, callType: 'audio' | 'video' }`.
  - Returns `{ newBalance?: number }` (shape may vary upstream).

Platform & Audio Routing

- Web: Sets Agora audio profile `speech_low_quality` and scenario `meeting`; optional `setEnableSpeakerphone` toggle.
- Native (Capacitor): Uses `utils/audioRouting.ts` to enter communication mode, toggle speakerphone, and reset audio after call.
- Video specifics: camera track creation and `flipCamera` toggling between `user` and `environment` facing modes.

State & Storage

- `sessionStorage` keys:
  - `channelName` — Agora channel.
  - `callData` — `{ otherUserId, userName, userAvatar, rate, type, isCaller }`.
  - `callSessionId` — stored if returned by call-log start.
- `localStorage`:
  - `user` — current user profile; used for IDs and tracking.

Error Handling

- Agora token fetch failure: show error, abort join, or retry.
- `call-log` proxy failure: warn user; history may not reflect the session.
- Coin deduction failure: if message contains `Insufficient`, end call.
- Socket disconnect/reconnect: `SocketContext` re-registers the user and refreshes `online-users`.

Security & Privacy

- Permissions: microphone and camera are required; ensure prompts are handled before joining.
- Token security: channel tokens should be short-lived and not reusable.
- Do not store sensitive data in `sessionStorage` beyond call runtime.

References

- Screens: `components/AudioCallScreen.tsx`, `components/VideoCallScreen.tsx`
- Socket: `contexts/SocketContext.tsx`
- Utils: `utils/coinDeduction.ts`, `utils/audioRouting.ts`, `utils/audioRoute.ts`, `utils/userTracking.ts`
- Local routes: `app/api/call-log/route.ts`, `app/api/call-history/route.ts`, `app/api/deduct-coins/route.ts`