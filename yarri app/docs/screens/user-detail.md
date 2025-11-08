User Detail Screen

Purpose

- Show a single user's profile, gallery, and call options with live online status.

APIs

- `GET https://admin.yaari.me/api/users/{userId}` — user profile.
- `GET https://admin.yaari.me/api/users/{currentUserId}/balance` — current coin balance.
- `GET https://admin.yaari.me/api/settings` — call rates and configuration.

Workflow

- Fetch and sanitize profile/gallery URLs; dedupe gallery.
- Track screen view and profile view via CleverTap.
- Listen for `online-users` and `user-status-change` to reflect presence.
- On call accept via socket `call-accepted`: store `channelName` and `callData` to `sessionStorage`, navigate to `/video-call` or `/audio-call`.

Socket Events

- Received: `online-users`, `user-status-change`, `call-accepted`, `call-declined`, `call-ended`, `call-busy`.

Backend

- Profile, settings, balance from Admin API.
- Navigation target screens handle call logging and coin deduction.