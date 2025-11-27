# Keyboard and Safe Area

## Goals
- Prevent UI shift when keyboard opens.
- Keep action buttons visible and tappable.
- Respect device safe areas (notch, gesture bar).

## Implementation
- Keyboard:
  - Capacitor Keyboard plugin: `resize: 'none'`, `resizeOnFullScreen: false`.
  - Android Activity: recommend `windowSoftInputMode='adjustPan'` to avoid resizing.
  - `LoginScreen.tsx`: toggles `body.keyboard-open` and uses `--keyboard-offset` for a small bottom spacing.
- Safe Area:
  - `SafeAreaLayout` plus `utils/safeAreaManager.ts` detect insets and expose CSS variables.
  - Tailwind helpers: `pt-safe-top`, `pb-safe-bottom-extra` for fixed headers/footers.

## CSS Variables
- `--safe-area-top`, `--safe-area-bottom`, `--keyboard-offset`.
- Use `calc(var(--safe-area-bottom) + var(--keyboard-offset))` for fixed bottom controls.

## Testing
- Verify on devices with different OEM skins (Samsung, Xiaomi) and navigation modes (gesture/button).
- Confirm login page actions remain visible with the keyboard open.