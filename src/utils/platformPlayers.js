import AsyncStorage from '@react-native-async-storage/async-storage';
import { referral, leaderboard, tournaments } from '../services/api';
import { calculateGamePower } from './gamePower';

const COMMUNITY_CACHE_KEY = '@gamearn_community_users_cache';

// Empty list: mock/seed players removed. Data is fetched purely from the server database.
export const ALL_DATABASE_PLAYERS = [];

let memoryPlayersCache = [];
let lastFetchTimestamp = 0;
let inflightPromise = null;
const CACHE_TTL_MS = 5000;

/**
 * Clean up legacy local device cache keys so no stale mock or cached data persists.
 */
export async function clearLegacyDeviceCache() {
  try {
    await AsyncStorage.multiRemove([
      COMMUNITY_CACHE_KEY,
      '@gamearn_winners_cache',
      '@gamearn_gamestats_current',
      '@gamearn_leaderboard_v2_cache_Daily',
      '@gamearn_leaderboard_v2_cache_Weekly',
      '@gamearn_leaderboard_v2_cache_Monthly',
      '@gamearn_leaderboard_v2_cache_Yearly',
    ]);
  } catch {}
}

export async function getDeletedPlatformUidsSet() {
  try {
    const raw = await AsyncStorage.getItem('@gamearn_deleted_uids');
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export async function recordDeletedPlatformUid(uid) {
  if (!uid) return;
  try {
    const raw = await AsyncStorage.getItem('@gamearn_deleted_uids');
    const list = raw ? JSON.parse(raw) : [];
    const set = new Set(Array.isArray(list) ? list : []);
    set.add(uid);
    await AsyncStorage.setItem('@gamearn_deleted_uids', JSON.stringify(Array.from(set)));
  } catch {}

  memoryPlayersCache = memoryPlayersCache.filter((u) => u.uid !== uid && u.id !== uid);
  lastFetchTimestamp = 0;

  try {
    const commRaw = await AsyncStorage.getItem(COMMUNITY_CACHE_KEY);
    if (commRaw) {
      const comm = JSON.parse(commRaw);
      if (Array.isArray(comm)) {
        const filtered = comm.filter((u) => u.uid !== uid && u.id !== uid);
        await AsyncStorage.setItem(COMMUNITY_CACHE_KEY, JSON.stringify(filtered));
      }
    }
  } catch {}

  try {
    await Promise.all([
      AsyncStorage.removeItem(`@gamearn_profile_${uid}`),
      AsyncStorage.removeItem(`@gamearn_gamestats_${uid}`),
      AsyncStorage.removeItem(`@gamearn_earned_vp_${uid}`),
      AsyncStorage.removeItem(`@gamearn_cached_profile_${uid}`),
    ]);
  } catch {}
}

export function invalidatePlatformPlayersCache() {
  lastFetchTimestamp = 0;
}

export function extractArray(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.users)) return res.users;
  if (Array.isArray(res.referrals)) return res.referrals;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.users)) return res.data.users;
  if (res.data && Array.isArray(res.data.referrals)) return res.data.referrals;
  return [];
}

export async function getCachedPlatformPlayers() {
  const deletedSet = await getDeletedPlatformUidsSet();
  if (memoryPlayersCache.length > 0) {
    return memoryPlayersCache.filter((u) => !deletedSet.has(u.uid) && !deletedSet.has(u.id));
  }
  return [];
}

function mergeGameStatsObj(base = {}, incoming = {}) {
  const merged = { ...(base || {}) };
  for (const [k, st] of Object.entries(incoming || {})) {
    if (!st || typeof st !== 'object') continue;
    const prev = merged[k] || {};
    merged[k] = {
      ...prev,
      ...st,
      gamesPlayed: Math.max(Number(prev.gamesPlayed ?? prev.plays ?? 0), Number(st.gamesPlayed ?? st.plays ?? 0)),
      wins: Math.max(Number(prev.wins ?? 0), Number(st.wins ?? 0)),
      losses: Math.max(Number(prev.losses ?? 0), Number(st.losses ?? 0)),
      dailyPlays: Math.max(Number(prev.dailyPlays ?? 0), Number(st.dailyPlays ?? 0)),
      dailyWins: Math.max(Number(prev.dailyWins ?? 0), Number(st.dailyWins ?? 0)),
      lastPlayedDate: st.lastPlayedDate || prev.lastPlayedDate || null,
    };
  }
  return merged;
}

/**
 * Record any authenticated or newly registered account on this device into the
 * shared platform players cache so multi-account testing always includes every player.
 */
export async function registerKnownPlatformPlayer(profile) {
  if (!profile || typeof profile !== 'object') return;
  const uid = profile.uid || profile.id;
  if (!uid) return;

  const deletedSet = await getDeletedPlatformUidsSet();
  if (deletedSet.has(uid)) return;

  try {
    const existingList = await getCachedPlatformPlayers();
    const map = new Map();
    existingList.forEach((p) => {
      if (p && (p.uid || p.id) && !deletedSet.has(p.uid || p.id)) map.set(p.uid || p.id, p);
    });

    const prev = map.get(uid) || {};
    const displayName =
      profile.username ||
      profile.displayName ||
      profile.name ||
      prev.displayName ||
      (profile.email ? String(profile.email).split('@')[0] : 'Player');
    const username =
      profile.username ||
      prev.username ||
      String(displayName).toLowerCase().replace(/[^a-z0-9_-]/g, '') ||
      'player';
    const avatar = profile.avatar || profile.avatarUrl || prev.avatar || null;
    const gameStats = mergeGameStatsObj(prev.gameStats, profile.gameStats);

    let statsWins = 0;
    let statsPlays = 0;
    for (const gk of ['whot', 'ludo', 'ayo', 'draughts']) {
      const st = gameStats[gk] || (gk === 'draughts' ? gameStats.draft : null);
      if (st) {
        statsWins += Number(st.wins || 0);
        statsPlays += Number(st.gamesPlayed || 0);
      }
    }

    const careerPlays = Math.max(
      Number(profile.gamesPlayed ?? profile.plays ?? 0),
      Number(prev.careerPlays ?? prev.gamesPlayed ?? prev.plays ?? 0),
      statsPlays
    );
    const careerWins = Math.max(
      Number(profile.wins ?? profile.gamesWon ?? 0),
      Number(prev.careerWins ?? prev.wins ?? 0),
      statsWins
    );
    const computedGp = calculateGamePower(careerPlays, careerWins);
    const gp = computedGp;
    const streak = Math.max(
      Number(profile.streak ?? profile.currentStreak ?? 0),
      Number(prev.streak ?? 0)
    );

    const todayStr = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();
    const now = new Date();
    const currentWeek = `${now.getFullYear()}-W${Math.ceil((((now - new Date(now.getFullYear(), 0, 1)) / 86400000) + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7)}`;
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentYear = `${now.getFullYear()}`;

    const isToday = Boolean(profile.lastPlayedDate === todayStr || profile.lastDailyPlayDate === todayStr);
    const prevIsToday = Boolean(prev.lastPlayedDate === todayStr || prev.lastDailyPlayDate === todayStr);
    const dailyPlays = isToday
      ? Number(profile.dailyPlays !== undefined ? profile.dailyPlays : (prevIsToday ? prev.dailyPlays : 0))
      : (prevIsToday ? Number(prev.dailyPlays || 0) : 0);
    const dailyWins = isToday
      ? Number(profile.dailyWins !== undefined ? profile.dailyWins : (prevIsToday ? prev.dailyWins : 0))
      : (prevIsToday ? Number(prev.dailyWins || 0) : 0);

    const isThisWeek = Boolean(profile.lastPlayedWeek === currentWeek || isToday);
    const prevIsThisWeek = Boolean(prev.lastPlayedWeek === currentWeek || prevIsToday);
    const weeklyPlays = isThisWeek
      ? Number(profile.weeklyPlays !== undefined ? profile.weeklyPlays : (prevIsThisWeek ? prev.weeklyPlays : dailyPlays))
      : (prevIsThisWeek ? Number(prev.weeklyPlays || 0) : dailyPlays);
    const weeklyWins = isThisWeek
      ? Number(profile.weeklyWins !== undefined ? profile.weeklyWins : (prevIsThisWeek ? prev.weeklyWins : dailyWins))
      : (prevIsThisWeek ? Number(prev.weeklyWins || 0) : dailyWins);

    const isThisMonth = Boolean(profile.lastPlayedMonth === currentMonth || isToday);
    const prevIsThisMonth = Boolean(prev.lastPlayedMonth === currentMonth || prevIsToday);
    const monthlyPlays = isThisMonth
      ? Number(profile.monthlyPlays !== undefined ? profile.monthlyPlays : (prevIsThisMonth ? prev.monthlyPlays : weeklyPlays))
      : (prevIsThisMonth ? Number(prev.monthlyPlays || 0) : weeklyPlays);
    const monthlyWins = isThisMonth
      ? Number(profile.monthlyWins !== undefined ? profile.monthlyWins : (prevIsThisMonth ? prev.monthlyWins : weeklyWins))
      : (prevIsThisMonth ? Number(prev.monthlyWins || 0) : weeklyWins);

    const yearlyPlays = Math.max(Number(profile.yearlyPlays ?? 0), Number(prev.yearlyPlays ?? careerPlays), monthlyPlays);
    const yearlyWins = Math.max(Number(profile.yearlyWins ?? 0), Number(prev.yearlyWins ?? careerWins), monthlyWins);
    const lastPlayedDate = isToday ? todayStr : (prevIsToday ? todayStr : (profile.lastPlayedDate || prev.lastPlayedDate || null));
    const lastPlayedWeek = isThisWeek ? currentWeek : (profile.lastPlayedWeek || prev.lastPlayedWeek || null);
    const lastPlayedMonth = isThisMonth ? currentMonth : (profile.lastPlayedMonth || prev.lastPlayedMonth || null);
    const lastPlayedYear = profile.lastPlayedYear || prev.lastPlayedYear || currentYear;
    const vp = Math.max(Number(profile.valuePoints ?? profile.vp ?? 0), Number(prev.vp ?? 0));

    map.set(uid, {
      ...prev,
      uid,
      id: uid,
      displayName,
      name: displayName,
      username,
      avatar,
      avatarUrl: avatar,
      plays: careerPlays,
      gamesPlayed: careerPlays,
      careerPlays,
      wins: careerWins,
      careerWins,
      dailyPlays,
      dailyWins,
      weeklyPlays,
      weeklyWins,
      monthlyPlays,
      monthlyWins,
      yearlyPlays,
      yearlyWins,
      lastPlayedDate,
      lastPlayedWeek,
      lastPlayedMonth,
      lastPlayedYear,
      gameStats,
      gp,
      vp,
      valuePoints: vp,
      streak,
      phone: profile.phone || profile.phoneNumber || prev.phone || null,
      referralCode: profile.referralCode || username,
    });

    const updated = Array.from(map.values());
    memoryPlayersCache = updated;
    lastFetchTimestamp = 0; // Invalidate TTL so leaderboards refresh immediately
  } catch {
    // Best-effort cache update
  }
}

export async function fetchAllPlatformPlayers({ excludeUid = null, forceRefresh = false } = {}) {
  const now = Date.now();
  if (!forceRefresh && memoryPlayersCache.length > 1 && now - lastFetchTimestamp < CACHE_TTL_MS) {
    return excludeUid
      ? memoryPlayersCache.filter((u) => u.uid !== excludeUid)
      : memoryPlayersCache;
  }

  if (inflightPromise) {
    const list = await inflightPromise;
    return excludeUid ? list.filter((u) => u.uid !== excludeUid) : list;
  }

  inflightPromise = (async () => {
    const deletedSet = await getDeletedPlatformUidsSet();
    const cached = await getCachedPlatformPlayers();

    const requests = [
      referral.searchUsers(''),
      referral.searchUsers('+234'),
      leaderboard.get('Daily'),
      leaderboard.get('Yearly'),
      referral.me(),
      tournaments.list(),
    ];

    const results = await Promise.allSettled(requests);
    const map = new Map();

    const todayStr = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();

    const addEntry = (item, isDailyLb = false) => {
      if (!item || typeof item !== 'object') return;
      const uid = item.uid || item.id || item.user_id;
      if (!uid || deletedSet.has(uid)) return;

      const existing = map.get(uid) || {};
      const rawDisplayName =
        item.username ||
        item.displayName ||
        item.display_name ||
        item.name ||
        existing.displayName ||
        (item.email ? String(item.email).split('@')[0] : '') ||
        'Player';
      const rawUsername =
        item.username ||
        existing.username ||
        (rawDisplayName ? String(rawDisplayName).replace(/\s+/g, '').toLowerCase() : 'player');
      const avatar = item.avatar || item.avatarUrl || item.avatar_url || existing.avatar || null;
      const gameStats = mergeGameStatsObj(existing.gameStats, item.gameStats);

      let statsWins = 0;
      let statsPlays = 0;
      let statsDailyP = 0;
      let statsDailyW = 0;
      for (const gk of ['whot', 'ludo', 'ayo', 'draughts']) {
        const st = gameStats[gk] || (gk === 'draughts' ? gameStats.draft : null);
        if (st) {
          statsWins += Number(st.wins || 0);
          statsPlays += Number(st.gamesPlayed || 0);
          if (st.lastPlayedDate === todayStr) {
            statsDailyP += Number(st.dailyPlays || 0);
            statsDailyW += Number(st.dailyWins || 0);
          }
        }
      }

      const plays = Math.max(
        Number(item.totalPlays ?? item.careerPlays ?? item.gamesPlayed ?? item.games_played ?? (!isDailyLb ? item.plays : 0) ?? 0),
        Number(existing.careerPlays ?? existing.gamesPlayed ?? existing.plays ?? 0),
        statsPlays
      );
      const wins = Math.max(
        Number(item.totalWins ?? item.careerWins ?? (!isDailyLb ? item.wins : 0) ?? item.gamesWon ?? 0),
        Number(existing.careerWins ?? existing.wins ?? 0),
        statsWins
      );
      const isItemToday = Boolean(item.lastPlayedDate === todayStr || item.lastDailyPlayDate === todayStr);
      const existingIsToday = Boolean(existing.lastPlayedDate === todayStr || existing.lastDailyPlayDate === todayStr);
      const dailyPlays = isDailyLb
        ? Number(item.periodPlays !== undefined ? item.periodPlays : item.plays || 0)
        : (isItemToday ? Number(item.dailyPlays ?? item.todayPlays ?? 0) : (existingIsToday ? Number(existing.dailyPlays || 0) : statsDailyP));
      const dailyWins = isDailyLb
        ? Number(item.periodWins !== undefined ? item.periodWins : item.wins || 0)
        : (isItemToday ? Number(item.dailyWins ?? item.todayWins ?? 0) : (existingIsToday ? Number(existing.dailyWins || 0) : statsDailyW));

      const computedGp = calculateGamePower(plays, wins);
      const gp = computedGp;
      const streak = Math.max(Number(item.streak ?? 0), Number(existing.streak ?? 0));
      const vp = Math.max(Number(item.valuePoints ?? item.vp ?? 0), Number(existing.vp ?? 0));

      const weeklyPlays = Math.max(Number(item.weeklyPlays ?? 0), Number(existing.weeklyPlays ?? 0));
      const weeklyWins = Math.max(Number(item.weeklyWins ?? 0), Number(existing.weeklyWins ?? 0));
      const monthlyPlays = Math.max(Number(item.monthlyPlays ?? 0), Number(existing.monthlyPlays ?? 0));
      const monthlyWins = Math.max(Number(item.monthlyWins ?? 0), Number(existing.monthlyWins ?? 0));
      const yearlyPlays = Math.max(Number(item.yearlyPlays ?? plays), Number(existing.yearlyPlays ?? plays));
      const yearlyWins = Math.max(Number(item.yearlyWins ?? wins), Number(existing.yearlyWins ?? wins));

      map.set(uid, {
        uid,
        id: uid,
        displayName: rawDisplayName,
        name: rawDisplayName,
        username: rawUsername,
        avatar,
        avatarUrl: avatar,
        plays,
        gamesPlayed: plays,
        careerPlays: plays,
        wins,
        careerWins: wins,
        dailyPlays,
        dailyWins,
        weeklyPlays,
        weeklyWins,
        monthlyPlays,
        monthlyWins,
        yearlyPlays,
        yearlyWins,
        lastPlayedDate: item.lastPlayedDate || existing.lastPlayedDate || (dailyPlays > 0 ? todayStr : null),
        lastPlayedWeek: item.lastPlayedWeek || existing.lastPlayedWeek || null,
        lastPlayedMonth: item.lastPlayedMonth || existing.lastPlayedMonth || null,
        lastPlayedYear: item.lastPlayedYear || existing.lastPlayedYear || null,
        gameStats,
        gp,
        vp,
        valuePoints: vp,
        streak,
        phone: item.phone || item.phoneNumber || item.phone_number || existing.phone || null,
      });
    };

    // 1. Add results from server: search probes, daily & yearly leaderboards, and referrals
    for (let i = 0; i < results.length - 1; i++) {
      const r = results[i];
      if (r.status === 'fulfilled') {
        const isDaily = i === 2;
        extractArray(r.value).forEach((entry) => addEntry(entry, isDaily));
      }
    }

    // 2. Extract tournament creators if present
    const tourRes = results[results.length - 1];
    if (tourRes.status === 'fulfilled') {
      const tList = Array.isArray(tourRes.value)
        ? tourRes.value
        : tourRes.value?.tournaments || tourRes.value?.data?.tournaments || [];
      tList.forEach((t) => {
        if (t?.createdBy && t?.creatorName) {
          addEntry({ uid: t.createdBy, displayName: t.creatorName, username: t.creatorName }, false);
        }
      });
    }

    const allList = Array.from(map.values())
      .filter((u) => !deletedSet.has(u.uid) && !deletedSet.has(u.id))
      .sort(
        (a, b) => (b.gp - a.gp) || (b.plays - a.plays) || String(a.displayName).localeCompare(String(b.displayName))
      );

    if (allList.length > 0) {
      memoryPlayersCache = allList;
      lastFetchTimestamp = Date.now();
    }

    return allList;
  })();

  try {
    const finalAll = await inflightPromise;
    if (excludeUid) {
      return finalAll.filter((u) => u.uid !== excludeUid);
    }
    return finalAll;
  } finally {
    inflightPromise = null;
  }
}
