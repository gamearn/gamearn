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

  // TODO: log into the Firebase account that owns `gamearn-app` and run
  // `flutterfire configure` to finalize the web and macOS options below.
  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyBV8HNGct-D1DdV0Eo4U1RzOhTJ4gw9d94',
    appId: '1:600025492198:web:0000000000000000000000',
    messagingSenderId: '600025492198',
    projectId: 'gamearn-app',
    authDomain: 'gamearn-app.firebaseapp.com',
    storageBucket: 'gamearn-app.firebasestorage.app',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyBV8HNGct-D1DdV0Eo4U1RzOhTJ4gw9d94',
    appId: '1:600025492198:android:a03194ad5fc218a24ca927',
    messagingSenderId: '600025492198',
    projectId: 'gamearn-app',
    storageBucket: 'gamearn-app.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyDlCxnle8bZ1-n9ToUpwwSQJJ7z6aoc-Wc',
    appId: '1:600025492198:ios:073c2eee1717f98f4ca927',
    messagingSenderId: '600025492198',
    projectId: 'gamearn-app',
    storageBucket: 'gamearn-app.firebasestorage.app',
    iosBundleId: 'com.gamearn',
  );

  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: 'AIzaSyDlCxnle8bZ1-n9ToUpwwSQJJ7z6aoc-Wc',
    appId: '1:600025492198:macos:0000000000000000000000',
    messagingSenderId: '600025492198',
    projectId: 'gamearn-app',
    storageBucket: 'gamearn-app.firebasestorage.app',
    iosBundleId: 'com.gamearn',
  );
}
