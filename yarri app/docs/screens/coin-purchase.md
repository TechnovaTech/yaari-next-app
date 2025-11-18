Coin Purchase Screen

Purpose

- Purchase coins via Razorpay; show balance, plans, and pricing.

APIs

- Reads app data via `/api` routes referenced in the screen:
  - `GET /api/settings` — app pricing settings (coins per rupee, min/max recharge, call rates).
  - `GET /api/plans` — coin plans.
  - `GET /api/users/{userId}/balance` — current coin balance.
- Payment flow:
  - `POST /api/payments/order` — create Razorpay order (expected local proxy).
  - `POST /api/payments/verify` — verify Razorpay payment (expected local proxy).

Workflow

- On mount: fetch settings, balance, and plans; track screen view.
- User selects amount or plan; app creates order; opens Razorpay checkout; verifies payment.
- On success: update coins and track events (`trackCoinPurchase`, `trackSubscription`), sync to CleverTap.

Backend

- The screen references local payment proxy routes under `app/api/payments/order` and `verify` directories.
- If these routes are absent, implement them to forward to your payment gateway and update user balance on Admin API.

Tracking

- CleverTap: `Coin Purchase`, `Subscription Purchased`, and profile sync.