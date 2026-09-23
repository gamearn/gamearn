/**
 * Helper to determine AI difficulty based on user's Game Power (GP) or user setup preference.
 * - Low GP (< 1000): Easy AI
 * - Mid GP (1000 - 3000): Medium AI
 * - High GP (> 3000): Hard AI
 */
export function getAiDifficulty(userProfile, setupDifficulty = 'auto') {
  if (setupDifficulty && setupDifficulty !== 'auto') {
    return setupDifficulty;
  }
  const gp = Number(userProfile?.gamePower ?? 0);
  if (gp < 1000) return 'easy';
  if (gp <= 3000) return 'medium';
  return 'hard';
}
