export function createAyoInitialState(seedCount = 4) {
  const count = typeof seedCount === 'number' && seedCount > 0 ? seedCount : 4;
  return {
    pits: Array(12).fill(count),
    scores: [0, 0], // Index 0: Player 1 (You), Index 1: Player 2 (Oba)
    activePlayer: 1, // 1: You (bottom row: pits 0..5), 2: Oba (top row: pits 6..11)
    gameStatus: 'playing',
    winner: null,
    seedCount: count,
    statusMessage: 'Your turn! Tap one of your bottom pits (1–6) to sow seeds.',
  };
}

function moveReachesOpponent(pits, pitIndex, oppRange) {
  let hand = pits[pitIndex];
  let curr = pitIndex;
  while (hand > 0) {
    curr = (curr + 1) % 12;
    if (curr === pitIndex) continue;
    if (oppRange.includes(curr)) return true;
    hand--;
  }
  return false;
}

export function isValidAyoMove(state, pitIndex) {
  if (!state || state.gameStatus !== 'playing') return false;

  const { activePlayer, pits } = state;
  const isPlayer1 = activePlayer === 1;

  // Player 1 owns bottom row (0..5)
  // Player 2 owns top row (6..11)
  if (isPlayer1 && (pitIndex < 0 || pitIndex > 5)) return false;
  if (!isPlayer1 && (pitIndex < 6 || pitIndex > 11)) return false;

  if (pits[pitIndex] <= 0) return false;

  // Must-feed ("Je ki o je") check: if opponent has 0 seeds on board
  const oppRange = isPlayer1 ? [6, 7, 8, 9, 10, 11] : [0, 1, 2, 3, 4, 5];
  const oppTotalSeeds = oppRange.reduce((sum, idx) => sum + pits[idx], 0);

  if (oppTotalSeeds === 0) {
    const playerPits = isPlayer1 ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11];
    const feedingMoves = playerPits.filter((i) => pits[i] > 0 && moveReachesOpponent(pits, i, oppRange));

    if (feedingMoves.length > 0) {
      return moveReachesOpponent(pits, pitIndex, oppRange);
    }
  }

  return true;
}

export function getAyoMoveSteps(state, pitIndex) {
  if (!isValidAyoMove(state, pitIndex)) {
    return {
      steps: [],
      finalState: {
        ...state,
        statusMessage: state.activePlayer === 1
          ? 'Select a valid pit on your row!'
          : 'Wait for your turn!',
      },
    };
  }

  const steps = [];
  const pits = [...state.pits];
  const scores = [...state.scores];
  const player = state.activePlayer;
  const seedCount = state.seedCount || 4;
  const totalBoardSeeds = seedCount * 12;
  const winningScore = Math.floor(totalBoardSeeds / 2) + 1;

  let hand = pits[pitIndex];
  pits[pitIndex] = 0;

  const playerLabel = player === 1 ? 'You' : 'Oba';
  const startPitNum = pitIndex < 6 ? pitIndex + 1 : 12 - pitIndex;

  // Frame 0: Pick up seeds
  steps.push({
    pits: [...pits],
    activePit: pitIndex,
    seedsInHand: hand,
    scores: [...scores],
    message: `${playerLabel} picked ${hand} seed${hand > 1 ? 's' : ''} from pit ${startPitNum}`,
    capturedPits: [],
  });

  let curr = pitIndex;
  const startingPit = pitIndex;

  while (hand > 0) {
    curr = (curr + 1) % 12;
    // 12-seed lap skip rule: skip starting pit if lap exceeds 11 seeds
    if (curr === startingPit) continue;

    pits[curr]++;
    hand--;

    const pitNumLabel = curr < 6 ? curr + 1 : 12 - curr;
    steps.push({
      pits: [...pits],
      activePit: curr,
      seedsInHand: hand,
      scores: [...scores],
      message: `Sowing into pit ${pitNumLabel}... (${hand} left)`,
      capturedPits: [],
    });
  }

  const lastPit = curr;
  let check = lastPit;
  const isOpponentPit = (idx) => (player === 1 ? idx >= 6 && idx <= 11 : idx >= 0 && idx <= 5);

  let captureIndices = [];
  let totalCaptured = 0;

  while (isOpponentPit(check) && (pits[check] === 2 || pits[check] === 3)) {
    captureIndices.push(check);
    totalCaptured += pits[check];
    check = (check - 1 + 12) % 12;
  }

  // Grand Slam Prohibition: cannot capture ALL opponent seeds
  if (totalCaptured > 0) {
    const oppRange = player === 1 ? [6, 7, 8, 9, 10, 11] : [0, 1, 2, 3, 4, 5];
    const remainingOppSeeds = oppRange.reduce((sum, idx) => {
      return sum + (captureIndices.includes(idx) ? 0 : pits[idx]);
    }, 0);

    if (remainingOppSeeds === 0) {
      captureIndices = [];
      totalCaptured = 0;
    }
  }

  if (totalCaptured > 0) {
    captureIndices.forEach((idx) => {
      pits[idx] = 0;
    });
    scores[player - 1] += totalCaptured;

    steps.push({
      pits: [...pits],
      activePit: lastPit,
      seedsInHand: 0,
      scores: [...scores],
      message: `🎉 Packed ${totalCaptured} seed${totalCaptured > 1 ? 's' : ''}!`,
      capturedPits: [...captureIndices],
    });
  }

  let gameStatus = 'playing';
  let winner = null;
  let finalMsg = `${playerLabel} sowed pit ${startPitNum}.${totalCaptured > 0 ? ` Packed ${totalCaptured} seeds!` : ''}`;

  if (scores[0] >= winningScore) {
    gameStatus = 'game_over';
    winner = 1;
    finalMsg = `🎉 Victory! You won Ayò with ${scores[0]} seeds!`;
  } else if (scores[1] >= winningScore) {
    gameStatus = 'game_over';
    winner = 2;
    finalMsg = `💔 Game Over! Oba won with ${scores[1]} seeds.`;
  } else {
    const nextPlayer = player === 1 ? 2 : 1;
    const nextPitsRange = nextPlayer === 1 ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11];
    const nextHasSeeds = nextPitsRange.some((idx) => pits[idx] > 0);

    if (!nextHasSeeds) {
      const remainingSeeds = pits.reduce((a, b) => a + b, 0);
      scores[player - 1] += remainingSeeds;
      for (let i = 0; i < 12; i++) pits[i] = 0;

      gameStatus = 'game_over';
      if (scores[0] > scores[1]) {
        winner = 1;
        finalMsg = `🎉 You won ${scores[0]} - ${scores[1]}!`;
      } else if (scores[1] > scores[0]) {
        winner = 2;
        finalMsg = `💔 Oba won ${scores[1]} - ${scores[0]}!`;
      } else {
        winner = 'draw';
        finalMsg = `🤝 Game ended in a tie (${scores[0]} - ${scores[1]})!`;
      }
    }
  }

  const finalState = {
    ...state,
    pits,
    scores,
    activePlayer: gameStatus === 'game_over' ? state.activePlayer : (player === 1 ? 2 : 1),
    gameStatus,
    winner,
    statusMessage: finalMsg,
    seedCount,
  };

  return { steps, finalState };
}

export function sowAyoSeeds(state, pitIndex) {
  const { finalState } = getAyoMoveSteps(state, pitIndex);
  return finalState;
}

export function getAyoAiMove(state, difficulty = 'medium') {
  const validPits = [6, 7, 8, 9, 10, 11].filter((i) => isValidAyoMove(state, i));
  if (validPits.length === 0) return null;

  if (difficulty === 'easy') {
    if (Math.random() < 0.45) {
      return validPits[Math.floor(Math.random() * validPits.length)];
    }
  }

  if (difficulty === 'hard') {
    let bestPit = validPits[0];
    let maxNetScore = -999;

    for (const pitIdx of validPits) {
      const testState = sowAyoSeeds(state, pitIdx);
      const scoreGained = testState.scores[1] - state.scores[1];

      const playerValidPits = [0, 1, 2, 3, 4, 5].filter((i) => isValidAyoMove(testState, i));
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

  // Medium / Default
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

