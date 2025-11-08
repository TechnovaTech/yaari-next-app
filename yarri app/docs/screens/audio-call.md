Audio Call Screen

Purpose

- Run audio calls with Agora; handle logging, coin deduction, and platform audio routing.

Props

- `userName: string`, `userAvatar: string`, `rate: number`, `onEndCall: () => void`

APIs

- `POST https://admin.yaari.me/api/agora/token` — returns `{ token }` for channel.
- `POST /api/call-log` — start/end logging.
  - Start: `{ callerId, receiverId, callType: 'audio', action: 'start', channelName }`
  - End: `{ callerId, receiverId, callType: 'audio', action: 'end', duration, cost, status: 'completed' }`
- `POST https://admin.yaari.me/api/users/{userId}/deduct-coins` — coin deduction when caller hits 10s.

Workflow

- Join Agora using token; create/publish mic track.
- Log start to `/api/call-log` and store `sessionId` if present.
- Deduct coins at `duration === 10s` (caller only) using `utils/coinDeduction.ts`; update `remainingBalance`.
- End call: compute cost, log end, emit `end-call`, cleanup tracks, reset native audio, clear session keys, navigate to `/users`.

State & Storage

- `sessionStorage`: `channelName`, `callData` (`{ otherUserId, rate, type, isCaller }`), `callSessionId`.
- `localStorage`: `user` profile.

Socket

- Listens for `call-ended` to cleanup when remote ends.
- Emits `end-call` with `{ userId, otherUserId }` on user end.

Platform Audio

- Web: `AgoraRTC.setAudioProfile('speech_low_quality')`, `setAudioScenario('meeting')`, `setEnableSpeakerphone` toggle.
- Native: `audioRouting.enterCommunicationMode()`, `setSpeakerphoneOn`, `resetAudio()` after call.

Errors

- Token/Join failures; call-log proxy errors; coin deduction insufficiency.

Cross-Reference

- See `../Call_Service.md` for full service architecture and flows.