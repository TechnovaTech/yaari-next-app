# Pages, Routes, and Navigation

## Route Map (App Router)

- `/` → `app/page.tsx` (Welcome/Home)
- `/login/` → `app/login/` with `LoginScreen.tsx`
- `/otp/` → `app/otp/` with `OTPScreen.tsx`
- `/language/` → `app/language/` with `LanguageScreen.tsx`
- `/users/` → `app/users/` with `UserListScreen.tsx`
- `/user-detail/` → `app/user-detail/` with `UserDetailScreen.tsx`
- `/profile/` → `app/profile/` with `ProfileMenuScreen.tsx` and profile editing flows
- `/coins/` → `app/coins/` with `CoinPurchaseScreen.tsx`
- `/transaction-history/` → `app/transaction-history/`
- `/audio-call/` → `app/audio-call/` with `AudioCallScreen.tsx`
- `/video-call/` → `app/video-call/` with `VideoCallScreen.tsx`
- `/call-history/` → `app/call-history/` with `CallHistoryScreen.tsx` and Next.js `app/api/call-history` proxy
- `/customer-support/` → `app/customer-support/`
- `/privacy-security/` → `app/privacy-security/`
- `/gender/` → `app/gender/` with `GenderScreen.tsx`
- `404` → `app/not-found.tsx` and `www/404.html`

## Layout and Wrappers

- `app/layout.tsx` provides global layout.
- `components/PageLayout.tsx` and `SafeAreaLayout.tsx` wrap pages to enforce safe-area paddings and consistent spacing.
- `components/StatusBarInit.tsx` and `NativeStatusBar.tsx` initialize status bar overlay and style.
- `components/RouteAnalytics.tsx` tracks route changes and user events.

## Navigation Rules

- After login: redirect based on user completeness.
  - If user has `name` and `gender`, go to `/users/`.
  - Else go to `/language/` to complete onboarding.
- Use Next.js `useRouter` for navigation within client components.

## Page-specific Notes

- Login (`/login/`): stable keyboard behavior, no scroll jump, safe-area respect; supports Google login and phone OTP.
- OTP (`/otp/`): validates 6-digit OTP and continues onboarding.
- Coins (`/coins/`): integrates Razorpay for purchases; shows price packs and handles transactions.
- Calls (`/audio-call/`, `/video-call/`): Agora integration, device permissions, live session management, call logging to Admin API.
- Call History (`/call-history/`): fetches history from DB via API; displays outgoing/incoming calls.