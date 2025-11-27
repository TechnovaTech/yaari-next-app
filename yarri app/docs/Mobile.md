# Mobile Specifics (Capacitor)

## Capacitor Configuration
- Keyboard:
  - `resize: 'none'` — prevents webview resize when keyboard opens.
  - `resizeOnFullScreen: false` — avoid adjustments in full-screen contexts.
- Status Bar: overlay enabled; style/colors set via `@capacitor/status-bar` components.
- Bundled web runtime: not used; follow deprecation notes in `cap sync` output.

## Android Manifest
- Key permissions: INTERNET, CAMERA, RECORD_AUDIO, MODIFY_AUDIO_SETTINGS, ACCESS_NETWORK_STATE, BLUETOOTH/CONNECT, GET_ACCOUNTS.
- Activity configuration: `singleTask`, extensive `configChanges`.
- Recommended attributes:
  - `android:windowSoftInputMode="adjustPan"` to avoid layout resizing on input.
  - `android:resizeableActivity="false"` to prevent webview relayout.
  - Documented here for clarity; verify manifest reflects these in production.

## Safe Area & Status Bar
- Safe-area handled by `SafeAreaLayout` and `utils/safeAreaManager.ts`.
- CSS variables `--safe-area-top`, `--safe-area-bottom`, with fallbacks for OEM quirks.
- Status bar and nav bar colors set to match brand; content visible below bars.

## Keyboard Behavior
- `LoginScreen.tsx` toggles `body.keyboard-open` and applies small bottom offset via `--keyboard-offset` to keep actions visible.
- Combined with `resize: 'none'` and `adjustPan`, ensures no scroll jump and stable layout.

## Socket & Background
- Socket.io used for presence and call signaling; reconnects and re-registers user.
- Ensure app handles `disconnect`/`reconnect` events gracefully.