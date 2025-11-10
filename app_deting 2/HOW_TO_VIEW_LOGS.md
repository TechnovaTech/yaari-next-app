# How to View Logs in Flutter

## Method 1: Using Android Studio / VS Code (Recommended)

### In Android Studio:
1. Run your app in debug mode
2. Open the **Logcat** tab at the bottom
3. Filter logs by:
   - **Tag**: Enter `flutter` to see all Flutter logs
   - **Package**: Select your app package `com.example.app_deting`
   - **Level**: Choose `Debug` or `Verbose`

### In VS Code:
1. Run your app with `F5` or `Run > Start Debugging`
2. Open the **Debug Console** tab
3. All logs will appear here automatically

## Method 2: Using Terminal/Command Line

### View all logs:
```bash
flutter run
```

### View filtered logs (Android):
```bash
# In a separate terminal while app is running
adb logcat | grep flutter
```

### View specific tags:
```bash
adb logcat | grep "HomeScreen\|SocketService\|OutgoingCall\|IncomingCall"
```

## Method 3: Using Flutter DevTools

1. Run your app:
   ```bash
   flutter run
   ```

2. Open DevTools (URL will be shown in terminal):
   ```bash
   flutter pub global activate devtools
   flutter pub global run devtools
   ```

3. Go to **Logging** tab to see all logs

## Log Emoji Guide

Our logs use emojis for easy identification:

- 🔌 **Socket connection events**
- 👤 **User information**
- ✅ **Success operations**
- ❌ **Errors**
- ⚠️ **Warnings**
- 📊 **Data loading**
- 📞 **Call events**
- 📤 **Emitting events**
- 📥 **Receiving events**
- 👂 **Listening to events**
- 🔔 **Incoming call**
- 📵 **Call busy**
- 🔄 **Reconnection**

## Key Log Tags to Watch

### HomeScreen
- Socket initialization
- User data loading
- User status updates
- Balance and settings

### SocketService
- Connection status
- Event emissions
- Event receptions
- Errors

### OutgoingCall
- Call initiation
- Call responses (accepted/declined/busy)
- Caller information

### IncomingCall
- Incoming call notifications
- Call acceptance/decline
- Navigation events

## Example Log Output

```
🔌 Initializing Socket.IO [HomeScreen]
👤 User ID: 12345 [HomeScreen]
🔌 Connecting to Socket.IO server... [SocketService]
✅ Socket connected successfully [SocketService]
📤 Emitted: register, user-online, get-online-users [SocketService]
✅ Socket connected and listening [HomeScreen]
📊 Loading home data... [HomeScreen]
✅ Loaded 5 users, 2 ads, balance: 100 [HomeScreen]
📥 Received online-users: 5 users [HomeScreen]
```

## Troubleshooting

### No logs appearing?
1. Make sure you're running in **debug mode**
2. Check if logs are filtered out
3. Try `flutter clean` and rebuild

### Too many logs?
Filter by specific tags:
```bash
adb logcat | grep "HomeScreen"
```

### Want to save logs to file?
```bash
adb logcat > app_logs.txt
```

## Real-time Log Monitoring

For continuous monitoring during development:

```bash
# Terminal 1: Run app
flutter run

# Terminal 2: Monitor logs
adb logcat -c && adb logcat | grep -E "HomeScreen|SocketService|OutgoingCall|IncomingCall"
```
