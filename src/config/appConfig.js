// Gamearn client configuration
//
// Source of truth: the Node backend at api.gamearn.app. Same values the
// Flutter client used (docs/DEVELOPER_HANDOFF.md). Firebase options mirror
// the gamearn-app Firebase project config kept in the Flutter repo.

export const NODE_API_BASE =
  process.env.EXPO_PUBLIC_NODE_API_BASE || 'https://api.gamearn.app';

export const API_PREFIX = '/api/v1';

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBV8HNGct-D1DdV0Eo4U1RzOhTJ4gw9d94',
  authDomain: 'gamearn-app.firebaseapp.com',
  projectId: 'gamearn-app',
  storageBucket: 'gamearn-app.firebasestorage.app',
  messagingSenderId: '600025492198',
  appId: '1:600025492198:web:0000000000000000000000',
};

// Google OAuth clients from google-services.json + GoogleService-Info.plist
// (gamearn-app project). The web client is used by Expo auth-session; the
// native ids are kept for future dev builds.
export const GOOGLE_CLIENT_IDS = {
  webClientId:
    '600025492198-dcnafmn9aoojtn1v983ntie0vt2musgn.apps.googleusercontent.com',
  androidClientId:
    '600025492198-eo1a768ea7ffh7m398fqu0d99ohc034f.apps.googleusercontent.com',
  iosClientId:
    '600025492198-2g641acpvmhl1bm0m3f535kcodvhmt8k.apps.googleusercontent.com',
};

// Entry fee tiers in kobo, matching matchmaking.js ENTRY_FEES.
export const ENTRY_FEES = {
  whot: { beginner: 10000, intermediate: 50000, expert: 200000 },
  ludo: { beginner: 10000, intermediate: 50000, expert: 200000 },
  ayo: { beginner: 5000, intermediate: 25000, expert: 100000 },
  draughts: { beginner: 10000, intermediate: 50000, expert: 200000 },
};

export const koboToN = (kobo) => (kobo / 100).toFixed(0);
export const nairaToKobo = (naira) => Math.round(Number(naira) * 100);
export const naira = (amount) =>
  `\u20A6${Number(amount).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;