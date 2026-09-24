// Typed endpoint library for the Gamearn backend.
// Contracts derived from Backend_manager routes/validators/services.
// Money: wallet/pay amounts are NAIRA (floats); entry fees/transactions kobo.

import { apiGet, apiPatch, apiPost, ApiError } from './apiClient';
import { getIdToken } from './firebase';

// ── Auth ──────────────────────────────────────────────────────────────────────

export const auth = {
  requestSignupEmailOtp: async (email) => {
    const idToken = await getIdToken(true);
    if (!idToken) throw new ApiError({ code: 'AUTH_MISSING', message: 'Not signed in.' });
    return apiPost('/auth/signup/email-otp/request', { idToken, email }, { auth: false });
  },

  verifySignupEmailOtp: async (email, code) => {
    const idToken = await getIdToken();
    if (!idToken) throw new ApiError({ code: 'AUTH_MISSING', message: 'Not signed in.' });
    return apiPost('/auth/signup/email-otp/verify', { idToken, email, code }, { auth: false });
  },

  register: async ({ phoneNumber, displayName, referralCode }) => {
    const idToken = await getIdToken(true);
    if (!idToken) throw new ApiError({ code: 'AUTH_MISSING', message: 'Not signed in.' });
    return apiPost(
      '/auth/register',
      {
        phoneNumber,
        displayName,
        idToken,
        referralCode: referralCode || undefined,
      },
      { auth: false },
    );
  },

  login: async ({ fcmToken } = {}) => {
    const idToken = await getIdToken(true);
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

  // Claim the daily/in-game bonus coin grant (practice coins, not real money).
  // Idempotent per claim per UTC day — duplicate claims are no-ops.
  freeCoins: (claim = 'daily-bonus') => apiPost('/wallet/free-coins', { claim }),
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
  // Records that an invite share was sent (capped at 50/day).
  ping: () => apiPost('/referral/ping', {}),
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

// ── Tournaments ───────────────────────────────────────────────────────────────

export const tournaments = {
  create: (body) =>
    apiPost('/tournaments', {
      name: body.name,
      gameType: body.gameType,
      duration: body.duration,
      tournamentType: body.tournamentType || 'win',
      maxPlayers: body.maxPlayers || 32,
      topWinners: body.topWinners || 3,
    }),

  list: (gameType) =>
    apiGet(gameType ? `/tournaments?gameType=${gameType}` : '/tournaments/'),

  my: () => apiGet('/tournaments/my'),

  get: (id) => apiGet(`/tournaments/${id}`),

  register: (id) => apiPost(`/tournaments/${id}/register`, {}),
};

// ── Admin ─────────────────────────────────────────────────────────────────────

export const admin = {
  stats: () => apiGet('/admin/stats'),
  rooms: (status) => apiGet(status ? `/admin/rooms?status=${status}` : '/admin/rooms'),
  verifiedUsers: () => apiGet('/admin/verified-users'),
  banUser: (uid, payload) => apiPost(`/admin/users/${uid}/ban`, payload),
  unbanUser: (uid, payload) => apiPost(`/admin/users/${uid}/unban`, payload),
  adjustWallet: (uid, payload) => apiPost(`/admin/wallets/${uid}/adjust`, payload),
};

// ── Practice games ────────────────────────────────────────────────────────────

export const practice = {
  whot: {
    start: (opts = {}) =>
      apiPost('/practice/whot/start', {
        gameType: 'whot',
        playerRating: opts.playerRating || 1200,
        startCards: opts.startCards || 6,
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
        diceCount: opts.diceCount || 1,
        dualHome: !!opts.dualHome,
      }),
    roll: (sessionId) => apiPost('/practice/ludo/roll', { sessionId }),
    move: (sessionId, pieceId, diceValue) =>
      apiPost('/practice/ludo/move', { sessionId, pieceId, diceValue }),
    state: (sessionId) => apiGet(`/practice/ludo/state/${sessionId}`),
  },

  ayo: {
    start: (opts = {}) =>
      apiPost('/practice/ayo/start', { playerRating: opts.playerRating || 1200 }),
    move: (sessionId, pitIndex) => apiPost('/practice/ayo/move', { sessionId, pitIndex }),
    state: (sessionId) => apiGet(`/practice/ayo/state/${sessionId}`),
  },

  draughts: {
    start: (opts = {}) =>
      apiPost('/practice/draughts/start', { playerRating: opts.playerRating || 1200 }),
    move: (sessionId, move) => apiPost('/practice/draughts/move', { sessionId, ...move }),
    state: (sessionId) => apiGet(`/practice/draughts/state/${sessionId}`),
  },
};
export const streak = {
  get: () => apiGet('/streak/'),
  recover: (method) => apiPost('/streak/recover', { method }),
};

