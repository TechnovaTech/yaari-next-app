# UI and Components

## Screen Components

- `LoginScreen.tsx`: Phone login, Google login, keyboard handling, safe-area paddings.
- `OTPScreen.tsx`: OTP input, verification, progression to next step.
- `UserListScreen.tsx`: User browsing list.
- `UserDetailScreen.tsx`: Profile details of a selected user.
- `ProfileMenuScreen.tsx`: Profile editing, toggles, avatar management.
- `CoinPurchaseScreen.tsx`: Presents coin packs, triggers Razorpay checkout.
- `VideoCallScreen.tsx` / `AudioCallScreen.tsx`: Agora SDK integration, session lifecycle, call logging.
- `CallHistoryScreen.tsx`: Displays recent calls and metadata.
- `LanguageScreen.tsx`: Select application language.
- `WelcomeScreen.tsx`: Intro / landing visuals.

## Layout and Safe Area

- `SafeAreaLayout.tsx`, `SafeAreaWrapper.tsx`, `SafeAreaInit.tsx`: initialize CSS variables, apply `env(safe-area-inset-*)` fallbacks, and enforce full-screen layout.
- `PageLayout.tsx`: wraps pages; top padding disabled for `/login` to allow full-bleed.

## Status Bar

- `NativeStatusBar.tsx`, `StatusBarInit.tsx`: configure overlay, background color, and style.

## Global Call UI

- `GlobalCallUI.tsx`, `IncomingCallModal.tsx`, `AdBanner.tsx`: shared UI elements shown across pages.

## Error Handling

- `ErrorBoundary.tsx`: catches React errors and prevents hard crashes.