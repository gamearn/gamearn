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
  const vp = Math.max(0, Math.floor(kobo / 5000));
  return `${vp.toLocaleString()} VP`;
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
  // Only non-authoritative UI flags are cached locally. Wallet balance, streak,
  // transactions and profile fields are always read from the server.
  return {
    ...INITIAL_STATE,
    joined: value.joined === true,
    notificationsRead: value.notificationsRead === true,
    claimed: value.claimed === true,
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

function leaderboard(dbRows = [], userProfile = null, period = 'Daily', gameType = null) {
  // Rows arrive pre-ranked by the server (plays DESC, then wins).
  // Authenticated players always see themselves on the board with accurate plays.
  const isPeriodFiltered = period === 'Daily' || period === 'Weekly' || period === 'Monthly';

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const playedToday = Boolean(
    userProfile?.lastPlayedDate === todayStr ||
    userProfile?.lastStreakDate === todayStr ||
    userProfile?.lastDailyPlayDate === todayStr
  );

  const getRelevantUserStats = () => {
    if (!userProfile) return { plays: 0, wins: 0, dailyPlays: 0, dailyWins: 0 };
    if (gameType) {
      const gKey = String(gameType).toLowerCase();
      const candidates = (gKey === 'draft' || gKey === 'checkers' || gKey === 'draught' || gKey === 'draughts')
        ? ['draughts', 'draft', 'checkers']
        : [gKey];

      let maxW = 0;
      let maxP = 0;
      let maxDailyP = 0;
      let maxDailyW = 0;
      let foundStat = false;
      for (const k of candidates) {
        const stat = userProfile?.gameStats?.[k];
        if (stat) {
          foundStat = true;
          const w = Number(stat.wins || 0);
          const p = Number(stat.gamesPlayed ?? stat.plays ?? (w + Number(stat.losses || 0)));
          if (w > maxW) maxW = w;
          if (Math.max(p, w) > maxP) maxP = Math.max(p, w);
          if (stat.dailyPlays !== undefined) maxDailyP = Math.max(maxDailyP, Number(stat.dailyPlays || 0));
          if (stat.dailyWins !== undefined) maxDailyW = Math.max(maxDailyW, Number(stat.dailyWins || 0));
        }
      }
      if (foundStat) {
        const finalDailyP = maxDailyP > 0 ? maxDailyP : (playedToday && maxP > 0 ? 1 : 0);
        const finalDailyW = maxDailyW > 0 ? maxDailyW : (playedToday && maxW > 0 ? 1 : 0);
        return { plays: Math.max(maxP, maxW), wins: maxW, dailyPlays: finalDailyP, dailyWins: finalDailyW };
      }
    }
    const totalWins = Number(userProfile.wins ?? userProfile.gamesWon ?? 0);
    const totalLosses = Number(userProfile.losses ?? userProfile.gamesLost ?? 0);
    const totalDraws = Number(userProfile.draws ?? userProfile.gamesDrawn ?? 0);
    const totalPlays = Number(userProfile.gamesPlayed ?? userProfile.plays ?? (totalWins + totalLosses + totalDraws));
    const globalDailyP = Number(userProfile.dailyPlays ?? (playedToday && totalPlays > 0 ? 1 : 0));
    const globalDailyW = Number(userProfile.dailyWins ?? (playedToday && totalWins > 0 ? 1 : 0));
    return { plays: Math.max(totalPlays, totalWins), wins: totalWins, dailyPlays: globalDailyP, dailyWins: globalDailyW };
  };

  const userStats = getRelevantUserStats();

  const getEffectiveUserStats = () => {
    if (period === 'Daily') {
      return { plays: userStats.dailyPlays, wins: userStats.dailyWins };
    }
    if (isPeriodFiltered) {
      return {
        plays: userStats.dailyPlays > 0 ? userStats.dailyPlays : userStats.plays,
        wins: userStats.dailyWins > 0 ? userStats.dailyWins : userStats.wins,
      };
    }
    return { plays: userStats.plays, wins: userStats.wins };
  };

  const effectiveStats = getEffectiveUserStats();

  const getUserGp = () => {
    if (!userProfile) return 0;
    if (userProfile.gp !== undefined && userProfile.gp !== null) return Number(userProfile.gp);
    if (userProfile.gamePower !== undefined && userProfile.gamePower !== null) return Number(userProfile.gamePower);
    return computeRowGp(userStats.wins, userStats.plays);
  };

  const rows = Array.isArray(dbRows) ? dbRows : [];
  const list = rows.map((row, index) => {
    const isUser = Boolean(userProfile?.uid && (row.id === userProfile.uid || row.uid === userProfile.uid || row.isUser));
    const rawName = row.username || row.displayName || row.name || (isUser ? (userProfile?.username || userProfile?.displayName || 'You') : 'Player');
    const cleanName = rawName.replace(/\s*\(You\)\s*$/, '');
    let wins = Number(row.wins || 0);
    let plays = Number(row.plays ?? row.gamesPlayed ?? row.played ?? 0);
    if (isUser) {
      if (period === 'Daily') {
        plays = Math.max(plays, effectiveStats.plays);
        wins = Math.max(wins, effectiveStats.wins);
      } else {
        wins = Math.max(wins, effectiveStats.wins);
        plays = Math.max(plays, effectiveStats.plays, wins);
      }
    }
    const rowGp = isUser ? getUserGp() : computeRowGp(wins, plays, row.gp ?? row.gamePower);
    return {
      id: row.id || row.uid || `player_${index}`,
      name: isUser ? `${cleanName} (You)` : cleanName,
      plays,
      wins,
      gp: rowGp,
      gpText: `${rowGp} GP`,
      xp: rowGp,
      avatar: row.avatar || (isUser ? userProfile?.avatar : null),
      isUser,
      rank: row.rank || index + 1,
    };
  });

  // Always guarantee the authenticated user is visible on the board, with accurate stats for the period
  if (userProfile?.uid) {
    const hasUser = list.some((item) => item.isUser);
    if (!hasUser) {
      const userGp = getUserGp();
      const rawName = userProfile.username || userProfile.displayName || userProfile.name || 'You';
      const cleanName = rawName.replace(/\s*\(You\)\s*$/, '');
      list.push({
        id: userProfile.uid,
        name: `${cleanName} (You)`,
        plays: effectiveStats.plays,
        wins: effectiveStats.wins,
        gp: userGp,
        gpText: `${userGp} GP`,
        xp: userGp,
        avatar: userProfile.avatar || null,
        isUser: true,
        rank: list.length + 1,
      });
    }
  }

  // Sort so any player with higher plays and wins takes their proper rank
  list.sort((a, b) => {
    if (b.plays !== a.plays) return b.plays - a.plays;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return (a.name || '').localeCompare(b.name || '');
  });
  list.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return list;
}

module.exports = { INITIAL_STATE, reducer, restore, parseAmount, money, localDay, previousDay, leaderboard, computeRowGp };
