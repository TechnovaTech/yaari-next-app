Language Screen

Purpose

- Allow user to choose app language and persist to profile.

APIs

- `PUT /api/users/{userId}` via build API URL (local proxy in web dev, remote on native):
  - On native or non-local: `https://admin.yaari.me/api/users/{userId}`
  - Body: `{ language: 'en' | 'hi' }`

Workflow

- Track screen view; update selected language.
- On save: call `PUT` endpoint; update user in `localStorage`; fire CleverTap events.

Backend

- Uses dynamic URL construction similar to `buildApiUrl`; remote Admin API receives the update.

Tracking

- Tracks selection and save events via CleverTap.