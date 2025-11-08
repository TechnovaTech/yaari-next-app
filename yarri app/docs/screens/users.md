Users List Screen

Purpose

- Discover users, show online status, initiate audio/video calls; manage permissions and coin balance checks.

APIs

- `GET https://admin.yaari.me/api/users-list` — list users.
- `GET https://admin.yaari.me/api/settings` — call rates and app settings.
- `GET https://admin.yaari.me/api/users/{userId}/balance` — current coin balance.

Workflow

- On mount: fetch users, rates, and (optionally) balance.
- Integrates real-time presence and call flow via socket events.
- Call initiation triggers `call-accepted/declined/busy` handling; opens `call` screens on accept.
- Handles permission modals (camera/microphone), insufficient coins modal, and call confirmation.

Socket Events

- Emitted: `register`, `user-online`, `get-online-users`.
- Received: `online-users`, `user-status-change`, `call-accepted`, `call-declined`, `call-ended`, `call-busy`.

Backend

- Data served by Admin API.
- Socket server configured via `NEXT_PUBLIC_SOCKET_URL` (defaults to `https://admin.yaari.me`).