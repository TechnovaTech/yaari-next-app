Edit Profile Screen

Purpose

- Update profile fields (name, phone, email, about, hobbies, gender, language) and manage images (profile & gallery).

APIs

- Images:
  - `GET/POST https://admin.yaari.me/api/users/{userId}/images` — fetch/manage gallery.
  - `POST https://admin.yaari.me/api/upload-photo` — upload (with compression and validation client-side).
  - `DELETE /api/delete-photo` — local proxy to Admin API for deleting a photo.
- Profile:
  - `PUT https://admin.yaari.me/api/users/{userId}` — update fields.

Workflow

- Load user from `localStorage`; render current profile values.
- Image management: compress, validate, upload; delete via local proxy; keep gallery URLs canonicalized.
- Update profile fields; persist to Admin API; update `localStorage` and CleverTap profile via `updateUserProfile`.

Backend

- `app/api/delete-photo/route.ts` proxies DELETE to upstream (`admin.yaari.me` or configured base), with CORS and multi-base fallback.
- Other image/profile endpoints hit Admin API directly.