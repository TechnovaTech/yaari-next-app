# Architecture and Tech Stack

## Overview

- Mobile frontend built with `Next.js 14`, `React 18`, `TypeScript`.
- Packaged as a native Android app using `Capacitor` (static export under `www`).
- Backend is the Yaari Admin Panel API (`admin.yaari.me`), consumed via HTTPS; mobile app does not host its own backend.
- Native capabilities via Capacitor plugins (Status Bar, Keyboard, Browser, GoogleAuth) and a Cordova CleverTap plugin.

## Structure

- `app/` routes (Next.js App Router) for pages like `login/`, `otp/`, `users/`, `user-detail/`, `profile/`, `coins/`, `transaction-history/`, `audio-call/`, `video-call/`, `call-history/`, `language/`, `customer-support/`, `privacy-security/`, `gender/`.
- `components/` for screen-level components (e.g., `LoginScreen.tsx`, `OTPScreen.tsx`, `VideoCallScreen.tsx`, `SafeAreaLayout.tsx`).
- `contexts/` for global state providers (e.g., `LanguageContext.tsx`, `SocketContext.tsx`).
- `utils/` for helpers (e.g., `safeAreaManager.ts`, `statusBar.ts`, `translations.ts`, `mixpanel.ts`, `clevertap.ts`).
- `config/` for runtime configuration (e.g., `agora.ts`).
- `android/` native Android project (Gradle), Manifest, assets.
- `www/` static export of Next.js for Capacitor packaging.

## Tech Stack

- Next.js 14 static export, Tailwind CSS, React 18.
- Capacitor 5 (`@capacitor/android`, `@capacitor/core`, `@capacitor/cli`).
- Plugins: `@capacitor/status-bar`, `@capacitor/browser`, `@capacitor/app`, `@capacitor/keyboard`, `@codetrix-studio/capacitor-google-auth`.
- Cordova plugin: `clevertap-cordova` via `@awesome-cordova-plugins`.

## Data Flow

- Client components make `fetch` calls to Admin API endpoints through rewrites configured in `next.config.js`.
- Some requests use in-app `app/api/*` Next.js routes for proxying or minimal server logic (e.g., call log proxy).
- Persistent storage via `localStorage` for user data; session storage for transient call session IDs.

## Mobile Integration

- Capacitor wraps the web app in an Android WebView, syncing static assets from `out`→`www`.
- Manifest settings configure status bar, input behavior, permissions.
- Keyboard and safe-area handling ensure stable UI across devices (Samsung/Xiaomi).