export const SHAPE_COLORS = {
  cross: '#f9002c',
  square: '#00bb50',
  circle: '#9400df',
  triangle: '#292533',
  star: '#ff5e00',
  whot: '#ffcc00',
};

// Official Whot Card Point Values for Checkup Scoring
export function getCardPoints(card) {
  if (!card) return 0;
  if (card.value === 20) return 20; // Whot 20 is 20 points
  if (card.shape === 'star') return card.value * 2; // Star cards score DOUBLE points
  return card.value; // Circles, Triangles, Crosses, Squares face value
}

export function calculateHandPoints(hand) {
  return (hand || []).reduce((sum, c) => sum + getCardPoints(c), 0);
}

// Generate full standard Nigerian WHOT deck (54 cards)
export function createDeck() {
  const deck = [];
  let cardId = 1;

  // Circles: 1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14 (12 cards)
  const circles = [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14];
  circles.forEach((val) => {
    deck.push({ id: `c_${cardId++}`, value: val, color: SHAPE_COLORS.circle, shape: 'circle' });
  });

  // Triangles: 1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14 (12 cards)
  const triangles = [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14];
  triangles.forEach((val) => {
    deck.push({ id: `t_${cardId++}`, value: val, color: SHAPE_COLORS.triangle, shape: 'triangle' });
  });

  // Crosses: 1, 2, 3, 5, 7, 10, 11, 13, 14 (9 cards)
  const crosses = [1, 2, 3, 5, 7, 10, 11, 13, 14];
  crosses.forEach((val) => {
    deck.push({ id: `cr_${cardId++}`, value: val, color: SHAPE_COLORS.cross, shape: 'cross' });
  });

  // Squares: 1, 2, 3, 5, 7, 10, 11, 13, 14 (9 cards)
  const squares = [1, 2, 3, 5, 7, 10, 11, 13, 14];
  squares.forEach((val) => {
    deck.push({ id: `sq_${cardId++}`, value: val, color: SHAPE_COLORS.square, shape: 'square' });
  });

  // Stars: 1, 2, 3, 4, 5, 7, 8 (7 cards)
  const stars = [1, 2, 3, 4, 5, 7, 8];
  stars.forEach((val) => {
    deck.push({ id: `st_${cardId++}`, value: val, color: SHAPE_COLORS.star, shape: 'star' });
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

export function createInitialState(timer = '2m', cardCount = 6, playerCount = 2, vsOba = false) {
  const fullDeck = createDeck();
  const turnSecs = parseTimerSec(timer);

  const numCardsPerPlayer = Math.min(8, Math.max(3, Number(cardCount) || 6));
  const totalPlayers = vsOba ? 2 : Math.min(4, Math.max(2, Number(playerCount) || 2));

  let players = [];
  if (totalPlayers === 2) {
    players = [
      { id: 0, name: 'You', hand: [], isAi: false, avatarIndex: 3 },
      { id: 1, name: 'Oba 👑', hand: [], isAi: true, avatarIndex: 2 },
    ];
  } else if (totalPlayers === 3) {
    players = [
      { id: 0, name: 'You', hand: [], isAi: false, avatarIndex: 3 },
      { id: 1, name: 'QueenBee 👑', hand: [], isAi: true, avatarIndex: 0 },
      { id: 2, name: 'Oba 👑', hand: [], isAi: true, avatarIndex: 2 },
    ];
  } else {
    players = [
      { id: 0, name: 'You', hand: [], isAi: false, avatarIndex: 3 },
      { id: 1, name: 'QueenBee 👑', hand: [], isAi: true, avatarIndex: 0 },
      { id: 2, name: 'Oba 👑', hand: [], isAi: true, avatarIndex: 2 },
      { id: 3, name: 'KingTee 👑', hand: [], isAi: true, avatarIndex: 1 },
    ];
  }

  // Deal exact requested cards count (e.g. 6) to each player
  for (let i = 0; i < numCardsPerPlayer; i++) {
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

  const initialMsgs = totalPlayers === 2
    ? [{ id: '1', sender: 'Oba 👑', text: 'Good luck! May the best Whot master win!', isUser: false }]
    : [
        { id: '1', sender: 'QueenBee 👑', text: 'Good luck everyone! Let’s play WHOT!', isUser: false },
        { id: '2', sender: 'KingTee 👑', text: 'Watch out for my Pick 2s! 😄', isUser: false },
      ];

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
    statusMessage: `Your turn! Hand: ${numCardsPerPlayer} cards. Match shape or number.`,
    coinBalance: 1250,
    dailyBonusSeconds: 8073,
    soundEnabled: true,
    pendingWhotSelection: false,
    messages: initialMsgs,
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

// Draw pile does NOT recycle discard pile - once the first pile finishes, game ends for checkup
function ensureDrawPileHasCards(drawPile, discardPile) {
  return { drawPile: [...drawPile], discardPile: [...discardPile] };
}

export function nextPlayerIndex(currentIndex, step = 1, numPlayers = 4) {
  return (currentIndex + step) % (numPlayers || 4);
}

export function evaluateCheckup(players) {
  let minScore = Infinity;
  let winner = players[0];
  const scores = players.map((p) => {
    const pts = calculateHandPoints(p.hand);
    if (pts < minScore || (pts === minScore && p.hand.length < winner.hand.length)) {
      minScore = pts;
      winner = p;
    }
    return { player: p, pts };
  });
  return { winner, minScore, scores };
}

export function playCard(state, playerIndex, cardId, chosenShape) {
  if (state.gameStatus === 'game_over') return state;

  const numPlayers = state.players.length;
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

  // Check victory (Hand emptied!)
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

  let nextIdx = nextPlayerIndex(playerIndex, 1, numPlayers);
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
    nextIdx = nextPlayerIndex(nextIdx, 1, numPlayers);
    msg = `${player.name} played 8 (Suspension)! ${skippedPlayer.name}'s turn skipped.`;
  } else if (card.value === 14) {
    let currentDiscard = updatedDiscard;
    const marketPlayers = updatedPlayers.map((p, idx) => {
      if (idx === playerIndex) return p;
      if (drawPile.length > 0) {
        const drawnCard = drawPile.pop();
        return { ...p, hand: [...p.hand, drawnCard] };
      }
      return p;
    });
    msg = `${player.name} played 14 (General Market)! All opponents draw 1 card.`;

    if (drawPile.length === 0) {
      const { winner, minScore } = evaluateCheckup(marketPlayers);
      const isHumanWinner = winner.id === 0;
      return {
        ...state,
        players: marketPlayers,
        drawPile: [],
        discardPile: currentDiscard,
        gameStatus: 'game_over',
        winner,
        coinBalance: state.coinBalance + (isHumanWinner ? 500 : 0),
        statusMessage: `🏁 First pile finished! Checkup: ${winner.name} won with lowest card count (${minScore} pts)!`,
      };
    }

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

  // Check if draw pile finished after playing
  if (drawPile.length === 0) {
    const { winner, minScore } = evaluateCheckup(updatedPlayers);
    const isHumanWinner = winner.id === 0;
    return {
      ...state,
      players: updatedPlayers,
      discardPile: updatedDiscard,
      drawPile: [],
      gameStatus: 'game_over',
      winner,
      coinBalance: state.coinBalance + (isHumanWinner ? 500 : 0),
      statusMessage: `🏁 First pile finished! Checkup: ${winner.name} won with lowest card count (${minScore} pts)!`,
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

  const numPlayers = state.players.length;
  const drawPile = [...state.drawPile];
  const discardPile = [...state.discardPile];
  const player = state.players[playerIndex];

  let drawCount = 1;
  let penaltyCleared = false;
  if (state.pendingDrawPenalty) {
    drawCount = state.pendingDrawPenalty.count;
    penaltyCleared = true;
  }

  const drawnCards = [];
  for (let i = 0; i < drawCount; i++) {
    if (drawPile.length > 0) {
      drawnCards.push(drawPile.pop());
    }
  }

  const updatedPlayers = state.players.map((p, idx) =>
    idx === playerIndex ? { ...p, hand: [...p.hand, ...drawnCards] } : p
  );

  // Market exhausted (First Pile Finished) -> Game ends immediately & Checkup Scoring determines winner!
  if (drawPile.length === 0) {
    const { winner, minScore } = evaluateCheckup(updatedPlayers);
    const isHumanWinner = winner.id === 0;
    const bonusCoins = isHumanWinner ? 500 : 0;
    return {
      ...state,
      players: updatedPlayers,
      drawPile: [],
      discardPile,
      gameStatus: 'game_over',
      winner,
      coinBalance: state.coinBalance + bonusCoins,
      statusMessage: `🏁 First pile finished! Checkup: ${winner.name} won with lowest card count (${minScore} pts)!`,
    };
  }

  const nextIdx = nextPlayerIndex(playerIndex, 1, numPlayers);
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

export function getAiMove(state, aiPlayerIndex, difficulty = 'medium') {
  const aiPlayer = state.players[aiPlayerIndex];
  if (!aiPlayer) return { action: 'draw' };

  const topCard = state.discardPile[state.discardPile.length - 1];

  const validCards = aiPlayer.hand.filter((c) =>
    isValidMove(c, topCard, state.requestedShape, state.pendingDrawPenalty)
  );

  if (validCards.length === 0) {
    return { action: 'draw' };
  }

  if (difficulty === 'easy' && Math.random() < 0.45) {
    const randomCard = validCards[Math.floor(Math.random() * validCards.length)];
    if (randomCard.value === 20) {
      return { action: 'play', cardId: randomCard.id, shape: 'circle' };
    }
    return { action: 'play', cardId: randomCard.id };
  }

  if (difficulty === 'hard') {
    const attackCard = validCards.find((c) => [2, 5, 14, 8, 1].includes(c.value));
    const whotCard = validCards.find((c) => c.value === 20);

    if (attackCard) {
      return { action: 'play', cardId: attackCard.id };
    }

    if (whotCard) {
      const shapeCounts = { cross: 0, square: 0, circle: 0, triangle: 0, star: 0 };
      aiPlayer.hand.forEach((c) => {
        if (c.shape !== 'whot') shapeCounts[c.shape] = (shapeCounts[c.shape] || 0) + 1;
      });

      let bestShape = 'circle';
      let maxCount = -1;
      Object.keys(shapeCounts).forEach((s) => {
        if (shapeCounts[s] > maxCount) {
          maxCount = shapeCounts[s];
          bestShape = s;
        }
      });

      return { action: 'play', cardId: whotCard.id, shape: bestShape };
    }
  }

  // Medium (Default)
  const whotCard = validCards.find((c) => c.value === 20);
  const actionCard = validCards.find((c) => [2, 5, 8, 1, 14].includes(c.value));
  const chosenCard = actionCard || validCards[0];

  if (whotCard && Math.random() > 0.3) {
    const shapeCounts = { cross: 0, square: 0, circle: 0, triangle: 0, star: 0, whot: 0 };
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
