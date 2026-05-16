import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyBWTKCHUUNvkgSm2G5fpqaFyJ6M1kqDz2o',
    appId: '1:905375433822:web:97e6d5bba4345e4bb560cf',
    messagingSenderId: '905375433822',
    projectId: 'gaming-platform-2025',
    authDomain: 'gaming-platform-2025.firebaseapp.com',
    storageBucket: 'gaming-platform-2025.firebasestorage.app',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyBWTKCHUUNvkgSm2G5fpqaFyJ6M1kqDz2o',
    appId: '1:905375433822:android:your_android_app_id',
    messagingSenderId: '905375433822',
    projectId: 'gaming-platform-2025',
    storageBucket: 'gaming-platform-2025.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyBWTKCHUUNvkgSm2G5fpqaFyJ6M1kqDz2o',
    appId: '1:905375433822:ios:your_ios_app_id',
    messagingSenderId: '905375433822',
    projectId: 'gaming-platform-2025',
    storageBucket: 'gaming-platform-2025.firebasestorage.app',
  );

  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: 'AIzaSyBWTKCHUUNvkgSm2G5fpqaFyJ6M1kqDz2o',
    appId: '1:905375433822:ios:your_macos_app_id',
    messagingSenderId: '905375433822',
    projectId: 'gaming-platform-2025',
    storageBucket: 'gaming-platform-2025.firebasestorage.app',
  );
}