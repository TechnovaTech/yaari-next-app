Call History Screen

Purpose

- Display recent calls with enriched user details and call metadata.

APIs

- `GET /api/call-history?userId={id}` — local Next.js route.
  - Returns array of `{ _id, callType, duration, status, startTime, endTime, cost, isOutgoing, otherUserName, otherUserAvatar, otherUserAbout, createdAt }`.

Workflow

- On mount: fetch call history; sanitize `otherUserAvatar` origin; render list.

Backend

- Next.js route `app/api/call-history/route.ts`:
  - Reads MongoDB `yarri.callHistory` for calls where user is caller or receiver.
  - Enriches with `yarri.users` (name, profilePic, about) using both string and `ObjectId` formats.
  - Adds CORS headers; returns latest 50 records sorted by `createdAt`.