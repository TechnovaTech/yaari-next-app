# Yaari Mobile App

A Next.js mobile application for Yaari dating app.

## Architecture

- **Mobile App** (Frontend only) → Calls → **Admin Panel API** (Backend)
- No backend in mobile app
- All API calls go to admin panel

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure API URL and Mixpanel token in `.env.local`:
```
NEXT_PUBLIC_API_URL=https://acsgroup.cloud
NEXT_PUBLIC_MIXPANEL_TOKEN=<your_mixpanel_project_token>
```

3. Run development server:
```bash
npm run dev
```

Mobile app runs on: https://acsgroup.cloud

## For Production (Capacitor)

1. Update API URL in `.env.local`:
```
NEXT_PUBLIC_API_URL=https://your-production-api.com
```

2. Build the app:
```bash
npm run build
```

3. Sync with Capacitor:
```bash
npx cap sync
```

4. Build APK/IPA:
```bash
npx cap open android
npx cap open ios
```

## Tech Stack

- Next.js 14 (Static Export)
- React 18
- TypeScript
- Tailwind CSS
- Capacitor (for native mobile)
