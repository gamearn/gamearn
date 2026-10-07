// Pure application state. Amounts are integer kobo; no floating-point money math.
const INITIAL_STATE = {
  name: '', balance: 0, streak: 0, lastPlayed: null,
  joined: false, notificationsRead: false, claimed: false,
  settings: { sound: true, notifications: true }, transactions: [],
};

function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function previousDay(day) {
  const [year, month, date] = String(day || '').split('-').map(Number);
  if (!year || !month || !date) return localDay();
  return localDay(new Date(year, month - 1, date - 1, 12));
}

function parseAmount(input) {
  const value = input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  const kobo = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(kobo) && kobo >= 10000 && kobo <= 100000000 ? kobo : null;
}

function money(kobo) {
  const [whole, fraction] = (kobo / 100).toFixed(2).split('.');
  return `₦${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
}

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE': return restore(action.value);
    case 'TOP_UP': {
      if (!Number.isSafeInteger(action.amount) || action.amount < 10000 || action.amount > 100000000) return state;
      if (!Number.isSafeInteger(state.balance + action.amount)) return state;
      if (state.transactions.some(t => t.id === action.id)) return state;
      return { ...state, balance: state.balance + action.amount, transactions: [
        { id: action.id, label: 'Wallet top-up', amount: action.amount, date: action.date },
        ...state.transactions,
      ].slice(0, 100) };
    }
    case 'JOIN': return { ...state, joined: true };
    case 'READ_NOTIFICATIONS': return { ...state, notificationsRead: true };
    case 'SETTING':
      if (!['sound', 'notifications'].includes(action.key)) return state;
      return { ...state, settings: { ...state.settings, [action.key]: Boolean(action.value) } };
    case 'NAME': return action.value.trim() ? { ...state, name: action.value.trim().slice(0, 24) } : state;
    case 'COMPLETE_DEMO': {
      if (state.lastPlayed === action.day) return state;
      const consecutive = !state.lastPlayed || state.lastPlayed === previousDay(action.day);
      return { ...state, streak: consecutive ? state.streak + 1 : 1, lastPlayed: action.day };
    }
    case 'CLAIM': return state.streak >= 30 && !state.claimed ? { ...state, claimed: true } : state;
    default: return state;
  }
}

function restore(value) {
  if (!value || typeof value !== 'object') return { ...INITIAL_STATE };
  return {
    ...INITIAL_STATE,
    name: typeof value.name === 'string' && value.name.trim() ? value.name.trim().slice(0, 24) : INITIAL_STATE.name,
    balance: Number.isSafeInteger(value.balance) && value.balance >= 0 ? value.balance : INITIAL_STATE.balance,
    streak: Number.isInteger(value.streak) && value.streak >= 0 && value.streak <= 100000 ? value.streak : 0,
    lastPlayed: typeof value.lastPlayed === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.lastPlayed) ? value.lastPlayed : null,
    joined: value.joined === true, notificationsRead: value.notificationsRead === true, claimed: value.claimed === true,
    settings: { sound: value.settings?.sound !== false, notifications: value.settings?.notifications !== false },
    transactions: Array.isArray(value.transactions) ? value.transactions.filter(t =>
      t && typeof t.id === 'string' && typeof t.label === 'string' && typeof t.date === 'string' && Number.isSafeInteger(t.amount)
    ).slice(0, 100) : [],
  };
}

function computeRowGp(wins = 0, played = 0, explicitGp = null) {
  const W = Math.max(0, Number(wins) || 0);
  const P = Math.max(0, Number(played) || W);
  if (P === 0) {
    if (explicitGp !== null && explicitGp !== undefined && !isNaN(Number(explicitGp))) {
      return Math.min(100, Math.max(0, Math.round(Number(explicitGp))));
    }
    return 0;
  }
  const WR = Math.min(1, Math.max(0, W / P));
  const expScore = Math.min(1, Math.log10(P + 1) / 3);
  return Math.min(100, Math.max(0, Math.round(100 * (0.75 * WR + 0.25 * expScore))));
}

function leaderboard(dbRows = [], userProfile = null) {
  const getUserGp = () => {
    if (!userProfile) return 0;
    if (userProfile.gp !== undefined && userProfile.gp !== null) return Number(userProfile.gp);
    if (userProfile.gamePower !== undefined && userProfile.gamePower !== null) return Number(userProfile.gamePower);
    const wins = Number(userProfile.wins || userProfile.gamesWon || 0);
    const losses = Number(userProfile.losses || userProfile.gamesLost || 0);
    const played = Number(userProfile.gamesPlayed || (wins + losses));
    return computeRowGp(wins, played);
  };

  if (!Array.isArray(dbRows) || dbRows.length === 0) {
    if (userProfile?.uid) {
      const userGp = getUserGp();
      return [
        {
          id: userProfile.uid,
          name: `${userProfile.displayName || userProfile.fullName || userProfile.name || userProfile.username || 'You'} (You)`,
          wins: Number(userProfile.wins || userProfile.gamesWon || 0),
          gp: userGp,
          gpText: `${userGp} GP`,
          xp: userGp,
          avatar: userProfile.avatar || 'adebayo',
          isUser: true,
          rank: 1,
        }
      ];
    }
    return [];
  }

  const list = dbRows.map((row, index) => {
    const isUser = Boolean(userProfile?.uid && (row.id === userProfile.uid || row.uid === userProfile.uid));
    const name = row.name || row.displayName || 'Gamer';
    const wins = Number(row.wins || 0);
    const played = Number(row.gamesPlayed || row.played || wins);
    const rowGp = isUser ? getUserGp() : computeRowGp(wins, played, row.gp ?? row.gamePower);
    return {
      id: row.id || row.uid || `player_${index}`,
      name: isUser ? `${name} (You)` : name,
      wins,
      gp: rowGp,
      gpText: `${rowGp} GP`,
      xp: rowGp,
      avatar: row.avatar || 'adebayo',
      isUser,
      rank: index + 1,
    };
  });

  const hasUserInList = userProfile?.uid && list.some((item) => item.isUser);
  if (userProfile?.uid && !hasUserInList) {
    const userGp = getUserGp();
    list.push({
      id: userProfile.uid,
      name: `${userProfile.displayName || userProfile.fullName || userProfile.name || userProfile.username || 'You'} (You)`,
      wins: Number(userProfile.wins || userProfile.gamesWon || 0),
      gp: userGp,
      gpText: `${userGp} GP`,
      xp: userGp,
      avatar: userProfile.avatar || 'adebayo',
      isUser: true,
      rank: list.length + 1,
    });
  }

  return list;
}

module.exports = { INITIAL_STATE, reducer, restore, parseAmount, money, localDay, previousDay, leaderboard, computeRowGp };
