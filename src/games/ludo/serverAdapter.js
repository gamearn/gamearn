// Server-authoritative Ludo adapter.
// Maps the normalized backend snapshot (see Backend_manager
// src/routes/practice_ludo.js _responseData + src/validators/ludo.js) into a
// flat, render-ready view model for Board/LudoScreen. The client never mutates
// board state locally — every move is sent to the server and re-rendered from
// the returned snapshot.
//
// Backend model:
//   piece = { position, inHomeStretch, homePosition, completed, colorIdx }
//     position -1 ............ in yard
//     position 0..51 ......... absolute main-track square (ring index)
//     inHomeStretch true ..... homePosition 1..6 (6 = home/centre)
//   colorIdx 0..3 = red, blue, yellow, green (start ring 0, 13, 26, 39)
//   START_POSITIONS = [0, 13, 26, 39];  SAFE_ZONES = [0,8,13,21,26,31,39,47]

import { MAIN_TRACK, HOME_STRETCHES } from './ludoGameEngine';

export const RING = MAIN_TRACK; // 52 squares; index === server absolute track position

// Physical board quadrants, matching the approved reference Ludo-board artwork:
// 0: Red (top-left), 1: Yellow (bottom-left), 2: Blue (bottom-right), 3: Green (top-right).
export const COLOR_BY_INDEX = ['#e61c24', '#ffcc00', '#0085ff', '#00b843'];
export const DARK_BY_INDEX = ['#980014', '#bb7300', '#0033a8', '#006320'];
export const LIGHT_BY_INDEX = ['#fca5a5', '#fde68a', '#93c5fd', '#6ee7b7'];
export const NAME_BY_INDEX = ['Red', 'Yellow', 'Blue', 'Green'];

export const START_RING = [0, 13, 26, 39];
export const SAFE_RING = [0, 8, 13, 21, 26, 34, 39, 47];

// The backend only stores homePosition; the lane is implied by colorIdx.
// 0 Red -> top lane, 1 Yellow -> left lane, 2 Blue -> bottom lane, 3 Green -> right lane
export const LANE_BY_COLORIDX = [
  HOME_STRETCHES[0], // Red -> top (1..6, 7)
  HOME_STRETCHES[3], // Yellow -> left (7, 1..6)
  HOME_STRETCHES[2], // Blue -> bottom (13..8, 7)
  HOME_STRETCHES[1], // Green -> right (7, 13..8)
];

// Yard quadrant origin (top-left cell on the 15x15 grid) for each colorIdx:
// 0 Red top-left, 1 Yellow bottom-left, 2 Blue bottom-right, 3 Green top-right
export const YARD_ORIGIN = [
  { r: 0, c: 0 },
  { r: 9, c: 0 },
  { r: 9, c: 9 },
  { r: 0, c: 9 },
];

export const BOARD_CELLS = 15;
export const CENTRE = { r: 7, c: 7 };

function yardCell(colorIdx, pieceIndex, count) {
  const o = YARD_ORIGIN[colorIdx] || YARD_ORIGIN[0];
  // Offsets chosen so tokens land directly on the 4 circular yard bases
  // (centres at o.c + 1.8, o.r + 1.8, etc., with token center at c + 0.5, r + 0.5).
  const slots = [
    { r: 1.3, c: 1.3 }, { r: 1.3, c: 3.7 },
    { r: 3.7, c: 1.3 }, { r: 3.7, c: 3.7 },
  ];
  const slot = slots[pieceIndex % slots.length];
  return { r: o.r + slot.r, c: o.c + slot.c };
}

/** Board cell (0..14, fractional) for one piece. */
export function pieceCell(piece, colorIdx, pieceIndex, count) {
  if (!piece) return CENTRE;
  if (piece.completed || piece.homePosition === 6) return CENTRE;
  if (piece.position == null || piece.position < 0) return yardCell(colorIdx, pieceIndex, count);
  if (piece.inHomeStretch) {
    const lane = LANE_BY_COLORIDX[colorIdx] || [];
    const cell = lane[Math.max(0, Math.min(5, (piece.homePosition || 1) - 1))];
    return cell ? { r: cell.r, c: cell.c } : CENTRE;
  }
  const cell = RING[piece.position];
  return cell ? { r: cell.r, c: cell.c } : CENTRE;
}

function effectiveColorIdx(piece, playerIndex) {
  return piece && piece.colorIdx != null ? piece.colorIdx : playerIndex;
}

// Animation frames for one server 'move' presentation event. The server walks
// the piece square-by-square (validators/ludo.js movementSteps) and stores each
// intermediate piece state in event.steps; we map those to board cells so the
// client can replay the exact path the piece took. The pre-move cell is taken
// from event.beforePlayers when present, otherwise the first step is the start.
function moveEventFrames(event, players) {
  if (!event || event.type !== 'move' || !Array.isArray(event.steps) || !event.steps.length) return null;
  const playerIndex = players.findIndex((p) => p.uid === event.playerUid);
  if (playerIndex < 0) return null;
  const { pieceId } = event;
  if (!Number.isInteger(pieceId)) return null;

  const colorIdx = event.steps[0] && event.steps[0].colorIdx != null
    ? event.steps[0].colorIdx
    : playerIndex;
  const count = players[playerIndex]?.pieces?.length || 4;

  const cells = [];
  const beforePiece = event.beforePlayers?.[playerIndex]?.pieces?.[pieceId];
  if (beforePiece) cells.push(pieceCell(beforePiece, colorIdx, pieceId, count));
  event.steps.forEach((step) => cells.push(pieceCell(step, colorIdx, pieceId, count)));

  // Drop consecutive duplicates (e.g. overshoot frames collapsing on the centre).
  const trimmed = cells.filter((cell, i) => (
    i === 0 || Math.abs(cell.r - cells[i - 1].r) > 1e-6 || Math.abs(cell.c - cells[i - 1].c) > 1e-6
  ));
  if (trimmed.length < 2) return null;

  return { id: event.id, playerIndex, pieceId, colorIdx, cells: trimmed };
}

function buildMoveEvents(snapshot, players) {
  const events = Array.isArray(snapshot.presentationEvents) ? snapshot.presentationEvents : [];
  const out = [];
  events.forEach((event) => {
    const frames = moveEventFrames(event, players);
    if (frames) out.push(frames);
  });
  return out;
}

/**
 * Build the render view model from a server snapshot.
 * @param {Object} snapshot  _responseData payload
 * @param {string} myUid     current user's uid (to detect turn ownership)
 */
export function ludoViewModel(snapshot, myUid) {
  if (!snapshot || !Array.isArray(snapshot.players)) return null;

  const players = snapshot.players.map((p, index) => {
    const isBot = typeof p.uid === 'string' && p.uid.indexOf('bot') === 0;
    const rawPieces = Array.isArray(p.pieces) ? p.pieces : [];
    const pieces = rawPieces.map((piece, pieceId) => {
      const colorIdx = effectiveColorIdx(piece, index);
      return {
        pieceId,
        colorIdx,
        color: COLOR_BY_INDEX[colorIdx] || COLOR_BY_INDEX[0],
        dark: DARK_BY_INDEX[colorIdx] || DARK_BY_INDEX[0],
        light: LIGHT_BY_INDEX[colorIdx] || LIGHT_BY_INDEX[0],
        cell: pieceCell(piece, colorIdx, pieceId, rawPieces.length),
        inYard: piece.position == null || piece.position < 0,
        completed: !!piece.completed,
      };
    });
    return {
      index,
      uid: p.uid,
      name: isBot
        ? (p.displayName || 'OBA').replace(/gamearn\s*bot/gi, 'OBA')
        : (p.displayName || NAME_BY_INDEX[index] || `Player ${index + 1}`),
      isBot,
      color: COLOR_BY_INDEX[index] || COLOR_BY_INDEX[0],
      pieces,
    };
  });

  const legalMoves = Array.isArray(snapshot.legalMoves) ? snapshot.legalMoves : [];
  const legalPieceIds = Array.isArray(snapshot.legalPieceIds) && snapshot.legalPieceIds.length
    ? snapshot.legalPieceIds
    : [...new Set(legalMoves.map((m) => m.pieceId))];

  const dice = Array.isArray(snapshot.diceValues) && snapshot.diceValues.length
    ? snapshot.diceValues
    : snapshot.diceValue
      ? [snapshot.diceValue]
      : [];

  const moveEvents = buildMoveEvents(snapshot, players);

  return {
    players,
    legalMoves,
    legalPieceIds,
    moveEvents,
    currentPlayerIndex: snapshot.currentPlayerIndex ?? 0,
    currentPlayerUid: snapshot.currentPlayerUid ?? null,
    myUid: myUid || null,
    isMyTurn: !!myUid && snapshot.currentPlayerUid === myUid,
    dice,
    diceRolled: !!snapshot.diceRolled,
    mustPass: !!snapshot.mustPass,
    dualHome: !!snapshot.dualHome,
    tokenCount: snapshot.tokenCount || 4,
    status: snapshot.status || 'playing',
    winner: snapshot.winner || null,
  };
}

/** The dice value to submit for a given piece's legal move. */
export function diceValueForMove(viewModel, pieceId) {
  const match = (viewModel?.legalMoves || []).find((m) => m.pieceId === pieceId);
  if (match) return match.diceValue;
  return (viewModel?.dice || [])[0] ?? null;
}

/**
 * Selectable dice options after a roll. Two dice expose each die plus their sum
 * (e.g. 6 & 6 -> options 6, 6, 12); a single die exposes itself.
 */
export function diceOptions(viewModel) {
  const dice = viewModel?.dice || [];
  if (!dice.length) return [];
  const options = dice.map((d) => ({ value: d, label: String(d) }));
  if (dice.length === 2) options.push({ value: dice[0] + dice[1], label: String(dice[0] + dice[1]) });
  return options;
}

/** Piece ids the current player may move with a specific dice value. */
export function legalPieceIdsForValue(viewModel, value) {
  if (value == null) return [];
  return [
    ...new Set(
      (viewModel?.legalMoves || [])
        .filter((m) => m.diceValue === value)
        .map((m) => m.pieceId),
    ),
  ];
}
