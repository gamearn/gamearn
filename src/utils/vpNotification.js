import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 10 VP notification has been retired per product requirements.
 * Also purges any previously stored 10 VP milestone notifications from local storage.
 */
export async function checkAndTriggerVp10Notification(_currentVp, uid) {
  try {
    const keys = ['@gamearn_notifications_all', '@gamearn_notifications_me'];
    if (uid) keys.push(`@gamearn_notifications_${uid}`);
    for (const key of keys) {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) continue;
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        const filtered = list.filter(
          (n) =>
            !String(n?.id || '').startsWith('vp10_eligible_') &&
            n?.type !== '10_vp_milestone' &&
            !String(n?.title || '').includes('Reached 10 VP') &&
            !String(n?.message || '').includes('10 VP withdrawal threshold')
        );
        if (filtered.length !== list.length) {
          await AsyncStorage.setItem(key, JSON.stringify(filtered));
        }
      }
    }
  } catch {
    // Non-critical
  }
  return false;
}

export const checkAndTriggerVp5Notification = checkAndTriggerVp10Notification;

