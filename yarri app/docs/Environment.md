# Environment and Config

## .env.local
- `NEXT_PUBLIC_API_URL` — API base (default `https://admin.yaari.me`).
- `NEXT_PUBLIC_MIXPANEL_TOKEN` — Mixpanel project token.
- `NEXT_PUBLIC_SOCKET_URL` — Socket.io server (optional; default `https://admin.yaari.me`).
- `MONGODB_URI` — used by internal `app/api/*` routes in dev (e.g., ads, call history).

## Package Scripts
- `dev`: `next dev -p 3001`
- `build`: `next build`
- `start`: `next start -p 3001`
- `cap:sync`: `npx cap sync android`
- `android`: `npm run build && npx cap sync android`
- `android:build`: `cd android && gradlew assembleDebug`

## Config Files
- `capacitor.config.ts` — Keyboard plugin settings and platform config.
- `android/app/src/main/AndroidManifest.xml` — permissions and activity config.
- `config/agora.ts` — Agora credentials.