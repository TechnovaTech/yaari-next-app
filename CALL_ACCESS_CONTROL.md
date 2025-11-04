# Call Access Control Feature

## Overview
This feature allows admins to control video and audio call access for individual users (creators) from the Yarri Admin Panel.

## Access Levels

### 1. **Full Access** 🎥 + 📞
- Both video and audio call buttons are visible
- User can make both types of calls
- Default setting for new users

### 2. **Video Only** 🎥
- Only video call button is visible
- Audio call button is hidden
- User can only make video calls

### 3. **Audio Only** 📞
- Only audio call button is visible
- Video call button is hidden
- User can only make audio calls

### 4. **No Access** 🚫
- Both call buttons are hidden
- User cannot make any calls
- Call section is completely hidden

## How to Use (Admin Panel)

1. Navigate to **Dashboard → Users**
2. Find the user you want to manage
3. Click on the **Call Access** badge in the user row
4. Select the desired access level from the modal:
   - Full Access
   - Video Only
   - Audio Only
   - No Access
5. The change is applied immediately

## How It Works (Yaari App)

When a user views another user's profile:
- The app fetches the target user's call access settings
- Call buttons are displayed based on permissions:
  - **Full Access**: Both video and audio buttons shown
  - **Video Only**: Only video button shown
  - **Audio Only**: Only audio button shown
  - **No Access**: No call buttons shown (call section hidden)

## Technical Implementation

### Database Field
- Field: `callAccess`
- Type: String (enum)
- Values: `'none'` | `'audio'` | `'video'` | `'full'`
- Default: `'full'`

### Files Modified

#### Admin Panel
- `app/dashboard/users/page.tsx` - Added call access control UI and modal

#### Yaari App
- `components/UserDetailScreen.tsx` - Added conditional rendering of call buttons

### API Endpoint
- **PUT** `/api/users/[id]`
- Body: `{ callAccess: 'none' | 'audio' | 'video' | 'full' }`

## Benefits

1. **Content Moderation**: Control which creators can offer call services
2. **Monetization Control**: Manage premium features per user
3. **User Safety**: Restrict call access for problematic users
4. **Flexible Permissions**: Granular control over call types
5. **Real-time Updates**: Changes reflect immediately in the app
