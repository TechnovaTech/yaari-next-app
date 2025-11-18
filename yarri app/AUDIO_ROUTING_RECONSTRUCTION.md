Title: Audio UI Reconstruction and Earpiece/Speaker Routing Fixes

Overview
- Reconstructed AudioCall UI into presentational components while preserving identical visuals and layout.
- Hardened audio routing for earpiece and speaker, including stabilization during the first seconds of a call and after toggles.
- Ensured backward compatibility for Android < 12 via multi-pass routing; Android 12+ uses explicit communication device selection.

Files Changed
- `components/AudioCallScreen.tsx`: Refactored to use `AvatarCircle`, `CallStats`, and `ControlsBar`. Added earpiece `startEarpieceStabilizer()` and immediate reinforcement during route toggles and remote audio start.
- `components/call-ui/AvatarCircle.tsx`: Presentational avatar circle, identical classes.
- `components/call-ui/CallStats.tsx`: Presentational stats (username, timer, cost, remaining balance), identical classes.
- `components/call-ui/ControlsBar.tsx`: Presentational controls (speaker, end, mute), identical classes.
- Native plugin (earlier commit): `android/app/src/main/java/com/yaari/app/AudioRoutingPlugin.java` monitors BT disconnects and re-applies last route; defaults to earpiece in comms mode; requests exclusive audio focus; legacy multi-pass reinforcement.

Routing Strategy
- On call init: Enter communication mode and set speaker OFF, then reinforce after publishing and when remote audio starts.
- On toggle to earpiece: Enter communication mode, set speaker OFF, run `ensureEarpieceRoute()` and `startEarpieceStabilizer()`.
- On toggle to speaker: Enter communication mode and set speaker ON.
- On BT disconnect: Native plugin re-applies last desired route and clears stale communication device.

Backward Compatibility
- Android < 12: Multi-pass delayed `setSpeakerphoneOn(false)` and `MODE_IN_COMMUNICATION)` to stabilize earpiece.
- Android ≥ 12: Explicit `setCommunicationDevice()` for earpiece/speaker; clears stale BT routing.

Known Considerations
- Visuals remain identical by preserving Tailwind classes and structure at the component boundaries.
- No changes to coin deduction or socket logic beyond necessary navigation safety.