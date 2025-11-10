# Call Functionality Improvements

## Changes Made

### 1. Added Socket.IO Integration
- **New dependency**: `socket_io_client: ^2.0.3+1` in `pubspec.yaml`
- **New service**: `lib/services/socket_service.dart` for real-time communication
- Matches the yarri app's Socket.IO implementation for call signaling

### 2. Updated Outgoing Call Service
- Replaced Agora RTM with Socket.IO for call signaling
- Added ringing dialog UI during outgoing calls
- Handles call-accepted, call-declined, and call-busy events
- Emits proper Socket.IO events: `call-user`, `end-call`

### 3. Updated Incoming Call Service
- Replaced Agora RTM with Socket.IO for receiving calls
- Listens to `incoming-call` event from server
- Emits `accept-call` and `decline-call` events
- Properly handles call acceptance and navigation

### 4. Enhanced Home Screen
- Added Socket.IO initialization on screen load
- Real-time user status updates (online/offline/busy)
- Listens to `online-users` and `user-status-change` events
- Updates user status dynamically without refresh

### 5. Improved Call Service
- Better state cleanup when leaving calls
- Proper reset of joined status and remote UID

## How It Works

1. **User opens app** → Socket.IO connects with user ID
2. **User clicks call button** → Shows permission & confirmation dialogs
3. **User confirms call** → Emits `call-user` event via Socket.IO
4. **Ringing state** → Shows ringing dialog with cancel option
5. **Receiver accepts** → Both navigate to call screen with Agora
6. **Call ends** → Proper cleanup and navigation back

## Next Steps

Run `flutter pub get` to install the new Socket.IO dependency.

## Server Requirements

The app expects a Socket.IO server at `https://admin.yaari.me` with these events:
- `register` - Register user connection
- `user-online` - Update user online status
- `get-online-users` - Request online users list
- `call-user` - Initiate a call
- `accept-call` - Accept incoming call
- `decline-call` - Decline incoming call
- `end-call` - End active call
- `incoming-call` - Receive incoming call notification
- `call-accepted` - Call was accepted
- `call-declined` - Call was declined
- `call-busy` - User is busy
- `online-users` - List of online users
- `user-status-change` - User status changed
