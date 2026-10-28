export function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDayGap(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2) return null;
  const s1 = String(dateStr1).split('T')[0] || '';
  const s2 = String(dateStr2).split('T')[0] || '';
  const parts1 = s1.split('-').map(Number);
  const parts2 = s2.split('-').map(Number);
  if (parts1.length < 3 || parts2.length < 3) return null;
  const [y1, m1, d1] = parts1;
  const [y2, m2, d2] = parts2;
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return null;
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Record match completion for both:
 * 1. Daily Play Streak (playing games on consecutive calendar days)
 * 2. Win Streak (consecutive match wins without a loss)
 */
export async function recordGameStreak(updateProfileData, userProfile, isWinner = null) {
  if (typeof updateProfileData !== 'function') return;
  const todayStr = getLocalDateString();

  // 1. Daily Play Streak logic
  const currentDailyStreak = Number(userProfile?.dailyPlayStreak ?? userProfile?.streak ?? userProfile?.currentStreak ?? 0);
  const lastPlayedDate = userProfile?.lastPlayedDate || userProfile?.lastStreakDate || null;

  let newDailyStreak = currentDailyStreak;
  if (!lastPlayedDate) {
    newDailyStreak = 1; // First day playing!
  } else {
    const gap = getDayGap(lastPlayedDate, todayStr);
    if (gap === 0) {
      newDailyStreak = Math.max(1, currentDailyStreak);
    } else if (gap === 1) {
      newDailyStreak = currentDailyStreak + 1;
    } else if (gap > 1) {
      newDailyStreak = 1;
    }
  }

  // 2. Win Streak logic
  const currentWinStreak = Number(userProfile?.winStreak ?? userProfile?.currentWinStreak ?? 0);
  let newWinStreak = currentWinStreak;
  if (isWinner === true) {
    newWinStreak = currentWinStreak + 1;
  } else if (isWinner === false) {
    newWinStreak = 0;
  }

  // 3. 7-Day Streak Unlock & +1 Value Point Reward
  let extraVpAward = 0;
  const lastAwardedMilestone = Number(userProfile?.lastStreakMilestoneAwarded ?? 0);
  if (newDailyStreak >= 7 && lastAwardedMilestone < 7) {
    extraVpAward = 1;
  }

  const currentValuePoints = Number(userProfile?.valuePoints ?? 0);

  try {
    const payload = {
      dailyPlayStreak: newDailyStreak,
      streak: newDailyStreak,
      currentStreak: newDailyStreak,
      winStreak: newWinStreak,
      currentWinStreak: newWinStreak,
      lastPlayedDate: todayStr,
      lastStreakDate: todayStr,
      lastCheckInDate: todayStr,
      streak7Unlocked: newDailyStreak >= 7,
    };
    if (extraVpAward > 0) {
      payload.valuePoints = currentValuePoints + extraVpAward;
      payload.lastStreakMilestoneAwarded = 7;
    }
    await updateProfileData(payload);
  } catch (err) {
    console.log('Notice: Could not record game streak:', err?.message || err);
  }
}

/**
 * Get Daily Play Streak info for Dashboard
 */
export function getDailyStreakInfo(userProfile) {
  const todayStr = getLocalDateString();
  const rawStreak = Number(userProfile?.dailyPlayStreak ?? userProfile?.streak ?? userProfile?.currentStreak ?? 0);
  const lastDate = userProfile?.lastPlayedDate || userProfile?.lastStreakDate || userProfile?.lastCheckInDate || null;
  const gap = lastDate ? getDayGap(lastDate, todayStr) : null;

  // Case 1: No streak started yet
  if (rawStreak <= 0) {
    return {
      dayText: 'Day 0',
      statusText: 'Inactive',
      isAtRisk: false,
      isActive: false,
      isInactive: true,
      streakNumber: 0,
      subText: 'Play a game today to start your daily play streak!',
    };
  }

  // Case 2: Missed 2+ days (streak expired) -> Inactive (red)
  if (gap !== null && gap > 1) {
    return {
      dayText: 'Day 0',
      statusText: 'Inactive',
      isAtRisk: false,
      isActive: false,
      isInactive: true,
      streakNumber: 0,
      subText: 'Streak lost! Play a game today to start a new streak.',
    };
  }

  // Case 3: Played today (gap === 0) -> Streak completed and active for today!
  if (gap === 0) {
    return {
      dayText: `Day ${rawStreak}`,
      statusText: 'Active',
      isAtRisk: false,
      isActive: true,
      isInactive: false,
      streakNumber: rawStreak,
      subText: `🔥 ${rawStreak}-day play streak active!`,
    };
  }

  // Case 4: Streak alive from yesterday (gap === 1 or not yet played today).
  // Streak is MAINTAINED at rawStreak (e.g. Day 2), but flagged AT RISK in YELLOW until a game is played today!
  return {
    dayText: `Day ${rawStreak}`,
    statusText: 'At Risk',
    isAtRisk: true,
    isActive: false,
    isInactive: false,
    streakNumber: rawStreak,
    subText: 'Play a game today to keep your streak!',
  };
}

/**
 * Alias for getDailyStreakInfo
 */
export function getStreakInfo(userProfile) {
  return getDailyStreakInfo(userProfile);
}

/**
 * Get Win Streak info for Game Over screen
 */
export function getWinStreakInfo(userProfile) {
  const winCount = Number(userProfile?.winStreak ?? userProfile?.currentWinStreak ?? 0);

  if (winCount <= 0) {
    return {
      winText: '0 Wins',
      statusText: 'Win Streak',
      isActive: false,
      winCount: 0,
      subText: 'Win a match to start a win streak!',
    };
  }

  return {
    winText: `${winCount} ${winCount === 1 ? 'Win' : 'Wins'}`,
    statusText: 'Win Streak',
    isActive: true,
    winCount,
    subText: `🔥 ${winCount} win streak!`,
  };
}
