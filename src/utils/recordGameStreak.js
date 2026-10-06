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

export async function recordGameStreak(updateProfileData, userProfile, isWinner = null) {
  if (typeof updateProfileData !== 'function') return;
  const todayStr = getLocalDateString();
  const currentStreak = Number(userProfile?.streak ?? userProfile?.currentStreak ?? 0);

  let newStreak = currentStreak;

  if (isWinner === true) {
    // Player won the match -> Increment win streak!
    newStreak = currentStreak + 1;
  } else if (isWinner === false) {
    // Player lost the match -> Reset win streak to 0!
    newStreak = 0;
  } else {
    // Match in progress or outcome unknown -> preserve existing streak
    newStreak = currentStreak;
  }

  try {
    await updateProfileData({
      streak: newStreak,
      currentStreak: newStreak,
      lastCheckInDate: todayStr,
      lastStreakDate: todayStr,
      lastPlayedDate: todayStr,
      lastStreakPersistedDate: todayStr,
    });
  } catch (err) {
    console.log('Notice: Could not record win streak:', err?.message || err);
  }
}

export function getStreakInfo(userProfile) {
  const streakCount = Number(userProfile?.streak ?? userProfile?.currentStreak ?? 0);

  if (streakCount <= 0) {
    return {
      dayText: '0 Wins',
      statusText: 'No Streak',
      isAtRisk: true,
      isActive: false,
      streakNumber: 0,
      subText: 'Win a game to start your win streak!',
    };
  }

  return {
    dayText: `${streakCount} ${streakCount === 1 ? 'Win' : 'Wins'}`,
    statusText: 'Active Streak',
    isAtRisk: false,
    isActive: true,
    streakNumber: streakCount,
    subText: `🔥 ${streakCount} game win streak!`,
  };
}



