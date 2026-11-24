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
      return {
        ...state, balance: state.balance + action.amount, transactions: [
          { id: action.id, label: 'Wallet top-up', amount: action.amount, date: action.date },
          ...state.transactions,
        ].slice(0, 100)
      };
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
  if (explicitGp !== null && explicitGp !== undefined && !isNaN(Number(explicitGp)) && Number(explicitGp) > 0) {
    return Math.max(0, Math.round(Number(explicitGp)));
  }
  const W = Math.max(0, Number(wins) || 0);
  const P = Math.max(0, Number(played) || W);
  if (P === 0) return 0;
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
    if (!userProfile) return { plays: 0, wins: 0, dailyPlays: 0, dailyWins: 0, weeklyPlays: 0, weeklyWins: 0, monthlyPlays: 0, monthlyWins: 0, yearlyPlays: 0, yearlyWins: 0 };
    if (gameType) {
      const gKey = String(gameType).toLowerCase();
      const candidates = (gKey === 'draft' || gKey === 'checkers' || gKey === 'draught' || gKey === 'draughts')
        ? ['draughts', 'draft', 'checkers']
        : [gKey];

      let maxW = 0;
      let maxP = 0;
      let maxDailyP = 0;
      let maxDailyW = 0;
      let maxWeeklyP = 0;
      let maxWeeklyW = 0;
      let maxMonthlyP = 0;
      let maxMonthlyW = 0;
      let foundStat = false;
      let gamePlayedToday = false;
      for (const k of candidates) {
        const stat = userProfile?.gameStats?.[k];
        if (stat) {
          foundStat = true;
          const w = Number(stat.wins || 0);
          const p = Number(stat.gamesPlayed ?? stat.plays ?? (w + Number(stat.losses || 0)));
          if (w > maxW) maxW = w;
          if (Math.max(p, w) > maxP) maxP = Math.max(p, w);
          const isThisGameToday = stat.lastPlayedDate ? stat.lastPlayedDate === todayStr : playedToday;
          if (isThisGameToday) {
            gamePlayedToday = true;
            if (stat.dailyPlays !== undefined) maxDailyP = Math.max(maxDailyP, Number(stat.dailyPlays || 0));
            if (stat.dailyWins !== undefined) maxDailyW = Math.max(maxDailyW, Number(stat.dailyWins || 0));
          }
          if (stat.weeklyPlays !== undefined) maxWeeklyP = Math.max(maxWeeklyP, Number(stat.weeklyPlays || 0));
          if (stat.weeklyWins !== undefined) maxWeeklyW = Math.max(maxWeeklyW, Number(stat.weeklyWins || 0));
          if (stat.monthlyPlays !== undefined) maxMonthlyP = Math.max(maxMonthlyP, Number(stat.monthlyPlays || 0));
          if (stat.monthlyWins !== undefined) maxMonthlyW = Math.max(maxMonthlyW, Number(stat.monthlyWins || 0));
        }
      }
      if (!foundStat) {
        return { plays: 0, wins: 0, dailyPlays: 0, dailyWins: 0, weeklyPlays: 0, weeklyWins: 0, monthlyPlays: 0, monthlyWins: 0, yearlyPlays: 0, yearlyWins: 0 };
      }
      const finalDailyP = gamePlayedToday ? maxDailyP : 0;
      const finalDailyW = gamePlayedToday ? Math.min(maxDailyW, finalDailyP) : 0;
      return {
        plays: Math.max(maxP, maxW),
        wins: maxW,
        dailyPlays: finalDailyP,
        dailyWins: finalDailyW,
        weeklyPlays: maxWeeklyP || finalDailyP,
        weeklyWins: Math.min(maxWeeklyW || finalDailyW, maxWeeklyP || finalDailyP),
        monthlyPlays: maxMonthlyP || maxWeeklyP || finalDailyP,
        monthlyWins: Math.min(maxMonthlyW || maxWeeklyW || finalDailyW, maxMonthlyP || maxWeeklyP || finalDailyP),
        yearlyPlays: Math.max(maxP, maxW),
        yearlyWins: maxW,
      };
    }
    const totalWins = Number(userProfile.wins ?? userProfile.gamesWon ?? 0);
    const totalLosses = Number(userProfile.losses ?? userProfile.gamesLost ?? 0);
    const totalDraws = Number(userProfile.draws ?? userProfile.gamesDrawn ?? 0);
    const totalPlays = Number(userProfile.gamesPlayed ?? userProfile.plays ?? (totalWins + totalLosses + totalDraws));
    const now = new Date();
    const weekKey = `${now.getFullYear()}-W${Math.ceil((((now - new Date(now.getFullYear(), 0, 1)) / 86400000) + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7)}`;
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const yearKey = `${now.getFullYear()}`;

    const isPlayedWeek = userProfile?.lastPlayedWeek === weekKey || playedToday;
    const isPlayedMonth = userProfile?.lastPlayedMonth === monthKey || playedToday;
    const isPlayedYear = userProfile?.lastPlayedYear === yearKey || playedToday;

    const globalDailyP = playedToday ? Number(userProfile.dailyPlays || 0) : 0;
    const globalDailyW = playedToday ? Math.min(Number(userProfile.dailyWins || 0), globalDailyP) : 0;
    const globalWeeklyP = isPlayedWeek ? Number(userProfile.weeklyPlays || globalDailyP) : 0;
    const globalWeeklyW = isPlayedWeek ? Math.min(Number(userProfile.weeklyWins || globalDailyW), globalWeeklyP) : 0;
    const globalMonthlyP = isPlayedMonth ? Number(userProfile.monthlyPlays || globalWeeklyP) : 0;
    const globalMonthlyW = isPlayedMonth ? Math.min(Number(userProfile.monthlyWins || globalWeeklyW), globalMonthlyP) : 0;
    const globalYearlyP = isPlayedYear ? Number(userProfile.yearlyPlays || totalPlays) : totalPlays;
    const globalYearlyW = isPlayedYear ? Math.min(Number(userProfile.yearlyWins || totalWins), globalYearlyP) : totalWins;

    return {
      plays: Math.max(totalPlays, totalWins),
      wins: totalWins,
      dailyPlays: globalDailyP,
      dailyWins: globalDailyW,
      weeklyPlays: globalWeeklyP,
      weeklyWins: globalWeeklyW,
      monthlyPlays: globalMonthlyP,
      monthlyWins: globalMonthlyW,
      yearlyPlays: globalYearlyP,
      yearlyWins: globalYearlyW,
    };
  };

  const userStats = getRelevantUserStats();

  const getEffectiveUserStats = () => {
    if (period === 'Daily') {
      return { plays: userStats.dailyPlays, wins: userStats.dailyWins };
    }
    if (period === 'Weekly') {
      return {
        plays: userStats.weeklyPlays !== undefined ? userStats.weeklyPlays : 0,
        wins: userStats.weeklyWins !== undefined ? userStats.weeklyWins : 0,
      };
    }
    if (period === 'Monthly') {
      return {
        plays: userStats.monthlyPlays !== undefined ? userStats.monthlyPlays : 0,
        wins: userStats.monthlyWins !== undefined ? userStats.monthlyWins : 0,
      };
    }
    if (period === 'Yearly') {
      return {
        plays: userStats.yearlyPlays !== undefined ? userStats.yearlyPlays : 0,
        wins: userStats.yearlyWins !== undefined ? userStats.yearlyWins : 0,
      };
    }
    return { plays: userStats.plays, wins: userStats.wins };
  };

  const effectiveStats = getEffectiveUserStats();

  const getUserGp = () => {
    if (!userProfile) return 0;
    const totalP = Number(userProfile.gamesPlayed ?? userProfile.plays ?? 0);
    const totalW = Number(userProfile.wins ?? userProfile.gamesWon ?? 0);
    if (totalP === 0) return 0;
    return computeRowGp(totalW, totalP);
  };

  const rows = Array.isArray(dbRows) ? dbRows : [];
  const list = rows.map((row, index) => {
    const isUser = Boolean(userProfile?.uid && (row.id === userProfile.uid || row.uid === userProfile.uid || row.isUser));
    const rawName = row.username || row.displayName || row.name || (isUser ? (userProfile?.username || userProfile?.displayName || 'You') : 'Player');
    const cleanName = rawName.replace(/\s*\(You\)\s*$/, '');
    let plays = Number(row.periodPlays !== undefined ? row.periodPlays : (row.plays ?? 0));
    let wins = Number(row.periodWins !== undefined ? row.periodWins : (row.wins ?? 0));

    const careerP = Math.max(Number(row.careerPlays ?? row.totalPlays ?? 0), isUser ? Number(userProfile?.gamesPlayed ?? 0) : 0, plays);
    const careerW = Math.max(Number(row.careerWins ?? row.totalWins ?? 0), isUser ? Number(userProfile?.wins ?? 0) : 0, wins);
    const rowGp = (row.gp != null && Number(row.gp) >= 0)
      ? Number(row.gp)
      : ((isUser && getUserGp() > 0) ? getUserGp() : computeRowGp(careerW, careerP));
    return {
      id: row.id || row.uid || `player_${index}`,
      uid: row.uid || row.id,
      name: isUser ? `${cleanName} (You)` : cleanName,
      displayName: cleanName,
      username: row.username || cleanName,
      plays,
      wins,
      periodPlays: plays,
      periodWins: wins,
      careerPlays: careerP,
      careerWins: careerW,
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
        uid: userProfile.uid,
        name: `${cleanName} (You)`,
        displayName: cleanName,
        username: userProfile.username || cleanName,
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
    if (b.gp !== a.gp) return b.gp - a.gp;
    return (a.name || '').localeCompare(b.name || '');
  });
  list.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return list;
}

module.exports = { INITIAL_STATE, reducer, restore, parseAmount, money, localDay, previousDay, leaderboard, computeRowGp };
