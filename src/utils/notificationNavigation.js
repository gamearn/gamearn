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
  // A match is ready — go straight to the room when we have one.
  if ((type === 'match_found' || type === 'challenge_accepted' || type === 'your_turn') && info.roomId) {
    return { name: 'GameLobby', params: { roomId: info.roomId } };
  }
  // Challenge requests / new open challenges → the challenge hub.
  if (type === 'challenge_request' || type === 'challenge_created' || type === 'challenge_accepted') {
    return { name: 'ChallengeHub', params: { tab: 'open' } };
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
  if (ready && navigationRef?.current) {
    try {
      navigationRef.current.navigate(target.name, target.params);
      return true;
    } catch (e) {
      // fall through to queue
    }
  }
  pendingTarget = target;
  awaitingAuth = !ready;
  return true;
};

/** Consume and dispatch any queued target. Call once when auth becomes ready. */
export const consumeNotificationTarget = () => {
  if (!pendingTarget) return false;
  const target = pendingTarget;
  pendingTarget = null;
  awaitingAuth = false;
  if (navigationRef?.current) {
    try {
      navigationRef.current.navigate(target.name, target.params);
      return true;
    } catch (e) {
      // ignore
    }
  }
  return false;
};

export const hasPendingTarget = () => !!pendingTarget;
export const isAwaitingAuth = () => awaitingAuth;
