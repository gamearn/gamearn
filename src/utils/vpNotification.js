import AsyncStorage from '@react-native-async-storage/async-storage';
import { wallet as walletApi } from '../services/api.js';

/**
 * 1.4 & 2.2 Reaching 10 VP Milestone
 * Check if the user has reached 10 VP or above (minimum withdrawal threshold).
 * If yes and not already notified, sends:
 * 1. In-app notification saved to user's notifications storage:
 *    "Congratulations, {{username}}! You've reached the minimum 10 VP withdrawal threshold. Head to your account to proceed!"
 * 2. Transactional email (1.4) + push/server in-app notification (2.2) via POST /wallet/notify-vp-milestone
 *
 * @param {number} currentVp - Current Value Points
 * @param {string} uid - User UID
 * @param {string} [username] - User display name or username
 * @returns {Promise<boolean>} Whether notification was triggered
 */
export async function checkAndTriggerVp10Notification(currentVp, uid, username = '') {
  const vpNum = Number(currentVp || 0);
  if (!uid || vpNum < 10) return false;

  try {
    const notifyKey = `@gamearn_vp10_notified_${uid}`;
    const alreadyNotified = await AsyncStorage.getItem(notifyKey);
    if (alreadyNotified === 'true') {
      return false;
    }

    const displayUser = String(username || '').trim() || 'Player';

    // 1. Create and persist in-app notification (2.2 Reaching 10 VP)
    const keyTarget = `@gamearn_notifications_${uid}`;
    const keyAll = '@gamearn_notifications_all';

    const notif = {
      id: `vp10_eligible_${uid}_${Date.now()}`,
      type: 'reward',
      title: "Congratulations! You've Reached 10 VP! 🎉",
      message: `Congratulations, ${displayUser}! You've reached the minimum 10 VP withdrawal threshold. Head to your account to proceed!`,
      actionType: 'dashboard',
      actionPayload: { screen: 'MainTabs', tab: 'Home' },
      createdAt: Date.now(),
      read: false,
    };

    const [tRaw, aRaw] = await Promise.all([
      AsyncStorage.getItem(keyTarget),
      AsyncStorage.getItem(keyAll),
    ]);
    const tList = tRaw ? JSON.parse(tRaw) : [];
    const aList = aRaw ? JSON.parse(aRaw) : [];

    tList.unshift(notif);
    aList.unshift(notif);

    await Promise.all([
      AsyncStorage.setItem(keyTarget, JSON.stringify(tList.slice(0, 50))),
      AsyncStorage.setItem(keyAll, JSON.stringify(aList.slice(0, 50))),
      AsyncStorage.setItem(notifyKey, 'true'),
    ]);

    // 2. Dispatch email (1.4) + push notification (2.2) to backend
    if (walletApi && typeof walletApi.notifyVpMilestone === 'function') {
      walletApi.notifyVpMilestone().catch((err) => {
        console.log('Notice: Failed sending 10 VP milestone notification:', err?.message || err);
      });
    }

    return true;
  } catch (err) {
    console.log('Notice: Could not trigger VP10 notification:', err?.message || err);
    return false;
  }
}

// Keep alias for backward-compatible imports across the codebase
export const checkAndTriggerVp5Notification = checkAndTriggerVp10Notification;
