// Gamearn client configuration
//
// Source of truth: the Node backend at api.gamearn.app. Same values the
// Flutter client used (docs/DEVELOPER_HANDOFF.md). Firebase options mirror
// the gamearn-app Firebase project config kept in the Flutter repo.

// Backend API Base URL — Change to your live server or http://localhost:3000 for local testing
// TODO: REPLACE_WITH_YOUR_BACKEND_URL (e.g., 'http://localhost:3000' or 'https://api.yourdomain.com')
export const NODE_API_BASE =
  process.env.EXPO_PUBLIC_NODE_API_BASE || 'https://api.gamearn.app';

export const API_PREFIX = '/api/v1';

// Firebase Web SDK Configuration — From Firebase Console -> Project Settings -> General -> Your Apps
// TODO: REPLACE_WITH_YOUR_FIREBASE_WEB_CONFIG
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBV8HNGct-D1DdV0Eo4U1RzOhTJ4gw9d94',
  authDomain: 'gamearn-app.firebaseapp.com',
  projectId: 'gamearn-app',
  storageBucket: 'gamearn-app.firebasestorage.app',
  messagingSenderId: '600025492198',
  appId: '1:600025492198:web:0000000000000000000000',
};

// Google OAuth Clients — From Google Cloud Console / Firebase Console Authentication
// TODO: REPLACE_WITH_YOUR_GOOGLE_CLIENT_IDS
export const GOOGLE_CLIENT_IDS = {
  webClientId:
    '600025492198-dcnafmn9aoojtn1v983ntie0vt2musgn.apps.googleusercontent.com',
  androidClientId:
    '600025492198-eo1a768ea7ffh7m398fqu0d99ohc034f.apps.googleusercontent.com',
  iosClientId:
    '600025492198-2g641acpvmhl1bm0m3f535kcodvhmt8k.apps.googleusercontent.com',
};

// Facebook OAuth — App ID from Meta Developer Portal (https://developers.facebook.com)
// TODO: REPLACE_WITH_YOUR_FACEBOOK_APP_ID
export const FACEBOOK_APP_ID = '1762055368454928';

// Apple Sign-In — Team ID from Apple Developer Portal (https://developer.apple.com)
// TODO: REPLACE_WITH_YOUR_APPLE_TEAM_ID
export const APPLE_TEAM_ID = '8D2897QPB3';

// Coin purchase rate: 1 coin = ₦50. Challenge stakes are configured by the
// player (custom amount) rather than preset tiers.
export const NAIRA_PER_COIN = 50;
export const coinsFromNaira = (n) => Math.max(0, Math.floor(Number(n || 0) / NAIRA_PER_COIN));
export const coinsFromKobo = (k) => Math.max(0, Math.floor(Number(k || 0) / (100 * NAIRA_PER_COIN)));

export const koboToN = (kobo) => (kobo / 100).toFixed(0);
export const nairaToKobo = (naira) => Math.round(Number(naira) * 100);
export const naira = (amount) =>
  `\u20A6${Number(amount).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

// ── App Store / deep-link identifiers for sharing outside the app ─────────────
// The universal landing URL (https://gamearn.app/i/<code>) is what goes in every
// shared invite; that page is configured to open the app when installed (via
// universal/deep link) and redirect to the correct store when it is not.
export const DEEP_LINK_SCHEME = 'gamearn';
export const ANDROID_PACKAGE = 'com.gamearn';
export const IOS_BUNDLE_ID = 'com.gamearn';
// App Store numeric ID — fill in once Gamearn is live on the App Store.
// Until then the iOS line of the share message falls back to the universal link.
export const IOS_APP_STORE_ID = '';
export const REFERRAL_LANDING_BASE = 'https://gamearn.app/i';

export const referralDeepLink = (code) => `${DEEP_LINK_SCHEME}://invite/${code}`;
export const referralUniversalLink = (code) => `${REFERRAL_LANDING_BASE}/${code}`;
export const playStoreLink = (code) =>
  `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}&referrer=utm_source%3Dinvite%26utm_campaign%3D${encodeURIComponent(code)}`;
export const appStoreLink = (code) =>
  IOS_APP_STORE_ID
    ? `https://apps.apple.com/app/id${IOS_APP_STORE_ID}`
    : referralUniversalLink(code);
