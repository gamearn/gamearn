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
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_CONFIG } from '../config/appConfig';

const app = initializeApp(FIREBASE_CONFIG);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { app };

export const getCurrentUser = () => auth.currentUser;

export const reloadCurrentUser = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  await user.reload();
  return auth.currentUser;
};

export const onUserChanged = (cb) => onAuthStateChanged(auth, cb);

export const getIdToken = async (forceRefresh = false) => {
  const user = auth.currentUser;
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

export const signOutFirebase = async () => {
  await fbSignOut(auth);
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
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return err?.message || 'Authentication failed. Please try again.';
  }
};