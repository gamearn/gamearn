// Typed endpoint library for the Gamearn backend.
// Contracts derived from Backend_manager routes/validators/services.
// Money: wallet/pay amounts are NAIRA (floats); entry fees/transactions kobo.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet, apiPatch, apiPost, apiDelete, ApiError } from './apiClient';
import { getIdToken } from './firebase';

const DELETED_TOURNAMENTS_STORAGE_KEY = '@gamearn_deleted_tournament_ids';
const deletedTournamentIdsMem = new Set();
let deletedTournamentIdsLoaded = false;

async function getDeletedTournamentIds() {
  if (!deletedTournamentIdsLoaded) {
    try {
      const raw = await AsyncStorage.getItem(DELETED_TOURNAMENTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((id) => deletedTournamentIdsMem.add(String(id)));
        }
      }
    } catch {
      // ignore storage read error
    }
    deletedTournamentIdsLoaded = true;
  }
  return deletedTournamentIdsMem;
}

async function markTournamentDeletedLocally(id) {
  if (!id) return;
  const set = await getDeletedTournamentIds();
  set.add(String(id));
  try {
    await AsyncStorage.setItem(DELETED_TOURNAMENTS_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore storage write error
  }
}

async function filterDeletedTournaments(res) {
  const deletedSet = await getDeletedTournamentIds();
  if (!deletedSet.size || !res) return res;
  if (Array.isArray(res)) {
    return res.filter((t) => !deletedSet.has(String(t?.id)));
  }
  if (Array.isArray(res.tournaments)) {
    const filtered = res.tournaments.filter((t) => !deletedSet.has(String(t?.id)));
    return { ...res, count: filtered.length, tournaments: filtered };
  }
  if (Array.isArray(res.data)) {
    return { ...res, data: res.data.filter((t) => !deletedSet.has(String(t?.id))) };
  }
  if (res.data && Array.isArray(res.data.tournaments)) {
    const filtered = res.data.tournaments.filter((t) => !deletedSet.has(String(t?.id)));
    return { ...res, data: { ...res.data, count: filtered.length, tournaments: filtered } };
  }
  return res;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const auth = {
  requestSignupEmailOtp: async (email) => {
    const idToken = await getIdToken(false);
    if (!idToken) throw new ApiError({ code: 'AUTH_MISSING', message: 'Not signed in.' });
    return apiPost('/auth/signup/email-otp/request', { idToken, email }, { auth: false });
  },

  verifySignupEmailOtp: async (email, code) => {
    const idToken = await getIdToken(false);
    if (!idToken) throw new ApiError({ code: 'AUTH_MISSING', message: 'Not signed in.' });
    return apiPost('/auth/signup/email-otp/verify', { idToken, email, code }, { auth: false });
  },

  register: async ({ phoneNumber, displayName, fullName, referralCode }) => {
    const idToken = await getIdToken(false);
    if (!idToken) throw new ApiError({ code: 'AUTH_MISSING', message: 'Not signed in.' });
    return apiPost(
      '/auth/register',
      {
        phoneNumber,
        displayName,
        fullName: fullName || displayName,
        idToken,
        referralCode: referralCode || undefined,
      },
      { auth: false },
    );
  },

  login: async ({ fcmToken } = {}) => {
    const idToken = await getIdToken(false);
    if (!idToken) throw new ApiError({ code: 'AUTH_MISSING', message: 'Not signed in.' });
    return apiPost('/auth/login', { idToken, fcmToken: fcmToken || undefined }, { auth: false });
  },

  me: () => apiGet('/auth/me'),

  updateProfile: (patch) => apiPatch('/auth/profile', patch),

  deleteAccount: (confirmation) => apiPost('/auth/delete-account', { confirmation }),

  mfaStatus: () => apiGet('/auth/mfa/status'),

  mfaEnroll: (factor, value) => apiPost('/auth/mfa/enroll', { factor, ...(value ? { value } : {}) }),

  mfaVerify: (payload) => apiPost('/auth/mfa/verify', payload),

  mfaDisable: () => apiPost('/auth/mfa/disable', {}),
  deleteAccount: () => apiPost('/auth/delete-account', { confirmation: 'DELETE' }),
};

// ── Wallet & payments ─────────────────────────────────────────────────────────

export const wallet = {
  get: () => apiGet('/wallet/'),

  topup: ({ amount, paymentMethod = 'card' }) =>
    apiPost('/pay/initiate', { amount, currency: 'NGN', paymentMethod }),

  withdraw: ({ amount, accountNumber, bankCode, accountName }) =>
    // Withdrawals require a fresh sign-in token (backend requireFreshAuth).
    apiPost('/wallet/withdraw', { amount, accountNumber, bankCode, accountName }, { auth: { forceRefresh: true } }),

  transactions: ({ type, status, page = 1, limit = 20 } = {}) => {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (type) qs.set('type', type);
    if (status) qs.set('status', status);
    return apiGet(`/wallet/transactions?${qs.toString()}`);
  },

  verify: (txRef) => apiGet(`/pay/verify/${txRef}`),

  banks: async () => {
    const res = await apiGet('/pay/banks');
    return Array.isArray(res) ? res : res?.data || [];
  },

  // Claim the daily/in-game bonus Value Point grant. Idempotent per claim per
  // UTC day — duplicate claims are no-ops.
  freeValuePoints: (claim = 'daily-bonus') => apiPost('/wallet/free-points', { claim }),

  // Trigger email & push/in-app notification for reaching 10+ VP withdrawal milestone
  notifyVpMilestone: () => apiPost('/wallet/notify-vp-milestone', {}),
};

// ── Notifications (In-App Notification History) ───────────────────────────────

export const notifications = {
  list: async (limit = 50) => {
    const res = await apiGet(`/notifications?limit=${limit}`);
    return res?.notifications || res?.data?.notifications || (Array.isArray(res) ? res : []);
  },
  markRead: (notificationId = null) =>
    apiPost('/notifications/mark-read', notificationId ? { notificationId } : {}),
  delete: async (notificationId) => {
    if (!notificationId) return null;
    try {
      return await apiDelete(`/notifications/${encodeURIComponent(String(notificationId))}`);
    } catch {
      return await apiPost('/notifications/delete', { notificationId }).catch(() => null);
    }
  },
};

// ── Premium ───────────────────────────────────────────────────────────────────

export const premium = {
  plans: () => apiGet('/premium/plans'),
  status: () => apiGet('/premium/status'),
  initiate: ({ plan, paymentMethod = 'card' }) =>
    apiPost('/premium/initiate', { plan, paymentMethod }),
  verify: (txRef) => apiPost(`/premium/verify/${txRef}`, {}),
};

// ── Referral ──────────────────────────────────────────────────────────────────

export const referral = {
  me: () => apiGet('/referral/me'),
  apply: async (referralCode) => {
    try {
      return await apiPost('/referral/apply', { referralCode });
    } catch {
      return await apiPatch('/auth/profile', { referralCode }).catch(() => null);
    }
  },
  // Search registered users by username or display name across the app
  searchUsers: (query) => apiGet(`/referral/search?q=${encodeURIComponent(query || '')}`),
  // Sends real referral pings: { refereeUids: string[], type: 'streak' | 'challenge' | 'tournament' }.
  ping: ({ refereeUids = [], type = 'streak', tournamentId, tournamentName } = {}) =>
    apiPost('/referral/ping', {
      refereeUids,
      type,
      ...(tournamentId ? { tournamentId } : {}),
      ...(tournamentName ? { tournamentName } : {}),
    }),
};

// ── User settings ─────────────────────────────────────────────────────────────

export const settings = {
  get: () => apiGet('/settings/'),
  patch: (patch) => apiPatch('/settings/', patch),
};

// ── Content (help/support) ────────────────────────────────────────────────────

export const content = {
  help: async () => {
    const res = await apiGet('/content/help');
    return res?.sections || res?.data?.sections || [];
  },
};

// ── Matchmaking (REST queue) ──────────────────────────────────────────────────

export const matchmaking = {
  join: ({ gameType, entryFee, rated = true, playerCount = 2, options = {} }) =>
    apiPost('/matchmaking/join', { gameType, entryFee, rated, playerCount, options }),

  leave: (gameType) => apiPost('/matchmaking/leave', { gameType }),

  status: (gameType) =>
    apiGet(gameType ? `/matchmaking/status?gameType=${gameType}` : '/matchmaking/status'),
};

// ── Challenges (async, create now / accept later) ────────────────────────────

export const challenges = {
  // Create an open challenge. entryFeeKobo is in kobo (e.g. 10000 = N100).
  // No fee is deducted until the match actually starts (both players joined).
  create: ({ gameType, entryFeeKobo, options = {} }) =>
    apiPost('/challenges', { gameType, entryFeeKobo, options }),

  // Open challenges from other players (accept ready).
  list: (gameType) =>
    apiGet(gameType ? `/challenges?gameType=${gameType}` : '/challenges'),

  // Challenges I created or accepted — rejoin accepted rooms / cancel open ones.
  my: () => apiGet('/challenges/my'),

  accept: (id) => apiPost(`/challenges/${id}/accept`, {}),
  cancel: (id) => apiPost(`/challenges/${id}/cancel`, {}),
};

// ── Tournaments ───────────────────────────────────────────────────────────────

const CREATED_TOURNAMENTS_KEY = '@gamearn_created_tournaments';

export const tournaments = {
  create: async (body) => {
    const res = await apiPost('/tournaments', {
      name: body.name,
      gameType: body.gameType,
      duration: body.duration,
      tournamentType: body.tournamentType || 'win',
      maxPlayers: body.maxPlayers || 32,
      topWinners: body.topWinners || 3,
      entryFeeVp: body.entryFeeVp != null ? Number(body.entryFeeVp) : 0,
      committedVp: body.committedVp != null ? Number(body.committedVp) : 100,
    });
    try {
      const created = res?.data || res;
      if (created && created.id) {
        const raw = await AsyncStorage.getItem(CREATED_TOURNAMENTS_KEY);
        const list = raw ? JSON.parse(raw) : [];
        const arr = Array.isArray(list) ? list.filter((t) => String(t?.id) !== String(created.id)) : [];
        arr.unshift(created);
        await AsyncStorage.setItem(CREATED_TOURNAMENTS_KEY, JSON.stringify(arr.slice(0, 50)));
      }
    } catch {}
    return res;
  },

  list: async (gameType) => {
    let serverList = [];
    try {
      const res = await apiGet(gameType ? `/tournaments?gameType=${gameType}` : '/tournaments/');
      serverList = Array.isArray(res) ? res : (res?.tournaments || res?.data || []);
    } catch {}
    let localList = [];
    try {
      const raw = await AsyncStorage.getItem(CREATED_TOURNAMENTS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        localList = gameType && gameType !== 'all'
          ? parsed.filter((t) => !t?.gameType || t.gameType === gameType || t.gameType === 'all')
          : parsed;
      }
    } catch {}
    const byId = new Map();
    [...serverList, ...localList].forEach((item) => {
      if (item && item.id && !byId.has(String(item.id))) {
        byId.set(String(item.id), item);
      }
    });
    return filterDeletedTournaments(Array.from(byId.values()));
  },

  my: async () => {
    const res = await apiGet('/tournaments/my');
    return filterDeletedTournaments(res);
  },

  get: async (id) => {
    const deletedSet = await getDeletedTournamentIds();
    if (deletedSet.has(String(id))) {
      throw new ApiError({ code: 'NOT_FOUND', message: 'Tournament has been deleted.', statusCode: 404 });
    }
    try {
      return await apiGet(`/tournaments/${id}`);
    } catch (err) {
      try {
        const raw = await AsyncStorage.getItem(CREATED_TOURNAMENTS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        const match = Array.isArray(parsed) ? parsed.find((t) => String(t?.id) === String(id)) : null;
        if (match) return match;
      } catch {}
      throw err;
    }
  },

  standings: (id) => apiGet(`/tournaments/${id}/standings`),

  register: (id) => apiPost(`/tournaments/${id}/register`, {}),
};

// ── Leaderboard ───────────────────────────────────────────────────────────────

// The UI key for Draughts is "draft"; the backend enum is "draughts".
const GAME_TYPE_ALIASES = {
  draft: 'draughts',
  checkers: 'draughts',
  draught: 'draughts',
  draughts: 'draughts',
};

export const leaderboard = {
  get: async (period = 'Daily', gameType = null) => {
    const rawP = String(period || 'Daily').trim().toLowerCase();
    const normPeriod = rawP === 'weekly' ? 'Weekly' : rawP === 'monthly' ? 'Monthly' : rawP === 'yearly' ? 'Yearly' : 'Daily';
    const qs = new URLSearchParams({ period: normPeriod });
    const normalized = gameType ? GAME_TYPE_ALIASES[String(gameType).toLowerCase()] || gameType : null;
    if (normalized) qs.set('gameType', normalized);
    const res = await apiGet(`/leaderboard?${qs.toString()}`);
    return res?.data || res || [];
  },
  getWinners: async (period = null) => {
    try {
      const qs = period ? `?period=${encodeURIComponent(period)}` : '';
      const res = await apiGet(`/leaderboard/winners${qs}`, { auth: false }).catch(() => null);
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.winners)) return res.winners;
      return [];
    } catch {
      return [];
    }
  },
  recordCompletion: async (gameType, outcome = 'win', completionReason = 'normal', matchId = null) => {
    try {
      const normalized = gameType ? GAME_TYPE_ALIASES[String(gameType).toLowerCase()] || gameType : null;
      return await apiPost('/leaderboard/record-completion', {
        gameType: normalized,
        outcome,
        completionReason,
        matchId,
      });
    } catch {
      // Endpoint is optional depending on backend deployment version; fail silently
      return null;
    }
  },
};

// ── Admin ─────────────────────────────────────────────────────────────────────

export const admin = {
  stats: () => apiGet('/admin/stats'),
  rooms: (status) => apiGet(status ? `/admin/rooms?status=${status}` : '/admin/rooms'),
  verifiedUsers: () => apiGet('/admin/verified-users'),
  banUser: (uid, payload) => apiPost(`/admin/users/${uid}/ban`, payload),
  unbanUser: (uid, payload) => apiPost(`/admin/users/${uid}/unban`, payload),
  adjustWallet: (uid, payload) => apiPost(`/admin/wallets/${uid}/adjust`, payload),
  creditUser: (uid, amountNaira, reason) =>
    apiPost(`/admin/wallets/${uid}/adjust`, {
      type: 'credit',
      amountKobo: Math.round(Number(amountNaira || 0) * 100),
      reason: reason || 'Admin VP credit',
    }),

  // System + logs
  system: () => apiGet('/admin/system'),
  logs: ({ lines = 200, level = 'all', q, file = 'app' } = {}) => {
    const qs = new URLSearchParams({ lines: String(lines), level, file });
    if (q) qs.set('q', q);
    return apiGet(`/admin/logs?${qs.toString()}`);
  },

  // Settings + feature flags
  settings: () => apiGet('/admin/settings'),
  updateSettings: (settings) => apiPatch('/admin/settings', { settings }),

  // Leaderboard rewards & manual winners
  leaderboardRewards: () => apiGet('/admin/leaderboard-rewards'),
  updateLeaderboardRewards: (payload) => apiPatch('/admin/leaderboard-rewards', payload),
  leaderboardWinners: () => apiGet('/admin/leaderboard-winners'),
  assignLeaderboardWinner: (payload) => apiPost('/admin/leaderboard-winners', payload),
  deleteLeaderboardWinner: (id) => apiDelete(`/admin/leaderboard-winners/${id}`),

  // Users
  users: ({ page = 1, limit = 50, q, status = 'all' } = {}) => {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit), status });
    if (q) qs.set('q', q);
    return apiGet(`/admin/users?${qs.toString()}`);
  },
  user: (uid) => apiGet(`/admin/users/${uid}`),
  suspendUser: (uid, payload) => apiPost(`/admin/users/${uid}/suspend`, payload),
  unsuspendUser: (uid, payload) => apiPost(`/admin/users/${uid}/unsuspend`, payload),
  softDeleteUser: (uid, payload) => apiPost(`/admin/users/${uid}/delete`, payload),
  permanentDeleteUser: (uid) => apiDelete(`/admin/users/${encodeURIComponent(uid)}`),
  deleteUser: (uid) => apiDelete(`/admin/users/${encodeURIComponent(uid)}`),
  revokeSessions: (uid) => apiPost(`/admin/users/${uid}/revoke-sessions`, {}),
  updateClaims: (uid, claims) => apiPatch(`/admin/users/${uid}/claims`, claims),

  // Identity reconciliation
  identityMismatches: () => apiGet('/admin/identity-mismatches'),
  finalizeOrphanDelete: (uid) => apiPost(`/admin/identity-mismatches/${uid}/finalize-delete`, {}),
  purgeProfile: (uid) => apiPost(`/admin/identity-mismatches/${uid}/purge-profile`, {}),

  // Tournaments
  tournaments: async ({ q, status = 'all' } = {}) => {
    const qs = new URLSearchParams({ status });
    if (q) qs.set('q', q);
    const res = await apiGet(`/admin/tournaments?${qs.toString()}`);
    return filterDeletedTournaments(res);
  },
  deleteTournament: async (id) => {
    await markTournamentDeletedLocally(id);
    try {
      return await apiPost(`/admin/tournaments/${id}/delete`, {});
    } catch (err) {
      // If remote server hasn't deployed /admin/tournaments/:id/delete yet, keep local deletion authoritative
      if (err?.statusCode === 404 || err?.code === 'NOT_FOUND') {
        return { id, deleted: true };
      }
      throw err;
    }
  },
};

// ── Practice games ────────────────────────────────────────────────────────────

export const practice = {
  whot: {
    start: (opts = {}) =>
      apiPost('/practice/whot/start', {
        gameType: 'whot',
        playerRating: opts.playerRating || 1200,
        startCards: opts.startCards ?? opts.cardCount ?? opts.cards ?? 6,
        seats: opts.seats || 4,
        timer: opts.timer || '2m',
        nulled: opts.nulled,
        removed: opts.removed,
        specialCards: opts.specialCards,
      }),
    move: (sessionId, move) => apiPost('/practice/whot/move', { sessionId, move }),
    state: (sessionId) => apiGet(`/practice/whot/state/${sessionId}`),
  },

  ludo: {
    start: (opts = {}) =>
      apiPost('/practice/ludo/start', {
        gameType: 'ludo',
        playerRating: opts.playerRating || 1200,
        playerCount: opts.playerCount || 2,
        diceCount: 2,
        tokenCount: opts.tokenCount || 4,
        timer: opts.timer || '2m',
        dualHome: !!opts.dualHome,
      }),
    roll: (sessionId) => apiPost('/practice/ludo/roll', { sessionId }),
    move: (sessionId, pieceId, diceValue) =>
      apiPost('/practice/ludo/move', { sessionId, pieceId, diceValue }),
    state: (sessionId) => apiGet(`/practice/ludo/state/${sessionId}`),
  },

  ayo: {
    start: (opts = {}) =>
      apiPost('/practice/ayo/start', { playerRating: opts.playerRating || 1200, timer: opts.timer || '2m' }),
    move: (sessionId, pitIndex) => apiPost('/practice/ayo/move', { sessionId, pitIndex }),
    state: (sessionId) => apiGet(`/practice/ayo/state/${sessionId}`),
  },

  draughts: {
    start: (opts = {}) =>
      apiPost('/practice/draughts/start', {
        playerRating: opts.playerRating || 1200,
        playerColor: opts.playerColor,
        timer: opts.timer || '2m',
      }),
    move: (sessionId, move) => apiPost('/practice/draughts/move', { sessionId, ...move }),
    state: (sessionId) => apiGet(`/practice/draughts/state/${sessionId}`),
  },
};
export const streak = {
  get: () => apiGet('/streak/'),
  recover: (method) => apiPost('/streak/recover', { method }),
};


export const practiceControl = (gameType, sessionId, action) => apiPost(`/practice/${gameType}/control`, { sessionId, action });
