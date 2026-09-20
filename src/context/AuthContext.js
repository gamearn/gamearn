// Auth state: Firebase is the identity authority; the Node backend is the
// profile/wallet source of truth. Exposes the same API the screens used with
// mock auth (user, userProfile, loading, signIn, signUp, signOut,
// updateProfileData) plus backend-specific helpers.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Google from 'expo-auth-session/providers/google';
import { AuthRequest, ResponseType, exchangeCodeAsync } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { randomUUID, digestStringAsync, CryptoDigestAlgorithm } from 'expo-crypto';
import { GOOGLE_CLIENT_IDS, FACEBOOK_APP_ID } from '../config/appConfig';

WebBrowser.maybeCompleteAuthSession();
const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';
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

  const [authError, setAuthError] = useState('');
  const activeLogin = React.useRef(false);
  const [googleRequest, , googlePrompt] = Google.useAuthRequest({
    webClientId: GOOGLE_CLIENT_IDS.webClientId,
    androidClientId: GOOGLE_CLIENT_IDS.androidClientId,
    iosClientId: GOOGLE_CLIENT_IDS.iosClientId,
    responseType: Platform.OS === 'web' ? ResponseType.IdToken : ResponseType.Code,
    shouldAutoExchangeCode: false,
    selectAccount: true,
    ...(Platform.OS === 'ios' ? {
      redirectUri: `com.googleusercontent.apps.${GOOGLE_CLIENT_IDS.iosClientId.split('.apps.')[0]}:/oauthredirect`,
    } : Platform.OS === 'android' ? {
      redirectUri: `com.googleusercontent.apps.${GOOGLE_CLIENT_IDS.androidClientId.split('.apps.')[0]}:/oauthredirect`,
    } : {}),
  });

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
        // Registered in Firebase but not in the backend yet â†’ onboarding.
        setUserProfile(null);
        setBackendReady(false);
        return null;
      }
      setUserProfile(null);
      setBackendReady(false);
      throw err;
    }
  }, []);

  // Explicit sign-in owns profile loading; the listener handles restored sessions.
  // Publish user only after the backend result so screens cannot route too early.
  useEffect(() => onUserChanged(async (fbUser) => {
    if (activeLogin.current) return;
    setLoading(true);
    try {
      if (fbUser) {
        await loadBackendProfile(fbUser);
        if (getCurrentUser()?.uid === fbUser.uid) setUser(fbUser);
      } else {
        setUser(null);
        setUserProfile(null);
        setBackendReady(false);
      }
    } catch (error) {
      setAuthError(friendlyAuthError(error));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }), [loadBackendProfile]);

  const runLogin = async (authenticate) => {
    if (activeLogin.current) return null;
    activeLogin.current = true;
    setLoading(true);
    setAuthError('');
    try {
      const fbUser = await authenticate();
      if (!fbUser) return null; // Provider cancellation is not an error.
      await loadBackendProfile(fbUser);
      setUser(fbUser);
      return fbUser;
    } catch (error) {
      const message = friendlyAuthError(error);
      setAuthError(message);
      throw new Error(message);
    } finally {
      activeLogin.current = false;
      setLoading(false);
    }
  };

  const signIn = (email, password) => runLogin(() => loginEmailPassword(email, password));

  const signUp = async (email, password, displayName = null, phoneNumber = null) => {
    if (activeLogin.current) return null;
    activeLogin.current = true;
    setLoading(true);
    setAuthError('');
    pendingProfile.current = { displayName, phoneNumber };
    try {
      const fbUser = await registerEmailPassword(email, password);
      setUserProfile(null);
      setBackendReady(false);
      setUser(fbUser);
      return fbUser;
    } catch (error) {
      throw new Error(friendlyAuthError(error));
    } finally {
      activeLogin.current = false;
      setLoading(false);
    }
  };

  const sendEmailOtp = async (email) => {
    const res = await authApi.requestSignupEmailOtp(email);
    return res;
  };

  const verifyEmailOtp = async (email, code) => {
    await authApi.verifySignupEmailOtp(email, code);
    await reloadCurrentUser();
    await getCurrentUser()?.getIdToken(true);
    const fbUser = getCurrentUser();
    setUser(fbUser);
    return fbUser;
  };

  const requireStandaloneOAuth = () => {
    if (IS_EXPO_GO) throw new Error('Please open the installed Gamearn app to sign in with this provider.');
  };

  const signUpWithGoogle = () => runLogin(async () => {
    requireStandaloneOAuth();
    if (!googleRequest) throw new Error('Google sign-in is still loading. Please try again.');
    const result = await googlePrompt();
    if (result.type === 'cancel' || result.type === 'dismiss') return null;
    if (result.type !== 'success') throw new Error(result.error?.message || 'Google sign-in could not complete.');
    let idToken = result.params?.id_token;
    if (!idToken && result.params?.code) {
      const tokens = await exchangeCodeAsync({
        clientId: googleRequest.clientId,
        code: result.params.code,
        redirectUri: googleRequest.redirectUri,
        extraParams: { code_verifier: googleRequest.codeVerifier },
      }, Google.discovery);
      idToken = tokens.idToken;
    }
    if (!idToken) throw new Error('Google did not return a sign-in token.');
    return signInWithGoogleIdToken(idToken);
  });

  const signUpWithFacebook = () => runLogin(async () => {
    requireStandaloneOAuth();
    const discovery = { authorizationEndpoint: 'https://www.facebook.com/dialog/oauth' };
    const request = new AuthRequest({
      clientId: FACEBOOK_APP_ID,
      redirectUri: `fb${FACEBOOK_APP_ID}://authorize`,
      scopes: ['public_profile', 'email'],
      responseType: ResponseType.Token,
      usePKCE: false,
    });
    const result = await request.promptAsync(discovery);
    if (result.type === 'cancel' || result.type === 'dismiss') return null;
    if (result.type !== 'success' || !result.params?.access_token) {
      throw new Error(result.error?.message || 'Facebook sign-in could not complete.');
    }
    return signInWithFacebookToken(result.params.access_token);
  });

  const signUpWithApple = () => runLogin(async () => {
    if (Platform.OS !== 'ios' || !(await AppleAuthentication.isAvailableAsync())) {
      throw new Error('Sign in with Apple is available in the Gamearn iPhone app.');
    }
    const rawNonce = randomUUID();
    const nonce = await digestStringAsync(CryptoDigestAlgorithm.SHA256, rawNonce);
    const state = randomUUID();
    try {
      const result = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
        nonce,
        state,
      });
      if (result.state !== state) throw new Error('Apple sign-in could not be verified. Please try again.');
      if (!result.identityToken) throw new Error('Apple did not return a sign-in token.');
      pendingProfile.current.displayName = [result.fullName?.givenName, result.fullName?.familyName].filter(Boolean).join(' ') || null;
      return signInWithAppleToken(result.identityToken, rawNonce);
    } catch (error) {
      if (error.code === 'ERR_REQUEST_CANCELED') return null;
      throw error;
    }
  });

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

  // Include current request callbacks; memoizing only user state captured a null OAuth request.
  const value = {
    user, userProfile, loading, backendReady, authError,
    signIn, signUp, signUpWithGoogle, signUpWithFacebook, signUpWithApple,
    backendRegister, getPendingProfile, sendEmailOtp, verifyEmailOtp,
    signOut, updateProfileData, refreshProfile, refreshWallet,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
