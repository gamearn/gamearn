export function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDayGap(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2) return null;
  const s1 = String(dateStr1).split('T')[0];
  const s2 = String(dateStr2).split('T')[0];
  const [y1, m1, d1] = s1.split('-').map(Number);
  const [y2, m2, d2] = s2.split('-').map(Number);
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return null;
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

export async function recordGameStreak(updateProfileData, userProfile) {
  if (typeof updateProfileData !== 'function') return;
  const todayStr = getLocalDateString();
  const persistedDate = userProfile?.lastStreakPersistedDate || userProfile?.lastBackendStreakDate;
  const lastDate = persistedDate || userProfile?.lastStreakDate || userProfile?.lastCheckInDate || userProfile?.lastPlayedDate;

  // If today's streak update was already persisted to backend and storage, skip duplicate call
  if (persistedDate === todayStr) return;

  const currentStreak = Number(userProfile?.streak ?? userProfile?.currentStreak ?? 0);
  const currentWins = Number(userProfile?.wins ?? userProfile?.gamesWon ?? 0);
  const currentLosses = Number(userProfile?.losses ?? userProfile?.gamesLost ?? 0);
  const gamesPlayed = Math.max(Number(userProfile?.gamesPlayed ?? 0), currentWins + currentLosses);

  let newStreak = currentStreak;
  if (!lastDate) {
    newStreak = 1;
  } else {
    const gap = getDayGap(lastDate, todayStr);
    if (gap === 1) {
      newStreak = currentStreak > 0 ? currentStreak + 1 : 1;
    } else if (gap > 1) {
      newStreak = 1;
    } else if (gap === 0) {
      newStreak = Math.max(1, currentStreak);
    }
  }

  try {
    await updateProfileData({
      gamesPlayed,
      streak: newStreak,
      currentStreak: newStreak,
      lastCheckInDate: todayStr,
      lastStreakDate: todayStr,
      lastPlayedDate: todayStr,
      lastStreakPersistedDate: todayStr,
    });
  } catch (err) {
    console.log('Notice: Could not record game streak:', err?.message || err);
  }
}

export function getStreakInfo(userProfile) {
  const streakCount = Number(userProfile?.streak ?? userProfile?.currentStreak ?? 0);
  const todayStr = getLocalDateString();
  const lastDate = userProfile?.lastStreakPersistedDate || userProfile?.lastStreakDate || userProfile?.lastPlayedDate || userProfile?.lastCheckInDate;

  if (!lastDate) {
    return {
      dayText: 'Day 1',
      statusText: 'At Risk',
      isAtRisk: true,
      isActive: false,
      streakNumber: 1,
      subText: 'Play a game today to start your streak!',
    };
  }

  const gap = getDayGap(lastDate, todayStr);

  if (gap === 0) {
    // Played today!
    const num = Math.max(1, streakCount);
    return {
      dayText: `Day ${num}`,
      statusText: 'Active',
      isAtRisk: false,
      isActive: true,
      streakNumber: num,
      subText: 'Great! Today’s streak is active.',
    };
  } else if (gap === 1) {
    // Played yesterday, hasn't played today yet -> AT RISK!
    const num = Math.max(1, streakCount);
    return {
      dayText: `Day ${num}`,
      statusText: 'At Risk',
      isAtRisk: true,
      isActive: false,
      streakNumber: num,
      subText: 'Play a game today to keep your streak!',
    };
  } else {
    // Missed 2+ days -> Reset to Day 1, At Risk until played today
    return {
      dayText: 'Day 0',
      statusText: 'At Risk',
      isAtRisk: true,
      isActive: false,
      streakNumber: 0,
      subText: 'Streak at risk! Play a game today to start Day 1.',
    };
  }
}



