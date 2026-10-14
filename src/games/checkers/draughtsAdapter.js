// Bridge between the Gamearn backend's authoritative Draughts state and the
// app's local Checkers engine board (games/checkers/CheckersEngine).
//
// Server contract (Backend_manager/src/validators/draughts.js):
//   - board[row][col] numeric: 0 empty, 1 P1 man, 2 P1 king, 3 P2 man, 4 P2 king
//   - player index 0 is the TOP side and moves first; index 1 is the BOTTOM side
//   - moves are { fromRow, fromCol, toRow, toCol, captures? }
//
// App engine board: 64 slots of { side: 'white' | 'black', king } | null.
// Engine 'white' occupies the top rows and moves down, so it maps onto server
// player 0; engine 'black' maps onto server player 1.

const SIDE_BY_SERVER = { 1: 'white', 2: 'white', 3: 'black', 4: 'black' };
const KING_BY_SERVER = { 2: true, 4: true };

export function serverBoardToEngine(input) {
  if (!Array.isArray(input)) return Array(64).fill(null);
  const flat = Array.isArray(input[0]) ? input.flat() : input;
  return Array.from({ length: 64 }, (_, index) => {
    const piece = flat[index] || 0;
    if (!piece) return null;
    return { side: SIDE_BY_SERVER[piece] || 'white', king: !!KING_BY_SERVER[piece] };
  });
}

// Server seat index 0 (top) renders as engine 'white'; seat 1 as engine 'black'.
export function seatToEngineSide(index) {
  return index === 1 ? 'black' : 'white';
}

// Build the descriptor consumed by CheckersScreen's remote mode. Returns null
// until the server has sent an authoritative board.
export function draughtsSnapshotToRemote(snapshot, uid) {
  if (!snapshot || !Array.isArray(snapshot.board)) return null;
  const players = snapshot.players || [];
  const selfIndex = players.findIndex((p) => p.uid === uid);
  const currentIndex = snapshot.currentPlayerIndex ?? 0;
  const finished = snapshot.status === 'completed' || !!snapshot.winner;
  const winnerIndex = snapshot.winner ? players.findIndex((p) => p.uid === snapshot.winner) : -1;

  const rawLegal = Array.isArray(snapshot.legalMoves) ? snapshot.legalMoves : [];
  const legalMoves = rawLegal.map((m) => {
    const fromIdx = m.fromRow * 8 + m.fromCol;
    const toIdx = m.toRow * 8 + m.toCol;
    const rowDiff = m.toRow - m.fromRow;
    const colDiff = m.toCol - m.fromCol;
    const captures = [];
    if (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 2) {
      const midRow = (m.fromRow + m.toRow) / 2;
      const midCol = (m.fromCol + m.toCol) / 2;
      captures.push(midRow * 8 + midCol);
    }
    return {
      from: fromIdx,
      to: toIdx,
      captures,
      path: [fromIdx, toIdx],
    };
  });

  return {
    board: serverBoardToEngine(snapshot.board),
    humanSide: seatToEngineSide(selfIndex),
    turn: seatToEngineSide(currentIndex),
    canMove: snapshot.status === 'playing' && selfIndex >= 0 && currentIndex === selfIndex,
    gameOver: finished,
    winnerSide: finished && winnerIndex >= 0 ? seatToEngineSide(winnerIndex) : null,
    selfIndex,
    currentIndex,
    legalMoves,
    forcedCapture: snapshot.forcedCapture
      ? snapshot.forcedCapture.row * 8 + snapshot.forcedCapture.col
      : null,
    coinToss: snapshot.coinToss || null,
  };
}

// Translate an engine legal move ({ from, to, captures:[indices] }) into the
// server's coordinate move.
export function engineMoveToServer(move) {
  return {
    fromRow: Math.floor(move.from / 8),
    fromCol: move.from % 8,
    toRow: Math.floor(move.to / 8),
    toCol: move.to % 8,
    captures: move.captures && move.captures.length
      ? move.captures.map((index) => ({ row: Math.floor(index / 8), col: index % 8 }))
      : undefined,
  };
}
