import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkAndTriggerVp5Notification } from './vpNotification.js';

export function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDayGap(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2) return null;
  const s1 = String(dateStr1).split('T')[0] || '';
  const s2 = String(dateStr2).split('T')[0] || '';
  const parts1 = s1.split('-').map(Number);
  const parts2 = s2.split('-').map(Number);
  if (parts1.length < 3 || parts2.length < 3) return null;
  const [y1, m1, d1] = parts1;
  const [y2, m2, d2] = parts2;
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return null;
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Progression for daily streak reward progress:
 * 7 days: 0.5 vp daily * 7 = 3.5vp
 * 14 days (7 days from prev): 1vp daily * 7 = 7vp (cumulative 3.5 + 7 = 10.5vp)
 * 30 days (16 days from prev): 1.5vp daily * 16 = 24vp (cumulative 10.5 + 24 = 34.5vp)
 * 50 days (20 days from prev): 2vp daily * 20 = 40vp (cumulative 34.5 + 40 = 74.5vp)
 * 90 days (40 days from prev): 2.5vp daily * 40 = 100vp (cumulative 74.5 + 100 = 174.5vp)
 */
export const DAILY_STREAK_MILESTONES = [
  { day: 7, incrementalVp: 3.5, cumulativeVp: 3.5, rateText: '0.5 VP/day', calcText: '0.5 vp * 7 = 3.5vp' },
  { day: 14, incrementalVp: 7.0, cumulativeVp: 10.5, rateText: '1.0 VP/day', calcText: '7 days * 1vp = +7vp (10.5vp total)' },
  { day: 30, incrementalVp: 24.0, cumulativeVp: 34.5, rateText: '1.5 VP/day', calcText: '16 days * 1.5vp = +24vp (34.5vp total)' },
  { day: 50, incrementalVp: 40.0, cumulativeVp: 74.5, rateText: '2.0 VP/day', calcText: '20 days * 2vp = +40vp (74.5vp total)' },
  { day: 90, incrementalVp: 100.0, cumulativeVp: 174.5, rateText: '2.5 VP/day', calcText: '40 days * 2.5vp = +100vp (174.5vp total)' },
];

/**
 * Progression for consecutive winning streak per game:
 * 1-3 wins: reward 1 VP
 * 1-5 wins: reward 1.5 VP
 * 1-7 wins: reward 2 VP
 * 1-10 wins: reward 3 VP
 *
 * Gating rule: If a player does not claim 1-3, 1-5 does not show, etc.
 */
export const WIN_STREAK_TIERS = [
  { tier: 1, targetWins: 3, rewardVp: 1.0, label: '1-3 Consecutive Wins', shortLabel: '1-3 Wins' },
  { tier: 2, targetWins: 5, rewardVp: 1.5, label: '1-5 Consecutive Wins', shortLabel: '1-5 Wins' },
  { tier: 3, targetWins: 7, rewardVp: 2.0, label: '1-7 Consecutive Wins', shortLabel: '1-7 Wins' },
  { tier: 4, targetWins: 10, rewardVp: 3.0, label: '1-10 Consecutive Wins', shortLabel: '1-10 Wins' },
];

/**
 * Get current progressive win streak state for a specific game
 */
export function getGameWinStreakState(userProfile, gameKey = 'whot') {
  const normKey = String(gameKey || 'whot').toLowerCase();
  const canonKey = normKey === 'draft' || normKey === 'checkers' ? 'draughts' : normKey;
  const gameStats = userProfile?.gameStats || {};
  const gameData = gameStats[canonKey] || gameStats[normKey] || {};

  const winStreak = Number(gameData.winStreak ?? 0);
  const claimedTier = Number(gameData.claimedWinStreakTier ?? 0); // 0 = none claimed, 1 = 1-3 claimed, etc.

  const isCompletedAll = claimedTier >= WIN_STREAK_TIERS.length;
  // Current active tier to show (tier N+1 will NOT show until tier N is claimed)
  const activeTier = isCompletedAll ? null : WIN_STREAK_TIERS[claimedTier];

  const canClaim = Boolean(activeTier && winStreak >= activeTier.targetWins);
  const winsNeeded = activeTier ? Math.max(0, activeTier.targetWins - winStreak) : 0;

  return {
    gameKey: canonKey,
    winStreak,
    claimedTier,
    activeTier,
    isCompletedAll,
    canClaim,
    winsNeeded,
    tiers: WIN_STREAK_TIERS,
  };
}

/**
 * Record match completion for both:
 * 1. Daily Play Streak (playing games on consecutive calendar days)
 * 2. Win Streak (consecutive match wins without a loss)
 */
export async function recordGameStreak(updateProfileData, userProfile, isWinner = null) {
  if (typeof updateProfileData !== 'function') return;
  const todayStr = getLocalDateString();

  // 1. Daily Play Streak logic
  const currentDailyStreak = Number(userProfile?.dailyPlayStreak ?? userProfile?.streak ?? userProfile?.currentStreak ?? 0);
  const lastPlayedDate = userProfile?.lastPlayedDate || userProfile?.lastStreakDate || null;

  let newDailyStreak = currentDailyStreak;
  if (!lastPlayedDate) {
    newDailyStreak = 1; // First day playing!
  } else {
    const gap = getDayGap(lastPlayedDate, todayStr);
    if (gap === 0) {
      newDailyStreak = Math.max(1, currentDailyStreak);
    } else if (gap === 1) {
      newDailyStreak = currentDailyStreak + 1;
    } else if (gap > 1) {
      newDailyStreak = 1;
    }
  }

  // 2. Global Win Streak logic
  const currentWinStreak = Number(userProfile?.winStreak ?? userProfile?.currentWinStreak ?? 0);
  let newWinStreak = currentWinStreak;
  if (isWinner === true) {
    newWinStreak = currentWinStreak + 1;
  } else if (isWinner === false) {
    newWinStreak = 0;
  }

  // 3. Daily Streak Unlock & Progressive Value Point Rewards
  let extraVpAward = 0;
  let lastAwardedMilestone = Number(userProfile?.lastStreakMilestoneAwarded ?? 0);
  let newLastAwardedMilestone = lastAwardedMilestone;

  for (const milestone of DAILY_STREAK_MILESTONES) {
    if (newDailyStreak >= milestone.day && lastAwardedMilestone < milestone.day) {
      extraVpAward += milestone.incrementalVp;
      newLastAwardedMilestone = Math.max(newLastAwardedMilestone, milestone.day);
    }
  }

  const currentValuePoints = Number(userProfile?.valuePoints ?? userProfile?.vp ?? 0);
  const finalVp = extraVpAward > 0 ? Math.round((currentValuePoints + extraVpAward) * 10) / 10 : currentValuePoints;

  try {
    const payload = {
      dailyPlayStreak: newDailyStreak,
      streak: newDailyStreak,
      currentStreak: newDailyStreak,
      winStreak: newWinStreak,
      currentWinStreak: newWinStreak,
      lastPlayedDate: todayStr,
      lastStreakDate: todayStr,
      lastCheckInDate: todayStr,
      streak7Unlocked: newDailyStreak >= 7,
    };

    if (extraVpAward > 0) {
      payload.valuePoints = finalVp;
      payload.vp = finalVp;
      payload.lastStreakMilestoneAwarded = newLastAwardedMilestone;
    }

    await updateProfileData(payload);

    // If total VP reaches 10+, trigger 10 VP milestone notifications (1.4 & 2.2)
    if (finalVp >= 10) {
      checkAndTriggerVp5Notification(
        finalVp,
        userProfile?.uid,
        userProfile?.username || userProfile?.displayName || userProfile?.name
      );
    }
  } catch (err) {
    console.log('Notice: Could not record game streak:', err?.message || err);
  }
}

/**
 * 2.3 Daily Streak Reminder – Less Than 4 Hours Remaining
 * Checks if the user's daily streak is at risk (not yet played today) and < 4 hours remain before midnight.
 * If so, records the In-App notification once per calendar day.
 */
export async function checkAndTriggerStreak4hNotification(userProfile) {
  const uid = userProfile?.uid;
  if (!uid) return false;

  const streakInfo = getDailyStreakInfo(userProfile);
  if (!streakInfo?.isAtRisk) return false;

  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const hoursRemaining = (endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursRemaining > 4 || hoursRemaining <= 0) return false;

  const todayStr = getLocalDateString(now);
  const reminderKey = `@gamearn_streak_4h_notified_${uid}_${todayStr}`;

  try {
    const alreadySent = await AsyncStorage.getItem(reminderKey);
    if (alreadySent === 'true') return false;

    const username = String(userProfile?.username || userProfile?.displayName || userProfile?.name || 'Player').trim();
    const keyTarget = `@gamearn_notifications_${uid}`;
    const keyAll = '@gamearn_notifications_all';

    const notif = {
      id: `streak_4h_${uid}_${todayStr}`,
      type: 'streak_reminder',
      title: 'Your Daily Streak Is About to Expire! 🔥',
      message: `Hey ${username}, your daily streak is at risk! You have less than 4 hours left to keep it alive. Open GAMEARN and complete your daily activity now!`,
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
      AsyncStorage.setItem(reminderKey, 'true'),
    ]);

    return true;
  } catch (err) {
    console.log('Notice: Could not trigger 4h streak notification:', err?.message || err);
    return false;
  }
}

/**
 * Get Daily Play Streak info for Dashboard
 */
export function getDailyStreakInfo(userProfile) {
  const todayStr = getLocalDateString();
  const rawStreak = Number(userProfile?.dailyPlayStreak ?? userProfile?.streak ?? userProfile?.currentStreak ?? 0);
  const lastDate = userProfile?.lastPlayedDate || userProfile?.lastStreakDate || userProfile?.lastCheckInDate || null;
  const gap = lastDate ? getDayGap(lastDate, todayStr) : null;

  // Case 1: No streak started yet
  if (rawStreak <= 0) {
    return {
      dayText: 'Day 0',
      statusText: 'Inactive',
      isAtRisk: false,
      isActive: false,
      isInactive: true,
      streakNumber: 0,
      subText: 'Play a game today to start your daily play streak!',
    };
  }

  // Case 2: Missed 2+ days (streak expired) -> Inactive (red)
  if (gap !== null && gap > 1) {
    return {
      dayText: 'Day 0',
      statusText: 'Inactive',
      isAtRisk: false,
      isActive: false,
      isInactive: true,
      streakNumber: 0,
      subText: 'Streak lost! Play a game today to start a new streak.',
    };
  }

  // Case 3: Played today (gap === 0) -> Streak completed and active for today!
  if (gap === 0) {
    return {
      dayText: `Day ${rawStreak}`,
      statusText: 'Active',
      isAtRisk: false,
      isActive: true,
      isInactive: false,
      streakNumber: rawStreak,
      subText: `🔥 ${rawStreak}-day play streak active!`,
    };
  }

  // Case 4: Streak alive from yesterday (gap === 1 or not yet played today).
  return {
    dayText: `Day ${rawStreak}`,
    statusText: 'At Risk',
    isAtRisk: true,
    isActive: false,
    isInactive: false,
    streakNumber: rawStreak,
    subText: 'Play a game today to keep your streak!',
  };
}

/**
 * Alias for getDailyStreakInfo
 */
export function getStreakInfo(userProfile) {
  return getDailyStreakInfo(userProfile);
}

/**
 * Get Win Streak info for Game Over screen (backward compatible)
 */
export function getWinStreakInfo(userProfile) {
  const winCount = Number(userProfile?.winStreak ?? userProfile?.currentWinStreak ?? 0);

  if (winCount <= 0) {
    return {
      winText: '0 Wins',
      statusText: 'Win Streak',
      isActive: false,
      winCount: 0,
      subText: 'Win a match to start a win streak!',
    };
  }

  return {
    winText: `${winCount} ${winCount === 1 ? 'Win' : 'Wins'}`,
    statusText: 'Win Streak',
    isActive: true,
    winCount,
    subText: `🔥 ${winCount} win streak!`,
  };
}
