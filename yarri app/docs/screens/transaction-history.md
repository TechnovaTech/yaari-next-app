Transaction History Screen

Purpose

- Show coin transaction ledger for the current user.

APIs

- `GET {API_URL}/api/users/{userId}/transactions` — remote Admin API.

Workflow

- Fetch on mount; handle loading/error; display records; provide `mailto:support@yaari.me` for assistance.

Backend

- No local proxy; relies on Admin API.