Yaari App — Screen Documentation

This folder documents every major screen in the Yaari app. Each doc covers:

- Purpose and key UX
- Working APIs (URLs, methods, request/response summary)
- Workflow and state transitions
- Backend details (local Next.js routes, remote services)
- Real-time socket interactions (where applicable)

Index

- [Login](screens/login.md)
- [OTP](screens/otp.md)
- [Language](screens/language.md)
- [Gender](screens/gender.md)
- [Profile Menu](screens/profile-menu.md)
- [Customer Support](screens/customer-support.md)
- [Privacy & Security](screens/privacy-security.md)
- [Users](screens/users.md)
- [User Detail](screens/user-detail.md)
- [Audio Call](screens/audio-call.md)
- [Video Call](screens/video-call.md)
- [Call History](screens/call-history.md)
- [Coin Purchase](screens/coin-purchase.md)
- [Transaction History](screens/transaction-history.md)
- [Edit Profile](screens/edit-profile.md)

Key Backend Routes (local, under `app/api`)

- `GET /api/call-history` — reads MongoDB, enriches callers/receivers.
- `POST /api/call-log` — proxies to Admin API for session logging.
- `DELETE /api/delete-photo` — proxies deletion to Admin API.
- `POST /api/deduct-coins` — proxies to Admin API.
- `GET /api/ads` — reads MongoDB for active ads.

See also

- Root `APIs.md` for upstream endpoints and conventions.
- Call service overview: `Call_Service.md` (architecture, flows, contracts).

Notes

- Safe area topics are intentionally excluded per requirement.
- For shared APIs and libraries (e.g., socket, CleverTap, Agora, Razorpay), see cross-references in each screen doc.