// Shared helper for handling notification taps. Stores a pending navigation
// target when a notification opens the app, so the navigator can dispatch it
// once the user is authenticated (notifications can arrive on the login screen).

let navigationRef = null;
let pendingTarget = null;
let awaitingAuth = false;

export const setNavigationRef = (ref) => { navigationRef = ref; };

/**
 * Map a push/in-app notification payload to a React Navigation target.
 * Challenge notifications go to the Challenge hub (open tab); match/accepted
 * notifications go to the game lobby or straight into the room.
 */
export const resolveNotificationTarget = (info = {}) => {
  const type = String(info.type || '').toLowerCase();
  // `refresh` changes on every tap so an already-open hub re-reads its params.
  const refresh = Date.now();
  // Someone accepted my challenge: the Join Match button lives on the
  // My Challenges tab. (GameLobby ignores a roomId param, so do not send it there.)
  if (type === 'challenge_accepted') {
    return { name: 'ChallengeHub', params: { tab: 'mine', refresh } };
  }
  // Challenge requests / new open challenges -> the Open tab.
  if (type === 'challenge_request' || type === 'challenge_created') {
    return { name: 'ChallengeHub', params: { tab: 'open', refresh } };
  }
  // A match is ready — go to the room when we have one.
  if ((type === 'match_found' || type === 'your_turn') && info.roomId) {
    return { name: 'GameLobby', params: { roomId: info.roomId } };
  }
  return null;
};

/**
 * Queue a notification target for navigation. If a navigator is ready and the
 * user is authenticated (caller passes ready=true), navigate immediately;
 * otherwise hold it until consumeNotificationTarget() is called after auth.
 */
export const queueNotificationTarget = (info, ready = false) => {
  const target = resolveNotificationTarget(info);
  if (!target) return false;
  pendingTarget = target;
  awaitingAuth = !ready;
  if (ready) consumeNotificationTarget();
  return true;
};

/** Consume and dispatch any queued target. Call once when auth becomes ready.
 *  If the navigator is not mounted yet (cold start from a tap), keep the
 *  target and retry a few times instead of dropping it. */
export const consumeNotificationTarget = (attempt = 0) => {
  if (!pendingTarget) return false;
  const nav = navigationRef?.current;
  if (nav && (typeof nav.isReady !== 'function' || nav.isReady())) {
    const target = pendingTarget;
    pendingTarget = null;
    awaitingAuth = false;
    try {
      nav.navigate(target.name, target.params);
      return true;
    } catch (e) {
      return false;
    }
  }
  if (attempt < 10) setTimeout(() => consumeNotificationTarget(attempt + 1), 300);
  return false;
};

export const hasPendingTarget = () => !!pendingTarget;
export const isAwaitingAuth = () => awaitingAuth;
