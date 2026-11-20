import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'api_service.dart';

/// Top-level handler for messages received while the app is terminated
/// or in the background. Must stay in the isolate entry point.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // No Firebase.initializeApp() here — the notification payload is already
  // resolved and displayed by the OS. Log for diagnostics.
  debugPrint('[Push] background message: ${message.messageId} ${message.notification?.title}');
}

/// Push Notification Service
///
/// Requests permission, obtains the device FCM token, and syncs it to the
/// backend's Postgres `users.fcm_token` column via `PATCH /auth/profile`.
/// The backend uses that token for match/tournament/wallet notifications.
class PushService {
  PushService._();
  static final PushService instance = PushService._();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  /// Current device token (cached so callers can avoid re-fetching).
  String? _token;
  String? get token => _token;

  /// Requests permission and registers the device token with the backend.
  /// Safe to call at startup — degrades silently if permissions are denied.
  Future<void> init() async {
    try {
      // Background / terminated delivery (Android + iOS)
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      // Request permission (Android 13+ shows the runtime dialog;
      // iOS prompts for alert/badge/sound).
      final settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
      if (settings.authorizationStatus == AuthorizationStatus.denied) {
        debugPrint('[Push] notification permission denied');
        return;
      }

      // Initial token + sync
      final token = await _messaging.getToken();
      await _sync(token);

      // Keep the token fresh if it rotates
      _messaging.onTokenRefresh.listen(_sync);

      // Re-sync whenever a user signs in (init() may run before login)
      FirebaseAuth.instance.authStateChanges().listen((user) async {
        if (user != null && _token == null) {
          final t = await _messaging.getToken();
          await _sync(t);
        }
      });
    } catch (e) {
      debugPrint('[Push] init error: $e');
    }
  }

  /// Send the current FCM token to the backend (best-effort, non-blocking).
  Future<void> _sync(String? token) async {
    if (token == null || token.isEmpty) return;
    _token = token;
    try {
      await ApiService.patch('/auth/profile', {'fcmToken': token});
      debugPrint('[Push] token synced to backend');
    } catch (e) {
      debugPrint('[Push] token sync failed (will retry next launch): $e');
    }
  }
}
