// Firebase client — JS SDK for Expo Go (no native modules required).
// Persists the auth session via AsyncStorage (getReactNativePersistence).

import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithCredential,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  getAuth,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { FIREBASE_CONFIG } from '../config/appConfig';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const app = initializeApp(FIREBASE_CONFIG);

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  auth = getAuth(app);
}
const storage = getStorage(app);

export { app };

export const uploadProfileImage = async (uid, uri) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const target = ref(storage, `profile-photos/${uid}/avatar-${Date.now()}.jpg`);
  await uploadBytes(target, blob, { contentType: blob.type || 'image/jpeg' });
  return getDownloadURL(target);
};

// Native Firebase Auth (@react-native-firebase) — required for phone/SMS
// sign-in. Present only in the installed dev/standalone build; absent in
// Expo Go, where the JS SDK above is used for every provider.
const getNativeAuth = () => {
    if (IS_EXPO_GO) return null;
    try {
        const mod = require('@react-native-firebase/auth');
        if (!mod || typeof mod.getAuth !== 'function') return null;
        return mod.getAuth();
    } catch (e) {
        return null;
    }
};

export const isNativeAuthAvailable = () => !!getNativeAuth();

// A native session (e.g. phone sign-in) takes precedence over the JS SDK one.
export const getBestAuthUser = () => {
    const native = getNativeAuth();
    if (native && native.currentUser) return native.currentUser;
    return auth.currentUser;
};

// Normalize a Nigerian phone into E.164 (+234...) for Firebase SMS.
export const normalizePhoneToE164 = (raw) => {
    const digits = String(raw || '').replace(/[^\d+]/g, '').replace(/^00/, '+');
    if (digits.startsWith('+')) {
        return /^\+\d{10,15}$/.test(digits) ? digits : null;
    }
    if (digits.startsWith('234') && digits.length === 13) return `+${digits}`;
    if (digits.startsWith('0') && digits.length === 11) return `+234${digits.slice(1)}`;
    if (digits.length === 10) return `+234${digits}`;
    return null;
};

// Ask Firebase to send an SMS code to the given E.164 phone number.
// Returns a confirmation (verificationId) used by confirmPhoneCode.
export const sendPhoneCode = async (phoneNumber) => {
    const mod = require('@react-native-firebase/auth');
    if (!mod || typeof mod.signInWithPhoneNumber !== 'function' || typeof mod.getAuth !== 'function') {
        throw new Error('Phone sign-in needs the installed Gamearn app (native SMS). Open the dev build instead of Expo Go.');
    }
    return mod.signInWithPhoneNumber(mod.getAuth(), phoneNumber);
};

// Submit the SMS code and resolve to the signed-in Firebase user.
export const confirmPhoneCode = async (confirmation, code) => {
    if (!confirmation) throw new Error('Request a code first.');
    const res = await confirmation.confirm(String(code).trim());
    return res.user;
};

export const getCurrentUser = () => getBestAuthUser();

export const reloadCurrentUser = async () => {
    const user = getBestAuthUser();
    if (!user) return null;
    await user.reload();
    return getBestAuthUser();
};

export const onUserChanged = (cb) => {
    const native = getNativeAuth();
    const emit = () => {
        const u = (native && native.currentUser) || auth.currentUser;
        cb(u);
    };
    const unsubs = [onAuthStateChanged(auth, emit)];
    if (native) {
        const mod = require('@react-native-firebase/auth');
        if (typeof mod.onAuthStateChanged === 'function') unsubs.push(mod.onAuthStateChanged(native, emit));
    }
    return () => { unsubs.forEach((unsub) => unsub()); };
};

export const getIdToken = async (forceRefresh = false) => {
    const user = getBestAuthUser();
    if (!user) return null;
    return user.getIdToken(forceRefresh);
};

export const loginEmailPassword = async (email, password) => {
  const res = await signInWithEmailAndPassword(auth, email.trim(), password);
  return res.user;
};

export const registerEmailPassword = async (email, password) => {
  const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
  return res.user;
};

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email.trim());
};

// Sign in with an id_token from Google OAuth (expo-auth-session).
export const signInWithGoogleIdToken = async (idToken) => {
  const credential = GoogleAuthProvider.credential(idToken);
  const res = await signInWithCredential(auth, credential);
  return res.user;
};

// Sign in with an access_token from Facebook OAuth (expo-auth-session).
export const signInWithFacebookToken = async (accessToken) => {
  const credential = FacebookAuthProvider.credential(accessToken);
  const res = await signInWithCredential(auth, credential);
  return res.user;
};

// Sign in with the identity token + raw nonce from Sign In with Apple.
export const signInWithAppleToken = async (idToken, rawNonce) => {
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({ idToken, rawNonce });
  const res = await signInWithCredential(auth, credential);
  return res.user;
};

export const signOutFirebase = async () => {
    const native = getNativeAuth();
    if (native && native.currentUser) {
        const mod = require('@react-native-firebase/auth');
        if (typeof mod.signOut === 'function') await mod.signOut(native);
    }
    if (auth.currentUser) {
        await fbSignOut(auth);
    }
};

// Map common Firebase auth errors to friendly user messages.
export const friendlyAuthError = (err) => {
    const code = err?.code || '';
    switch (code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Incorrect email or password.';
        case 'auth/email-already-in-use':
            return 'An account already exists for this email.';
        case 'auth/invalid-email':
            return 'Enter a valid email address.';
        case 'auth/weak-password':
            return 'Password must be at least 6 characters.';
        case 'auth/network-request-failed':
            return 'No internet connection. Check your network and try again.';
        case 'auth/account-exists-with-different-credential':
            return 'This email already uses a different sign-in method. Sign in with your original method.';
        case 'auth/operation-not-allowed':
            return 'This sign-in provider is not enabled for Gamearn yet.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please try again later.';
        case 'auth/invalid-phone-number':
            return 'Enter a valid phone number with your country code.';
        case 'auth/missing-phone-number':
            return 'Enter your phone number first.';
        case 'auth/invalid-verification-code':
        case 'auth/missing-verification-code':
            return 'That code was incorrect. Check the SMS and try again.';
        case 'auth/code-expired':
        case 'auth/session-expired':
            return 'That code expired. Request a new one.';
        case 'auth/quota-exceeded':
            return 'SMS is temporarily blocked for this number. Try again later.';
        case 'auth/provider-already-linked':
            return 'This phone is already linked to an account.';
        case 'auth/captcha-check-failed':
            return 'We could not verify you are not a robot. Try again.';
        default:
            return err?.message || 'Authentication failed. Please try again.';
    }
};
