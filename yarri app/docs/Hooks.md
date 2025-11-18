# Hooks

## Custom Hooks

- `useBackButton.ts`: Handles Android back button behavior; coordinates with Capacitor App plugin.
- `useNavigationBar.ts`: Manages Android navigation bar visibility and colors.
- `useSafeArea.ts`: Reads safe-area insets and exposes CSS variables for consistent padding across devices.

## Usage Notes

- Always initialize `SafeAreaInit` early to set CSS variables before page render to avoid jank.
- Back button behavior should respect route state and modals; ensure appropriate cleanup on unmount.