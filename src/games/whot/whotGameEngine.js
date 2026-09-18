const SHAPE_COLORS = {
  cross: '#f9002c',
  square: '#00bb50',
  circle: '#9400df',
  triangle: '#292533',
  whot: '#ffcc00',
};

// Generate full standard Nigerian WHOT deck (54 cards)
export function createDeck() {
  const deck = [];
  let cardId = 1;

  // Circles: 1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14
  const circles = [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14];
  circles.forEach((val) => {
    deck.push({ id: `c_${cardId++}`, value: val, color: SHAPE_COLORS.circle, shape: 'circle' });
  });

  // Triangles: 1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14
  const triangles = [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14];
  triangles.forEach((val) => {
    deck.push({ id: `t_${cardId++}`, value: val, color: SHAPE_COLORS.triangle, shape: 'triangle' });
  });

  // Crosses: 1, 2, 3, 5, 7, 10, 11, 13, 14
  const crosses = [1, 2, 3, 5, 7, 10, 11, 13, 14];
  crosses.forEach((val) => {
    deck.push({ id: `cr_${cardId++}`, value: val, color: SHAPE_COLORS.cross, shape: 'cross' });
  });

  // Squares: 1, 2, 3, 5, 7, 10, 11, 13, 14
  const squares = [1, 2, 3, 5, 7, 10, 11, 13, 14];
  squares.forEach((val) => {
    deck.push({ id: `sq_${cardId++}`, value: val, color: SHAPE_COLORS.square, shape: 'square' });
  });

  // WHOT Wild cards: 5 cards with value 20
  for (let i = 0; i < 5; i++) {
    deck.push({ id: `w_${cardId++}`, value: 20, color: SHAPE_COLORS.whot, shape: 'whot' });
  }

  // Shuffle deck using Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

export function parseTimerSec(timerStr) {
  if (!timerStr) return 120;
  if (typeof timerStr === 'number') return timerStr;
  if (timerStr.endsWith('s')) return parseInt(timerStr, 10);
  if (timerStr.endsWith('m')) return parseInt(timerStr, 10) * 60;
  return 120;
}

export function createInitialState(timer = '2m') {
  const fullDeck = createDeck();
  const turnSecs = parseTimerSec(timer);

  const players = [
    { id: 0, name: 'You', hand: [], isAi: false, avatarIndex: 3 },
    { id: 1, name: 'QueenBee', hand: [], isAi: true, avatarIndex: 0 },
    { id: 2, name: 'AI Bot', hand: [], isAi: true, avatarIndex: 2 },
    { id: 3, name: 'KingTee', hand: [], isAi: true, avatarIndex: 1 },
  ];

  // Deal 6 cards to each player
  for (let i = 0; i < 6; i++) {
    players.forEach((p) => {
      if (fullDeck.length > 0) {
        p.hand.push(fullDeck.pop());
      }
    });
  }

  // Find a starting non-special, non-20 card for discard pile
  let initialDiscardIndex = fullDeck.findIndex(
    (c) => c.value !== 20 && c.value !== 1 && c.value !== 2 && c.value !== 5 && c.value !== 8 && c.value !== 14
  );
  if (initialDiscardIndex === -1) initialDiscardIndex = 0;

  const discardPile = fullDeck.splice(initialDiscardIndex, 1);

  return {
    players,
    activePlayerIndex: 0,
    drawPile: fullDeck,
    discardPile,
    requestedShape: null,
    pendingDrawPenalty: null,
    turnTimerSeconds: turnSecs,
    secondsRemaining: turnSecs,
    gameStatus: 'playing',
    winner: null,
    statusMessage: 'Your turn! Select a card to play or draw from the pile.',
    coinBalance: 1250,
    dailyBonusSeconds: 8073,
    soundEnabled: true,
    pendingWhotSelection: false,
    messages: [
      { id: '1', sender: 'QueenBee', text: 'Good luck everyone! Let’s play WHOT!', isUser: false },
      { id: '2', sender: 'KingTee', text: 'Watch out for my Pick 2s! 😄', isUser: false },
    ],
  };
}

export function isValidMove(card, topCard, requestedShape, pendingPenalty) {
  if (pendingPenalty) {
    return card.value === pendingPenalty.cardValue;
  }

  if (card.value === 20) {
    return true;
  }

  if (requestedShape) {
    return card.shape === requestedShape;
  }

  return card.shape === topCard.shape || card.value === topCard.value;
}

// Ensure deck has cards by recycling discard pile if draw pile is empty
function ensureDrawPileHasCards(drawPile, discardPile) {
  if (drawPile.length > 0) return { drawPile: [...drawPile], discardPile: [...discardPile] };

  if (discardPile.length <= 1) return { drawPile: [], discardPile: [...discardPile] };

  const topCard = discardPile[discardPile.length - 1];
  const recycled = discardPile.slice(0, discardPile.length - 1);

  for (let i = recycled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [recycled[i], recycled[j]] = [recycled[j], recycled[i]];
  }

  return { drawPile: recycled, discardPile: [topCard] };
}

export function nextPlayerIndex(currentIndex, step = 1) {
  return (currentIndex + step) % 4;
}

export function playCard(state, playerIndex, cardId, chosenShape) {
  if (state.gameStatus === 'game_over') return state;

  const player = state.players[playerIndex];
  const card = player.hand.find((c) => c.id === cardId);
  if (!card) return state;

  const topCard = state.discardPile[state.discardPile.length - 1];
  if (!isValidMove(card, topCard, state.requestedShape, state.pendingDrawPenalty)) {
    return {
      ...state,
      statusMessage: `Invalid move! Must match ${state.requestedShape ? state.requestedShape.toUpperCase() : topCard.shape.toUpperCase()} or number ${topCard.value}.`,
    };
  }

  // Update player hand & discard pile
  const updatedHand = player.hand.filter((c) => c.id !== cardId);
  const updatedPlayers = state.players.map((p, idx) => (idx === playerIndex ? { ...p, hand: updatedHand } : p));
  const updatedDiscard = [...state.discardPile, card];

  // Check victory
  if (updatedHand.length === 0) {
    const isHuman = playerIndex === 0;
    const bonusCoins = isHuman ? 500 : 0;
    return {
      ...state,
      players: updatedPlayers,
      discardPile: updatedDiscard,
      gameStatus: 'game_over',
      winner: player,
      coinBalance: state.coinBalance + bonusCoins,
      statusMessage: `🎉 ${player.name} won the game! ${isHuman ? '+500 Coins rewarded!' : ''}`,
    };
  }

  let nextIdx = nextPlayerIndex(playerIndex);
  let requestedShape = state.requestedShape;
  let pendingPenalty = state.pendingDrawPenalty;
  let msg = `${player.name} played ${card.value === 20 ? 'WHOT (20)' : `${card.value} ${card.shape}`}.`;
  let drawPile = [...state.drawPile];

  // Handle WHOT 20 Shape Request
  if (card.value === 20) {
    if (chosenShape) {
      requestedShape = chosenShape;
      msg = `${player.name} played WHOT (20) and called ${chosenShape.toUpperCase()}!`;
    } else {
      // Waiting for shape selection modal
      return {
        ...state,
        players: updatedPlayers,
        discardPile: updatedDiscard,
        pendingWhotSelection: true,
        statusMessage: 'Choose a shape to call!',
      };
    }
  } else {
    requestedShape = null;
  }

  // Handle Action Cards
  if (card.value === 1) {
    nextIdx = playerIndex;
    msg = `${player.name} played 1 (Hold On)! Plays again.`;
  } else if (card.value === 2) {
    const currentCount = pendingPenalty?.cardValue === 2 ? pendingPenalty.count : 0;
    pendingPenalty = { count: currentCount + 2, cardValue: 2 };
    msg = `${player.name} played Pick Two! Next player must draw ${pendingPenalty.count} or counter.`;
  } else if (card.value === 5) {
    const currentCount = pendingPenalty?.cardValue === 5 ? pendingPenalty.count : 0;
    pendingPenalty = { count: currentCount + 3, cardValue: 5 };
    msg = `${player.name} played Pick Three! Next player must draw ${pendingPenalty.count} or counter.`;
  } else if (card.value === 8) {
    const skippedPlayer = state.players[nextIdx];
    nextIdx = nextPlayerIndex(nextIdx);
    msg = `${player.name} played 8 (Suspension)! ${skippedPlayer.name}'s turn skipped.`;
  } else if (card.value === 14) {
    let currentDiscard = updatedDiscard;
    const marketPlayers = updatedPlayers.map((p, idx) => {
      if (idx === playerIndex) return p;
      const refilled = ensureDrawPileHasCards(drawPile, currentDiscard);
      drawPile = refilled.drawPile;
      currentDiscard = refilled.discardPile;
      if (drawPile.length > 0) {
        const drawnCard = drawPile.pop();
        return { ...p, hand: [...p.hand, drawnCard] };
      }
      return p;
    });
    msg = `${player.name} played 14 (General Market)! All opponents draw 1 card.`;
    return {
      ...state,
      players: marketPlayers,
      drawPile,
      discardPile: currentDiscard,
      activePlayerIndex: nextIdx,
      requestedShape,
      pendingDrawPenalty: null,
      secondsRemaining: state.turnTimerSeconds || 120,
      pendingWhotSelection: false,
      statusMessage: msg,
    };
  }

  return {
    ...state,
    players: updatedPlayers,
    discardPile: updatedDiscard,
    activePlayerIndex: nextIdx,
    requestedShape,
    pendingDrawPenalty: pendingPenalty,
    secondsRemaining: state.turnTimerSeconds || 120,
    pendingWhotSelection: false,
    statusMessage: msg,
  };
}

export function drawCard(state, playerIndex) {
  if (state.gameStatus === 'game_over') return state;

  let { drawPile, discardPile } = ensureDrawPileHasCards(state.drawPile, state.discardPile);
  const player = state.players[playerIndex];

  let drawCount = 1;
  let penaltyCleared = false;
  if (state.pendingDrawPenalty) {
    drawCount = state.pendingDrawPenalty.count;
    penaltyCleared = true;
  }

  const drawnCards = [];
  for (let i = 0; i < drawCount; i++) {
    const refilled = ensureDrawPileHasCards(drawPile, discardPile);
    drawPile = refilled.drawPile;
    discardPile = refilled.discardPile;
    if (drawPile.length > 0) {
      drawnCards.push(drawPile.pop());
    }
  }

  const updatedPlayers = state.players.map((p, idx) =>
    idx === playerIndex ? { ...p, hand: [...p.hand, ...drawnCards] } : p
  );

  const nextIdx = nextPlayerIndex(playerIndex);
  const msg = `${player.name} drew ${drawnCards.length} card${drawnCards.length > 1 ? 's' : ''}.`;

  return {
    ...state,
    players: updatedPlayers,
    drawPile,
    discardPile,
    activePlayerIndex: nextIdx,
    pendingDrawPenalty: penaltyCleared ? null : state.pendingDrawPenalty,
    secondsRemaining: state.turnTimerSeconds || 120,
    statusMessage: msg,
  };
}

export function getAiMove(state, aiPlayerIndex) {
  const aiPlayer = state.players[aiPlayerIndex];
  const topCard = state.discardPile[state.discardPile.length - 1];

  const validCards = aiPlayer.hand.filter((c) =>
    isValidMove(c, topCard, state.requestedShape, state.pendingDrawPenalty)
  );

  if (validCards.length === 0) {
    return { action: 'draw' };
  }

  const whotCard = validCards.find((c) => c.value === 20);
  const actionCard = validCards.find((c) => [2, 5, 8, 1, 14].includes(c.value));
  const chosenCard = actionCard || validCards[0];

  if (whotCard && Math.random() > 0.3) {
    const shapeCounts = { cross: 0, square: 0, circle: 0, triangle: 0, whot: 0 };
    aiPlayer.hand.forEach((c) => {
      if (c.shape !== 'whot') shapeCounts[c.shape]++;
    });

    let bestShape = 'circle';
    let maxCount = -1;
    Object.keys(shapeCounts).forEach((s) => {
      if (s !== 'whot' && shapeCounts[s] > maxCount) {
        maxCount = shapeCounts[s];
        bestShape = s;
      }
    });

    return { action: 'play', cardId: whotCard.id, shape: bestShape };
  }

  return { action: 'play', cardId: chosenCard.id };
}

export const AI_CHAT_RESPONSES = [
  "Nice play! But I've got a strategy ready. 😄",
  "Who played that card?! 😅",
  "I'm saving my best cards for last!",
  "Market time for someone soon!",
  "Great game! Let's keep going.",
  "WHOT is pure excitement! 🔥",
  "Don't get too comfortable, I'm winning this round!",
];
