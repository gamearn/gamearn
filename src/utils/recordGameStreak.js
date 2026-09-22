export async function recordGameStreak(updateProfileData, userProfile) {
  if (typeof updateProfileData !== 'function') return;
  const today = new Date().toISOString().split('T')[0];
  const lastDate = userProfile?.lastCheckInDate || userProfile?.lastPlayedDate;
  const currentStreak = Number(userProfile?.streak ?? 0);
  const gamesPlayed = Number(userProfile?.gamesPlayed ?? 0) + 1;

  let newStreak = currentStreak;
  if (lastDate !== today) {
    newStreak = currentStreak > 0 ? currentStreak + 1 : 1;
  }

  try {
    await updateProfileData({
      gamesPlayed,
      streak: newStreak,
      lastCheckInDate: today,
      lastPlayedDate: today,
    });
  } catch (err) {
    console.log('Notice: Could not record game streak:', err?.message || err);
  }
}
