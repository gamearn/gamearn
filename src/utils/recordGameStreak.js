export async function recordGameStreak(updateProfileData, userProfile) {
  if (typeof updateProfileData !== 'function') return;
  const todayStr = new Date().toISOString().split('T')[0];
  const lastDate = userProfile?.lastCheckInDate || userProfile?.lastPlayedDate || userProfile?.lastStreakDate;

  const currentStreak = Number(userProfile?.streak ?? userProfile?.currentStreak ?? 0);
  const currentWins = Number(userProfile?.wins ?? userProfile?.gamesWon ?? 0);
  const currentLosses = Number(userProfile?.losses ?? userProfile?.gamesLost ?? 0);
  const gamesPlayed = Math.max(Number(userProfile?.gamesPlayed ?? 0), currentWins + currentLosses);

  let newStreak;
  if (lastDate === todayStr) {
    newStreak = Math.max(1, currentStreak);
  } else if (lastDate) {
    const last = new Date(`${lastDate.slice(0, 10)}T00:00:00Z`);
    const today = new Date(`${todayStr}T00:00:00Z`);
    const dayGap = Math.round((today - last) / 86400000);
    newStreak = dayGap <= 1 ? (currentStreak > 0 ? currentStreak + 1 : 1) : 1;
  } else {
    newStreak = 1;
  }

  if (lastDate === todayStr && currentStreak > 0 && userProfile?.streak === newStreak) return;

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
