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
  const lastDate = userProfile?.lastCheckInDate || userProfile?.lastPlayedDate || userProfile?.lastStreakDate;

  const currentStreak = Number(userProfile?.streak ?? userProfile?.currentStreak ?? 0);
  const currentWins = Number(userProfile?.wins ?? userProfile?.gamesWon ?? 0);
  const currentLosses = Number(userProfile?.losses ?? userProfile?.gamesLost ?? 0);
  const gamesPlayed = Math.max(Number(userProfile?.gamesPlayed ?? 0), currentWins + currentLosses);

  let newStreak;
  if (!lastDate) {
    newStreak = 1;
  } else {
    const gap = getDayGap(lastDate, todayStr);
    if (gap === 0) {
      newStreak = Math.max(1, currentStreak);
    } else if (gap === 1) {
      newStreak = currentStreak > 0 ? currentStreak + 1 : 1;
    } else if (gap > 1) {
      newStreak = 1;
    } else {
      newStreak = Math.max(1, currentStreak);
    }
  }

  const lastDateClean = lastDate ? String(lastDate).split('T')[0] : null;
  if (lastDateClean === todayStr && currentStreak > 0 && userProfile?.streak === newStreak) return;

  try {
    await updateProfileData({
      gamesPlayed,
      streak: newStreak,
      currentStreak: newStreak,
      lastCheckInDate: todayStr,
      lastStreakDate: todayStr,
      lastPlayedDate: todayStr,
    });
  } catch (err) {
    console.log('Notice: Could not record game streak:', err?.message || err);
  }
}

