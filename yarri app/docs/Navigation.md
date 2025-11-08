# Navigation

## Rules
- After login:
  - If user has `name` and `gender`, navigate to `/users/`.
  - Else navigate to `/language/` to complete onboarding.
- Call acceptance navigates to `/audio-call` or `/video-call` based on `callData.type`.

## Socket-driven Navigation
- On `call-accepted`: save `channelName` and route to call screen.
- On `call-declined` or `call-busy`: clear `callData` and alert user.
- On `call-ended`: clear session and return to `/users`.

## Safe Area Layout
- Pages use `SafeAreaLayout` and Tailwind helpers to keep headers/footers visible.
- `/login/` applies custom keyboard-open offset while avoiding top padding.