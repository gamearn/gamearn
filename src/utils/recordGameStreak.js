export async function recordGameStreak(updateProfileData, userProfile) {
  if (typeof updateProfileData !== 'function') return;
  const today = new Date().toISOString().split('T')[0];
  const lastCheckIn = userProfile?.lastCheckInDate || userProfile?.lastStreakDate;
  const lastPlayed = userProfile?.lastPlayedDate;

  const currentStreak = Number(userProfile?.streak ?? userProfile?.currentStreak ?? 0);
  const currentWins = Number(userProfile?.wins ?? userProfile?.gamesWon ?? 0);
  const currentLosses = Number(userProfile?.losses ?? userProfile?.gamesLost ?? 0);
  const gamesPlayed = Math.max(Number(userProfile?.gamesPlayed ?? 0), currentWins + currentLosses);

  // Prevent duplicate state updates if today is already recorded and streak is active (>0)
  if (lastPlayed === today && currentStreak > 0) return;

  let newStreak = currentStreak;
  if (lastPlayed !== today) {
    newStreak = currentStreak > 0 ? currentStreak + 1 : 1;
  } else if (newStreak === 0) {
    newStreak = 1;
  }

  try {
    await updateProfileData({
      gamesPlayed,
      streak: newStreak,
      currentStreak: newStreak,
      lastCheckInDate: today,
      lastStreakDate: today,
      lastPlayedDate: today,
    });
  } catch (err) {
    console.log('Notice: Could not record game streak:', err?.message || err);
  }
}
