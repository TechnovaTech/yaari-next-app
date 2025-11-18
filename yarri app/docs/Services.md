# Services, Utils, and Contexts

## Contexts

- `LanguageContext.tsx`: Provides selected language and helpers to switch; interacts with `utils/translations.ts`.
- `SocketContext.tsx`: Manages Socket.IO client for real-time features (calls, messaging).

## Utils

- `safeAreaManager.ts`: Reads native safe-area (when available) and sets CSS variables, with fallbacks for devices where `env()` is inconsistent.
- `statusBar.ts`: Configures status bar overlay, style, and background; ensures consistent app colors.
- `translations.ts`: Key-value translations for supported languages.
- `mixpanel.ts`: Initializes and tracks Mixpanel events.
- `clevertap.ts`: Wraps CleverTap initialization and event logging.
- `coinDeduction.ts`: Helpers for coin accounting.
- `audioRoute.ts`, `audioRouting.ts`: Manages audio input/output device routing and capture.
- `userTracking.ts`: Shared user tracking utilities.

## Config

- `config/agora.ts`: Exposes Agora credentials and initialization helpers for RTC sessions.