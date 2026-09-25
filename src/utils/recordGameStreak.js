export async function recordGameStreak(updateProfileData, userProfile) {
  if (typeof updateProfileData !== 'function') return;
  const todayStr = new Date().toISOString().split('T')[0];
  const lastDate = userProfile?.lastCheckInDate || userProfile?.lastPlayedDate;
  const currentStreak = Number(userProfile?.streak ?? 0);
  const gamesPlayed = Number(userProfile?.gamesPlayed ?? 0) + 1;

  let newStreak;
  if (lastDate === todayStr) {
    // Already logged today; do not double-count.
    newStreak = currentStreak;
  } else if (lastDate) {
    const last = new Date(`${lastDate.slice(0, 10)}T00:00:00Z`);
    const today = new Date(`${todayStr}T00:00:00Z`);
    const dayGap = Math.round((today - last) / 86400000);
    newStreak = dayGap <= 1 ? currentStreak + 1 : 1;
  } else {
    newStreak = 1;
  }

  try {
    await updateProfileData({
      gamesPlayed,
      streak: newStreak,
      lastCheckInDate: todayStr,
      lastPlayedDate: todayStr,
    });
  } catch (err) {
    console.log('Notice: Could not record game streak:', err?.message || err);
  }
}
