# Audio Routing and Calls

## Routing
- Default to speaker on call start; toggle to earpiece via UI.
- Native routing via custom plugin (`AudioRouting`/`AudioRoute`):
  - `enterCommunicationMode()`
  - `setSpeakerphoneOn({ on: boolean })`
  - `resetAudio()` after call ends.
- Web SDK fallback uses Agora `setEnableSpeakerphone` where available.

## Keep WebAudio Alive
- Maintain/resume an `AudioContext` oscillator at zero gain to prevent audio route drops.

## Agora
- Token: `POST /api/agora/token` with `{ channelName }`.
- Join and publish audio/video tracks; play local/remote media.

## Call Logging
- Start: `POST /api/call-log` with `{ action: 'start' }`.
- End: `POST /api/call-log` with `{ action: 'end', duration, cost }`.
- Emit `socket.emit('end-call', { userId, otherUserId })` to notify peer.