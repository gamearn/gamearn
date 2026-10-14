// Bridge between the Gamearn backend's authoritative Whot state and the app's
// local engine state (games/whot/WhotScreen).
//
// Server contract (Backend_manager/src/validators/whot.js):
//   - Card        { number: 1-14 | 20, shape: circle|square|star|cross|triangle|whot }
//   - Hand        array of cards — the server only ever sends the requester's
//                 own hand; every other player is a count (sanitizeGameState).
//   - Room state  { players:[{uid,displayName,hand|handSize,index}], topCard,
//                 pendingShape, currentPlayerIndex, currentPlayerUid,
//                 deck|deckSize, discardPile, status, winner }
//   - Practice    (practice/whot/{start,move,state}) returns
//                 { playerHand, topCard, botCardCount, currentPlayerIndex,
//                   currentTurn, pendingShape, deckSize, status, winner, ... }
//
// The app renders fixed seats [You(0), Opponent(1), Seat3(2), Seat4(3)].

import { SHAPE_COLORS, parseTimerSec } from './whotGameEngine';

let cardSeq = 0;

export function serverCardToEngine(card) {
  if (!card) return null;
  cardSeq += 1;
  return {
    id: `sc_${cardSeq}_${Math.random().toString(36).slice(2, 6)}`,
    value: card.number,
    shape: card.shape,
    color: SHAPE_COLORS[card.shape] || '#555555',
  };
}

export function engineCardToServer(card) {
  if (!card) return null;
  return {
    number: Number(card.value) === 20 ? 20 : Number(card.value),
    shape: card.shape,
  };
}

function handSize(hand) {
  if (Array.isArray(hand)) return hand.length;
  if (typeof hand === 'number') return hand;
  return 0;
}

const SEAT_NAMES = ['Seat 2', 'Seat 3', 'Seat 4'];

// Build a full engine gameState from a normalized view. The server decides
// turns, legality and effects — the engine is only used for rendering here.
function buildEngineState(view, meta = {}) {
  const timerRaw = view.timer || meta.timer || (view.turnDurationSeconds ? `${view.turnDurationSeconds}s` : '2m');
  const turnSecs = parseTimerSec(timerRaw);
  const secondsRemaining = meta.secondsRemaining != null
    ? meta.secondsRemaining
    : (view.secondsRemaining != null ? view.secondsRemaining : turnSecs);
  const selfName = view.selfName || 'You';
  const opps = view.opponents || [];

  const oppAvatarIndices = [0, 2, 1];
  const players = [
    { id: 0, name: selfName, hand: (view.self || []).map(serverCardToEngine), isAi: false, avatarIndex: 3 },
    ...(opps.length > 0
      ? opps.map((opp, idx) => ({
          id: idx + 1,
          name: opp.name || meta.opponentName || SEAT_NAMES[idx] || `Player ${idx + 2}`,
          hand: Array.from({ length: opp?.handSize ?? meta.startCards ?? 6 }),
          isAi: true,
          avatarIndex: oppAvatarIndices[idx % oppAvatarIndices.length],
        }))
      : [{ id: 1, name: meta.opponentName || 'Oba 👑', hand: Array.from({ length: meta.startCards ?? 6 }), isAi: true, avatarIndex: 0 }]
    ),
  ];

  const pileFinished = view.deckSize === 0 && view.deckSize !== undefined && (view.self?.length > 0 || opps.some((o) => (o.handSize ?? 0) > 0));
  const finished = view.status === 'completed' || !!view.winner || pileFinished;
  const topCard = view.topCard ? serverCardToEngine(view.topCard) : null;

  const activePlayerIndex =
    view.currentPlayerIndex == null
      ? 0
      : view.selfIndex != null && view.currentPlayerIndex === view.selfIndex
        ? 0
        : Array.isArray(view.seatByIndex)
          ? view.seatByIndex[view.currentPlayerIndex] ?? 1
          : 1;

  let winner = null;
  if (finished) {
    if (view.winner) {
      winner = view.winner === view.selfUid ? players[0] : (players[1] || null);
    } else if (pileFinished) {
      const selfTotal = (view.self || []).reduce(
        (sum, c) => sum + (c.number === 20 ? 20 : (Number(c.number) || 0)),
        0
      );
      let lowestScore = selfTotal;
      let winningPlayer = players[0];
      opps.forEach((opp, i) => {
        const oppEst = (opp.handSize ?? 0) * 6;
        if (oppEst < lowestScore) {
          lowestScore = oppEst;
          winningPlayer = players[i + 1] || players[1];
        }
      });
      winner = winningPlayer;
    }
  }

  let statusMessage = view.statusMessage;
  if (!statusMessage) {
    const activeName = activePlayerIndex === 0 ? 'You' : players[activePlayerIndex]?.name;
    statusMessage = finished
      ? (pileFinished ? `🏁 Pile finished! Checkup: ${winner?.name || 'Player'} wins!` : 'Game over')
      : activePlayerIndex === 0
        ? 'Your turn! Select a card to play or pick from the pile.'
        : `${activeName || 'Opponent'} is playing…`;
  }

  return {
    players,
    activePlayerIndex,
    drawPile: Array.from({ length: view.deckSize || 0 }),
    discardPile: topCard ? [topCard] : [],
    requestedShape: view.pendingShape || null,
    pendingDrawPenalty: null,
    turnTimerSeconds: turnSecs,
    secondsRemaining: Math.max(0, secondsRemaining),
    gameStatus: finished ? 'game_over' : 'playing',
    winner,
    statusMessage,
    valuePoints: 0,
    dailyBonusSeconds: 0,
    soundEnabled: true,
    pendingWhotSelection: false,
    messages: [],
  };
}

// Practice REST snapshot → engine state.
export function practiceSnapshotToEngine(data, opts = {}) {
  const selfUid = opts.selfUid || 'practice_anon';
  const selfName = opts.selfName || 'You';
  const fallbackHandSize = opts.startCards || 6;
  const others = Array.isArray(data.players)
    ? data.players.filter((p) => p.uid !== selfUid)
    : [];
  const opponents = others.length
    ? others.map((p) => ({
        handSize: p.handSize ?? fallbackHandSize,
        name: p.username || p.displayName || 'Player',
      }))
    : [{ handSize: data.botCardCount ?? fallbackHandSize, name: 'Oba 👑' }];
  const opponentName = opts.opponentName || opponents[0]?.name || 'Oba 👑';
  const timer = opts.timer || (data.turnDurationSeconds ? `${data.turnDurationSeconds}s` : '2m');
  return buildEngineState(
    {
      self: data.playerHand || [],
      opponents,
      topCard: data.topCard,
      pendingShape: data.pendingShape || null,
      currentPlayerIndex: data.currentPlayerIndex ?? 0,
      selfIndex: 0,
      seatByIndex: [0, 1, 2, 3],
      deckSize: data.deckSize || 0,
      status: data.status || (data.gameOver ? 'completed' : 'playing'),
      winner: data.winner || null,
      selfUid,
      selfName,
      statusMessage: opts.statusMessage,
      turnDurationSeconds: data.turnDurationSeconds,
      timer,
      secondsRemaining: opts.secondsRemaining,
    },
    { opponentName, timer, secondsRemaining: opts.secondsRemaining, startCards: opts.startCards },
  );
}

// Socket multiplayer gameState (join_room / match_started / move_made / sync) → engine state.
export function socketStateToEngine(gameState, selfUid, opts = {}) {
  if (!gameState) return null;
  const players = gameState.players || [];
  const selfIndex = players.findIndex((p) => p.uid === selfUid);
  const self = selfIndex >= 0 ? players[selfIndex] : null;
  const others = players.filter((p, i) => i !== selfIndex);
  const fallbackHandSize = opts.startCards || 6;

  const isVsOba = opts.vsOba || (players.length === 2 && others.some((p) => p.uid?.startsWith('bot_')));

  const opponents = isVsOba
    ? [{ handSize: handSize(others[0]?.hand ?? fallbackHandSize), name: 'Oba 👑' }]
    : (others.length ? others : players.slice(1)).map((p, idx) => ({
        handSize: handSize(p.hand != null ? p.hand : fallbackHandSize),
        name: p.username || p.displayName || `Player ${idx + 2}`,
      }));

  const topCard = gameState.topCard || gameState.discardPile?.[gameState.discardPile.length - 1] || null;
  const timer = opts.timer || (gameState.turnDurationSeconds ? `${gameState.turnDurationSeconds}s` : '2m');

  return buildEngineState(
    {
      self: self?.hand || [],
      opponents,
      topCard,
      pendingShape: gameState.pendingShape || null,
      currentPlayerIndex: gameState.currentPlayerIndex ?? 0,
      selfIndex,
      deckSize: gameState.deckSize ?? (Array.isArray(gameState.deck) ? gameState.deck.length : 0),
      status: gameState.status || 'playing',
      winner: gameState.winner || null,
      selfUid,
      selfName: opts.selfName || self?.username || self?.displayName || 'You',
      statusMessage: opts.statusMessage,
      turnDurationSeconds: gameState.turnDurationSeconds,
      timer,
      secondsRemaining: opts.secondsRemaining,
    },
    { opponentName: opponents[0]?.name, timer, secondsRemaining: opts.secondsRemaining, startCards: opts.startCards },
  );
}