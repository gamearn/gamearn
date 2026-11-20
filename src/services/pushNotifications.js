// Push notifications via native Firebase Cloud Messaging.
//
// Works only in a native build (dev client / TestFlight / Play Store), not
// Expo Go. All calls are best-effort — a missing module or denied permission
// must never break sign-in or gameplay.
//
// Token registration: the FCM token is saved on the backend user record via
// POST /auth/login ({ fcmToken }) so the challenge push helpers can find it.
// Token rotation is handled by onTokenRefresh, which re-sends the new token.

import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { auth as authApi } from './api';

export const ANDROID_CHANNEL_ID = 'gamearn';

const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let _messaging = null;
let _initialized = false;
let _permissionGranted = false;
let _requestInFlight = null;

// Last notification whose tap opened the app (or brought it to foreground).
// The navigation layer reads and clears this once authenticated.
let _pendingOpen = null;
let _openListeners = new Set();

const getMessaging = () => {
  if (_messaging) return _messaging;
  if (IS_EXPO_GO) return null;
  try {
    const mod = require('@react-native-firebase/messaging');
    if (!mod || typeof mod.getMessaging !== 'function') return null;
    _messaging = mod.getMessaging();
    return _messaging;
  } catch (e) {
    return null;
  }
};

export const isPushAvailable = () => !!getMessaging();

/**
 * Ask the OS for notification permission. Android 13+ and iOS both require
 * this. Older Android versions are implicitly authorized.
 */
export const requestPermission = async () => {
  const messaging = getMessaging();
  if (!messaging) return false;
  if (_permissionGranted) return true;
  if (_requestInFlight) return _requestInFlight;

  _requestInFlight = (async () => {
    try {
      if (Platform.OS === 'android' && messaging.authorizationStatus) {
        const status = await messaging.authorizationStatus();
        // Android 12 and below report AUTHORIZED; 13+ reports NOT_DETERMINED.
        if (status === 2 /* AUTHORIZED */ || status === 1 /* PROVISIONAL */) {
          _permissionGranted = true;
          return true;
        }
      }
      const AuthorizationStatus = require('@react-native-firebase/messaging').AuthorizationStatus;
      const status = await messaging.requestPermission();
      _permissionGranted =
        status === AuthorizationStatus.AUTHORIZED ||
        status === AuthorizationStatus.PROVISIONAL;
      return _permissionGranted;
    } catch (e) {
      _permissionGranted = false;
      return false;
    } finally {
      _requestInFlight = null;
    }
  })();

  return _requestInFlight;
};

/** Create the Android channel the backend sends to (channelId: 'gamearn'). */
const createAndroidChannel = async (messaging) => {
  if (Platform.OS !== 'android') return;
  try {
    if (typeof messaging.android?.createChannel === 'function') {
      await messaging.android.createChannel({
        id: ANDROID_CHANNEL_ID,
        name: 'Gamearn',
        importance: 4, // IMPORTANCE_HIGH
        sound: 'default',
        vibrationEnabled: true,
        showBadge: true,
      });
    }
  } catch (e) {
    // Channel creation is best-effort; FCM falls back to the default channel.
  }
};

/** Fetch the current FCM device token (requests permission if needed). */
export const getToken = async () => {
  try {
    const messaging = getMessaging();
    if (!messaging) return null;
    const granted = await requestPermission();
    if (!granted) return null;
    await createAndroidChannel(messaging);
    return await messaging.getToken();
  } catch (e) {
    return null;
  }
};

/**
 * Obtain the FCM token and persist it on the backend user record.
 * Safe to call after every sign-in (idempotent).
 */
export const registerFcmToken = async () => {
  try {
    const token = await getToken();
    if (!token) return null;
    await authApi.login({ fcmToken: token });
    return token;
  } catch (e) {
    return null;
  }
};

/** Delete the local FCM token on sign-out. The backend token row is left
 *  untouched, but pushes to a deleted device token fail silently. */
export const unregisterFcmToken = async () => {
  try {
    const messaging = getMessaging();
    if (!messaging) return;
    await messaging.deleteToken();
  } catch (e) {
    // best-effort
  }
};

const normalizeOpenData = (remoteMessage) => {
  if (!remoteMessage) return null;
  const data = remoteMessage.data || {};
  return {
    type: data.type || 'general',
    gameType: data.gameType || null,
    challengeId: data.challengeId || null,
    roomId: data.roomId || null,
    notificationId: data.notificationId || null,
    title: remoteMessage.notification?.title || null,
    body: remoteMessage.notification?.body || null,
  };
};

const emitOpen = (info) => {
  _pendingOpen = info;
  _openListeners.forEach((fn) => {
    try { fn(info); } catch (e) { /* ignore */ }
  });
};

/** Subscribe to notification-open events. Returns an unsubscribe function. */
export const onNotificationOpen = (listener) => {
  _openListeners.add(listener);
  if (_pendingOpen) {
    try { listener(_pendingOpen); } catch (e) { /* ignore */ }
  }
  return () => _openListeners.delete(listener);
};

/** Read (and optionally clear) the last notification that opened the app. */
export const consumePendingOpen = () => {
  const pending = _pendingOpen;
  _pendingOpen = null;
  return pending;
};

/**
 * Register all notification handlers. Call once when the app mounts (after
 * AuthProvider so a user is available). Returns a cleanup function.
 */
export const setupPushHandlers = ({ onForegroundMessage } = {}) => {
  const messaging = getMessaging();
  if (!messaging) return () => {};

  const unsubs = [];

  try {
    unsubs.push(
      messaging.onMessage((remoteMessage) => {
        // Foreground: refresh in-app list via the caller; do not show a
        // duplicate system notification here (FCM shows it in background).
        onForegroundMessage?.(normalizeOpenData(remoteMessage));
      })
    );
  } catch (e) { /* ignore */ }

  try {
    unsubs.push(
      messaging.onNotificationOpenedApp((remoteMessage) => {
        emitOpen(normalizeOpenData(remoteMessage));
      })
    );
  } catch (e) { /* ignore */ }

  try {
    unsubs.push(
      messaging.onTokenRefresh(async () => {
        try {
          const token = await messaging.getToken();
          if (token) await authApi.login({ fcmToken: token });
        } catch (e) { /* ignore */ }
      })
    );
  } catch (e) { /* ignore */ }

  // App was terminated when the notification was tapped.
  messaging
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) emitOpen(normalizeOpenData(remoteMessage));
    })
    .catch(() => {});

  return () => unsubs.forEach((fn) => {
    try { fn(); } catch (e) { /* ignore */ }
  });
};
