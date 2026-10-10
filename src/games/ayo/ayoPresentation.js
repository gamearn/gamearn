// Presentation only. Pit ownership, moves, sowing, captures and results come
// from the server. Rotate the board so the signed-in player's row is below.
export function serverPitIndex(displayIndex, playerIndex) {
  const index = (displayIndex + 6) % 12;
  return playerIndex === 0 ? index : 11 - index;
}

export function ayoView(snapshot, uid) {
  const playerIndex = snapshot.players.findIndex((player) => player.uid === uid);
  if (playerIndex < 0) throw new Error('You are not a participant in this Ayo game.');
  const rotate = (board) => Array.from({ length: 12 }, (_, index) => board[serverPitIndex(index, playerIndex)]);
  const displayPit = (index) => Array.from({ length: 12 }, (_, i) => i).find((i) => serverPitIndex(i, playerIndex) === index);
  const completed = snapshot.status === 'completed';
  const scores = snapshot.finalScores
    ? [snapshot.finalScores.player0, snapshot.finalScores.player1]
    : snapshot.stores;
  return {
    pits: rotate(snapshot.board),
    scores: [scores[playerIndex], scores[1 - playerIndex]],
    playerIndex,
    activePlayer: snapshot.currentPlayerUid === uid ? 1 : 2,
    gameStatus: completed ? 'game_over' : snapshot.status,
    winner: snapshot.winner,
    opponentName: snapshot.players[1 - playerIndex]?.uid?.startsWith('bot_') ? 'Oba' : snapshot.players[1 - playerIndex]?.displayName || 'Opponent',
    statusMessage: completed
      ? snapshot.winner == null ? 'Draw' : snapshot.winner === uid ? 'You win!' : 'Opponent wins'
      : snapshot.currentPlayerUid === uid ? 'Your turn. Choose a pit.' : "Opponent's turn",
    steps: (snapshot.lastMove?.sowingSteps || []).map((step) => ({
      ...step, pits: rotate(step.board), pitIndex: displayPit(step.pitIndex),
    })),
    movingPlayer: snapshot.lastMove?.playerUid === uid ? 1 : 2,
  };
}

export const initialAyoSession = { snapshot: null, queue: [], revision: -1, serial: 0 };

export function receiveAyoSnapshot(model, snapshot, reset = false) {
  const revision = snapshot.turnCount || 0;
  if (!reset && revision < model.revision) return model;
  if (!reset && model.snapshot?.status === 'completed' && snapshot.status !== 'completed') return model;
  if (!reset && revision === model.revision && snapshot.status === model.snapshot?.status && snapshot.currentPlayerUid === model.snapshot?.currentPlayerUid) return model;
  const animate = !reset && revision === model.revision + 1;
  const entry = { id: model.serial + 1, snapshot, animate };
  return {
    snapshot, revision, serial: entry.id,
    queue: reset ? [entry] : [...model.queue, entry],
  };
}
