// Auth state: Firebase is the identity authority; the Node backend is the
// profile/wallet source of truth. Exposes the same API the screens used with
// Authentication context (user, profile, loading, sign-in, sign-up, sign-out,
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
  sendPhoneCode,
  confirmPhoneCode,
  normalizePhoneToE164,
  signOutFirebase,
  friendlyAuthError,
  getCurrentUser,
  reloadCurrentUser,
  isNativeAuthAvailable,
} from '../services/firebase';
import { auth as authApi, wallet } from '../services/api';
import { ApiError } from '../services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateGamePower, formatGP, calculateValuePoints, formatVP } from '../utils/gamePower';

const AuthContext = createContext();

async function getCachedProfile(uid) {
  try {
    const raw = await AsyncStorage.getItem(`@gamearn_profile_${uid}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

async function saveCachedProfile(uid, profile) {
  if (!uid || !profile) return;
  try {
    await AsyncStorage.setItem(`@gamearn_profile_${uid}`, JSON.stringify(profile));
  } catch (e) {
    console.warn('Could not save cached profile:', e);
  }
}

function profileFromMe(me, cached) {
  const gamesPlayed = Math.max(
    Number(me?.stats?.gamesPlayed ?? me?.gamesPlayed ?? 0),
    Number(cached?.gamesPlayed ?? 0)
  );
  const wins = Math.max(
    Number(me?.stats?.wins ?? me?.wins ?? 0),
    Number(cached?.wins ?? 0)
  );
  const losses = Math.max(
    Number(me?.stats?.losses ?? me?.losses ?? 0),
    Number(cached?.losses ?? 0)
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const lastDateStr = me?.lastStreakDate || me?.lastPlayedDate || me?.lastCheckInDate || cached?.lastStreakDate || cached?.lastPlayedDate || cached?.lastCheckInDate;

  let baseStreak = Number(me?.streak ?? me?.currentStreak ?? me?.stats?.streak ?? cached?.streak ?? cached?.currentStreak ?? (gamesPlayed > 0 ? 1 : 0));

  let updatedStreak = baseStreak;
  let newLastStreakDate = lastDateStr || todayStr;

  if (lastDateStr) {
    const d1 = new Date(lastDateStr.split('T')[0] + 'T00:00:00Z');
    const d2 = new Date(todayStr + 'T00:00:00Z');
    const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Logged in on the NEXT DAY! Automatically increment streak (+1)
      updatedStreak = baseStreak > 0 ? baseStreak + 1 : 1;
      newLastStreakDate = todayStr;
    } else if (diffDays === 0) {
      // Same day login: maintain current streak (at least 1 if active)
      updatedStreak = Math.max(1, baseStreak);
    } else if (diffDays > 1) {
      // Missed 2+ days: restart streak at 1 for today's login
      updatedStreak = 1;
      newLastStreakDate = todayStr;
    }
  } else {
    updatedStreak = Math.max(1, baseStreak);
    newLastStreakDate = todayStr;
  }

  const rawNaira = me?.stats?.balance ?? me?.wallet?.balance ?? me?.walletBalance ?? cached?.walletBalance ?? 0;
  const gp = me?.gamePower ?? calculateGamePower(gamesPlayed, wins, losses);
  const vp = Number.isFinite(me?.valuePoints) ? me.valuePoints : Number.isFinite(me?.vp) ? me.vp : calculateValuePoints(rawNaira, gamesPlayed, wins);

  const username = me?.username || me?.name || me?.displayName || cached?.username || me?.email?.split('@')[0] || 'Gamer';
  const displayName = me?.displayName || me?.username || me?.name || cached?.displayName || 'Gamer';
  const name = me?.name || me?.username || me?.displayName || cached?.name || 'Gamer';

  return {
    ...cached,
    ...me,
    username,
    displayName,
    name,
    avatar: me?.avatar || me?.avatarUrl || me?.photoURL || cached?.avatar || '',
    bio: me?.bio || cached?.bio || '',
    phone: me?.phoneNumber || me?.phone || cached?.phone || '',
    walletBalance: rawNaira,
    coins: rawNaira,
    isPremium: !!(me?.premium?.isPremium || me?.isPremium || cached?.isPremium),
    gamesPlayed,
    wins,
    losses,
    streak: updatedStreak,
    currentStreak: updatedStreak,
    lastStreakDate: newLastStreakDate,
    lastPlayedDate: newLastStreakDate,
    lastCheckInDate: newLastStreakDate,
    gamePower: gp,
    gpText: formatGP(gp),
    valuePoints: vp,
    vpText: formatVP(vp),
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

const PROFILE_CACHE_KEY = 'gamearn.backendProfile.v1';

async function readCachedProfile() {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function writeCachedProfile(me) {
  try {
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(me));
  } catch (err) {
    console.log('Notice: Could not cache profile:', err?.message || err);
  }
}

async function clearCachedProfile() {
  try {
    await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    // Cache clearing is best-effort.
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
      redirectUri: `com.googleusercontent.apps.${(GOOGLE_CLIENT_IDS.iosClientId || '').split('.apps.')[0]}:/oauthredirect`,
    } : Platform.OS === 'android' ? {
      redirectUri: `com.googleusercontent.apps.${(GOOGLE_CLIENT_IDS.androidClientId || '').split('.apps.')[0]}:/oauthredirect`,
    } : {}),
  });

  // Onboarding details collected by RegisterScreen until the email is verified.
  const pendingProfile = React.useRef({ displayName: null, phoneNumber: null });

  const getPendingProfile = () => pendingProfile.current;

  const loadBackendProfile = useCallback(async (fbUser) => {
    const uid = fbUser?.uid || 'user_demo_123';
    const cached = await getCachedProfile(uid);
    try {
      // login updates last_login and returns profile + wallet; me() is the
      // richer endpoint. login first so the backend tracks the session.
      await authApi.login({});
      const me = await authApi.me();
      const isAdmin = await isAdminUser();
      await writeCachedProfile({ ...me, isAdmin });
      const profile = profileFromMe({ ...me, isAdmin });
      setUserProfile(profile);
      setBackendReady(true);
      return me;
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 404) {
        // Registered in Firebase but not in the backend yet → onboarding.
        setUserProfile(null);
        setBackendReady(false);
        await clearCachedProfile();
        return null;
      }
      // Backend blip or network error: fall back to the last known profile
      // instead of dropping a returning user into onboarding.
      const cached = await readCachedProfile();
      if (cached) {
        setUserProfile(profileFromMe(cached));
        setBackendReady(true);
        return cached;
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

  // Phone sign-in state: the confirmation from sendPhoneCode is kept until the
  // user submits the SMS code (or requests a new one).
  const phoneConfirmation = React.useRef(null);

  const sendPhoneOtp = async (phone) => {
    const normalized = normalizePhoneToE164(phone);
    if (!normalized) throw new Error('Enter a valid Nigerian phone number (e.g. 0801 234 5678).');
    const confirmation = await sendPhoneCode(normalized);
    phoneConfirmation.current = confirmation;
    return { verificationId: confirmation.verificationId, phone: normalized };
  };

  const verifyPhoneOtp = (code) => runLogin(async () => {
    const confirmation = phoneConfirmation.current;
    if (!confirmation) throw new Error('Request a code first.');
    return confirmPhoneCode(confirmation, code);
  });

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

  const updateProfileData = useCallback(async (updates) => {
    const displayName = updates.displayName || updates.username || updates.name;
    try {
      if (backendReady && authApi && authApi.updateProfile) {
        await authApi.updateProfile({
          ...(displayName ? { displayName } : {}),
          ...(updates.avatar ? { avatarUrl: updates.avatar } : {}),
          ...(updates.bio !== undefined ? { bio: updates.bio } : {}),
          ...(updates.streak !== undefined ? { streak: updates.streak } : {}),
          ...(updates.gamesPlayed !== undefined ? { gamesPlayed: updates.gamesPlayed } : {}),
          ...(updates.lastStreakDate !== undefined ? { lastStreakDate: updates.lastStreakDate } : {}),
          ...(updates.lastCheckInDate !== undefined ? { lastCheckInDate: updates.lastCheckInDate } : {}),
          ...(updates.lastPlayedDate !== undefined ? { lastPlayedDate: updates.lastPlayedDate } : {}),
        });
      }
    } catch (err) {
      console.log('Backend profile update notice:', err?.message || err);
    }

    // Instantly update userProfile state in React context so changes reflect on all screens in real-time
    let updated;
    setUserProfile((prev) => {
      const merged = {
        ...(prev || {}),
        ...updates,
        username: updates.username || updates.name || updates.displayName || prev?.username,
        name: updates.name || updates.username || updates.displayName || prev?.name,
        displayName: displayName || prev?.displayName,
        avatar: updates.avatar || prev?.avatar,
        bio: updates.bio !== undefined ? updates.bio : prev?.bio,
      };
      updated = profileFromMe(merged, prev);
      writeCachedProfile(updated);
      return updated;
    });

    return updated;
  }, [backendReady, authApi]);

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
    }));
    return w;
  }, []);

  // Include current request callbacks; memoizing only user state captured a null OAuth request.
  const value = {
    user, userProfile, loading, backendReady, authError,
    signIn, signUp, signUpWithGoogle, signUpWithFacebook, signUpWithApple,
    sendPhoneOtp, verifyPhoneOtp, isNativeAuthAvailable,
    backendRegister, getPendingProfile, sendEmailOtp, verifyEmailOtp,
    signOut, updateProfileData, refreshProfile, refreshWallet,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

