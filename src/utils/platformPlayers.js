import AsyncStorage from '@react-native-async-storage/async-storage';
import { referral, leaderboard, tournaments } from '../services/api';

const COMMUNITY_CACHE_KEY = '@gamearn_community_users_cache';

let memoryPlayersCache = [];
let lastFetchTimestamp = 0;
let inflightPromise = null;
const CACHE_TTL_MS = 10000;

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
  if (memoryPlayersCache.length > 0) {
    return memoryPlayersCache;
  }
  try {
    const raw = await AsyncStorage.getItem(COMMUNITY_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      memoryPlayersCache = parsed;
      return parsed;
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

  try {
    const existingList = await getCachedPlatformPlayers();
    const map = new Map();
    existingList.forEach((p) => {
      if (p && (p.uid || p.id)) map.set(p.uid || p.id, p);
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
    const lastPlayedDate = profile.lastPlayedDate || profile.lastDailyPlayDate || prev.lastPlayedDate || null;
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
      lastPlayedDate,
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
      if (!uid) return;

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
        lastPlayedDate: item.lastPlayedDate || existing.lastPlayedDate || (dailyPlays > 0 ? todayStr : null),
        gameStats,
        gp,
        vp,
        valuePoints: vp,
        streak,
        phone: item.phone || item.phoneNumber || item.phone_number || existing.phone || null,
      });
    };

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

    // 4. Merge any locally stored per-user profiles & gameStats on this device so multi-account testing is 100% instant
    try {
      const uids = Array.from(map.keys());
      const localReads = await Promise.all(
        uids.map(async (u) => {
          const [pRaw, gsRaw] = await Promise.all([
            AsyncStorage.getItem(`@gamearn_profile_${u}`),
            AsyncStorage.getItem(`@gamearn_gamestats_${u}`),
          ]);
          return { u, p: pRaw ? JSON.parse(pRaw) : null, gs: gsRaw ? JSON.parse(gsRaw) : null };
        })
      );
      for (const { u, p, gs } of localReads) {
        if (p || gs) {
          addEntry({ ...(p || {}), uid: u, gameStats: mergeGameStatsObj(p?.gameStats, gs) }, false);
        }
      }
    } catch {}

    const allList = Array.from(map.values()).sort(
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
