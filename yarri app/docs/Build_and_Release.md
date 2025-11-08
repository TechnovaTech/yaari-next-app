# Build and Release

## Development
- Install dependencies: `npm install`
- Run dev server: `npm run dev` (port `3001`)
- Android live run (no APK): `npx cap run android`

## Sync Capacitor
- Propagate config: `npx cap sync android` or `npm run cap:sync`
- Address deprecation warnings as needed (e.g., bundledWebRuntime).

## Build APK
- Script: `build-apk.bat` or `fresh-build-apk.bat`.
- Output (debug): `android\app\build\outputs\apk\debug\app-debug.apk`
- Install: `adb install android\app\build\outputs\apk\debug\app-debug.apk`

## Environment
- Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_MIXPANEL_TOKEN` in `.env.local`.

## Release Checklist
- Verify manifest permissions and keyboard/safe-area behavior.
- Confirm call logging and history endpoints work against production Admin API.