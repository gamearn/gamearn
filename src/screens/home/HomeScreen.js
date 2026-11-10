import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  Linking,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { reference, regions } from './art';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { settings as settingsApi, wallet, tournaments, leaderboard as leaderboardApi, notifications as notificationsApi, referral as referralApi } from '../../services/api';
import {
  getStreakInfo,
  DAILY_STREAK_MILESTONES,
  checkAndTriggerStreak4hNotification,
  getUnclaimedDailyStreakMilestone,
  claimDailyStreakMilestone,
} from '../../utils/recordGameStreak';
import StreakRewardModal from '../../components/StreakRewardModal';
import { fetchAllPlatformPlayers } from '../../utils/platformPlayers';
import { checkAndTriggerVp5Notification } from '../../utils/vpNotification';
import { resolveAvatarSource } from '../../utils/avatarPresets';
import { TELEGRAM_COMMUNITY_LINK, WHATSAPP_COMMUNITY_LINK } from '../../config/appConfig';
const GAMEARN_LOGO = require('../../../assets/logos/gamearn_g_logo.png');
import ActiveMatchBanner from '../../components/ActiveMatchBanner';
const { INITIAL_STATE, reducer, parseAmount, money, localDay, leaderboard } = require('./model');

const STORAGE_KEY = '@gamearn/home_ui.v1';
const CYAN = '#00d9ff';
const GREEN = '#12ff39';
const GAMES = [
  { id: 'ludo', name: 'Ludo', description: 'Race your four tokens around the board and bring them home.', targetScreen: 'LudoGame' },
  { id: 'ayo', name: 'Ayo Ọ̀pọ́n', description: 'Sow seeds around the wooden board and capture your opponent’s seeds.', targetScreen: 'AyoGame' },
  { id: 'whot', name: 'Whot', description: 'Match shapes or numbers and be the first to empty your hand.', targetScreen: 'WhotGame' },
  { id: 'draft', name: 'Draft', description: 'Move diagonally, capture pieces, and crown your kings.', targetScreen: 'DraughtsGame' },
];

function Art({ name, width, height, style }) {
  const [x, y, w, h] = regions[name] || [0, 0, 100, 100];
  const factor = Math.max(width / w, height / h);
  return (
    <View accessible={false} pointerEvents="none" style={[{ width, height, overflow: 'hidden' }, style]}>
      <Image
        source={reference}
        accessibilityIgnoresInvertColors
        resizeMode="stretch"
        style={{
          position: 'absolute',
          width: 590 * factor,
          height: 1280 * factor,
          left: -x * factor + (width - w * factor) / 2,
          top: -y * factor + (height - h * factor) / 2,
        }}
      />
    </View>
  );
}

function Tap({ onPress, label, children, style, disabled, selected, role = 'button' }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, selected: !!selected }}
      hitSlop={4}
      style={({ pressed }) => [style, pressed && { opacity: 0.75 }, disabled && { opacity: 0.45 }]}
    >
      {children}
    </Pressable>
  );
}

function GradientButton({ title, onPress, style, compact = false, disabled = false, scale = 1 }) {
  return (
    <Tap onPress={onPress} label={title} disabled={disabled} style={style}>
      <LinearGradient
        colors={['#ff9900', '#ff450d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[ui.button, compact && { minHeight: 40 * scale, paddingVertical: 8 * scale, paddingHorizontal: 20 * scale, borderRadius: 24 * scale, gap: 8 * scale }]}
      >
        <Text style={[ui.buttonText, compact && { fontSize: 16 * scale }]}>{title}</Text>
        <Ionicons name="chevron-forward" size={19 * scale} color="#fff" />
      </LinearGradient>
    </Tap>
  );
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scale = Math.min(width, 650) / 590;
  const { theme, isDark, setTheme } = useTheme();
  const { userProfile, updateProfileData, user } = useAuth() || {};
  const isAdmin = !!userProfile?.isAdmin || userProfile?.username?.toLowerCase() === 'jessejesutoni' ||
    userProfile?.email?.toLowerCase() === 'abbagem@gmail.com' ||
    user?.email?.toLowerCase() === 'abbagem@gmail.com';
  const s = useMemo(() => makeStyles(scale, theme, isDark), [scale, theme, isDark]);

  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('Home');
  const [period, setPeriod] = useState('Daily');
  const [sheet, setSheet] = useState(null);
  const [amount, setAmount] = useState('');
  const [formError, setFormError] = useState('');
  const [name, setName] = useState('');
  const [roll, setRoll] = useState(null);
  const [demoComplete, setDemoComplete] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [backendWallet, setBackendWallet] = useState(null);
  const [serverTransactions, setServerTransactions] = useState([]);
  const [featuredTournament, setFeaturedTournament] = useState(null);
  const [myTournaments, setMyTournaments] = useState([]);
  const [homeDataLoading, setHomeDataLoading] = useState(true);
  const [dbLeaderboardRows, setDbLeaderboardRows] = useState([]);
  const [winnersList, setWinnersList] = useState([]);
  const [winnersLoading, setWinnersLoading] = useState(true);
  const [winnersPeriod, setWinnersPeriod] = useState('Daily');
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [notificationsList, setNotificationsList] = useState([]);
  const [showWelcomeCommunityModal, setShowWelcomeCommunityModal] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const uid = userProfile?.uid || user?.uid || 'me';
      const [userNotifsRaw, globalNotifsRaw, deletedRaw, serverNotifs] = await Promise.all([
        AsyncStorage.getItem(`@gamearn_notifications_${uid}`),
        AsyncStorage.getItem('@gamearn_notifications_all'),
        AsyncStorage.getItem(`@gamearn_deleted_notifications_${uid}`),
        userProfile?.uid ? notificationsApi.list(50).catch(() => []) : Promise.resolve([]),
      ]);
      const deletedSet = new Set(deletedRaw ? JSON.parse(deletedRaw).map(String) : []);
      const userNotifs = userNotifsRaw ? JSON.parse(userNotifsRaw) : [];
      const globalNotifs = globalNotifsRaw ? JSON.parse(globalNotifsRaw) : [];
      const combined = [
        ...(Array.isArray(serverNotifs) ? serverNotifs : []),
        ...(Array.isArray(userNotifs) ? userNotifs : []),
        ...(Array.isArray(globalNotifs) ? globalNotifs : []),
      ];
      const seen = new Set();
      const unique = [];
      for (const n of combined) {
        const nid = String(n?.id || '');
        if (!nid || seen.has(nid) || deletedSet.has(nid)) continue;
        seen.add(nid);
        unique.push(n);
      }
      unique.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setNotificationsList(unique);
    } catch {}
  }, [userProfile?.uid, user?.uid]);

  const handleDeleteNotification = useCallback(async (notificationId) => {
    if (!notificationId) return;
    const nid = String(notificationId);
    setNotificationsList((prev) => prev.filter((n) => String(n?.id) !== nid));
    try {
      const uid = userProfile?.uid || user?.uid || 'me';
      const [userNotifsRaw, globalNotifsRaw, deletedRaw] = await Promise.all([
        AsyncStorage.getItem(`@gamearn_notifications_${uid}`),
        AsyncStorage.getItem('@gamearn_notifications_all'),
        AsyncStorage.getItem(`@gamearn_deleted_notifications_${uid}`),
      ]);
      const deletedList = deletedRaw ? JSON.parse(deletedRaw) : [];
      if (!deletedList.includes(nid)) {
        deletedList.push(nid);
        await AsyncStorage.setItem(`@gamearn_deleted_notifications_${uid}`, JSON.stringify(deletedList));
      }
      if (userNotifsRaw) {
        const filteredUser = JSON.parse(userNotifsRaw).filter((n) => String(n?.id) !== nid);
        await AsyncStorage.setItem(`@gamearn_notifications_${uid}`, JSON.stringify(filteredUser));
      }
      if (globalNotifsRaw) {
        const filteredGlobal = JSON.parse(globalNotifsRaw).filter((n) => String(n?.id) !== nid);
        await AsyncStorage.setItem('@gamearn_notifications_all', JSON.stringify(filteredGlobal));
      }
      await notificationsApi.delete(notificationId);
    } catch {}
  }, [userProfile?.uid, user?.uid]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // 3. Persistent Welcome Dashboard In-App Notification (Community Prompt)
  // Appears whenever the user launches GAMEARN or logs in, and continues appearing
  // until the user clicks either the Telegram or WhatsApp community button.
  useEffect(() => {
    const uid = userProfile?.uid || user?.uid;
    if (!uid) return;
    let active = true;
    (async () => {
      try {
        const localClicked = await AsyncStorage.getItem(`@gamearn_community_link_clicked_${uid}`);
        const serverClicked = Boolean(
          userProfile?.welcomeCommunityClicked ||
          userProfile?.settings?.communityLinkClicked
        );
        if (localClicked === 'true' || serverClicked) {
          if (localClicked !== 'true') {
            await AsyncStorage.setItem(`@gamearn_community_link_clicked_${uid}`, 'true');
          }
          if (active) setShowWelcomeCommunityModal(false);
        } else if (active) {
          setShowWelcomeCommunityModal(true);
        }
      } catch {
        if (active) setShowWelcomeCommunityModal(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [userProfile?.uid, user?.uid, userProfile?.welcomeCommunityClicked, userProfile?.settings?.communityLinkClicked]);

  const handleCommunityButtonClick = useCallback(async (platform, url) => {
    const uid = userProfile?.uid || user?.uid;
    setShowWelcomeCommunityModal(false);
    try {
      if (uid) {
        await AsyncStorage.setItem(`@gamearn_community_link_clicked_${uid}`, 'true');
      }
      if (userProfile) {
        settingsApi.patch({ communityLinkClicked: true, communityLinkPlatform: platform }).catch(() => {});
        if (typeof updateProfileData === 'function') {
          updateProfileData({
            welcomeCommunityClicked: true,
            welcomeCommunityPlatform: platform,
          }).catch(() => {});
        }
      }
    } catch {}
    try {
      await Linking.openURL(url);
    } catch {}
  }, [userProfile, user?.uid, updateProfileData]);


  const fetchWinners = useCallback(() => {
    Promise.allSettled([
      AsyncStorage.getItem('@gamearn_winners_cache'),
      leaderboardApi.getWinners(),
    ])
      .then(([cacheRes, apiRes]) => {
        let cachedList = [];
        try {
          if (cacheRes.status === 'fulfilled' && cacheRes.value) {
            const parsed = JSON.parse(cacheRes.value);
            if (Array.isArray(parsed)) cachedList = parsed;
          }
        } catch {}

        const apiList = apiRes.status === 'fulfilled' && Array.isArray(apiRes.value)
          ? apiRes.value
          : [];

        const map = new Map();
        cachedList.forEach((w) => {
          if (w && w.period && w.rank) {
            map.set(`${w.period}:${w.rank}`, w);
          }
        });
        apiList.forEach((w) => {
          if (w && w.period && w.rank) {
            map.set(`${w.period}:${w.rank}`, w);
          }
        });
        const merged = Array.from(map.values()).sort((a, b) => a.rank - b.rank);
        setWinnersList(merged);
        if (merged.length > 0) {
          AsyncStorage.setItem('@gamearn_winners_cache', JSON.stringify(merged)).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => {
        setWinnersLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchWinners();
  }, [fetchWinners]);

  const fetchLeaderboard = useCallback(() => {
    let active = true;
    const cacheKey = `@gamearn_leaderboard_cache_${period}`;
    AsyncStorage.getItem(cacheKey)
      .then((raw) => {
        if (!active || !raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDbLeaderboardRows(parsed);
          setLeaderboardLoading(false);
        }
      })
      .catch(() => {});

    Promise.allSettled([
      leaderboardApi.get(period),
      fetchAllPlatformPlayers(),
    ])
      .then(([lbRes, allPlayersRes]) => {
        if (!active) return;
        const lbRows = lbRes.status === 'fulfilled'
          ? (Array.isArray(lbRes.value) ? lbRes.value : lbRes.value?.data || [])
          : [];
        const refRows = allPlayersRes.status === 'fulfilled' && Array.isArray(allPlayersRes.value)
          ? allPlayersRes.value
          : [];
        const cachedComm = [];

        const map = new Map();
        const addEntry = (item, isFromPeriodLb = false) => {
          if (!item) return;
          const uid = item.uid || item.id;
          if (!uid) return;
          const existing = map.get(uid);
          const name = item.displayName || item.name || item.username || existing?.name || 'Player';
          const plays = isFromPeriodLb
            ? Number(item.plays ?? item.gamesPlayed ?? 0)
            : Number(existing?.plays ?? item.gamesPlayed ?? item.plays ?? 0);
          const wins = isFromPeriodLb
            ? Number(item.wins ?? item.gamesWon ?? 0)
            : Number(existing?.wins ?? item.wins ?? item.gamesWon ?? Math.floor(plays * 0.6));
          const gp = item.gp != null
            ? Number(item.gp)
            : (existing?.gp != null ? existing.gp : 0);

          map.set(uid, {
            id: uid,
            uid,
            name,
            displayName: name,
            avatar: item.avatar || item.avatarUrl || existing?.avatar || null,
            plays: Math.max(plays, existing?.plays || 0),
            wins: Math.max(wins, existing?.wins || 0),
            gp: Math.max(gp, existing?.gp || 0),
            isUser: Boolean(userProfile?.uid && uid === userProfile.uid),
          });
        };

        lbRows.forEach((r) => addEntry(r, true));
        refRows.forEach((r) => addEntry(r, false));
        cachedComm.forEach((r) => addEntry(r, false));

        const mergedList = Array.from(map.values()).sort(
          (a, b) => (b.plays - a.plays) || (b.wins - a.wins) || (b.gp - a.gp) || String(a.name).localeCompare(String(b.name))
        );
        setDbLeaderboardRows(mergedList);
        if (mergedList.length > 0) {
          AsyncStorage.setItem(cacheKey, JSON.stringify(mergedList)).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLeaderboardLoading(false);
      });
    return () => {
      active = false;
    };
  }, [period, userProfile?.uid]);

  useEffect(() => {
    const cancel = fetchLeaderboard();
    return cancel;
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (!navigation) return;
    const unsubscribe = navigation.addListener('focus', () => {
      fetchLeaderboard();
      fetchWinners();
    });
    return unsubscribe;
  }, [navigation, fetchLeaderboard, fetchWinners]);
  const pendingWrites = useRef(Promise.resolve());
  const mounted = useRef(true);
  const depositLock = useRef(false);
  const scroll = useRef(null);

  useEffect(() => {
    mounted.current = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw && mounted.current) dispatch({ type: 'HYDRATE', value: JSON.parse(raw) });
      })
      .catch(() => {
        if (mounted.current) setStorageError('Saved data could not be loaded. No saved preferences were found.');
      })
      .finally(() => {
        if (mounted.current) setReady(true);
      });
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.allSettled([wallet.get(), tournaments.list(), tournaments.my()]).then(
      ([walletResult, tournamentResult, myTournamentsResult]) => {
        if (!active) return;
        if (walletResult.status === 'fulfilled') setBackendWallet(walletResult.value);
        if (tournamentResult.status === 'fulfilled') {
          const rawList = Array.isArray(tournamentResult.value)
            ? tournamentResult.value
            : tournamentResult.value?.tournaments || tournamentResult.value?.data || [];
          const now = Date.now();
          const validList = rawList.filter((item) => {
            const st = String(item.status || '').toLowerCase();
            if (['cancelled', 'completed'].includes(st)) return false;
            const isLive = Boolean((item.isLive || item.is_live) && st === 'in_progress');
            if (!isLive) {
              if (item.launchDeadline && new Date(item.launchDeadline).getTime() <= now) return false;
              if (item.createdAt && (now - new Date(item.createdAt).getTime()) > 24 * 3600 * 1000) return false;
            }
            return true;
          });
          const featured =
            validList.find((item) => (item.isLive || item.is_live) && String(item.status).toLowerCase() === 'in_progress') ||
            validList.find((item) => ['open', 'registration_open', 'scheduled'].includes(String(item.status).toLowerCase())) ||
            validList[0] ||
            null;
          setFeaturedTournament(featured);
        }
        if (myTournamentsResult.status === 'fulfilled') {
          const myList = Array.isArray(myTournamentsResult.value)
            ? myTournamentsResult.value
            : myTournamentsResult.value?.tournaments || myTournamentsResult.value?.data || [];
          setMyTournaments(myList);
        }
        setHomeDataLoading(false);
      }
    );
    return () => {
      active = false;
    };
  }, []);

  // Transaction history is server-authoritative (never cached locally).
  useEffect(() => {
    if (!userProfile) return;
    let active = true;
    wallet
      .transactions({ page: 1, limit: 20 })
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res) ? res : res?.transactions || res?.data || [];
        setServerTransactions(Array.isArray(list) ? list : []);
      })
      .catch(() => { });
    return () => {
      active = false;
    };
  }, [userProfile?.uid]);

  // Load server-side preferences (sound/notifications/theme) once and merge them in.
  useEffect(() => {
    if (!userProfile) return;
    let active = true;
    Promise.allSettled([settingsApi.get()]).then(([res]) => {
      if (!active || res.status !== 'fulfilled') return;
      const prefs = res.value?.data ?? res.value ?? {};
      if (typeof prefs.sound === 'boolean') dispatch({ type: 'SETTING', key: 'sound', value: prefs.sound });
      if (typeof prefs.notifications === 'boolean') dispatch({ type: 'SETTING', key: 'notifications', value: prefs.notifications });
      if (prefs.theme === 'dark' || prefs.theme === 'light') setTheme(prefs.theme === 'dark');
    });
    return () => { active = false; };
  }, [userProfile?.uid]);

  const changeSetting = (key, value) => {
    dispatch({ type: 'SETTING', key, value });
    if (userProfile) {
      settingsApi
        .patch({ [key]: value })
        .catch(() => {
          dispatch({ type: 'SETTING', key, value: !value });
          if (mounted.current) Alert.alert('Sync failed', 'Your preference could not be saved to your account.');
        });
    }
  };

  const changeTheme = (nextDark) => {
    setTheme(nextDark);
    if (userProfile) {
      settingsApi.patch({ theme: nextDark ? 'dark' : 'light' }).catch(() => {
        setTheme(!nextDark);
        if (mounted.current) Alert.alert('Sync failed', 'Your appearance preference could not be saved to your account.');
      });
    }
  };

  // Value Points rate: 1 VP = 50 units. We display Acquired Points everywhere instead of Naira.
  const walletBalanceNaira = Number(backendWallet?.balance ?? userProfile?.walletBalance ?? 0);
  const formatPoints = (value) => {
    const rawVp = Number(userProfile?.valuePoints ?? userProfile?.vp ?? (Number(value || 0) / 50));
    const rounded = Math.round(rawVp * 10) / 10;
    return `${rounded.toLocaleString()} VP`;
  };
  const formatNaira = formatPoints;
  const streakDays = Number(userProfile?.streak ?? userProfile?.currentStreak ?? 0);

  // Trigger 10 VP withdrawal milestone (1.4 & 2.2) and <4h Daily Streak reminder (2.3)
  useEffect(() => {
    const rawVp = Number(userProfile?.valuePoints ?? userProfile?.vp ?? (Number(walletBalanceNaira || 0) / 50));
    if (rawVp >= 10 && userProfile?.uid) {
      checkAndTriggerVp5Notification(
        rawVp,
        userProfile.uid,
        userProfile?.username || userProfile?.displayName || userProfile?.name
      ).then((triggered) => {
        if (triggered) loadNotifications();
      });
    }
    if (userProfile?.uid) {
      checkAndTriggerStreak4hNotification(userProfile).then((triggered) => {
        if (triggered) loadNotifications();
      });
    }
  }, [userProfile?.valuePoints, userProfile?.vp, userProfile?.uid, userProfile?.streak, userProfile?.lastPlayedDate, walletBalanceNaira, loadNotifications]);

  const displayName = userProfile?.username || userProfile?.displayName || userProfile?.name || state.name || 'Gamer';

  useEffect(() => {
    const currentName = userProfile?.username || userProfile?.displayName || userProfile?.name;
    if (currentName && currentName !== state.name) {
      dispatch({ type: 'NAME', value: currentName });
    }
  }, [userProfile]);

  useEffect(() => {
    if (!ready) return;
    // Only non-authoritative UI flags are cached locally. Wallet balance,
    // streak, transactions and profile fields are read from the server.
    const uiFlags = {
      joined: state.joined,
      notificationsRead: state.notificationsRead,
      claimed: state.claimed,
    };
    pendingWrites.current = pendingWrites.current
      .then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(uiFlags)))
      .catch(() => {
        if (mounted.current) setStorageError('Changes are active, but could not be saved on this device.');
      });
  }, [state.joined, state.notificationsRead, state.claimed, ready]);

  const launchGame = (game) => {
    if (!navigation) return;
    navigation.navigate('GameSection', {
      gameId: game.id,
      gameName: game.name,
      targetScreen: game.targetScreen,
    });
  };

  const open = (type, data) => {
    setFormError('');
    setAmount('');
    setRoll(null);
    setDemoComplete(false);
    depositLock.current = false;
    if (type === 'profile') setName(displayName);
    if (type === 'notifications') {
      dispatch({ type: 'READ_NOTIFICATIONS' });
      if (userProfile?.uid) notificationsApi.markRead().catch(() => {});
      loadNotifications();
    }
    setSheet({ type, data });
  };

  const changeTab = (next) => {
    setTab(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  const txt = (value, size = 18, style) => <Text style={[s.text, { fontSize: size * scale }, style]}>{value}</Text>;
  const icon = (iconName, size = 24, color = CYAN) => <Ionicons name={iconName} size={size * scale} color={color} />;
  const rows = useMemo(
    () => leaderboard(dbLeaderboardRows, userProfile, period),
    [dbLeaderboardRows, userProfile, period]
  );

  /* Wallet commented out (no wallet in project)
  const addFunds = () => {
    const parsed = parseAmount(amount);
    if (parsed === null) {
      setFormError('Enter 2 VP–20,000 VP, using whole numbers.');
      return;
    }
    setSheet(null);
    navigation?.navigate('BuyValuePoints');
  };
  */

  function Header() {
    const avatarUri = userProfile?.avatar;

    return (
      <View style={s.header}>
        <Tap label="Open your profile" onPress={() => navigation?.navigate('ProfileTab')} style={s.member}>
          <LinearGradient colors={[CYAN, '#146aff', '#ffbb00']} style={s.avatarRing}>
            <Image source={resolveAvatarSource(avatarUri)} style={[s.avatar, { width: 55 * scale, height: 55 * scale, borderRadius: (55 * scale) / 2 }]} />
          </LinearGradient>
          <View style={{ marginLeft: 12 * scale, justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap', gap: 6 * scale }}>
              <View style={{ backgroundColor: '#F59E0B22', paddingHorizontal: 7 * scale, paddingVertical: 4 * scale, borderRadius: 8 * scale, borderWidth: 1, borderColor: '#F59E0B66' }}>
                <Text style={{ color: '#F59E0B', fontSize: 11 * scale, fontWeight: '900' }}>⚡ {userProfile?.gpText || '0 GP'}</Text>
              </View>
              <View style={{ backgroundColor: '#3B82F622', paddingHorizontal: 7 * scale, paddingVertical: 4 * scale, borderRadius: 8 * scale, borderWidth: 1, borderColor: '#3B82F666' }}>
                <Text style={{ color: '#60A5FA', fontSize: 11 * scale, fontWeight: '900' }}>🏆 {userProfile?.vpText || '0 VP'}</Text>
              </View>
            </View>
          </View>
        </Tap>
        <Tap label={state.notificationsRead ? 'Notifications' : 'Notifications, unread messages'} onPress={() => open('notifications')} style={s.roundIcon}>
          {icon('notifications-outline', 31)}
          {(!state.notificationsRead || notificationsList.some((n) => !n.read)) && <View style={s.unread} />}
        </Tap>
        {isAdmin && (
          <Tap label="Admin Dashboard" onPress={() => navigation?.navigate('AdminDashboard')} style={[s.roundIcon, { borderColor: '#FF5500', backgroundColor: 'rgba(255, 85, 0, 0.18)' }]}>
            {icon('shield-checkmark-outline', 28, '#FF5500')}
          </Tap>
        )}
        <Tap label="Settings" onPress={() => navigation?.navigate('Settings')} style={s.roundIcon}>
          {icon('settings-outline', 31)}
        </Tap>
      </View>
    );
  }

  function WalletCard() {
    const currentVp = Math.max(
      0,
      Number(userProfile?.valuePoints ?? userProfile?.vp ?? (Number(walletBalanceNaira || 0) / 50))
    );
    const canClaimReward = currentVp >= 5;

    /* Wallet withdrawal commented out (no wallet in project)
    const handleWithdraw = () => {
      navigation.navigate('Withdraw', { amount: walletBalanceNaira });
    };
    */

    const handleClaimReward = () => {
      Linking.openURL('https://www.gamearn.app').catch(() => {
        Alert.alert('Claim Reward', 'Please visit https://www.gamearn.app to claim your reward.');
      });
    };

    return (
      <LinearGradient colors={['#003a72', '#001324', '#00101e']} style={[s.card, s.wallet]}>
        <View style={s.walletIcon}>{icon('wallet-outline', 34)}</View>
        <View style={{ flex: 1, paddingVertical: 4 }}>
          {txt('Acquired Value Points', 13, s.muted)}
          {txt(homeDataLoading ? 'Loading...' : formatPoints(walletBalanceNaira), 24, s.bold)}
          {canClaimReward ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleClaimReward}
              style={s.withdrawRewardsBtn}
              accessibilityRole="button"
              accessibilityLabel="Claim Reward"
            >
              <LinearGradient
                colors={['#00E5FF', '#0284C7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.withdrawRewardsGrad}
              >
                <Ionicons name="gift-outline" size={14 * scale} color="#001824" style={{ marginRight: 5 * scale }} />
                <Text style={s.withdrawRewardsText}>Claim Reward</Text>
                <Ionicons name="arrow-forward" size={13 * scale} color="#001824" style={{ marginLeft: 5 * scale }} />
              </LinearGradient>
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>
    );
  }

  function TournamentCard() {
    if (homeDataLoading) return <Text style={[s.muted, { marginVertical: 18 * scale }]}>Loading live tournaments...</Text>;
    if (!featuredTournament) return <Text style={[s.muted, { marginVertical: 18 * scale }]}>No live tournaments right now.</Text>;
    const tournament = featuredTournament;
    const isJoined = Boolean(
      tournament?.id &&
      myTournaments.some((t) => String(t.id || t.tournamentId) === String(tournament.id))
    );
    const isLive = Boolean(
      (tournament?.isLive || tournament?.is_live) &&
      String(tournament?.status).toLowerCase() === 'in_progress'
    );

    return (
      <LinearGradient colors={['#172019', '#170b19', '#001b30']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.tournament}>
        <Art name="tournament" width={320 * scale} height={168 * scale} style={s.trophyArt} />
        <LinearGradient colors={['#001321', '#001321b0', '#00132100']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
        <View style={s.badges}>
          <View style={isLive ? s.live : s.upcoming}>
            {txt(isLive ? 'Live Now' : 'Upcoming', 13, { color: isLive ? '#00110a' : (theme ? theme.primary : CYAN), fontWeight: '800' })}
          </View>
          <View style={s.playersBadge}>
            {icon('people', 14, '#fff')}
            {txt(`${Number(tournament.currentPlayers ?? tournament.currentParticipants ?? tournament.playersCount ?? 0).toLocaleString()} Players`, 12)}
          </View>
        </View>
        {txt(tournament.name || (isLive ? 'Live Tournament' : 'Upcoming Tournament'), 23, s.tournamentTitle)}
        {txt(tournament.description || (isLive ? 'Join an active tournament.' : 'Register and compete to win.'), 15, s.muted)}
        <View style={s.prizeRow}>
          <View>
            {txt('Prize Pool', 13, s.muted)}
            {txt(tournament.prizePool ? `${Math.floor(Number(tournament.prizePool) / 50).toLocaleString()} VP` : (tournament.prizePoolVp ? `${tournament.prizePoolVp} VP` : 'Prize pool pending'), 25, [s.bold, s.cyan])}
          </View>
          <GradientButton
            title={isJoined ? 'Joined' : 'Join Now'}
            onPress={() => {
              if (isLive) {
                navigation.navigate('LiveTournament', { tourId: tournament.id, title: tournament.name });
              } else if (isJoined) {
                navigation.navigate('TournamentPending', { tourId: tournament.id, title: tournament.name });
              } else {
                navigation.navigate('TournamentDetails', { tourId: tournament.id, title: tournament.name });
              }
            }}
            style={{ width: 148 * scale }}
            compact
            scale={scale}
          />
        </View>
      </LinearGradient>
    );
  }

  function GameCard({ game }) {
    const rawVal = String(game.players || '0').trim();
    const countNum = parseInt(rawVal.replace(/[^0-9]/g, '') || '0', 10);
    const hasPlayers = countNum > 0;

    return (
      <Tap label={`${game.name}, ${hasPlayers ? (game.players || countNum) : '0'} playing. Open game lobby`} onPress={() => launchGame(game)} style={s.gameCard}>
        <Art name={game.id} width={116 * scale} height={81 * scale} style={{ width: '100%' }} />
        <View style={s.gameText}>
          {txt(game.name, 15, s.bold)}
          <View style={s.inline}>
            <View style={[s.dot, { backgroundColor: hasPlayers ? GREEN : '#EF4444' }]} />
            {txt(hasPlayers ? `${game.players || countNum} Playing` : '0 Playing', 11, hasPlayers ? s.muted : { color: '#EF4444', fontWeight: '700' })}
          </View>
        </View>
      </Tap>
    );
  }

  function Streak() {
    const streakInfo = getStreakInfo(userProfile);
    const streakDays = streakInfo.streakNumber;
    return (
      <LinearGradient colors={['#002332', '#07122b', '#200732']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.streak}>
        <View style={s.sectionRow}>
          {txt('Streak Progress', 18, s.bold)}
          {txt(
            streakInfo.isActive
              ? 'Great! Streak active for today.'
              : (streakInfo.isAtRisk ? 'Streak at risk! Play today to keep it.' : 'Play a game today to keep your streak!'),
            10,
            streakInfo.isActive ? s.cyan : (streakInfo.isAtRisk ? { color: '#F59E0B', fontWeight: '700' } : { color: '#EF4444' })
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled style={s.milestoneScroller} contentContainerStyle={s.milestones}>
          <View style={s.milestoneTrack}>
            <View style={s.track} />
            <View style={[s.track, { width: `${Math.min(streakDays / 90, 1) * 100}%`, backgroundColor: CYAN }]} />
            {[7, 14, 30, 50, 90].map((day) => {
              const done = streakDays >= day;
              const lastAwarded = Number(userProfile?.lastStreakMilestoneAwarded ?? 0);
              const isClaimed = lastAwarded >= day;
              const milestoneData = DAILY_STREAK_MILESTONES.find((m) => m.day === day);
              return (
                <TouchableOpacity
                  key={day}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (done && milestoneData) {
                      if (!isClaimed) {
                        setDailyMilestoneModal(milestoneData);
                      } else {
                        Alert.alert('Milestone Claimed ✓', `You have already claimed +${milestoneData.incrementalVp} VP for your ${day}-Day Streak!`);
                      }
                    } else if (milestoneData) {
                      Alert.alert(`${day}-Day Streak Locked 🔒`, `Reach ${day} consecutive days to unlock and claim +${milestoneData.incrementalVp} VP!`);
                    }
                  }}
                  style={s.milestone}
                >
                  {milestoneData ? (
                    <Text
                      numberOfLines={1}
                      style={[
                        s.text,
                        {
                          fontSize: 10 * scale,
                          color: done ? (isClaimed ? '#10B981' : '#FDE047') : CYAN,
                          fontWeight: '800',
                          marginBottom: 4 * scale,
                          textAlign: 'center',
                        },
                      ]}
                    >
                      {`+${milestoneData.incrementalVp} VP`}
                    </Text>
                  ) : null}
                  <View style={[s.milestoneCircle, done && s.done]}>
                    {icon(done ? (isClaimed ? 'checkmark' : 'gift') : 'lock-closed', 19, done ? '#fff' : '#d8e4ef')}
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      s.text,
                      {
                        fontSize: 11.5 * scale,
                        marginTop: 6 * scale,
                        fontWeight: '700',
                        textAlign: 'center',
                      },
                    ]}
                  >
                    {`${day} Days`}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                const unclaimed = getUnclaimedDailyStreakMilestone(userProfile);
                if (unclaimed) {
                  setDailyMilestoneModal(unclaimed);
                } else {
                  navigation?.navigate('DailyStreak');
                }
              }}
              style={s.reward}
            >
              <Art name="gift" width={48 * scale} height={55 * scale} style={s.gift} />
              {txt(streakDays >= 90 ? '90-Day\n174.5 VP\nUnlocked' : '90-Day\nReward\nLocked', 11, { textAlign: 'center', lineHeight: 13 * scale, fontWeight: '700' })}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  function WreathMedal({ rank }) {
    const colors = {
      1: { bg: '#92400E', ring: '#F59E0B', text: '#FEF3C7', leaf: '#FBBF24' },
      2: { bg: '#334155', ring: '#94A3B8', text: '#F8FAFC', leaf: '#CBD5E1' },
      3: { bg: '#78350F', ring: '#D97706', text: '#FEF3C7', leaf: '#F59E0B' },
    };
    const c = colors[rank] || colors[1];
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: 44 * scale, height: 38 * scale }}>
        <Text style={{ fontSize: 16 * scale, color: c.leaf, marginRight: -4 * scale }}>🌿</Text>
        <View
          style={{
            width: 24 * scale,
            height: 24 * scale,
            borderRadius: 12 * scale,
            backgroundColor: c.bg,
            borderWidth: 1.5,
            borderColor: c.ring,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          <Text style={{ color: c.text, fontWeight: '900', fontSize: 12 * scale }}>{rank}</Text>
        </View>
        <Text style={{ fontSize: 16 * scale, color: c.leaf, marginLeft: -4 * scale, transform: [{ scaleX: -1 }] }}>🌿</Text>
      </View>
    );
  }

  function LeaderboardWinners() {
    const periodWinners = (winnersList || [])
      .filter((w) => w.period === winnersPeriod)
      .sort((a, b) => a.rank - b.rank);

    const getPeriodDateLabel = (p) => {
      const matchWinner = (winnersList || []).find((w) => w.period === p && w.periodDate);
      if (matchWinner?.periodDate) return matchWinner.periodDate;
      const now = new Date();
      const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      if (p === 'Daily') {
        return `${now.getDate()} ${shortMonths[now.getMonth()]} ${now.getFullYear()}`;
      }
      if (p === 'Weekly') {
        const weekNum = Math.ceil(now.getDate() / 7);
        return `Wk ${weekNum}, ${shortMonths[now.getMonth()]} ${now.getFullYear()}`;
      }
      if (p === 'Monthly') {
        return `${fullMonths[now.getMonth()]} ${now.getFullYear()}`;
      }
      return `${now.getFullYear()}`;
    };

    return (
      <View
        style={{
          backgroundColor: 'rgba(8, 16, 40, 0.85)',
          borderWidth: 1.5,
          borderColor: 'rgba(0, 229, 255, 0.28)',
          borderRadius: 18 * scale,
          padding: 14 * scale,
          marginTop: 18 * scale,
          shadowColor: '#00E5FF',
          shadowOpacity: 0.15,
          shadowRadius: 10,
          elevation: 6,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 20 * scale, marginRight: 8 * scale }}>🏆</Text>
            <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 18 * scale, letterSpacing: 0.3 }}>
              Leaderboard Winners
            </Text>
          </View>
          <Text style={{ color: '#00E5FF', fontWeight: '800', fontSize: 11 * scale }}>
            {getPeriodDateLabel(winnersPeriod)}
          </Text>
        </View>

        {/* Period Selector Tabs with Dates */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: 'rgba(4, 9, 24, 0.85)',
            borderRadius: 12 * scale,
            padding: 3 * scale,
            marginTop: 10 * scale,
            marginBottom: 12 * scale,
          }}
        >
          {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((p) => {
            const on = winnersPeriod === p;
            return (
              <TouchableOpacity
                key={p}
                activeOpacity={0.8}
                onPress={() => setWinnersPeriod(p)}
                style={{
                  flex: 1,
                  paddingVertical: 7 * scale,
                  paddingHorizontal: 2 * scale,
                  borderRadius: 9 * scale,
                  backgroundColor: on ? '#00E5FF' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: on ? '#00172D' : '#FFFFFF',
                    fontWeight: '900',
                    fontSize: 12 * scale,
                  }}
                >
                  {p}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    color: on ? '#002B4D' : '#94A3B8',
                    fontWeight: '700',
                    fontSize: 8.5 * scale,
                    marginTop: 2 * scale,
                  }}
                >
                  {getPeriodDateLabel(p)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Winners List */}
        {winnersLoading ? (
          <ActivityIndicator color={CYAN} style={{ marginVertical: 18 * scale }} />
        ) : periodWinners.length === 0 ? (
          <View style={{ paddingVertical: 18 * scale, alignItems: 'center' }}>
            <Text style={[s.muted, { fontSize: 13 * scale, textAlign: 'center' }]}>
              No winners awarded for this period yet.
            </Text>
          </View>
        ) : (
          periodWinners.map((w, idx) => {
            const isUser = Boolean(userProfile?.uid && w.uid === userProfile.uid);
            return (
              <View
                key={w.id || idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: isUser ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  borderColor: isUser ? '#00E5FF' : 'rgba(255, 255, 255, 0.08)',
                  borderWidth: 1,
                  borderRadius: 12 * scale,
                  paddingHorizontal: 8 * scale,
                  paddingVertical: 10 * scale,
                  marginBottom: idx < periodWinners.length - 1 ? 8 * scale : 0,
                }}
              >
                {/* Left: Medal + Avatar + Name */}
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <WreathMedal rank={w.rank || idx + 1} />
                  <Image
                    source={resolveAvatarSource(w.avatar)}
                    style={{
                      width: 32 * scale,
                      height: 32 * scale,
                      borderRadius: (32 * scale) / 2,
                      marginRight: 8 * scale,
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    }}
                  />
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontWeight: '800',
                      fontSize: 12 * scale,
                      maxWidth: 85 * scale,
                    }}
                    numberOfLines={1}
                  >
                    {w.name || w.displayName || 'Player'}{isUser ? ' (You)' : ''}
                  </Text>
                </View>

                {/* Middle: Stats (GP, Played, Won) */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 4 * scale }}>
                  <View style={{ alignItems: 'center', paddingHorizontal: 5 * scale, borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 11 * scale }}>{w.gp || 0} GP</Text>
                    <Text style={{ color: '#64748B', fontSize: 8 * scale, fontWeight: '700' }}>Game Power</Text>
                  </View>
                  <View style={{ alignItems: 'center', paddingHorizontal: 5 * scale, borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 11 * scale }}>{w.plays || 0}</Text>
                    <Text style={{ color: '#64748B', fontSize: 8 * scale, fontWeight: '700' }}>Played</Text>
                  </View>
                  <View style={{ alignItems: 'center', paddingHorizontal: 5 * scale }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 11 * scale }}>{w.wins || 0}</Text>
                    <Text style={{ color: '#64748B', fontSize: 8 * scale, fontWeight: '700' }}>Won</Text>
                  </View>
                </View>

                {/* Right: Golden Reward Ticket Voucher */}
                <View
                  style={{
                    backgroundColor: 'rgba(168, 85, 0, 0.28)',
                    borderColor: '#F59E0B',
                    borderWidth: 1,
                    borderRadius: 8 * scale,
                    paddingHorizontal: 7 * scale,
                    paddingVertical: 5 * scale,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 12 * scale, marginRight: 4 * scale }}>🎁</Text>
                  <Text
                    style={{
                      color: '#FBBF24',
                      fontWeight: '900',
                      fontSize: 10 * scale,
                      maxWidth: 85 * scale,
                    }}
                    numberOfLines={1}
                  >
                    {w.rewardVp ? `${w.rewardVp} VP` : (String(w.reward || '').toUpperCase().includes('VP') ? w.reward : `${String(w.reward || '10').replace(/[^0-9.]/g, '') || 10} VP`)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    );
  }

  function Leaderboard() {
    return (
      <View style={{ marginTop: 15 * scale }}>
        <View style={s.sectionRow}>
          {txt('Global Leaderboard', 20, s.bold)}
          <View style={s.filters}>
            {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((p) => (
              <Tap key={p} label={`${p} leaderboard`} role="tab" selected={period === p} onPress={() => setPeriod(p)} style={[s.filter, period === p && s.activeFilter]}>
                {txt(p, 10, { color: period === p ? '#002239' : '#d7d7ee' })}
              </Tap>
            ))}
          </View>
        </View>
        {leaderboardLoading ? (
          <ActivityIndicator color={CYAN} style={{ marginTop: 16 * scale }} />
        ) : rows.length === 0 ? (
          <Text style={[s.muted, { marginTop: 12 * scale }]}>
            {period === 'Daily' ? 'No players have played today yet.' : 'No active database rankings for this period yet.'}
          </Text>
        ) : rows.map((player, index) => (
          <Tap key={player.id} label={`${index + 1}, ${player.name}, ${player.plays} plays, ${player.wins} wins`} onPress={() => open('player', player)} style={[s.leaderRow, index === 0 && s.firstRow, player.isUser && { borderColor: '#00E5FF', borderWidth: 1.5, backgroundColor: 'rgba(0, 229, 255, 0.08)' }]}>
            <View style={[s.rank, index < 3 && { borderColor: ['#eab51b', '#91a6b9', '#ff8a00'][index], backgroundColor: ['#8f6400', '#526b80', '#bf4004'][index] }]}>
              {index < 3 && <View style={s.medalRibbon} />}
              {txt(String(index + 1), 17, index === 0 && { color: '#fff676' })}
            </View>
            <Image source={resolveAvatarSource(player.avatar)} style={[s.smallAvatar, { width: 32 * scale, height: 32 * scale, borderRadius: (32 * scale) / 2 }]} />
            <View style={{ flex: 1 }}>
              {txt(player.name, 12)}
              {txt(`${player.plays} Plays · ${player.wins} Wins`, 11, s.muted)}
            </View>
            {txt(player.gpText || `${player.gp || 0} GP`, 14, [s.bold, index === 0 && { color: '#ffe856' }])}
          </Tap>
        ))}
      </View>
    );
  }

  function Home() {
    const streakInfo = getStreakInfo(userProfile);

    return (
      <>
        <View style={s.welcomeRow}>
          <View style={{ flex: 1 }}>
            {txt('Welcome,', 32, s.bold)}
            <View style={s.inline}>
              {txt(displayName, 22, [s.bold, s.cyan, { maxWidth: 220 * scale }])}
              {txt(' \uD83D\uDC4B', 22)}
            </View>
            {txt('Play. Earn. Belong.', 16, s.muted)}
          </View>
          <Tap label="More games, bigger rewards" onPress={() => open('rewards')} style={s.promoWrap}>
            <LinearGradient colors={['#652d05', '#06152c', '#450098']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.promo}>
              <Art name="crown" width={57 * scale} height={56 * scale} />
              {txt('More Games\nBigger Rewards', 16, [s.bold, { flex: 1, marginLeft: 10 * scale }])}
              {icon('chevron-forward', 25, '#c7b8ff')}
            </LinearGradient>
          </Tap>
        </View>
        <View style={s.stats}>
          <WalletCard />
          <View style={[s.card, s.streakSummary]}>
            <Art name="flame" width={47 * scale} height={62 * scale} />
            <View style={{ flex: 1, marginLeft: 6 * scale }}>
              <View style={s.inline}>
                {txt(streakInfo.dayText, 21, [s.bold, { color: '#FFFFFF' }])}
                <View
                  style={[
                    s.activeBadge,
                    {
                      backgroundColor: streakInfo.isActive
                        ? '#10B981'
                        : (streakInfo.isAtRisk ? '#F59E0B' : '#EF4444'),
                    },
                  ]}
                >
                  {txt(streakInfo.statusText, 12, { color: '#FFFFFF', fontWeight: '800' })}
                  {icon(streakInfo.isActive ? 'checkmark-circle' : 'alert-circle', 13, '#FFFFFF')}
                </View>
              </View>
              {txt('Daily Streak', 14, s.muted)}
            </View>
          </View>
        </View>
        <Streak />
        <View style={s.playStrip}>
          {icon('information-circle', 29)}
          <View style={{ flex: 1, marginLeft: 9 * scale }}>
            {txt('Play a game today to keep your streak!', 13, s.medium)}
            {txt('Streak only counts if you visit and play a game successfully.', 11, [s.muted, { marginTop: 4 * scale }])}
          </View>
          <GradientButton title="Play Now" onPress={() => open('games')} style={{ width: 155 * scale }} compact scale={scale} />
        </View>
        <View style={[s.sectionRow, { marginTop: 12 * scale, marginBottom: 6 * scale }]}>
          {txt('Games', 20, s.bold)}
          <Tap label="See all games" onPress={() => open('games')} style={s.inline}>
            {txt('See All', 14, s.cyan)}
            {icon('chevron-forward', 17)}
          </Tap>
        </View>
        <View style={s.gameGrid}>
          {GAMES.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </View>
        <LeaderboardWinners />
        <Leaderboard />
      </>
    );
  }

  function OtherTab() {
    if (tab === 'Tournaments')
      return (
        <>
          <Text style={ui.pageTitle}>Tournaments</Text>
          <TournamentCard />
          <View style={ui.panel}>
            <Text style={ui.heading}>Your registration</Text>
            <Text style={ui.body}>{state.joined ? 'You have joined the Ayo á»Œpá»Ìn Grandmaster Tournament .' : 'Join the featured tournament to see your registration here.'}</Text>
            <GradientButton title={state.joined ? 'View tournament' : 'View entry details'} onPress={() => open('tournament')} />
          </View>
        </>
      );
    /* Wallet tab commented out (no wallet in project)
    if (tab === 'Wallet')
      return (
        <>
          <Text style={ui.pageTitle}>Points</Text>
          <View style={ui.panel}>
            <Text style={ui.body}>Acquired Points</Text>
            <Text style={ui.balance}>{formatPoints(walletBalanceNaira)}</Text>
            <GradientButton title="Add funds" onPress={() => open('deposit')} />
          </View>
          <Text style={ui.heading}>Transaction history</Text>
          {serverTransactions.length === 0 ? (
            <Text style={ui.body}>No transactions yet.</Text>
          ) : (
            serverTransactions.map((t) => {
              const amount = Number(t.amount ?? (t.amountKobo != null ? t.amountKobo / 100 : 0)) || 0;
              const credit = amount >= 0;
              return (
                <View key={t.id} style={ui.transaction}>
                  <View style={{ flex: 1 }}>
                    <Text style={ui.label}>{t.description || t.type || 'Transaction'}</Text>
                    <Text style={ui.caption}>{new Date(t.createdAt || t.processedAt || Date.now()).toLocaleString()}</Text>
                  </View>
                  <Text style={ui.credit}>{credit ? '+' : ''}{formatNaira(amount)}</Text>
                </View>
              );
            })
          )}
        </>
      );
    */
    return (
      <>
        <Text style={ui.pageTitle}>Profile</Text>
        <View style={[ui.panel, { alignItems: 'center' }]}>
          <Image source={resolveAvatarSource(userProfile?.avatar)} style={{ width: 80, height: 80, borderRadius: 40 }} />
          <Text style={ui.pageTitle}>{displayName}</Text>
          <Text style={ui.credit}>â— Active Member</Text>
          <Text style={ui.body}>
            {streakDays} day streak · {userProfile?.wins || 0} wins · {userProfile?.gpText || '0 GP'}
          </Text>
        </View>
        <GradientButton title="Edit profile" onPress={() => open('profile')} />
        <Tap label="Open settings" onPress={() => open('settings')} style={ui.listItem}>
          <Text style={ui.label}>Settings</Text>
          <Ionicons name="settings-outline" color={CYAN} size={24} />
        </Tap>
      </>
    );
  }

  function SheetContent() {
    switch (sheet?.type) {
      case 'notifications':
        return (
          <>
            <Text style={ui.heading}>Notifications</Text>
            {notificationsList.length === 0 ? (
              <Text style={ui.caption}>No new notifications</Text>
            ) : (
              <View style={{ gap: 8, marginTop: 4 }}>
                {notificationsList.map((item) => {
                  const handleNotificationPress = () => {
                    setSheet(null);
                    if (userProfile?.uid && item.id) {
                      notificationsApi.markRead(item.id).catch(() => {});
                    }
                    const act = item.actionType || item.type;
                    const payload = item.actionPayload || {};
                    if (act === 'referral') {
                      navigation?.navigate('InviteFriends');
                    } else if (act === 'tournament' || item.type === 'tournament_available' || item.type === 'tournament_ended' || item.type === 'tournament_ping') {
                      if (payload.tournamentId) {
                        const targetScreen = payload.screen || (item.type === 'tournament_ended' ? 'TournamentResults' : 'TournamentDetails');
                        navigation?.navigate(targetScreen, { tournamentId: payload.tournamentId });
                      } else {
                        changeTab('Tournaments');
                      }
                    } else {
                      changeTab('Home');
                    }
                  };
                  const iconName =
                    item.type === 'follow' || item.type === 'referral'
                      ? 'person-add'
                      : item.type === 'tournament' || item.type === 'tournament_available' || item.type === 'tournament_ended' || item.type === 'tournament_ping'
                      ? 'trophy'
                      : item.type === 'streak_reminder' || item.type === 'streak_ping'
                      ? 'flame'
                      : 'notifications';
                  return (
                    <View
                      key={item.id}
                      style={[ui.panel, { padding: 14, marginVertical: 4, flexDirection: 'row', alignItems: 'center' }]}
                    >
                      <Tap
                        label={item.title || 'Notification'}
                        onPress={handleNotificationPress}
                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                      >
                        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0, 217, 255, 0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                          <Ionicons name={iconName} size={18} color="#00d9ff" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[ui.label, { fontSize: 14, fontWeight: '700' }]}>{item.title || 'Notification'}</Text>
                          <Text style={[ui.body, { fontSize: 13, marginVertical: 2, color: '#bfcbdc' }]}>{item.message}</Text>
                          <Text style={[ui.caption, { fontSize: 11 }]}>{new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                      </Tap>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Delete notification"
                        activeOpacity={0.75}
                        onPress={() => handleDeleteNotification(item.id)}
                        style={{
                          marginLeft: 10,
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: 'rgba(239, 68, 68, 0.16)',
                          borderWidth: 1,
                          borderColor: 'rgba(239, 68, 68, 0.4)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        );
      case 'settings':
        return (
          <>
            <Text style={ui.heading}>Settings</Text>
            {[
              ['sound', 'Sound effects'],
              ['notifications', 'Push notifications'],
            ].map(([key, label]) => (
              <View key={key} style={ui.listItem}>
                <Text style={ui.label}>{label}</Text>
                <Switch
                  accessibilityLabel={label}
                  value={state.settings[key]}
                  onValueChange={(value) => changeSetting(key, value)}
                  trackColor={{ false: '#394657', true: '#008fae' }}
                  thumbColor={state.settings[key] ? CYAN : '#cad2df'}
                />
              </View>
            ))}
            <View style={ui.listItem}>
              <Text style={ui.label}>Dark mode</Text>
              <Switch
                accessibilityLabel="Dark mode"
                value={isDark}
                onValueChange={changeTheme}
                trackColor={{ false: '#394657', true: '#008fae' }}
                thumbColor={isDark ? CYAN : '#cad2df'}
              />
            </View>
            <Text style={ui.body}>Preferences are synced to your account when you are signed in.</Text>
          </>
        );
      case 'profile':
        return (
          <>
            <Text style={ui.heading}>Edit profile</Text>
            <Text style={ui.body}>Display name</Text>
            <TextInput
              accessibilityLabel="Display name"
              value={name}
              onChangeText={setName}
              maxLength={24}
              style={ui.input}
              placeholder="Your name"
              placeholderTextColor="#788b9f"
              autoCapitalize="words"
            />
            <GradientButton
              title="Save profile"
              onPress={() => {
                if (!name.trim()) {
                  setFormError('Please enter your name.');
                  return;
                }
                dispatch({ type: 'NAME', value: name });
                if (updateProfileData) updateProfileData({ name: name.trim() });
                setSheet(null);
              }}
            />
          </>
        );
      /* Wallet deposit sheet commented out (no wallet in project)
      case 'deposit':
        return (
          <>
            <Text style={ui.heading}>Add funds</Text>
            <Text style={ui.body}>Add funds through the wallet to start a payment.</Text>
            <Text style={ui.label}>Amount (NGN)</Text>
            <TextInput
              accessibilityLabel="Amount in naira"
              value={amount}
              onChangeText={(value) => {
                setAmount(value);
                setFormError('');
              }}
              keyboardType="decimal-pad"
              style={ui.input}
              placeholder="e.g. 1000.00"
              placeholderTextColor="#788b9f"
              maxLength={12}
            />
            <View style={ui.quickAmounts}>
              {['10', '20', '100'].map((value) => (
                <Tap key={value} label={`Set amount to ${value} Value Points`} onPress={() => setAmount(String(Number(value) * 50))} style={ui.chip}>
                  <Text style={ui.label}>{value} VP</Text>
                </Tap>
              ))}
            </View>
            <GradientButton title="Add virtual funds" onPress={addFunds} />
          </>
        );
      */
      case 'tournament':
        return (
          <>
            <Text style={ui.heading}>Ayo á»Œpá»Ìn Grandmaster Tournament</Text>
            <Art name="tournament" width={280} height={146} style={{ alignSelf: 'center', borderRadius: 12 }} />
            <Text style={ui.body}>
              Prize pool: 100 VP{'\n'}
              Players: 1,240 (players){'\n'}
              Entry fee: Free
            </Text>
            <Text style={ui.body}>{state.joined ? 'Your registration is saved. Tap below to launch the Ayo lobby.' : 'Tournament registration is handled by the backend.'}</Text>
            <GradientButton
              title={state.joined ? 'Open Ayo lobby' : 'Confirm registration'}
              onPress={() => {
                if (state.joined) {
                  setSheet(null);
                  launchGame(GAMES[1]);
                } else dispatch({ type: 'JOIN' });
              }}
            />
          </>
        );
      case 'games':
        return (
          <>
            <Text style={ui.heading}>Choose a game</Text>
            {GAMES.map((game) => (
              <Tap key={game.id} label={`Open ${game.name}`} onPress={() => { setSheet(null); launchGame(game); }} style={ui.listItem}>
                <Art name={game.id} width={74} height={52} style={{ borderRadius: 8 }} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={ui.label}>{game.name}</Text>
                  <Text style={ui.caption}>🟢 {game.players} Playing</Text>
                </View>
                <Ionicons name="chevron-forward" color={CYAN} size={22} />
              </Tap>
            ))}
          </>
        );
      case 'game':
        return (
          <>
            <Text style={ui.heading}>{sheet.data.name}</Text>
            <Art name={sheet.data.id} width={174} height={122} style={{ alignSelf: 'center', borderRadius: 16 }} />
            <Text style={ui.body}>{sheet.data.description}</Text>
            <Text style={ui.label}>Daily activity</Text>
            <Text style={ui.body}>Roll a 4, 5, or 6 to complete today's daily streak activity, or launch the game lobby directly below.</Text>
            {roll !== null && <Text accessibilityLiveRegion="polite" style={ui.dice}>{['âš€', 'âš', 'âš‚', 'âšƒ', 'âš„', 'âš…'][roll - 1]}  {roll}</Text>}
            {demoComplete && <Text accessibilityLiveRegion="polite" style={ui.credit}>Daily streak complete! Today's streak activity is saved.</Text>}
            <GradientButton
              disabled={demoComplete}
              title={demoComplete ? "Completed today's streak" : roll ? 'Roll again' : 'Roll the dice'}
              onPress={() => {
                const result = 1 + Math.floor(Math.random() * 6);
                setRoll(result);
                if (result >= 4) {
                  setDemoComplete(true);
                  dispatch({ type: 'COMPLETE_DEMO', day: localDay() });
                }
              }}
            />
            <View style={{ marginTop: 12 }}>
              <GradientButton title="Launch Full Game" onPress={() => { setSheet(null); launchGame(sheet.data); }} />
            </View>
          </>
        );
      case 'reward':
        return (
          <>
            <Text style={ui.heading}>Streak rewards</Text>
            <Art name="gift" width={90} height={105} style={{ alignSelf: 'center' }} />
            <Text style={ui.body}>{state.claimed ? 'Your reward status is managed by the backend.' : state.streak >= 30 ? 'Your reward is unlocked according to the backend milestone policy.' : `${30 - state.streak} more qualifying days to unlock your reward.`}</Text>
            <GradientButton disabled={state.streak < 30 || state.claimed} title={state.claimed ? 'Claimed' : state.streak >= 30 ? 'Reward status' : 'Reward locked'} onPress={() => dispatch({ type: 'CLAIM' })} />
          </>
        );
      case 'streak':
        return (
          <>
            <Text style={ui.heading}>{state.streak} Day Streak {'\uD83D\uDD25'}</Text>
            <Text style={ui.body}>Complete a qualifying game each day. Opening the app alone does not count. Complete a qualifying game to advance your streak.</Text>
            <Text style={ui.body}>Milestones: 7, 14, 30, 50, 90, 100, 120, 150, 180, 200, 250, 270, 300, 350, and 365 days. A day counts only after a completed game.</Text>
            <Text style={ui.caption}>Last activity: {state.lastPlayed || 'No completed daily activity yet'}</Text>
            <GradientButton title="Choose a game" onPress={() => open('games')} />
          </>
        );
      case 'rewards':
        return (
          <>
            <Text style={ui.heading}>More Games. Bigger Rewards.</Text>
            <Text style={ui.body}>Explore all four games, work toward streak milestones, and join the featured tournament.</Text>
            <GradientButton title="Explore games" onPress={() => open('games')} />
            <Tap label="View 30 day reward" onPress={() => open('reward')} style={ui.listItem}>
              <Text style={ui.label}>View Streak rewards</Text>
              <Ionicons name="gift-outline" size={24} color={CYAN} />
            </Tap>
          </>
        );
      case 'player':
        return (
          <>
            <Image source={resolveAvatarSource(sheet.data.avatar)} style={{ width: 72, height: 72, borderRadius: 36, alignSelf: 'center' }} />
            <Text style={ui.heading}>{sheet.data.name}</Text>
            <Text style={ui.body}>
              {period} leaderboard{'\n'}
              {sheet.data.wins} Wins{'\n'}
              {sheet.data.gpText || `${sheet.data.gp || 0} GP`}
            </Text>
            <Text style={ui.caption}>Player profile</Text>
          </>
        );
      default:
        return null;
    }
  }

  if (!ready)
    return (
      <View style={ui.loading}>
        <StatusBar barStyle="light-content" backgroundColor="#00101e" />
        <ActivityIndicator color={CYAN} size="large" accessibilityLabel="Loading dashboard" />
      </View>
    );

  return (
    <View style={[ui.root, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
      <LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />
      <ScrollView
        ref={scroll}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        nestedScrollEnabled={true}
        overScrollMode="always"
        bounces={true}
        scrollEventThrottle={16}
        contentContainerStyle={[
          s.content,
          {
            paddingTop: insets.top + 10 * scale,
            paddingBottom: Math.max(180, 180 * scale) + insets.bottom,
            flexGrow: 1,
          },
        ]}
      >
        <Header />
        {!!storageError && <Text accessibilityLiveRegion="polite" style={ui.error}>{storageError}</Text>}
        {tab === 'Home' ? <Home /> : <OtherTab />}
      </ScrollView>

      <Modal transparent visible={sheet !== null} animationType="slide" onRequestClose={() => setSheet(null)} statusBarTranslucent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={ui.modalBackdrop}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close dialog" onPress={() => setSheet(null)} style={StyleSheet.absoluteFillObject} />
          <View accessibilityViewIsModal style={[ui.sheet, { paddingBottom: Math.max(insets.bottom, 20), maxHeight: '88%' }]}>
            <View style={ui.sheetTop}>
              <View style={ui.handle} />
              <Tap label="Close dialog" onPress={() => setSheet(null)} style={ui.close}>
                <Ionicons name="close" size={26} color="#fff" />
              </Tap>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 220 }}>
              {SheetContent()}
              {!!formError && <Text accessibilityLiveRegion="polite" style={ui.error}>{formError}</Text>}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 3. Persistent Welcome Dashboard In-App Prompt (Telegram / WhatsApp Community) */}
      <Modal
        transparent
        visible={showWelcomeCommunityModal}
        animationType="fade"
        onRequestClose={() => {}}
        statusBarTranslucent
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(2, 10, 24, 0.85)', alignItems: 'center', justifyContent: 'center', padding: 22 }}>
          <View style={{ width: '100%', maxWidth: 420, backgroundColor: '#07182E', borderRadius: 22, borderWidth: 1.5, borderColor: '#00d9ff55', padding: 24, alignItems: 'center', shadowColor: '#00d9ff', shadowOpacity: 0.35, shadowRadius: 20, elevation: 12 }}>
            <Image source={GAMEARN_LOGO} style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 14 }} resizeMode="contain" />
            <Text style={{ color: '#FFFFFF', fontSize: 21, fontWeight: '800', textAlign: 'center', marginBottom: 10 }}>
              Welcome to GAMEARN! 🎉
            </Text>
            <Text style={{ color: '#C9D8E8', fontSize: 14.5, lineHeight: 22, textAlign: 'center', marginBottom: 22 }}>
              Hello {(displayName || 'Player').trim().split(/\s+/)[0]}! Welcome to GAMEARN! We're excited to have you here. Join our official GAMEARN community to receive first-hand information, important announcements, exciting updates and opportunities to connect and interact with other players. Be part of the community. Stay informed. Never miss out!
            </Text>
            <View style={{ width: '100%', gap: 12 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleCommunityButtonClick('telegram', TELEGRAM_COMMUNITY_LINK)}
                style={{ width: '100%', backgroundColor: '#229ED9', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
              >
                <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 15.5, fontWeight: '800' }}>Join Telegram Community</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleCommunityButtonClick('whatsapp', WHATSAPP_COMMUNITY_LINK)}
                style={{ width: '100%', backgroundColor: '#25D366', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 15.5, fontWeight: '800' }}>Join WhatsApp Community</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(k, theme, isDark) {
  const base = {
    content: { width: '100%', maxWidth: 650, alignSelf: 'center', paddingHorizontal: 30 },
    text: { color: theme ? theme.textPrimary : '#f7f7ff', fontSize: 18 },
    bold: { fontWeight: '700' },
    medium: { fontWeight: '500' },
    cyan: { color: theme ? theme.primary : CYAN },
    muted: { color: theme ? theme.textSecondary : '#c4c7dd' },
    inline: { flexDirection: 'row', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', height: 70, marginBottom: 8, gap: 22 },
    member: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatarRing: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', shadowColor: CYAN, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
    avatar: { borderRadius: 30 },
    avatarFallback: { backgroundColor: '#14304a', alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { color: '#fff', fontSize: 24, fontWeight: '800' },
    roundIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: isDark ? '#002138' : 'rgba(0, 0, 0, 0.06)', alignItems: 'center', justifyContent: 'center' },
    unread: { position: 'absolute', right: 13, top: 10, width: 11, height: 11, borderRadius: 6, backgroundColor: '#ff1532' },
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6, backgroundColor: GREEN },
    welcomeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    promoWrap: { width: 241, borderRadius: 17, borderColor: isDark ? '#83581f' : 'rgba(0, 0, 0, 0.1)', borderWidth: 1, overflow: 'hidden' },
    promo: { flexDirection: 'row', alignItems: 'center', height: 78, paddingHorizontal: 10 },
    stats: { flexDirection: 'row', alignItems: 'stretch', gap: 11, marginBottom: 15 },
    card: { flex: 1, minHeight: 85, borderWidth: 1, borderColor: isDark ? '#086d96' : 'rgba(0, 0, 0, 0.08)', borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
    wallet: { paddingHorizontal: 10, paddingVertical: 6 },
    withdrawRewardsBtn: { marginTop: 5, borderRadius: 8, overflow: 'hidden', alignSelf: 'flex-start' },
    withdrawRewardsGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    withdrawRewardsText: { color: '#001824', fontSize: 11, fontWeight: '900', letterSpacing: 0.3 },
    claimBtn: { backgroundColor: '#00d9ff', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 3 },
    claimBtnText: { color: '#001824', fontSize: 11, fontWeight: '800' },
    walletIcon: { width: 52, height: 56, backgroundColor: isDark ? '#003155' : 'rgba(0, 180, 216, 0.15)', borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    plus: { width: 35, height: 35, borderRadius: 18, backgroundColor: isDark ? '#00baf2' : '#00B4D8', alignItems: 'center', justifyContent: 'center', marginLeft: 5 },
    streakSummary: { paddingHorizontal: 8, backgroundColor: isDark ? '#001522' : '#FFFFFF' },
    activeBadge: { marginLeft: 10, borderRadius: 15, backgroundColor: GREEN, paddingHorizontal: 12, height: 26, flexDirection: 'row', alignItems: 'center', gap: 3 },
    streak: { borderRadius: 12, borderWidth: 1, borderColor: isDark ? '#087f94' : 'rgba(0, 0, 0, 0.08)', paddingHorizontal: 16, paddingTop: 7, height: 136, backgroundColor: isDark ? 'transparent' : '#FFFFFF', overflow: 'visible' },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    milestoneScroller: { marginTop: 6, flex: 1, overflow: 'visible' },
    milestones: { flexGrow: 1, overflow: 'visible' },
    milestoneTrack: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flex: 1, minWidth: 5 * 62 + 82, position: 'relative', paddingTop: 6, overflow: 'visible' },
    track: { position: 'absolute', top: 39, left: 26, right: 82, height: 4, backgroundColor: isDark ? '#3c455e' : '#CBD5E1' },
    milestone: { width: 62, alignItems: 'center' },
    milestoneCircle: { width: 33, height: 33, borderRadius: 17, borderWidth: 2, borderColor: isDark ? '#64778f' : '#94A3B8', backgroundColor: isDark ? '#142035' : '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
    done: { backgroundColor: '#07872f', borderColor: '#33ff3e', shadowColor: GREEN, shadowRadius: 8, shadowOpacity: 0.9, shadowOffset: { width: 0, height: 0 } },
    gold: { backgroundColor: '#a86a00', borderColor: '#ffe537', shadowColor: '#ffb500', shadowRadius: 7, shadowOpacity: 0.85, shadowOffset: { width: 0, height: 0 } },
    reward: { width: 79, height: 68, borderRadius: 9, borderWidth: 1, borderColor: isDark ? '#946d39' : 'rgba(0,0,0,0.1)', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 3, backgroundColor: isDark ? '#07162b' : '#F1F5F9', marginTop: 5, overflow: 'visible' },
    gift: { position: 'absolute', top: -22 },
    playStrip: { marginTop: 9, marginBottom: 9, height: 64, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', borderRadius: 10, backgroundColor: isDark ? '#09152f' : 'rgba(0, 180, 216, 0.12)' },
    tournament: { height: 187, borderRadius: 13, borderWidth: 1, borderColor: isDark ? '#ac7427' : 'rgba(0, 0, 0, 0.1)', overflow: 'hidden', paddingHorizontal: 21, paddingVertical: 9 },
    trophyArt: { position: 'absolute', right: 0, top: 0 },
    badges: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 },
    live: { backgroundColor: GREEN, paddingHorizontal: 16, paddingVertical: 5, borderRadius: 18 },
    upcoming: { backgroundColor: isDark ? 'rgba(0, 229, 255, 0.15)' : 'rgba(0, 180, 216, 0.15)', borderWidth: 1, borderColor: theme ? theme.primary : CYAN, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 18 },
    playersBadge: { backgroundColor: isDark ? '#162131' : 'rgba(0,0,0,0.06)', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 18 },
    tournamentTitle: { fontWeight: '700', lineHeight: 24, marginBottom: 5, width: 300, color: theme ? theme.textPrimary : '#FFFFFF' },
    prizeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    gameGrid: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
    gameCard: { flex: 1, height: 130, borderRadius: 10, borderWidth: 1, borderColor: isDark ? '#095674' : 'rgba(0, 0, 0, 0.08)', overflow: 'hidden', backgroundColor: isDark ? '#021626' : '#FFFFFF' },
    gameText: { paddingHorizontal: 9, paddingTop: 4, gap: 4 },
    filters: { width: 282, height: 29, flexDirection: 'row', borderRadius: 12, backgroundColor: isDark ? '#05152c' : '#E2E8F0', borderWidth: 1, borderColor: isDark ? '#132842' : '#CBD5E1', overflow: 'hidden' },
    filter: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
    activeFilter: { backgroundColor: theme ? theme.primary : '#00bdf3' },
    leaderRow: { height: 41, marginTop: 4, borderRadius: 10, borderWidth: 1, borderColor: isDark ? '#1b2b40' : 'rgba(0,0,0,0.06)', backgroundColor: isDark ? '#031626' : '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
    firstRow: { borderColor: '#b49125', backgroundColor: isDark ? '#161a1b' : '#FEF3C7' },
    rank: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#2d3c53', alignItems: 'center', justifyContent: 'center', marginRight: 18 },
    medalRibbon: { position: 'absolute', width: 14, height: 7, top: -6, borderLeftWidth: 3, borderRightWidth: 3, borderColor: '#a0a9ae', transform: [{ rotate: '15deg' }] },
    smallAvatar: { borderRadius: 16, marginRight: 21 },
    bottomBar: { width: '100%', maxWidth: 650, alignSelf: 'center', flexDirection: 'row', borderTopWidth: 1, borderColor: '#16334a', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 14, backgroundColor: '#00111d' },
    navItem: { flex: 1, alignItems: 'center', paddingBottom: 12, minHeight: 68 },
    navGlow: { textShadowColor: '#008cff', textShadowRadius: 15, textShadowOffset: { width: 0, height: 0 } },
  };
  const unitless = new Set(['flex', 'opacity', 'shadowOpacity', 'zIndex', 'aspectRatio', 'elevation', 'flexGrow', 'flexShrink']);
  function convert(value, key) {
    if (typeof value === 'number') return unitless.has(key) ? value : value * k;
    if (Array.isArray(value)) return value.map((v) => convert(v, ''));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([name, v]) => [name, convert(v, name)]));
    return value;
  }
  return StyleSheet.create(convert(base, ''));
}

const ui = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#00101e' },
  loading: { flex: 1, backgroundColor: '#00101e', justifyContent: 'center', alignItems: 'center' },
  button: { minHeight: 46, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '700', flexShrink: 1 },
  pageTitle: { color: '#fff', fontSize: 27, fontWeight: '700', marginVertical: 18 },
  heading: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 14, marginTop: 6 },
  body: { color: '#bfcbdc', fontSize: 15, lineHeight: 23, marginVertical: 10 },
  label: { color: '#f5f7ff', fontSize: 16, fontWeight: '600' },
  caption: { color: '#9cafc6', fontSize: 12, lineHeight: 18, marginTop: 4 },
  panel: { borderWidth: 1, borderColor: '#145370', borderRadius: 16, backgroundColor: '#071d30', padding: 20, marginVertical: 16 },
  balance: { color: CYAN, fontWeight: '700', fontSize: 36, marginBottom: 18 },
  credit: { color: GREEN, fontSize: 14, lineHeight: 22, marginVertical: 8 },
  transaction: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#18324b' },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 16, borderBottomWidth: 1, borderColor: '#193047' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: '#000000b3' },
  sheet: { backgroundColor: '#071a2b', width: '100%', maxWidth: 650, borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderColor: '#1a6480' },
  sheetTop: { height: 48, alignItems: 'center', justifyContent: 'center' },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#60768b' },
  close: { position: 'absolute', right: 12, top: 3, padding: 10 },
  input: { backgroundColor: '#001321', borderWidth: 1, borderColor: '#32617d', borderRadius: 12, padding: 14, color: '#fff', fontSize: 17, marginVertical: 12 },
  quickAmounts: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  chip: { backgroundColor: '#10324a', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20 },
  error: { color: '#ffb2a8', fontSize: 14, lineHeight: 20, marginVertical: 12 },
  notice: { padding: 15, backgroundColor: '#102b40', borderRadius: 12, marginBottom: 12 },
  dice: { color: CYAN, fontSize: 64, textAlign: 'center', marginVertical: 12 },
});





