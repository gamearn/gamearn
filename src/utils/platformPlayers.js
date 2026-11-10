import AsyncStorage from '@react-native-async-storage/async-storage';
import { referral, leaderboard, tournaments } from '../services/api';

const COMMUNITY_CACHE_KEY = '@gamearn_community_users_cache';

let memoryPlayersCache = [];
let lastFetchTimestamp = 0;
let inflightPromise = null;
const CACHE_TTL_MS = 15000; // 15s deduplication window to prevent 429 rate-limit bursts

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
    const careerPlays = Math.max(
      Number(profile.gamesPlayed ?? profile.plays ?? 0),
      Number(prev.careerPlays ?? prev.gamesPlayed ?? prev.plays ?? 0)
    );
    const careerWins = Math.max(
      Number(profile.wins ?? profile.gamesWon ?? 0),
      Number(prev.careerWins ?? prev.wins ?? 0)
    );
    const gp = Math.max(
      Number(profile.gp ?? profile.gamePower ?? 0),
      Number(prev.gp ?? 0)
    );
    const streak = Math.max(
      Number(profile.streak ?? profile.currentStreak ?? 0),
      Number(prev.streak ?? 0)
    );

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
      gp,
      streak,
      phone: profile.phone || profile.phoneNumber || prev.phone || null,
      referralCode: profile.referralCode || username,
    });

    const updated = Array.from(map.values());
    memoryPlayersCache = updated;
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

    // Keep network probes small (4 targeted calls) so we never trigger the 100 req/min IP rate limiter.
    // '' and '+234' match 100% of registered accounts in `users` (all Nigerian/E.164 phone numbers start with +234).
    const requests = [
      referral.searchUsers(''),
      referral.searchUsers('+234'),
      referral.searchUsers('234'),
      leaderboard.get('Yearly'),
      referral.me(),
      tournaments.list(),
    ];

    const results = await Promise.allSettled(requests);
    const map = new Map();

    const addEntry = (item) => {
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

      const plays = Math.max(
        Number(item.careerPlays ?? item.gamesPlayed ?? item.games_played ?? item.plays ?? 0),
        Number(existing.careerPlays ?? existing.gamesPlayed ?? existing.plays ?? 0)
      );
      const wins = Math.max(
        Number(item.careerWins ?? item.wins ?? item.gamesWon ?? 0),
        Number(existing.careerWins ?? existing.wins ?? 0)
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
        gp,
        streak,
        phone: item.phone || item.phoneNumber || item.phone_number || existing.phone || null,
      });
    };

    // 1. Seed with previously cached community players
    cached.forEach(addEntry);

    // 2. Add results from search probes, yearly leaderboard, and referrals
    for (let i = 0; i < results.length - 1; i++) {
      const r = results[i];
      if (r.status === 'fulfilled') {
        extractArray(r.value).forEach(addEntry);
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
          addEntry({ uid: t.createdBy, displayName: t.creatorName, username: t.creatorName });
        }
      });
    }

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
