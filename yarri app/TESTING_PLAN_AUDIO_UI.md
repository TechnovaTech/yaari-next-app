Title: Testing Plan — Audio UI and Routing

Scope
- UI element functionality for AudioCall screen.
- Audio routing through earpiece, loudspeaker, and Bluetooth.
- Integration between hardware events (BT connect/disconnect) and software controls.

Prerequisites
- Android device(s) across versions: One Android 12+ and one Android 9–11.
- Wired headset optional for additional path testing.
- Bluetooth earbuds/headset.

Test Cases
- UI Baseline
  - Open AudioCall screen; verify avatar circle, username, timer, and cost display exactly as before.
  - Verify buttons: Speaker, End Call, and Mute are in identical positions and styles.

- Call Initialization
  - Start call with no BT connected. Expected: Audio routes to earpiece by default; UI responsive.
  - Verify remote audio playback: route remains on earpiece; toggle switches to speaker and back reliably.

- Toggle Behavior
  - Toggle Speaker ON: Route moves to loudspeaker; audio remains stable during remote audio playback.
  - Toggle Speaker OFF: Route moves to earpiece; stabilization applies during first seconds; confirm audible change.
  - Toggle Mute: Local mic mute/unmute works; remote hears silence when muted.

- Bluetooth Integration
  - Connect BT before call: Audio routes to BT; toggles remain responsive (UI state stored; plugin applies last desired route when BT disconnects).
  - Disconnect BT mid-call: Plugin clears stale BT route; audio returns to last chosen route (earpiece or speaker). Toggle remains responsive.
  - Reconnect BT mid-call: Audio routes to BT; disconnect again to verify re-application to last chosen route.

- Legacy Stabilization (Android < 12)
  - Start call, confirm earpiece default and multi-pass stabilization keeps audio on earpiece.
  - Toggle back-and-forth under load (remote joins/leaves) to ensure routes persist.

- Wired Headset (optional)
  - Plug wired headset during call; verify route switches appropriately. Unplug and verify return to last desired route.

Pass Criteria
- All UI elements function identically with no visual regressions.
- Speaker/earpiece toggles always change audio output correctly within 1–2 seconds.
- BT disconnects/restores do not break toggles; last route preference persists.

Troubleshooting Notes
- If earpiece fails on specific device, capture device model, Android version, and whether remote audio has started.
- Check APK build logs for deprecation warnings; they are informational only.