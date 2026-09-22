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
  const [year, month, date] = day.split('-').map(Number);
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

const PLAYERS = [
  { id: 'you', name: 'Adebayo', wins: 24, xp: 12450, avatar: 'adebayo' },
  { id: 'pixel', name: 'PixelSlayer', wins: 19, xp: 11200, avatar: 'pixel' },
  { id: 'nova', name: 'Nova_01', wins: 15, xp: 9840, avatar: 'nova' },
  { id: 'shadow', name: 'ShadowKing', wins: 14, xp: 9800, avatar: 'shadow' },
  { id: 'lunar', name: 'LunarNova', wins: 13, xp: 9000, avatar: 'shadow' },
];

function leaderboard(period, name) {
  // Explicitly seeded examples, not network rankings.
  const samples = {
    Daily: [[24, 12450], [19, 11200], [15, 9840], [14, 9800], [13, 9000]],
    Weekly: [[88, 48200], [95, 51400], [61, 36600], [72, 40300], [54, 32500]],
    Monthly: [[270, 149000], [292, 158000], [315, 170000], [220, 126000], [205, 119000]],
    Yearly: [[1810, 1012000], [1995, 1088000], [2100, 1140000], [2210, 1200000], [1780, 960000]],
  };
  return [];
}

module.exports = { INITIAL_STATE, reducer, restore, parseAmount, money, localDay, previousDay, leaderboard };
