export const initialBoardState = () => {
  return Array.from({ length: 64 }, (_, i) => {
    const r = Math.floor(i / 8);
    const c = i % 8;
    if ((r + c) % 2 === 0) return null;
    if (r < 3) return { side: 'white' };
    if (r > 4) return { side: 'black' };
    return null;
  });
};

/** Get row and column for 0..63 index */
export function getCoord(index) {
  return { r: Math.floor(index / 8), c: index % 8 };
}

/** Get index from row and column */
export function getIndex(r, c) {
  if (r < 0 || r > 7 || c < 0 || c > 7) return null;
  return r * 8 + c;
}

/** Check if index is on playable dark square */
export function isDarkSquare(index) {
  const { r, c } = getCoord(index);
  return (r + c) % 2 === 1;
}

/** Get forward directions for piece */
export function getDirections(piece) {
  const dirs = [];
  // White moves down (dr = +1), Black moves up (dr = -1)
  if (piece.side === 'white' || piece.king) {
    dirs.push({ dr: 1, dc: -1 }, { dr: 1, dc: 1 });
  }
  if (piece.side === 'black' || piece.king) {
    dirs.push({ dr: -1, dc: -1 }, { dr: -1, dc: 1 });
  }
  return dirs;
}

/** Generate capture moves recursively for multi-jumps */
function getCaptureMovesForPiece(
  board,
  startIndex,
  currentIndex,
  currentPiece,
  visitedCaptures = [],
  currentPath = [startIndex]
) {
  const moves = [];
  const { r, c } = getCoord(currentIndex);
  const dirs = getDirections(currentPiece);

  for (const { dr, dc } of dirs) {
    const midR = r + dr;
    const midC = c + dc;
    const midIdx = getIndex(midR, midC);

    const landR = r + dr * 2;
    const landC = c + dc * 2;
    const landIdx = getIndex(landR, landC);

    if (
      midIdx !== null &&
      landIdx !== null &&
      !visitedCaptures.includes(midIdx) &&
      (landIdx === startIndex || board[landIdx] === null)
    ) {
      const midPiece = board[midIdx];
      if (midPiece !== null && midPiece.side !== currentPiece.side) {
        // Promote temporarily if landing on back row
        const promotes =
          !currentPiece.king &&
          ((currentPiece.side === 'white' && landR === 7) ||
            (currentPiece.side === 'black' && landR === 0));

        const updatedPiece = promotes ? { ...currentPiece, king: true } : currentPiece;
        const newVisited = [...visitedCaptures, midIdx];
        const newPath = [...currentPath, landIdx];

        // If promoted, stop multi-jump per standard rules
        if (promotes) {
          moves.push({
            from: startIndex,
            to: landIdx,
            captures: newVisited,
            path: newPath,
          });
        } else {
          // Continue searching for multi-jumps
          const subMoves = getCaptureMovesForPiece(
            board,
            startIndex,
            landIdx,
            updatedPiece,
            newVisited,
            newPath
          );
          if (subMoves.length > 0) {
            moves.push(...subMoves);
          } else {
            moves.push({
              from: startIndex,
              to: landIdx,
              captures: newVisited,
              path: newPath,
            });
          }
        }
      }
    }
  }

  return moves;
}

/** Get all capture moves for a side */
export function getAllCaptureMoves(board, side) {
  const captureMoves = [];
  for (let i = 0; i < 64; i++) {
    const piece = board[i];
    if (piece && piece.side === side) {
      const pieceCaptures = getCaptureMovesForPiece(board, i, i, piece);
      captureMoves.push(...pieceCaptures);
    }
  }
  return captureMoves;
}

/** Get all legal moves for a side (enforcing mandatory captures) */
export function getAllLegalMoves(board, side) {
  const captures = getAllCaptureMoves(board, side);
  if (captures.length > 0) {
    return captures;
  }

  const simpleMoves = [];
  for (let i = 0; i < 64; i++) {
    const piece = board[i];
    if (piece && piece.side === side) {
      const { r, c } = getCoord(i);
      const dirs = getDirections(piece);
      for (const { dr, dc } of dirs) {
        const destR = r + dr;
        const destC = c + dc;
        const destIdx = getIndex(destR, destC);
        if (destIdx !== null && board[destIdx] === null) {
          simpleMoves.push({
            from: i,
            to: destIdx,
            captures: [],
            path: [i, destIdx],
          });
        }
      }
    }
  }

  return simpleMoves;
}

/** Get legal moves starting from a specific square (allows player full freedom of choice) */
export function getLegalMovesForSquare(board, side, squareIndex) {
  const piece = board[squareIndex];
  if (!piece || piece.side !== side) return [];

  const moves = [];
  const captures = getCaptureMovesForPiece(board, squareIndex, squareIndex, piece);
  moves.push(...captures);

  const { r, c } = getCoord(squareIndex);
  const dirs = getDirections(piece);
  for (const { dr, dc } of dirs) {
    const destR = r + dr;
    const destC = c + dc;
    const destIdx = getIndex(destR, destC);
    if (destIdx !== null && board[destIdx] === null) {
      moves.push({
        from: squareIndex,
        to: destIdx,
        captures: [],
        path: [squareIndex, destIdx],
      });
    }
  }

  return moves;
}

/** Execute a move on the board and return new board state */
export function applyMove(board, move) {
  const newBoard = [...board];
  const movingPiece = newBoard[move.from];
  if (!movingPiece) return newBoard;

  newBoard[move.from] = null;
  for (const capIdx of move.captures) {
    newBoard[capIdx] = null;
  }

  const { r: destR } = getCoord(move.to);
  const promotes =
    !movingPiece.king &&
    ((movingPiece.side === 'white' && destR === 7) ||
      (movingPiece.side === 'black' && destR === 0));

  newBoard[move.to] = {
    side: movingPiece.side,
    king: movingPiece.king || promotes,
  };

  return newBoard;
}

/** Evaluate board position score for Minimax AI */
export function evaluateBoard(board) {
  let score = 0;
  for (let i = 0; i < 64; i++) {
    const piece = board[i];
    if (!piece) continue;

    const { r, c } = getCoord(i);
    let pieceValue = piece.king ? 18 : 10;

    // Positional bonuses: center control & advancement
    if (r >= 2 && r <= 5 && c >= 2 && c <= 5) pieceValue += 2;
    if (!piece.king) {
      if (piece.side === 'white') pieceValue += r;     // Advancing down
      else pieceValue += (7 - r);                     // Advancing up
    }

    // Back-row guard bonus
    if (!piece.king) {
      if (piece.side === 'white' && r === 0) pieceValue += 3;
      if (piece.side === 'black' && r === 7) pieceValue += 3;
    }

    if (piece.side === 'black') {
      score += pieceValue;
    } else {
      score -= pieceValue;
    }
  }
  return score;
}

/** Minimax search algorithm with Alpha-Beta pruning */
function minimax(board, depth, alpha, beta, isMaximizing) {
  const turn = isMaximizing ? 'black' : 'white';
  const legalMoves = getAllLegalMoves(board, turn);

  if (depth === 0 || legalMoves.length === 0) {
    return { score: evaluateBoard(board), move: null };
  }

  let bestMove = legalMoves[0] || null;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of legalMoves) {
      const nextBoard = applyMove(board, move);
      const evalResult = minimax(nextBoard, depth - 1, alpha, beta, false);
      if (evalResult.score > maxEval) {
        maxEval = evalResult.score;
        bestMove = move;
      }
      alpha = Math.max(alpha, evalResult.score);
      if (beta <= alpha) break;
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (const move of legalMoves) {
      const nextBoard = applyMove(board, move);
      const evalResult = minimax(nextBoard, depth - 1, alpha, beta, true);
      if (evalResult.score < minEval) {
        minEval = evalResult.score;
        bestMove = move;
      }
      beta = Math.min(beta, evalResult.score);
      if (beta <= alpha) break;
    }
    return { score: minEval, move: bestMove };
  }
}

/** Get best move for Computer AI based on difficulty */
export function getBestAIMove(board, side = 'black', difficulty = 'medium') {
  const legalMoves = getAllLegalMoves(board, side);
  if (legalMoves.length === 0) return null;

  if (difficulty === 'easy') {
    // 45% chance to play casual random move for beginners
    if (Math.random() < 0.45) {
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }
    const result = minimax(board, 2, -Infinity, Infinity, side === 'black');
    return result.move || legalMoves[0];
  }

  if (difficulty === 'hard') {
    // Expert depth 5 minimax
    const result = minimax(board, 5, -Infinity, Infinity, side === 'black');
    return result.move || legalMoves[0];
  }

  // Medium depth 3 minimax
  const result = minimax(board, 3, -Infinity, Infinity, side === 'black');
  return result.move || legalMoves[0];
}

/** Get hint move for player */
export function getHintMove(board, side) {
  const moves = getAllLegalMoves(board, side);
  if (moves.length === 0) return null;

  // Pick move with maximum score after opponent response
  let bestMove = moves[0];
  let bestScore = side === 'white' ? Infinity : -Infinity;

  for (const move of moves) {
    const nextBoard = applyMove(board, move);
    const score = evaluateBoard(nextBoard);
    if (side === 'white' && score < bestScore) {
      bestScore = score;
      bestMove = move;
    } else if (side === 'black' && score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

/** Check if game has ended */
export function checkGameEnd(board, currentTurn) {
  const legalMoves = getAllLegalMoves(board, currentTurn);
  const whitePieces = board.filter((p) => p?.side === 'white').length;
  const blackPieces = board.filter((p) => p?.side === 'black').length;

  if (whitePieces === 0) return { isOver: true, winner: 'black' };
  if (blackPieces === 0) return { isOver: true, winner: 'white' };

  if (legalMoves.length === 0) {
    // Current player has no legal moves -> opposite side wins
    return { isOver: true, winner: currentTurn === 'white' ? 'black' : 'white' };
  }

  return { isOver: false, winner: null };
}
