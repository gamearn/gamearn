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
import { getLocalDateString, getDayGap } from '../utils/recordGameStreak';

const AuthContext = createContext();

const PROFILE_CACHE_KEY = 'gamearn.backendProfile.v1';

async function getCachedProfile(uid) {
  try {
    if (uid) {
      const rawUid = await AsyncStorage.getItem(`@gamearn_profile_${uid}`);
      if (rawUid) return JSON.parse(rawUid);
    }
    const rawGlobal = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
    return rawGlobal ? JSON.parse(rawGlobal) : null;
  } catch (e) {
    return null;
  }
}

async function readCachedProfile(uid) {
  return getCachedProfile(uid);
}

async function writeCachedProfile(me, uid) {
  if (!me) return;
  try {
    const json = JSON.stringify(me);
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, json);
    const targetUid = uid || me.uid || me.id || getCurrentUser()?.uid;
    if (targetUid) {
      await AsyncStorage.setItem(`@gamearn_profile_${targetUid}`, json);
    }
  } catch (err) {
    console.log('Notice: Could not cache profile:', err?.message || err);
  }
}

async function clearCachedProfile(uid) {
  try {
    await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
    const targetUid = uid || getCurrentUser()?.uid;
    if (targetUid) {
      await AsyncStorage.removeItem(`@gamearn_profile_${targetUid}`);
    }
  } catch {
    // Cache clearing is best-effort.
  }
}


function profileFromMe(me, cached) {
  const wins = Math.max(
    Number(me?.stats?.wins ?? me?.wins ?? me?.gamesWon ?? 0),
    Number(cached?.wins ?? cached?.gamesWon ?? 0)
  );
  const losses = Math.max(
    Number(me?.stats?.losses ?? me?.losses ?? me?.gamesLost ?? 0),
    Number(cached?.losses ?? cached?.gamesLost ?? 0)
  );
  const gamesPlayed = Math.max(
    Number(me?.stats?.gamesPlayed ?? me?.gamesPlayed ?? me?.stats?.games ?? 0),
    Number(cached?.gamesPlayed ?? 0),
    wins + losses
  );

  const todayStr = getLocalDateString();
  const lastDateStr = me?.lastStreakDate || me?.lastPlayedDate || me?.lastCheckInDate || cached?.lastStreakDate || cached?.lastPlayedDate || cached?.lastCheckInDate;

  let baseStreak = Number(me?.streak ?? me?.currentStreak ?? me?.stats?.streak ?? cached?.streak ?? cached?.currentStreak ?? (gamesPlayed > 0 ? 1 : 0));

  let updatedStreak = baseStreak;
  let newLastStreakDate = lastDateStr ? String(lastDateStr).split('T')[0] : todayStr;
  let lastStreakPersistedDate = me?.lastStreakPersistedDate || cached?.lastStreakPersistedDate || (me?.lastStreakDate === todayStr ? todayStr : null);

  if (lastDateStr) {
    const diffDays = getDayGap(lastDateStr, todayStr);

    if (diffDays === 1) {
      // Logged in on the NEXT DAY! Automatically increment streak (+1)
      updatedStreak = baseStreak > 0 ? baseStreak + 1 : 1;
      newLastStreakDate = todayStr;
    } else if (diffDays === 0) {
      // Same day login: maintain current streak (at least 1 if active)
      updatedStreak = Math.max(1, baseStreak);
    } else if (diffDays !== null && diffDays > 1) {
      // Missed 2+ days: restart streak at 1 for today's login
      updatedStreak = 1;
      newLastStreakDate = todayStr;
    }
  } else {
    updatedStreak = Math.max(1, baseStreak);
    newLastStreakDate = todayStr;
  }

  const rawNaira = me?.stats?.balance ?? me?.wallet?.balance ?? me?.walletBalance ?? cached?.walletBalance ?? 0;

  // Stored GP preservation: prioritize explicitly saved gamePower/gp so it never resets on app restart
  const storedGp = me?.gamePower !== undefined && me?.gamePower !== null ? Number(me.gamePower)
                 : me?.gp !== undefined && me?.gp !== null ? Number(me.gp)
                 : cached?.gamePower !== undefined && cached?.gamePower !== null ? Number(cached.gamePower)
                 : cached?.gp !== undefined && cached?.gp !== null ? Number(cached.gp)
                 : null;

  const gp = storedGp !== null && !isNaN(storedGp)
    ? Math.min(100, Math.max(0, storedGp))
    : calculateGamePower(gamesPlayed, wins, losses);

  const computedVp = calculateValuePoints(rawNaira, gamesPlayed, wins);
  const vp = Math.max(
    Number(me?.valuePoints ?? me?.vp ?? 0),
    Number(cached?.valuePoints ?? cached?.vp ?? 0),
    computedVp
  );

  const username = me?.username || me?.name || me?.displayName || cached?.username || me?.email?.split('@')[0] || 'Gamer';
  const displayName = me?.displayName || me?.username || me?.name || cached?.displayName || 'Gamer';
  const name = me?.name || me?.username || me?.displayName || cached?.name || 'Gamer';

  const gameStats = me?.gameStats || cached?.gameStats || {};

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
    gamesWon: wins,
    losses,
    gamesLost: losses,
    streak: updatedStreak,
    currentStreak: updatedStreak,
    lastStreakDate: newLastStreakDate,
    lastPlayedDate: newLastStreakDate,
    lastCheckInDate: newLastStreakDate,
    lastStreakPersistedDate,
    gamePower: gp,
    gp,
    gpText: formatGP(gp),
    valuePoints: vp,
    vp,
    vpText: formatVP(vp),
    gameStats,
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
  const [authError, setAuthError] = useState(null);
  const activeLogin = React.useRef(false);
  const pendingProfile = React.useRef({});

  const getPendingProfile = useCallback(() => {
    return pendingProfile.current || {};
  }, []);

  const [googleRequest, , googlePrompt] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_CLIENT_IDS.webClientId || GOOGLE_CLIENT_IDS.web,
    iosClientId: GOOGLE_CLIENT_IDS.iosClientId || GOOGLE_CLIENT_IDS.ios,
    androidClientId: GOOGLE_CLIENT_IDS.androidClientId || GOOGLE_CLIENT_IDS.android,
    webClientId: GOOGLE_CLIENT_IDS.webClientId || GOOGLE_CLIENT_IDS.web,
  });

  const loadBackendProfile = useCallback(async (fbUser) => {
    const uid = fbUser?.uid || getCurrentUser()?.uid || 'user_demo_123';
    const cached = await getCachedProfile(uid);
    try {
      // login updates last_login and returns profile + wallet; me() is the
      // richer endpoint. login first so the backend tracks the session.
      await authApi.login({});
      const me = await authApi.me();
      const isAdmin = await isAdminUser();
      await writeCachedProfile({ ...me, isAdmin }, uid);
      const profile = profileFromMe({ ...me, isAdmin }, cached);
      setUserProfile(profile);
      setBackendReady(true);

      // Auto-sync backend streak if Day 2+ or new session today
      const todayStr = getLocalDateString();
      const lastBackendDate = me?.lastStreakDate || me?.lastPlayedDate || me?.lastCheckInDate;
      if (!lastBackendDate || (lastBackendDate && String(lastBackendDate).split('T')[0] !== todayStr)) {
        authApi.updateProfile({
          streak: profile.streak,
          lastStreakDate: todayStr,
          lastCheckInDate: todayStr,
          lastPlayedDate: todayStr,
        }).catch(() => {});
      }

      return me;
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 404) {
        // Registered in Firebase but not in the backend yet → onboarding.
        setUserProfile(null);
        setBackendReady(false);
        await clearCachedProfile(uid);
        return null;
      }
      // Backend blip or network error: fall back to the last known profile
      // instead of dropping a returning user into onboarding.
      const cachedProfile = await readCachedProfile(uid);
      if (cachedProfile) {
        const profile = profileFromMe(cachedProfile);
        setUserProfile(profile);
        setBackendReady(true);
        return cachedProfile;
      }
      // If network error and fbUser exists (and not 404), fall back to basic profile derived from fbUser
      if (fbUser) {
        const fallback = profileFromMe({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Gamer',
        });
        await writeCachedProfile(fallback, fbUser.uid);
        setUserProfile(fallback);
        setBackendReady(true);
        return fallback;
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
        if (getCurrentUser()?.uid === fbUser.uid || auth?.currentUser?.uid === fbUser.uid) {
          setUser(fbUser);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setBackendReady(false);
      }
    } catch (error) {
      console.warn('Backend profile load notice:', error?.message || error);
      setAuthError(friendlyAuthError(error));
      if (fbUser) {
        setUser(fbUser);
      } else {
        setUser(null);
      }
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
    const profile = profileFromMe({ ...me, isAdmin });
    await writeCachedProfile({ ...me, isAdmin }, me?.uid || getCurrentUser()?.uid);
    setUserProfile(profile);
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
          ...(updates.wins !== undefined ? { wins: updates.wins, gamesWon: updates.wins } : {}),
          ...(updates.gamesWon !== undefined ? { wins: updates.gamesWon, gamesWon: updates.gamesWon } : {}),
          ...(updates.losses !== undefined ? { losses: updates.losses, gamesLost: updates.losses } : {}),
          ...(updates.gamesLost !== undefined ? { losses: updates.gamesLost, gamesLost: updates.gamesLost } : {}),
          ...(updates.gamePower !== undefined ? { gamePower: updates.gamePower, gp: updates.gamePower } : {}),
          ...(updates.gp !== undefined ? { gamePower: updates.gp, gp: updates.gp } : {}),
          ...(updates.valuePoints !== undefined ? { valuePoints: updates.valuePoints, vp: updates.valuePoints } : {}),
          ...(updates.vp !== undefined ? { valuePoints: updates.vp, vp: updates.vp } : {}),
          ...(updates.gameStats !== undefined ? { gameStats: updates.gameStats } : {}),
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
        lastStreakPersistedDate: updates.lastStreakPersistedDate || (updates.lastStreakDate === getLocalDateString() ? getLocalDateString() : prev?.lastStreakPersistedDate),
        username: updates.username || updates.name || updates.displayName || prev?.username,
        name: updates.name || updates.username || updates.displayName || prev?.name,
        displayName: displayName || prev?.displayName,
        avatar: updates.avatar || prev?.avatar,
        bio: updates.bio !== undefined ? updates.bio : prev?.bio,
      };
      updated = profileFromMe(merged, prev);
      writeCachedProfile(updated, getCurrentUser()?.uid);
      return updated;
    });

    return updated;
  }, [backendReady, authApi]);

  const signOut = async () => {
    await clearCachedProfile();
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

