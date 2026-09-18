// Ludo Game Engine - 4 Players (0: Red, 1: Green, 2: Blue, 3: Yellow)

export const PLAYERS = [
  {
    id: 0,
    name: 'Player 1 (Red)',
    shortName: 'P1',
    color: '#EF4444',
    bgDark: '#991B1B',
    accentColor: '#F87171',
    startCell: { r: 1, c: 6 },
    startTrackIndex: 0,
    isAi: false,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Player1Male',
  },
  {
    id: 1,
    name: 'Player 2 (Green)',
    shortName: 'P2',
    color: '#10B981',
    bgDark: '#065F46',
    accentColor: '#34D399',
    startCell: { r: 6, c: 13 },
    startTrackIndex: 13,
    isAi: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Player2Female',
  },
  {
    id: 2,
    name: 'Player 4 (Blue)',
    shortName: 'P4',
    color: '#3B82F6',
    bgDark: '#1E40AF',
    accentColor: '#60A5FA',
    startCell: { r: 13, c: 8 },
    startTrackIndex: 26,
    isAi: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Player4Female',
  },
  {
    id: 3,
    name: 'Player 3 (Yellow)',
    shortName: 'P3',
    color: '#F59E0B',
    bgDark: '#92400E',
    accentColor: '#FBBF24',
    startCell: { r: 8, c: 1 },
    startTrackIndex: 39,
    isAi: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Player3Male',
  },
];

// Global 52 main track coordinates in clockwise sequence starting from Red entry (1,6)
export const MAIN_TRACK = [
  { r: 1, c: 6 }, { r: 2, c: 6 }, { r: 3, c: 6 }, { r: 4, c: 6 }, { r: 5, c: 6 },
  { r: 6, c: 5 }, { r: 6, c: 4 }, { r: 6, c: 3 }, { r: 6, c: 2 }, { r: 6, c: 1 }, { r: 6, c: 0 },
  { r: 7, c: 0 },
  { r: 8, c: 0 }, { r: 8, c: 1 }, { r: 8, c: 2 }, { r: 8, c: 3 }, { r: 8, c: 4 }, { r: 8, c: 5 },
  { r: 9, c: 6 }, { r: 10, c: 6 }, { r: 11, c: 6 }, { r: 12, c: 6 }, { r: 13, c: 6 }, { r: 14, c: 6 },
  { r: 14, c: 7 },
  { r: 14, c: 8 }, { r: 13, c: 8 }, { r: 12, c: 8 }, { r: 11, c: 8 }, { r: 10, c: 8 }, { r: 9, c: 8 },
  { r: 8, c: 9 }, { r: 8, c: 10 }, { r: 8, c: 11 }, { r: 8, c: 12 }, { r: 8, c: 13 }, { r: 8, c: 14 },
  { r: 7, c: 14 },
  { r: 6, c: 14 }, { r: 6, c: 13 }, { r: 6, c: 12 }, { r: 6, c: 11 }, { r: 6, c: 10 }, { r: 6, c: 9 },
  { r: 5, c: 8 }, { r: 4, c: 8 }, { r: 3, c: 8 }, { r: 2, c: 8 }, { r: 1, c: 8 }, { r: 0, c: 8 },
  { r: 0, c: 7 }, { r: 0, c: 6 },
];

// Home stretches leading to victory center
export const HOME_STRETCHES = {
  0: [{ r: 1, c: 7 }, { r: 2, c: 7 }, { r: 3, c: 7 }, { r: 4, c: 7 }, { r: 5, c: 7 }, { r: 6, c: 7 }], // Red
  1: [{ r: 7, c: 13 }, { r: 7, c: 12 }, { r: 7, c: 11 }, { r: 7, c: 10 }, { r: 7, c: 9 }, { r: 7, c: 8 }], // Green
  2: [{ r: 13, c: 7 }, { r: 12, c: 7 }, { r: 11, c: 7 }, { r: 10, c: 7 }, { r: 9, c: 7 }, { r: 8, c: 7 }], // Blue
  3: [{ r: 7, c: 1 }, { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }, { r: 7, c: 6 }], // Yellow
};

// Safe spots where tokens cannot be captured
export const SAFE_TRACK_INDEXES = [0, 8, 13, 21, 26, 34, 39, 47];

export const initialTokens = () => [
  // Red (Player 0)
  { id: 'r0', player: 0, stepCount: 0 },
  { id: 'r1', player: 0, stepCount: 0 },
  { id: 'r2', player: 0, stepCount: 0 },
  { id: 'r3', player: 0, stepCount: 0 },
  // Green (Player 1)
  { id: 'g0', player: 1, stepCount: 0 },
  { id: 'g1', player: 1, stepCount: 0 },
  { id: 'g2', player: 1, stepCount: 0 },
  { id: 'g3', player: 1, stepCount: 0 },
  // Blue (Player 2)
  { id: 'b0', player: 2, stepCount: 0 },
  { id: 'b1', player: 2, stepCount: 0 },
  { id: 'b2', player: 2, stepCount: 0 },
  { id: 'b3', player: 2, stepCount: 0 },
  // Yellow (Player 3)
  { id: 'y0', player: 3, stepCount: 0 },
  { id: 'y1', player: 3, stepCount: 0 },
  { id: 'y2', player: 3, stepCount: 0 },
  { id: 'y3', player: 3, stepCount: 0 },
];

/** Convert player stepCount to global track index (0..51) */
export function getGlobalTrackIndex(player, stepCount) {
  if (stepCount < 1 || stepCount > 51) return null;
  const start = PLAYERS[player].startTrackIndex;
  return (start + stepCount - 1) % 52;
}

/** Get board coordinates {r, c} for a given token */
export function getTokenCoordinates(player, stepCount) {
  if (stepCount === 0) return null; // In Base
  if (stepCount <= 51) {
    const trackIdx = getGlobalTrackIndex(player, stepCount);
    return MAIN_TRACK[trackIdx];
  }
  // Home stretch (steps 52..57)
  const homeIdx = stepCount - 52;
  return HOME_STRETCHES[player][homeIdx] || { r: 7, c: 7 };
}

/** Check if global track index is safe */
export function isSafeSpot(globalIdx) {
  return SAFE_TRACK_INDEXES.includes(globalIdx);
}

/** Get movable tokens for player given dice roll (1..6) */
export function getMovableTokens(tokens, player, roll) {
  const playerTokens = tokens.filter((t) => t.player === player && t.stepCount < 57);
  const movable = [];

  for (const token of playerTokens) {
    if (token.stepCount === 0) {
      if (roll === 6) movable.push(token.id);
    } else {
      if (token.stepCount + roll <= 57) {
        movable.push(token.id);
      }
    }
  }

  return movable;
}

/** Execute token move and handle captures according to standard Ludo rules */
export function moveToken(tokens, tokenId, roll) {
  let capturedPlayerName = null;
  const newTokens = tokens.map((t) => {
    if (t.id !== tokenId) return t;

    let newStep = t.stepCount;
    if (t.stepCount === 0) {
      if (roll === 6) newStep = 1;
    } else {
      newStep = Math.min(57, t.stepCount + roll);
    }

    return { ...t, stepCount: newStep };
  });

  const movedToken = newTokens.find((t) => t.id === tokenId);
  if (!movedToken) return { tokens: newTokens, capturedPlayerName };

  // Check capture if token landed on main track (stepCount 1..51)
  if (movedToken.stepCount >= 1 && movedToken.stepCount <= 51) {
    const movedGlobal = getGlobalTrackIndex(movedToken.player, movedToken.stepCount);

    if (movedGlobal !== null && !isSafeSpot(movedGlobal)) {
      for (let i = 0; i < newTokens.length; i++) {
        const other = newTokens[i];
        if (other.player !== movedToken.player && other.stepCount >= 1 && other.stepCount <= 51) {
          const otherGlobal = getGlobalTrackIndex(other.player, other.stepCount);
          if (otherGlobal === movedGlobal) {
            // Capture opponent! Reset token to base
            newTokens[i] = { ...other, stepCount: 0 };
            capturedPlayerName = PLAYERS[other.player].name;
          }
        }
      }
    }
  }

  return { tokens: newTokens, capturedPlayerName };
}

/** AI Bot move selector logic */
export function getBestAiToken(tokens, player, roll) {
  const movableIds = getMovableTokens(tokens, player, roll);
  if (movableIds.length === 0) return null;

  const playerTokens = tokens.filter((t) => movableIds.includes(t.id));

  // Priority 1: Capture opponent token
  for (const token of playerTokens) {
    const { capturedPlayerName } = moveToken(tokens, token.id, roll);
    if (capturedPlayerName) return token.id;
  }

  // Priority 2: Move token into Home (step 57)
  for (const token of playerTokens) {
    if (token.stepCount + roll === 57) return token.id;
  }

  // Priority 3: Spawn new token out of base if roll === 6
  if (roll === 6) {
    const baseToken = playerTokens.find((t) => t.stepCount === 0);
    if (baseToken) return baseToken.id;
  }

  // Priority 4: Advance furthest token
  playerTokens.sort((a, b) => b.stepCount - a.stepCount);
  return playerTokens[0].id;
}

/** Check if any player has won (all 4 tokens home at step 57) */
export function checkLudoWinner(tokens) {
  for (let p = 0; p < 4; p++) {
    const finishedCount = tokens.filter((t) => t.player === p && t.stepCount === 57).length;
    if (finishedCount === 4) {
      return p;
    }
  }
  return null;
}
