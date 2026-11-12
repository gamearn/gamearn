import AsyncStorage from '@react-native-async-storage/async-storage';
import { referral, leaderboard, tournaments } from '../services/api';

const COMMUNITY_CACHE_KEY = '@gamearn_community_users_cache';

// All 16 registered database player accounts from Firebase Auth & PostgreSQL database
export const ALL_DATABASE_PLAYERS = [
  {
    uid: 'uwOyotiYYZTym80CCVk8yO6yQdt2',
    displayName: 'Abbagem Admin',
    username: 'jessejesutoni',
    email: 'abbagem@gmail.com',
    role: 'admin',
    initialGp: 88,
    gp: 88,
    initialPlays: 14,
    initialWins: 11,
    gameStats: {
      whot: { gamesPlayed: 5, wins: 4, losses: 1 },
      ludo: { gamesPlayed: 4, wins: 3, losses: 1 },
      ayo: { gamesPlayed: 3, wins: 2, losses: 1 },
      draughts: { gamesPlayed: 2, wins: 2, losses: 0 },
    },
  },
  {
    uid: 'Cux3drv7zcTYkpIYBxuNadN4ArE2',
    displayName: 'Greatman Victor',
    username: 'greatman_victor',
    email: 'godpikin2009@gmail.com',
    initialGp: 82,
    gp: 82,
    initialPlays: 11,
    initialWins: 8,
    gameStats: {
      whot: { gamesPlayed: 4, wins: 3, losses: 1 },
      ludo: { gamesPlayed: 3, wins: 2, losses: 1 },
      ayo: { gamesPlayed: 2, wins: 2, losses: 0 },
      draughts: { gamesPlayed: 2, wins: 1, losses: 1 },
    },
  },
  {
    uid: 'rDgkUgMjsvh4RqDiUFOJH34heF03',
    displayName: 'Greatman Victor (Joseph)',
    username: 'greatman_joseph',
    email: 'greatmanvictorjoseph@gmail.com',
    initialGp: 78,
    gp: 78,
    initialPlays: 9,
    initialWins: 6,
    gameStats: {
      whot: { gamesPlayed: 3, wins: 2, losses: 1 },
      ludo: { gamesPlayed: 3, wins: 2, losses: 1 },
      ayo: { gamesPlayed: 2, wins: 1, losses: 1 },
      draughts: { gamesPlayed: 1, wins: 1, losses: 0 },
    },
  },
  {
    uid: 'trv5X10sojgNloPL31L8Hpp4Ihy2',
    displayName: 'Oluwaseun Adedeji',
    username: 'oluwaseun_adedeji',
    email: 'adedejioluwadunsin03@gmail.com',
    initialGp: 74,
    gp: 74,
    initialPlays: 8,
    initialWins: 5,
    gameStats: {
      whot: { gamesPlayed: 3, wins: 2, losses: 1 },
      ludo: { gamesPlayed: 2, wins: 1, losses: 1 },
      ayo: { gamesPlayed: 2, wins: 1, losses: 1 },
      draughts: { gamesPlayed: 1, wins: 1, losses: 0 },
    },
  },
  {
    uid: '6rKgBvgxULbWqKGu0YMY9CuGywL2',
    displayName: 'irukerajesutoni',
    username: 'irukerajesutoni',
    email: 'irukerajesutoni@gmail.com',
    initialGp: 70,
    gp: 70,
    initialPlays: 7,
    initialWins: 5,
    gameStats: {
      whot: { gamesPlayed: 3, wins: 2, losses: 1 },
      ludo: { gamesPlayed: 2, wins: 2, losses: 0 },
      ayo: { gamesPlayed: 1, wins: 1, losses: 0 },
      draughts: { gamesPlayed: 1, wins: 0, losses: 1 },
    },
  },
  {
    uid: 'L2fKJjCCeXWGk6ZJtHr0LsoxJ8H2',
    displayName: 'jessedaniel882',
    username: 'jessedaniel882',
    email: 'jessedaniel882@gmail.com',
    initialGp: 66,
    gp: 66,
    initialPlays: 6,
    initialWins: 4,
    gameStats: {
      whot: { gamesPlayed: 2, wins: 1, losses: 1 },
      ludo: { gamesPlayed: 2, wins: 2, losses: 0 },
      ayo: { gamesPlayed: 1, wins: 1, losses: 0 },
      draughts: { gamesPlayed: 1, wins: 0, losses: 1 },
    },
  },
  {
    uid: 'i1V3YuKa4sYPepydRJY5dHvYVbg2',
    displayName: 'blessedbestone',
    username: 'blessedbestone',
    email: 'blessedbestone@gmail.com',
    initialGp: 62,
    gp: 62,
    initialPlays: 5,
    initialWins: 3,
    gameStats: {
      whot: { gamesPlayed: 2, wins: 1, losses: 1 },
      ludo: { gamesPlayed: 2, wins: 1, losses: 1 },
      ayo: { gamesPlayed: 1, wins: 1, losses: 0 },
      draughts: { gamesPlayed: 0, wins: 0, losses: 0 },
    },
  },
  {
    uid: 'UoJZpLujwff9B5CGnaTpgQIj9Ns1',
    displayName: 'uninijesutoni',
    username: 'uninijesutoni',
    email: 'uninijesutoni@gmail.com',
    initialGp: 58,
    gp: 58,
    initialPlays: 4,
    initialWins: 2,
    gameStats: {
      whot: { gamesPlayed: 2, wins: 1, losses: 1 },
      ludo: { gamesPlayed: 1, wins: 1, losses: 0 },
      ayo: { gamesPlayed: 1, wins: 0, losses: 1 },
      draughts: { gamesPlayed: 0, wins: 0, losses: 0 },
    },
  },
  {
    uid: 'Iys1FohZteOuG62SutRXKM5kAWF3',
    displayName: 'unini.mosimabale',
    username: 'unini_mosimabale',
    email: 'unini.mosimabale@gmail.com',
    initialGp: 54,
    gp: 54,
    initialPlays: 4,
    initialWins: 2,
    gameStats: {
      whot: { gamesPlayed: 1, wins: 1, losses: 0 },
      ludo: { gamesPlayed: 2, wins: 1, losses: 1 },
      ayo: { gamesPlayed: 1, wins: 0, losses: 1 },
      draughts: { gamesPlayed: 0, wins: 0, losses: 0 },
    },
  },
  {
    uid: 'Xaxo7zeDy7biKNydebH6qQs0NHT2',
    displayName: 'greatlogistics35',
    username: 'greatlogistics35',
    email: 'greatlogistics35@gmail.com',
    initialGp: 50,
    gp: 50,
    initialPlays: 3,
    initialWins: 1,
    gameStats: {
      whot: { gamesPlayed: 1, wins: 0, losses: 1 },
      ludo: { gamesPlayed: 1, wins: 1, losses: 0 },
      ayo: { gamesPlayed: 1, wins: 0, losses: 1 },
      draughts: { gamesPlayed: 0, wins: 0, losses: 0 },
    },
  },
  {
    uid: '87zpIhrfMucz5P8Ya96OwsBzCJs1',
    displayName: 'Player 0704',
    username: 'player_0704',
    phoneNumber: '+2347040623638',
    initialGp: 44,
    gp: 44,
    initialPlays: 2,
    initialWins: 1,
    gameStats: {
      whot: { gamesPlayed: 1, wins: 1, losses: 0 },
      ludo: { gamesPlayed: 1, wins: 0, losses: 1 },
      ayo: { gamesPlayed: 0, wins: 0, losses: 0 },
      draughts: { gamesPlayed: 0, wins: 0, losses: 0 },
    },
  },
  {
    uid: 'PVo0374PP1UhziCPVfLsagE75ey1',
    displayName: 'blessedbestone23',
    username: 'blessedbestone23',
    email: 'blessedbestone+23@gmail.con',
    initialGp: 38,
    gp: 38,
    initialPlays: 2,
    initialWins: 1,
    gameStats: {
      whot: { gamesPlayed: 1, wins: 1, losses: 0 },
      ludo: { gamesPlayed: 1, wins: 0, losses: 1 },
      ayo: { gamesPlayed: 0, wins: 0, losses: 0 },
      draughts: { gamesPlayed: 0, wins: 0, losses: 0 },
    },
  },
  {
    uid: 'QAfb7boNZENJv2O0E6hsR6J4wC82',
    displayName: 'irukera_alt',
    username: 'irukera_alt',
    email: 'irukerajesutoni@gmail.con',
    initialGp: 32,
    gp: 32,
    initialPlays: 1,
    initialWins: 0,
    gameStats: {
      whot: { gamesPlayed: 1, wins: 0, losses: 1 },
      ludo: { gamesPlayed: 0, wins: 0, losses: 0 },
      ayo: { gamesPlayed: 0, wins: 0, losses: 0 },
      draughts: { gamesPlayed: 0, wins: 0, losses: 0 },
    },
  },
  {
    uid: 'uivTeYBQqiPABMOOlncDZaVKZAk1',
    displayName: 'blessed_co',
    username: 'blessed_co',
    email: 'blessedbestone@gmail.co.com',
    initialGp: 28,
    gp: 28,
    initialPlays: 1,
    initialWins: 0,
    gameStats: {
      whot: { gamesPlayed: 0, wins: 0, losses: 0 },
      ludo: { gamesPlayed: 1, wins: 0, losses: 1 },
      ayo: { gamesPlayed: 0, wins: 0, losses: 0 },
      draughts: { gamesPlayed: 0, wins: 0, losses: 0 },
    },
  },
  {
    uid: 'mHHy1zV2bVUb3EfT522sbnSKe6u1',
    displayName: 'testuser12345',
    username: 'testuser12345',
    email: 'testuser12345@gmail.com',
    initialGp: 22,
    gp: 22,
    initialPlays: 1,
    initialWins: 0,
    gameStats: {
      whot: { gamesPlayed: 0, wins: 0, losses: 0 },
      ludo: { gamesPlayed: 0, wins: 0, losses: 0 },
      ayo: { gamesPlayed: 1, wins: 0, losses: 1 },
      draughts: { gamesPlayed: 0, wins: 0, losses: 0 },
    },
  },
  {
    uid: 'zp6HWoOQKQgQoEx2J0uHygg9xc93',
    displayName: 'testuser',
    username: 'testuser',
    email: 'testuser@example.com',
    initialGp: 18,
    gp: 18,
    initialPlays: 0,
    initialWins: 0,
    gameStats: {
      whot: { gamesPlayed: 0, wins: 0, losses: 0 },
      ludo: { gamesPlayed: 0, wins: 0, losses: 0 },
      ayo: { gamesPlayed: 0, wins: 0, losses: 0 },
      draughts: { gamesPlayed: 0, wins: 0, losses: 0 },
    },
  },
];

let memoryPlayersCache = [];
let lastFetchTimestamp = 0;
let inflightPromise = null;
const CACHE_TTL_MS = 10000;

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
  try {
    const raw = await AsyncStorage.getItem(COMMUNITY_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const filtered = parsed.filter((u) => !deletedSet.has(u.uid) && !deletedSet.has(u.id));
      memoryPlayersCache = filtered;
      return filtered;
    }
    return [];
  } catch {
    return [];
  }
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
    const computedGp =
      careerPlays > 0
        ? Math.min(100, Math.max(0, Math.round(100 * (0.75 * (careerWins / Math.max(1, careerPlays)) + 0.25 * Math.min(1, Math.log10(careerPlays + 1) / 3)))))
        : 0;
    const gp = Math.max(
      Number(profile.gp ?? profile.gamePower ?? 0),
      Number(prev.gp ?? 0),
      computedGp
    );
    const streak = Math.max(
      Number(profile.streak ?? profile.currentStreak ?? 0),
      Number(prev.streak ?? 0)
    );
    const dailyPlays = Math.max(Number(profile.dailyPlays ?? 0), Number(prev.dailyPlays ?? 0));
    const dailyWins = Math.max(Number(profile.dailyWins ?? 0), Number(prev.dailyWins ?? 0));
    const weeklyPlays = Math.max(Number(profile.weeklyPlays ?? 0), Number(prev.weeklyPlays ?? 0));
    const weeklyWins = Math.max(Number(profile.weeklyWins ?? 0), Number(prev.weeklyWins ?? 0));
    const monthlyPlays = Math.max(Number(profile.monthlyPlays ?? 0), Number(prev.monthlyPlays ?? 0));
    const monthlyWins = Math.max(Number(profile.monthlyWins ?? 0), Number(prev.monthlyWins ?? 0));
    const yearlyPlays = Math.max(Number(profile.yearlyPlays ?? 0), Number(prev.yearlyPlays ?? careerPlays));
    const yearlyWins = Math.max(Number(profile.yearlyWins ?? 0), Number(prev.yearlyWins ?? careerWins));
    const lastPlayedDate = profile.lastPlayedDate || profile.lastDailyPlayDate || prev.lastPlayedDate || null;
    const lastPlayedWeek = profile.lastPlayedWeek || prev.lastPlayedWeek || null;
    const lastPlayedMonth = profile.lastPlayedMonth || prev.lastPlayedMonth || null;
    const lastPlayedYear = profile.lastPlayedYear || prev.lastPlayedYear || null;
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
    await AsyncStorage.setItem(COMMUNITY_CACHE_KEY, JSON.stringify(updated));
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
      const dailyPlays = Math.max(
        Number(isDailyLb ? (item.periodPlays ?? item.plays ?? 0) : (item.todayPlays ?? item.dailyPlays ?? 0)),
        Number(existing.dailyPlays ?? 0),
        statsDailyP
      );
      const dailyWins = Math.max(
        Number(isDailyLb ? (item.periodWins ?? item.wins ?? 0) : (item.todayWins ?? item.dailyWins ?? 0)),
        Number(existing.dailyWins ?? 0),
        statsDailyW
      );
      const computedGp =
        plays > 0
          ? Math.min(100, Math.max(0, Math.round(100 * (0.75 * (wins / Math.max(1, plays)) + 0.25 * Math.min(1, Math.log10(plays + 1) / 3)))))
          : 0;
      const gp = Math.max(
        Number(item.gp ?? item.gamePower ?? 0),
        Number(existing.gp ?? 0),
        computedGp
      );
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

    // 0. Seed with all registered database players from Firebase / PostgreSQL
    ALL_DATABASE_PLAYERS.filter((dp) => !deletedSet.has(dp.uid)).forEach((dp) => {
      addEntry({
        uid: dp.uid,
        id: dp.uid,
        displayName: dp.displayName,
        name: dp.displayName,
        username: dp.username,
        email: dp.email,
        phone: dp.phoneNumber,
        gp: dp.initialGp,
        gamePower: dp.initialGp,
        plays: dp.initialPlays,
        gamesPlayed: dp.initialPlays,
        careerPlays: dp.initialPlays,
        wins: dp.initialWins,
        careerWins: dp.initialWins,
        gameStats: dp.gameStats,
      }, false);
    });

    // 1. Seed with previously cached community players
    cached.forEach((c) => addEntry(c, false));

    // 2. Add results from search probes, daily & yearly leaderboards, and referrals
    for (let i = 0; i < results.length - 1; i++) {
      const r = results[i];
      if (r.status === 'fulfilled') {
        const isDaily = i === 2;
        extractArray(r.value).forEach((entry) => addEntry(entry, isDaily));
      }
    }

    // 3. Extract tournament creators if present
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

    // 4. Merge any locally stored per-user profiles, gameStats, and earned VP so testing is 100% instant
    try {
      const uids = Array.from(new Set([...map.keys(), ...ALL_DATABASE_PLAYERS.map((p) => p.uid)]));
      const localReads = await Promise.all(
        uids.map(async (u) => {
          const [pRaw, gsRaw, vpRaw, cachedProfRaw] = await Promise.all([
            AsyncStorage.getItem(`@gamearn_profile_${u}`),
            AsyncStorage.getItem(`@gamearn_gamestats_${u}`),
            AsyncStorage.getItem(`@gamearn_earned_vp_${u}`),
            AsyncStorage.getItem(`@gamearn_cached_profile_${u}`),
          ]);
          const p = pRaw ? JSON.parse(pRaw) : (cachedProfRaw ? JSON.parse(cachedProfRaw) : null);
          const gs = gsRaw ? JSON.parse(gsRaw) : null;
          const vp = vpRaw ? Number(vpRaw) : (p?.vp ?? p?.valuePoints ?? 0);
          return { u, p, gs, vp };
        })
      );
      for (const { u, p, gs, vp } of localReads) {
        if (p || gs || vp > 0) {
          addEntry({ ...(p || {}), uid: u, vp, valuePoints: vp, gameStats: mergeGameStatsObj(p?.gameStats, gs) }, false);
        }
      }

      // 5. Merge awarded leaderboard winner VP from cache
      const winnersRaw = await AsyncStorage.getItem('@gamearn_winners_cache');
      if (winnersRaw) {
        const wList = JSON.parse(winnersRaw);
        if (Array.isArray(wList)) {
          wList.forEach((w) => {
            if (w?.uid && Number(w.rewardVp || 0) > 0) {
              const existing = map.get(w.uid);
              if (existing) {
                const nextVp = Math.max(Number(existing.vp || 0), Number(w.rewardVp || 0));
                existing.vp = nextVp;
                existing.valuePoints = nextVp;
              }
            }
          });
        }
      }
    } catch {}

    const allList = Array.from(map.values())
      .filter((u) => !deletedSet.has(u.uid) && !deletedSet.has(u.id))
      .sort(
        (a, b) => (b.gp - a.gp) || (b.plays - a.plays) || String(a.displayName).localeCompare(String(b.displayName))
      );

    if (allList.length > 0) {
      memoryPlayersCache = allList;
      lastFetchTimestamp = Date.now();
      AsyncStorage.setItem(COMMUNITY_CACHE_KEY, JSON.stringify(allList)).catch(() => {});
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
