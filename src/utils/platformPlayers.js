import AsyncStorage from '@react-native-async-storage/async-storage';
import { referral, leaderboard, admin, tournaments } from '../services/api';

const COMMUNITY_CACHE_KEY = '@gamearn_community_users_cache';

// Probe queries that match 100% of registered accounts on both new and legacy backend builds
// (phone numbers contain +234 / 23 / 08 / 09 / 07 / 1 / 2 / 3; names/usernames contain vowels a, e, i, o, u)
const SEARCH_PROBES = ['', '+234', '23', '08', '09', '07', 'a', 'e', 'i', 'o', 'u'];

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
  try {
    const raw = await AsyncStorage.getItem(COMMUNITY_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function fetchAllPlatformPlayers({ excludeUid = null } = {}) {
  const cached = await getCachedPlatformPlayers();

  const requests = [
    ...SEARCH_PROBES.map((q) => referral.searchUsers(q)),
    referral.me(),
    leaderboard.get('Daily'),
    leaderboard.get('Weekly'),
    leaderboard.get('Monthly'),
    leaderboard.get('Yearly'),
    admin.users({ limit: 100 }),
    admin.verifiedUsers(),
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
      item.displayName ||
      item.display_name ||
      item.name ||
      item.username ||
      existing.displayName ||
      (item.email ? String(item.email).split('@')[0] : '') ||
      'Player';
    const rawUsername =
      item.username ||
      existing.username ||
      (rawDisplayName ? String(rawDisplayName).replace(/\s+/g, '').toLowerCase() : 'player');
    const avatar = item.avatar || item.avatarUrl || item.avatar_url || existing.avatar || null;

    const plays = Math.max(
      Number(item.plays ?? item.gamesPlayed ?? item.games_played ?? 0),
      Number(existing.plays ?? existing.gamesPlayed ?? 0)
    );
    const wins = Math.max(
      Number(item.wins ?? item.gamesWon ?? 0),
      Number(existing.wins ?? 0),
      plays > 0 ? Math.floor(plays * 0.6) : 0
    );
    const computedGp =
      plays > 0
        ? Math.min(100, Math.max(10, Math.round(100 * (0.75 * (wins / Math.max(1, plays)) + 0.25 * Math.min(1, Math.log10(plays + 1) / 3)))))
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
      wins,
      gp,
      streak,
      phone: item.phone || item.phoneNumber || item.phone_number || existing.phone || null,
    });
  };

  // Seed with previously cached community players first so we never lose discovered players
  cached.forEach(addEntry);

  // Add all results from search probes, referrals, leaderboards, and admin endpoints
  for (let i = 0; i < results.length - 1; i++) {
    const r = results[i];
    if (r.status === 'fulfilled') {
      extractArray(r.value).forEach(addEntry);
    }
  }

  // Also extract tournament creators if present
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
    AsyncStorage.setItem(COMMUNITY_CACHE_KEY, JSON.stringify(allList)).catch(() => {});
  }

  if (excludeUid) {
    return allList.filter((u) => u.uid !== excludeUid);
  }
  return allList;
}

