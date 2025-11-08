Video Call Screen

Purpose

- Run video calls with Agora; handle logging, per-minute cost, and camera/audio controls.

Props

- `userName: string`, `userAvatar: string`, `rate: number`, `onEndCall: () => void`

APIs

- `POST https://admin.yaari.me/api/agora/token` — `{ token }` for `channelName`.
- `POST /api/call-log` — start/end logging contracts mirrored from audio.
- `POST https://admin.yaari.me/api/users/{userId}/deduct-coins` — caller-only deduction at 10s.

Workflow

- Join Agora with mic+camera; publish; play local video (`videoTrack.play('local-video')`).
- Log start to `/api/call-log`; store `sessionId` when present.
- Deduct coins at 10s (caller only); update `remainingBalance`.
- Controls: `toggleMute`, `toggleVideo`, `flipCamera` (switch facing mode), `setSpeakerOn` on native via `AudioRoute`.
- End call: compute cost, log end, cleanup tracks/channel/session, optionally set earpiece on native, navigate to `/users`.

State & Storage

- `sessionStorage`: `channelName`, `callData`, `callSessionId`.

Socket

- Listens for `call-ended` to handle remote termination cleanup.

Errors

- Token fetch/join failures, call-log proxy issues, coin deduction insufficiency.

Cross-Reference

- See `../Call_Service.md` for system-level behavior and contracts.