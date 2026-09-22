import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_MATCH_KEY = '@gamearn_active_match_session';

/**
 * Save an active match session (e.g. when match starts)
 */
export async function setActiveMatch(matchData) {
  try {
    const durationSecs = matchData.durationSecs || 120; // 2 minutes default
    const session = {
      ...matchData,
      createdAt: Date.now(),
      expiresAt: Date.now() + durationSecs * 1000,
    };
    await AsyncStorage.setItem(ACTIVE_MATCH_KEY, JSON.stringify(session));
    return session;
  } catch (e) {
    return null;
  }
}

/**
 * Retrieve current active match session if not expired
 */
export async function getActiveMatch() {
  try {
    const raw = await AsyncStorage.setItem ? await AsyncStorage.getItem(ACTIVE_MATCH_KEY) : null;
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() >= session.expiresAt) {
      await AsyncStorage.removeItem(ACTIVE_MATCH_KEY);
      return null;
    }
    return session;
  } catch (e) {
    return null;
  }
}

/**
 * Clear active match session (e.g. on game completion or forfeit)
 */
export async function clearActiveMatch() {
  try {
    await AsyncStorage.removeItem(ACTIVE_MATCH_KEY);
  } catch (e) {}
}
