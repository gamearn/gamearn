// Auth state: Firebase is the identity authority; the Node backend is the
// profile/wallet source of truth. Exposes the same API the screens used with
// mock auth (user, userProfile, loading, signIn, signUp, signOut,
// updateProfileData) plus backend-specific helpers.

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as AppleAuthentication from 'expo-apple-authentication';
import { randomUUID as cryptoRandomUUID } from 'expo-crypto';
import { GOOGLE_CLIENT_IDS, FACEBOOK_APP_ID } from '../config/appConfig';

// Expo Go (StoreClient) runs a browser-based OAuth flow, so Google must go
// through the https://auth.expo.io proxy with the WEB client ID (the android
// client would otherwise trigger the "installed apps" policy block).
const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';
const GOOGLE_USE_PROXY = IS_EXPO_GO;
import {
  onUserChanged,
  loginEmailPassword,
  registerEmailPassword,
  signInWithGoogleIdToken,
  signInWithFacebookToken,
  signInWithAppleToken,
  signOutFirebase,
  friendlyAuthError,
  getCurrentUser,
  reloadCurrentUser,
} from '../services/firebase';
import { auth as authApi, wallet } from '../services/api';
import { ApiError } from '../services/apiClient';

const AuthContext = createContext();

function profileFromMe(me) {
  return {
    ...me,
    // Convenience fields consumed by existing screens.
    username: me.displayName || me.email?.split('@')[0] || '',
    displayName: me.displayName || '',
    phone: me.phoneNumber || '',
    walletBalance: me.wallet?.balance ?? 0,
    coins: me.wallet?.balance ?? 0,
    isPremium: !!me.premium?.isPremium,
  };
}

async function isAdminUser() {
  const { getCurrentUser } = await import('../services/firebase');
  const user = getCurrentUser();
  if (!user) return false;
  try {
    const { claims } = await user.getIdTokenResult();
    return claims?.admin === true;
  } catch {
    return false;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(false);

  const [googleRequest, googleResponse, googlePrompt] = Google.useIdTokenAuthRequest(
    IS_EXPO_GO
      ? { clientId: GOOGLE_CLIENT_IDS.webClientId }
      : {
          webClientId: GOOGLE_CLIENT_IDS.webClientId,
          androidClientId: GOOGLE_CLIENT_IDS.androidClientId,
          iosClientId: GOOGLE_CLIENT_IDS.iosClientId,
        },
    { useProxy: GOOGLE_USE_PROXY },
  );

  const [facebookRequest, facebookResponse, facebookPrompt] = Facebook.useAuthRequest(
    {
      clientId: FACEBOOK_APP_ID,
      scopes: ['public_profile', 'email'],
    },
    { useProxy: GOOGLE_USE_PROXY },
  );

  // Onboarding details collected by RegisterScreen until the email is verified.
  const pendingProfile = React.useRef({ displayName: null, phoneNumber: null });

  const getPendingProfile = () => pendingProfile.current;

  const loadBackendProfile = useCallback(async (fbUser) => {
    try {
      // login updates last_login and returns profile + wallet; me() is the
      // richer endpoint. login first so the backend tracks the session.
      await authApi.login({});
      const me = await authApi.me();
      const isAdmin = await isAdminUser();
      setUserProfile(profileFromMe({ ...me, isAdmin }));
      setBackendReady(true);
      return me;
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 404) {
        // Registered in Firebase but not in the backend yet → onboarding.
        setUserProfile(null);
        setBackendReady(false);
        return null;
      }
      if (err instanceof ApiError && err.statusCode === 401) {
        // Login rejected / banned. Keep Firebase session but no profile.
        setUserProfile(null);
        setBackendReady(false);
        return null;
      }
      console.warn('[Auth] profile load failed', err?.code, err?.message);
      setUserProfile(null);
      setBackendReady(false);
      return null;
    }
  }, []);

  useEffect(() => {
    const unsub = onUserChanged(async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        await loadBackendProfile(fbUser);
      } else {
        setUser(null);
        setUserProfile(null);
        setBackendReady(false);
      }
      setLoading(false);
    });
    return unsub;
  }, [loadBackendProfile]);

  useEffect(() => {
    if (googleResponse?.type === 'success' && googleResponse.params?.id_token) {
      (async () => {
        try {
          const fbUser = await signInWithGoogleIdToken(googleResponse.params.id_token);
          setUser(fbUser);
          await loadBackendProfile(fbUser);
        } catch (err) {
          console.warn('[Auth] Google sign-in failed', err?.code || err?.message);
        }
      })();
    }
  }, [googleResponse, loadBackendProfile]);

  useEffect(() => {
    if (facebookResponse?.type === 'success' && facebookResponse.params?.access_token) {
      (async () => {
        try {
          const fbUser = await signInWithFacebookToken(facebookResponse.params.access_token);
          setUser(fbUser);
          await loadBackendProfile(fbUser);
        } catch (err) {
          console.warn('[Auth] Facebook sign-in failed', err?.code || err?.message);
        }
      })();
    }
  }, [facebookResponse, loadBackendProfile]);

  const signIn = async (email, password) => {
    const fbUser = await loginEmailPassword(email, password);
    setUser(fbUser);
    await loadBackendProfile(fbUser);
    return fbUser;
  };

  const signUp = async (email, password, displayName = null, phoneNumber = null) => {
    try {
      const fbUser = await registerEmailPassword(email, password);
      setUser(fbUser);
      if (displayName || phoneNumber) {
        // Stash onboarding details for backendRegister() once email is verified.
        pendingProfile.current = {
          displayName,
          phoneNumber,
        };
      }
      return fbUser;
    } catch (err) {
      throw new Error(friendlyAuthError(err));
    }
  };

  const sendEmailOtp = async (email) => {
    const res = await authApi.requestSignupEmailOtp(email);
    return res;
  };

  const verifyEmailOtp = async (email, code) => {
    await authApi.verifySignupEmailOtp(email, code);
    await reloadCurrentUser();
    const fbUser = getCurrentUser();
    setUser(fbUser);
    return fbUser;
  };

  const signUpWithGoogle = async () => {
    if (!googleRequest) {
      throw new Error('Google sign-in is not ready.');
    }
    await googlePrompt();
  };

  const backendRegister = async ({ phoneNumber, displayName, referralCode }) => {
    await authApi.register({ phoneNumber, displayName, referralCode });
    const me = await authApi.me();
    const isAdmin = await isAdminUser();
    setUserProfile(profileFromMe({ ...me, isAdmin }));
    setBackendReady(true);
    return me;
  };

  const refreshProfile = useCallback(async () => {
    const me = await loadBackendProfile(user);
    return me;
  }, [user, loadBackendProfile]);

  const updateProfileData = async (updates) => {
    let next = { ...(userProfile || {}), ...updates };
    const displayName = updates.displayName || updates.username;
    if (displayName) {
      try {
        await authApi.updateProfile({ displayName });
      } catch (err) {
        console.warn('[Auth] profile patch failed', err?.message);
      }
    }
    setUserProfile(profileFromMe(next));
    return next;
  };

  const signOut = async () => {
    await signOutFirebase();
    setUser(null);
    setUserProfile(null);
    setBackendReady(false);
  };

  const refreshWallet = useCallback(async () => {
    const w = await wallet.get();
    setUserProfile((prev) => ({
      ...(prev || {}),
      walletBalance: w.balance,
      coins: w.balance,
    }));
    return w;
  }, []);

  const value = useMemo(
    () => ({
      user,
      userProfile,
      loading,
      backendReady,
      signIn,
      signUp,
      signUpWithGoogle,
      backendRegister,
      getPendingProfile,
      sendEmailOtp,
      verifyEmailOtp,
      signOut,
      updateProfileData,
      refreshProfile,
      refreshWallet,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, userProfile, loading, backendReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);