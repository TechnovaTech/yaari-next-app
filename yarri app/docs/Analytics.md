# Analytics (CleverTap & Mixpanel)

## Initialization
- `CleverTapInit.tsx` initializes either native Cordova CleverTap or the web SDK.
- Mixpanel initialized via `utils/mixpanel.ts` and linked with CleverTap identity.

## Identity & People
- On login: identify user (id/phone) and set people properties:
  - Name, Email, Phone, Gender, Age, City, Profile Picture, Coins Balance, User Type.

## Events
- App Open: `trackAppOpen` (CleverTap + Mixpanel).
- Screen Views: `trackScreenView('Audio Call'|'Video Call'|...)`.
- Call Events: `trackCallEvent('audio'|'video', 'accepted'|'ended', otherUserId, duration)`.
- Purchases & Coins: tracked around coin deductions and plan purchases.

## Notes
- CleverTap credentials are embedded; do not expose publicly.
- Align event names across CleverTap and Mixpanel for consistent analytics.