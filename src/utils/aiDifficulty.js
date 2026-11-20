/**
 * Helper to determine AI difficulty based on user's Game Power (GP) or user setup preference.
 * - Low GP (< 35): Easy AI
 * - Mid GP (35 - 70): Medium AI
 * - High GP (> 70): Hard AI
 */
export function getAiDifficulty(userProfile, setupDifficulty = 'auto') {
  if (setupDifficulty && setupDifficulty !== 'auto') {
    return setupDifficulty;
  }
  const gp = Math.min(100, Math.max(0, Number(userProfile?.gamePower ?? 0)));
  if (gp < 35) return 'easy';
  if (gp <= 70) return 'medium';
  return 'hard';
}
