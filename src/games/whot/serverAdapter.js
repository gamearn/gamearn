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
  const turnSecs = parseTimerSec('2m');
  const selfName = view.selfName || 'You';
  const opps = view.opponents || [];

  const players = [
    { id: 0, name: selfName, hand: (view.self || []).map(serverCardToEngine), isAi: false, avatarIndex: 3 },
    { id: 1, name: opps[0]?.name || meta.opponentName || SEAT_NAMES[0], hand: Array.from({ length: opps[0]?.handSize ?? 0 }), isAi: true, avatarIndex: 0 },
    { id: 2, name: opps[1]?.name || SEAT_NAMES[1], hand: Array.from({ length: opps[1]?.handSize ?? 0 }), isAi: true, avatarIndex: 2 },
    { id: 3, name: opps[2]?.name || SEAT_NAMES[2], hand: Array.from({ length: opps[2]?.handSize ?? 0 }), isAi: true, avatarIndex: 1 },
  ];

  const finished = view.status === 'completed' || !!view.winner;
  const topCard = view.topCard ? serverCardToEngine(view.topCard) : null;

  let statusMessage = view.statusMessage;
  if (!statusMessage) {
    statusMessage = finished
      ? 'Game over'
      : view.selfIndex != null && view.currentPlayerIndex === view.selfIndex
        ? 'Your turn! Select a card to play or pick from the pile.'
        : `${players[1].name} is playing…`;
  }

  return {
    players,
    activePlayerIndex: view.selfIndex != null && view.currentPlayerIndex === view.selfIndex ? 0 : 1,
    drawPile: Array.from({ length: view.deckSize || 0 }),
    discardPile: topCard ? [topCard] : [],
    requestedShape: view.pendingShape || null,
    pendingDrawPenalty: null,
    turnTimerSeconds: turnSecs,
    secondsRemaining: turnSecs,
    gameStatus: finished ? 'game_over' : 'playing',
    winner: finished && view.winner === view.selfUid ? players[0] : finished && view.winner ? players[1] : null,
    statusMessage,
    coinBalance: 0,
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
  return buildEngineState(
    {
      self: data.playerHand || [],
      opponents: [{ handSize: data.botCardCount || 0, name: 'Gamearn Bot' }],
      topCard: data.topCard,
      pendingShape: data.pendingShape || null,
      currentPlayerIndex: data.currentPlayerIndex ?? 0,
      selfIndex: 0,
      deckSize: data.deckSize || 0,
      status: data.status || (data.gameOver ? 'completed' : 'playing'),
      winner: data.winner || null,
      selfUid,
      selfName,
      statusMessage: opts.statusMessage,
    },
    { opponentName: 'Gamearn Bot' },
  );
}

// Socket multiplayer gameState (join_room / match_started / move_made / sync) → engine state.
export function socketStateToEngine(gameState, selfUid, opts = {}) {
  if (!gameState) return null;
  const players = gameState.players || [];
  const selfIndex = players.findIndex((p) => p.uid === selfUid);
  const self = selfIndex >= 0 ? players[selfIndex] : null;
  const others = players.filter((p, i) => i !== selfIndex);

  const topCard = gameState.topCard || gameState.discardPile?.[gameState.discardPile.length - 1] || null;

  return buildEngineState(
    {
      self: self?.hand || [],
      opponents: (others.length ? others : players.slice(1)).map((p) => ({
        handSize: handSize(p.hand),
        name: p.displayName || 'Opponent',
      })),
      topCard,
      pendingShape: gameState.pendingShape || null,
      currentPlayerIndex: gameState.currentPlayerIndex ?? 0,
      selfIndex,
      deckSize: gameState.deckSize ?? (Array.isArray(gameState.deck) ? gameState.deck.length : 0),
      status: gameState.status || 'playing',
      winner: gameState.winner || null,
      selfUid,
      selfName: opts.selfName || self?.displayName || 'You',
      statusMessage: opts.statusMessage,
    },
    { opponentName: opts.opponentName },
  );
}