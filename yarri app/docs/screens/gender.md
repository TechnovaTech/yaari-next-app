Gender Screen

Purpose

- Collect and persist the user's gender.

APIs

- `PUT /api/users/{userId}` (local proxy or remote Admin API depending on environment)
  - Body: `{ gender: 'male' | 'female' | 'other' }`

Workflow

- Track view and selection; `PUT` to update profile.
- On success: update `localStorage`, track success; navigate onward.

Backend

- Uses environment-aware API URL (local `/api` proxy in dev, remote `admin.yaari.me` on native).

Tracking

- CleverTap events: `GenderSelected`, `GenderSaved`, error variants.