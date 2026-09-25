import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_MATCH_KEY = '@gamearn_active_match_session';

/**
 * Save an active match session (e.g. when match starts)
 */
export async function setActiveMatch(matchData) {
  try {
    const session = {
      ...matchData,
      createdAt: Date.now(),
    };
    await AsyncStorage.setItem(ACTIVE_MATCH_KEY, JSON.stringify(session));
    return session;
  } catch (e) {
    return null;
  }
}

/**
 * Update the saved state of an ongoing active match
 */
export async function updateActiveMatchState(gameId, stateData) {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_MATCH_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session && (session.gameId === gameId || session.targetScreen?.toLowerCase().includes(gameId))) {
      session.savedState = {
        ...(session.savedState || {}),
        ...stateData,
      };
      session.updatedAt = Date.now();
      await AsyncStorage.setItem(ACTIVE_MATCH_KEY, JSON.stringify(session));
      return session;
    }
  } catch (e) {}
}

/**
 * Retrieve current active match session
 */
export async function getActiveMatch() {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_MATCH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Clear active match session (e.g. on game completion or when user taps End Game)
 */
export async function clearActiveMatch() {
  try {
    await AsyncStorage.removeItem(ACTIVE_MATCH_KEY);
  } catch (e) {}
}
