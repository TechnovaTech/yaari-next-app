import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError('Web platform not supported');
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError('Platform not supported');
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyA0lP6O_vCWHd5HLjirFEQ9tdoRlB-Ut34',
    appId: '1:427681836033:android:7feb7804e7ff4fb0b2e400',
    messagingSenderId: '427681836033',
    projectId: 'yaari-ff378',
    storageBucket: 'yaari-ff378.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'YOUR_IOS_API_KEY',
    appId: '1:YOUR_PROJECT_NUMBER:ios:YOUR_APP_ID',
    messagingSenderId: 'YOUR_SENDER_ID',
    projectId: 'yaari-ff378',
    storageBucket: 'yaari-ff378.firebasestorage.app',
    iosBundleId: 'com.example.appDeting',
  );
}
