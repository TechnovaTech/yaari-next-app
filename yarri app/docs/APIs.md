# APIs used by the Mobile App

## Base URLs
- Public API base: `https://admin.yaari.me`
- Configurable base via `NEXT_PUBLIC_API_URL` (defaults to `https://admin.yaari.me`)
- Local dev proxies use Next.js `app/api/*` routes to avoid CORS when running on `localhost`.

## Routing Strategy
- Native (Capacitor): calls `https://admin.yaari.me/api/...` directly using `NEXT_PUBLIC_API_URL`.
- Web/local dev: where available, use internal `app/api/*` routes (e.g., `/api/call-log`, `/api/call-history`) to proxy requests.
- Helper pattern: `buildApiUrl('/path')` returns either `'/api/path'` on localhost or `${API_BASE}/api/path` otherwise.

## Endpoints (Admin API)
- `GET /api/settings` — fetches global settings including `audioCallRate` and `videoCallRate`.
- `GET /api/plans` — lists purchasable coin packs and pricing.
- `GET /api/users-list` — returns public user list for browsing.
- `GET /api/users/:userId` — returns user profile detail.
- `GET /api/users/:userId/balance` — returns coin balance for the user.
- `GET /api/users/:userId/transactions` — returns transaction history for the user.
- `GET /api/users/:userId/images` — returns image gallery entries for the user.
- `POST /api/upload-photo` — uploads a profile photo (multipart/form-data).
- `POST /api/delete-photo` — deletes a profile photo.
- `PUT /api/users/:userId` — updates profile fields (e.g., `gender`, `language`, `name`).
- `POST /api/agora/token` — returns a temporary Agora token for a given channel.
- `POST /api/call-log` — logs call lifecycle events (start/end) and costs.
- `GET /api/call-history?userId=...` — returns recent calls for a user.
- `GET /api/ads` — returns active ads for display.

## Internal Next.js Routes (App)
- `POST /api/call-log` — proxies to Admin API `POST /api/call-log` using candidate bases: `localhost:3002`, `API_BASE`, `NEXT_PUBLIC_API_URL`, `https://admin.yaari.me`.
- `GET /api/call-history?userId=...` — queries MongoDB `callHistory` and enriches with user info; used for local/dev.
- `GET /api/ads` — fetches ads from local MongoDB if configured via `MONGODB_URI`.

## Request/Response Examples
- Call Start (Video/Audio):
  - Request: `POST /api/call-log` with `{ callerId, receiverId, callType: 'audio'|'video', action: 'start', channelName }`
  - Response: `{ sessionId: string, verified: boolean }`
- Call End:
  - Request: `POST /api/call-log` with `{ callerId, receiverId, callType, action: 'end', duration, cost, status: 'completed' }`
  - Response: `{ verified: boolean }`
- Agora Token:
  - Request: `POST /api/agora/token` with `{ channelName }`
  - Response: `{ token: string }`

## Image URL Normalization
- Some user images may have `localhost` or `0.0.0.0` origins.
- The app normalizes to `https://admin.yaari.me`:
  - `url.replace(/https?:\/\/localhost:\d+/, 'https://admin.yaari.me').replace(/https?:\/\/0\.0\.0\.0:\d+/, 'https://admin.yaari.me')`.

## Environment Variables
- `NEXT_PUBLIC_API_URL` — API base used by the app.
- `NEXT_PUBLIC_SOCKET_URL` — Socket.io server base (defaults to `https://admin.yaari.me`).
- `MONGODB_URI` — used by internal `app/api/*` routes in dev/local.

## Notes
- Prefer internal `/api/*` when running on `localhost` to avoid CORS.
- On native, always call the public base (`NEXT_PUBLIC_API_URL`).