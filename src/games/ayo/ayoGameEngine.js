export function createAyoInitialState() {
  // Standard Ayo Olopon: 12 pits, 4 seeds per pit (48 total)
  return {
    pits: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    scores: [0, 0], // Index 0: Player 1 (You), Index 1: Player 2 (AI)
    activePlayer: 1, // 1: You (bottom row: pits 6..11), 2: AI (top row: pits 0..5)
    gameStatus: 'playing',
    winner: null,
    statusMessage: 'Your turn! Tap one of your bottom pits (1–6) to sow seeds.',
  };
}

export function isValidAyoMove(state, pitIndex) {
  if (state.gameStatus !== 'playing') return false;

  const { activePlayer, pits } = state;
  // Player 1 (You) owns pits 6..11
  // Player 2 (AI) owns pits 0..5
  if (activePlayer === 1 && (pitIndex < 6 || pitIndex > 11)) return false;
  if (activePlayer === 2 && (pitIndex < 0 || pitIndex > 5)) return false;

  return pits[pitIndex] > 0;
}

export function sowAyoSeeds(state, pitIndex) {
  if (!isValidAyoMove(state, pitIndex)) {
    return {
      ...state,
      statusMessage: state.activePlayer === 1
        ? 'Select a non-empty pit on your bottom row!'
        : 'Wait for your turn!',
    };
  }

  const pits = [...state.pits];
  const scores = [...state.scores];
  const player = state.activePlayer;

  let hand = pits[pitIndex];
  pits[pitIndex] = 0;

  let curr = pitIndex;
  while (hand > 0) {
    curr = (curr + 1) % 12;
    // Skip original pit if hand was >= 12
    if (curr === pitIndex) continue;
    pits[curr]++;
    hand--;
  }

  // Capture logic
  // Player 1 (You) captures on Opponent side (pits 0..5)
  // Player 2 (AI) captures on Your side (pits 6..11)
  let totalCaptured = 0;
  let check = curr;
  const isOpponentSide = (idx) => (player === 1 ? idx >= 0 && idx <= 5 : idx >= 6 && idx <= 11);

  while (isOpponentSide(check) && (pits[check] === 2 || pits[check] === 3)) {
    totalCaptured += pits[check];
    pits[check] = 0;
    check = (check - 1 + 12) % 12;
  }

  scores[player - 1] += totalCaptured;

  // Check Victory
  let gameStatus = 'playing';
  let winner = null;
  let msg = `Player ${player === 1 ? '1 (You)' : '2 (AI)'} sowed pit ${pitIndex + 1}.`;
  if (totalCaptured > 0) {
    msg += ` Captured ${totalCaptured} seed${totalCaptured > 1 ? 's' : ''}! 🎉`;
  }

  if (scores[0] > 24) {
    gameStatus = 'game_over';
    winner = 1;
    msg = '🎉 Victory! You won Ayo Olopon with ' + scores[0] + ' seeds!';
  } else if (scores[1] > 24) {
    gameStatus = 'game_over';
    winner = 2;
    msg = '💔 Game Over! Oba won with ' + scores[1] + ' seeds.';
  } else {
    // Check if remaining seeds on board are too few or next player has no valid moves
    const nextPlayer = player === 1 ? 2 : 1;
    const nextPitsRange = nextPlayer === 1 ? [6, 7, 8, 9, 10, 11] : [0, 1, 2, 3, 4, 5];
    const nextHasSeeds = nextPitsRange.some((idx) => pits[idx] > 0);

    if (!nextHasSeeds) {
      // Collect remaining seeds for current player
      const remainingSeeds = pits.reduce((a, b) => a + b, 0);
      scores[player - 1] += remainingSeeds;
      for (let i = 0; i < 12; i++) pits[i] = 0;

      gameStatus = 'game_over';
      if (scores[0] > scores[1]) {
        winner = 1;
        msg = `🎉 You won ${scores[0]} - ${scores[1]}!`;
      } else if (scores[1] > scores[0]) {
        winner = 2;
        msg = `💔 Oba won ${scores[1]} - ${scores[0]}!`;
      } else {
        winner = 'draw';
        msg = `🤝 Game ended in a tie (${scores[0]} - ${scores[1]})!`;
      }
    }
  }

  return {
    ...state,
    pits,
    scores,
    activePlayer: player === 1 ? 2 : 1,
    gameStatus,
    winner,
    statusMessage: msg,
  };
}

export function getAyoAiMove(state, difficulty = 'medium') {
  const validPits = [0, 1, 2, 3, 4, 5].filter((i) => state.pits[i] > 0);
  if (validPits.length === 0) return null;

  if (difficulty === 'easy') {
    // 45% chance to pick a random legal pit to play sub-optimally
    if (Math.random() < 0.45) {
      return validPits[Math.floor(Math.random() * validPits.length)];
    }
  }

  if (difficulty === 'hard') {
    // 2-step lookahead minimax heuristic
    let bestPit = validPits[0];
    let maxNetScore = -999;

    for (const pitIdx of validPits) {
      const testState = sowAyoSeeds(state, pitIdx);
      const scoreGained = testState.scores[1] - state.scores[1];

      // Evaluate opponent's best response capture
      const playerValidPits = [6, 7, 8, 9, 10, 11].filter((i) => testState.pits[i] > 0);
      let oppMaxScore = 0;
      for (const oppPit of playerValidPits) {
        const oppState = sowAyoSeeds(testState, oppPit);
        const oppGained = oppState.scores[0] - testState.scores[0];
        if (oppGained > oppMaxScore) oppMaxScore = oppGained;
      }

      const netScore = scoreGained - oppMaxScore * 0.8;
      if (netScore > maxNetScore) {
        maxNetScore = netScore;
        bestPit = pitIdx;
      }
    }
    return bestPit;
  }

  // Medium / Default (1-step greedy capture)
  let bestPit = validPits[0];
  let maxScore = -1;

  for (const pitIdx of validPits) {
    const testState = sowAyoSeeds(state, pitIdx);
    const scoreGained = testState.scores[1] - state.scores[1];
    if (scoreGained > maxScore) {
      maxScore = scoreGained;
      bestPit = pitIdx;
    }
  }

  return bestPit;
}
