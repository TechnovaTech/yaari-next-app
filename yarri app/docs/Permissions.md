# Permissions and Manifest

## Android Permissions
- `android.permission.INTERNET`
- `android.permission.CAMERA`
- `android.permission.RECORD_AUDIO`
- `android.permission.MODIFY_AUDIO_SETTINGS`
- `android.permission.ACCESS_NETWORK_STATE`
- `android.permission.BLUETOOTH`
- `android.permission.BLUETOOTH_CONNECT`
- `android.permission.GET_ACCOUNTS`

## Hardware Features
- `android.hardware.camera`
- `android.hardware.camera.autofocus`
- `android.hardware.microphone`

## Activity Configuration
- `MainActivity` uses `singleTask` and broad `configChanges`.
- Recommended additions:
  - `android:windowSoftInputMode="adjustPan"`
  - `android:resizeableActivity="false"`

## Network Security
- `android:usesCleartextTraffic="true"` and `@xml/network_security_config` configured for development.