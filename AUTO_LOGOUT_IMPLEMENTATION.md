# Auto Logout Implementation

## Overview
When a user is deleted from the Yarri Admin Panel, they are automatically logged out from the app_deting 2 mobile app.

## How It Works

### 1. Admin Panel (yarri admin panel)
When an admin deletes a user from `/dashboard/users`:

**File: `app/api/users/[id]/route.ts`**
- The DELETE endpoint emits a `force-logout` socket event to the deleted user
- Uses Socket.IO room targeting: `io.to(userId).emit('force-logout', { reason: 'account_deleted' })`

**File: `server.js`**
- Socket.IO instance is made globally accessible via `global.io`
- Users join their own room (userId) when they register: `socket.join(userId)`
- This allows targeted messages to specific users

### 2. Mobile App (app_deting 2)
**File: `lib/services/socket_service.dart`**
- Listens for `force-logout` event from the server
- When received, automatically:
  1. Disconnects the socket
  2. Clears all user data from SharedPreferences
  3. Navigates to the login screen

## Technical Flow
```
Admin Panel → Delete User → Emit 'force-logout' → Socket.IO Server → User's Device → Auto Logout
```

## Files Modified
1. `/yarri admin panel/app/api/users/[id]/route.ts` - Added socket emission on user deletion
2. `/yarri admin panel/server.js` - Made io globally accessible and added user rooms
3. `/app_deting 2/lib/services/socket_service.dart` - Added force-logout listener and handler

## Testing
1. Login to the mobile app with a test user
2. Delete that user from the admin panel at `/dashboard/users`
3. The mobile app should immediately logout and redirect to login screen
