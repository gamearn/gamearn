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

// Physical board quadrants, matching the approved Ludo-board artwork:
// red top-left, blue top-right, green bottom-left, yellow bottom-right.
export const COLOR_BY_INDEX = ['#EF4444', '#10B981', '#FACC15', '#2563EB'];
export const DARK_BY_INDEX = ['#991B1B', '#065F46', '#A16207', '#1E40AF'];
export const LIGHT_BY_INDEX = ['#FCA5A5', '#6EE7B7', '#FDE68A', '#93C5FD'];
export const NAME_BY_INDEX = ['Red', 'Green', 'Yellow', 'Blue'];

export const START_RING = [0, 13, 26, 39];
export const SAFE_RING = [0, 8, 13, 21, 26, 31, 39, 47];

// The backend only stores homePosition; the lane is implied by colorIdx.
// index 0 red -> top lane, 1 blue -> left, 2 yellow -> bottom, 3 green -> right
export const LANE_BY_COLORIDX = [
  HOME_STRETCHES[0], // red  -> top   (1..6, 7)
  HOME_STRETCHES[3], // blue -> left  (7, 1..6)
  HOME_STRETCHES[2], // yellow -> bottom (13..8, 7)
  HOME_STRETCHES[1], // green -> right (7, 13..8)
];

// Yard quadrant origin (top-left cell on the 15x15 grid) for each colorIdx.
// 0 red top-left, 1 blue bottom-left, 2 yellow bottom-right, 3 green top-right
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
  // The reference board uses a stable 2 × 2 home formation. Keeping these
  // positions fixed also prevents four pieces from overlapping in a single row.
  const slots = [
    // pieceCell adds half a board cell when drawing a token, hence the .5
    // offsets here: the final token centre lands exactly on each home circle.
    { r: 1.5, c: 1.5 }, { r: 1.5, c: 3.5 },
    { r: 3.5, c: 1.5 }, { r: 3.5, c: 3.5 },
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

  return {
    players,
    legalMoves,
    legalPieceIds,
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
