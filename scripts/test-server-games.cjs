const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const babel = require('@babel/core');
const root = path.join(__dirname, '..');

function load(relative, mocks = {}) {
  const { code } = babel.transformFileSync(path.join(root, relative), {
    configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)((id) => {
    if (!(id in mocks)) throw new Error(`Unexpected dependency: ${id}`);
    return mocks[id];
  }, module, module.exports);
  return module.exports;
}
const presentation = load('src/games/ayo/ayoPresentation.js');
const whotAdapter = load('src/games/whot/serverAdapter.js', {
  './whotGameEngine': { SHAPE_COLORS: {}, parseTimerSec: (s) => (s === '30s' ? 30 : s === '1m' ? 60 : s === '3m' ? 180 : 120) },
});
const draughtsAdapter = load('src/games/checkers/draughtsAdapter.js');
const checkersEngine = load('src/games/checkers/CheckersEngine.js');
const ludoEngine = load('src/games/ludo/ludoGameEngine.js');
const ludoAdapter = load('src/games/ludo/serverAdapter.js', {
  './ludoGameEngine': ludoEngine,
});

const players = [{ uid: 'first', displayName: 'First' }, { uid: 'second', displayName: 'Second' }];
const snapshot = (extra = {}) => ({ players, board: Array(12).fill(4), stores: [0, 0], turnCount: 0, stateVersion: 0, currentPlayerUid: 'first', currentPlayerIndex: 0, status: 'playing', winner: null, ...extra });

test('Ayo rotates both server seats and round-trips every selectable pit', () => {
  const state = snapshot({ board: Array.from({ length: 12 }, (_, index) => index) });
  players.forEach((player, seat) => {
    const view = presentation.ayoView(state, player.uid);
    assert.equal(view.playerIndex, seat);
    for (let index = 0; index < 12; index++) assert.equal(view.pits[index], presentation.serverPitIndex(index, seat));
    const ownPits = view.pits.slice(6).sort((a, b) => a - b);
    assert.deepEqual(ownPits, Array.from({ length: 6 }, (_, i) => seat * 6 + i));
    assert.equal(view.activePlayer, seat === 0 ? 1 : 2);
  });
  assert.throws(() => presentation.ayoView(state, 'stranger'));
});

test('Ayo queues every server move, ignores duplicate/old acknowledgments, resyncs without replay', () => {
  const { receiveAyoSnapshot: receive, initialAyoSession } = presentation;
  let model = receive(initialAyoSession, snapshot(), true);
  model = { ...model, queue: [] };
  const first = snapshot({ turnCount: 1, currentPlayerUid: 'second' });
  const second = snapshot({ turnCount: 2 });
  model = receive(model, first);
  model = receive(model, second);
  assert.equal(model.queue.length, 2);
  assert.ok(model.queue.every((entry) => entry.animate));
  assert.equal(receive(model, first), model);
  assert.equal(receive(model, second), model);
  model = receive(model, snapshot({ turnCount: 2, status: 'completed' }));
  assert.equal(model.queue.at(-1).animate, false);
  assert.equal(receive(model, second), model);
  model = receive(model, second, true);
  assert.equal(model.queue.length, 1);
  assert.equal(model.queue[0].animate, false);
});

test('Ayo accepts a server skip at the same revision and preserves server draw scores', () => {
  let model = presentation.receiveAyoSnapshot(presentation.initialAyoSession, snapshot({ turnCount: 1, currentPlayerUid: 'second' }), true);
  model = presentation.receiveAyoSnapshot(model, snapshot({ turnCount: 1 }));
  assert.equal(model.snapshot.currentPlayerUid, 'first');
  const view = presentation.ayoView(snapshot({ status: 'completed', finalScores: { player0: 24, player1: 24 } }), 'second');
  assert.equal(view.statusMessage, 'Draw');
  assert.deepEqual(view.scores, [24, 24]);
});

test('Whot socket state hides opponent hands and renders the server turn seat', () => {
  const gameState = {
    players: [
      { uid: 'me', displayName: 'Me', hand: [{ number: 1, shape: 'circle' }, { number: 20, shape: 'whot' }] },
      { uid: 'foe', displayName: 'Foe', hand: 5 },
    ],
    topCard: { number: 3, shape: 'star' },
    pendingShape: 'square',
    currentPlayerIndex: 1,
    deckSize: 9,
    status: 'playing',
  };
  const view = whotAdapter.socketStateToEngine(gameState, 'me', { selfName: 'Me' });
  assert.equal(view.players[0].name, 'Me');
  assert.equal(view.players[0].hand.length, 2);
  assert.equal(view.players[0].hand[0].value, 1);
  assert.equal(view.players[0].hand[0].shape, 'circle');
  assert.equal(view.players[1].hand.length, 5); // opponent count only, no leaked cards
  assert.equal(view.players[1].hand[0], undefined);
  assert.equal(view.activePlayerIndex, 1);
  assert.equal(view.requestedShape, 'square');
  assert.equal(view.drawPile.length, 9);
  assert.equal(view.gameStatus, 'playing');
  assert.equal(view.winner, null);
});

test('Whot adapter marks the human and bot winner without leaking the losing hand', () => {
  const base = {
    players: [
      { uid: 'me', displayName: 'Me', hand: [] },
      { uid: 'foe', displayName: 'Foe', hand: 3 },
    ],
    topCard: { number: 1, shape: 'circle' },
    currentPlayerIndex: 0,
    deckSize: 0,
  };
  const win = whotAdapter.socketStateToEngine({ ...base, status: 'completed', winner: 'me' }, 'me');
  assert.equal(win.gameStatus, 'game_over');
  assert.equal(win.winner, win.players[0]);
  const loss = whotAdapter.socketStateToEngine({ ...base, status: 'completed', winner: 'foe' }, 'me');
  assert.equal(loss.winner, loss.players[1]);
});

test('Whot practice snapshot builds the human hand and counts the bot hand', () => {
  const data = {
    players: [
      { uid: 'me', displayName: 'Me', handSize: 2 },
      { uid: 'bot_practice_1', displayName: 'Gamearn Bot', handSize: 4 },
    ],
    playerHand: [{ number: 5, shape: 'cross' }],
    topCard: { number: 2, shape: 'square' },
    currentPlayerIndex: 1,
    currentPlayerUid: 'bot_practice_1',
    deckSize: 7,
    status: 'playing',
  };
  const view = whotAdapter.practiceSnapshotToEngine(data, { selfUid: 'me', selfName: 'Me' });
  assert.equal(view.players[0].hand.length, 1);
  assert.equal(view.players[0].hand[0].value, 5);
  assert.equal(view.players[1].hand.length, 4);
  assert.equal(view.players[1].name, 'Gamearn Bot');
  assert.equal(view.activePlayerIndex, 1);
  assert.equal(view.drawPile.length, 7);
});

test('Whot adapter strictly preserves match settings: custom cards and turn timer', () => {
  const data = {
    players: [
      { uid: 'me', displayName: 'Me', handSize: 4 },
      { uid: 'bot_practice_1', displayName: 'Oba', handSize: 4 },
    ],
    playerHand: [
      { number: 5, shape: 'cross' },
      { number: 7, shape: 'star' },
      { number: 1, shape: 'circle' },
      { number: 4, shape: 'triangle' },
    ],
    topCard: { number: 2, shape: 'square' },
    currentPlayerIndex: 0,
    deckSize: 31,
    status: 'playing',
  };
  const view = whotAdapter.practiceSnapshotToEngine(data, {
    selfUid: 'me',
    selfName: 'Me',
    timer: '30s',
    startCards: 4,
    secondsRemaining: 28,
  });
  assert.equal(view.players[0].hand.length, 4);
  assert.equal(view.players[1].hand.length, 4);
  assert.equal(view.turnTimerSeconds, 30);
  assert.equal(view.secondsRemaining, 28);

  const socketData = {
    players: [
      { uid: 'me', displayName: 'Me', hand: [{ number: 1, shape: 'circle' }] },
      { uid: 'other', displayName: 'Other', hand: 5 },
    ],
    topCard: { number: 8, shape: 'star' },
    currentPlayerIndex: 0,
    deckSize: 25,
    status: 'playing',
  };
  const sockView = whotAdapter.socketStateToEngine(socketData, 'me', {
    timer: '3m',
    startCards: 5,
    secondsRemaining: 175,
  });
  assert.equal(sockView.players[1].hand.length, 5);
  assert.equal(sockView.turnTimerSeconds, 180);
  assert.equal(sockView.secondsRemaining, 175);
});

test('Draughts maps server piece codes onto the engine board', () => {
  const flat = Array(64).fill(0);
  flat[0] = 1;  // P1 man (top)    -> engine white man
  flat[9] = 2;  // P1 king         -> engine white king
  flat[54] = 3; // P2 man (bottom) -> engine black man
  flat[63] = 4; // P2 king         -> engine black king
  const board = draughtsAdapter.serverBoardToEngine(flat);
  assert.deepEqual(board[0], { side: 'white', king: false });
  assert.deepEqual(board[9], { side: 'white', king: true });
  assert.deepEqual(board[54], { side: 'black', king: false });
  assert.deepEqual(board[63], { side: 'black', king: true });
  assert.equal(board[5], null);
});

test('Draughts remote descriptor tracks seats, turns and the authoritative winner', () => {
  const state = {
    players: [{ uid: 'top', displayName: 'Top' }, { uid: 'bottom', displayName: 'Bottom' }],
    board: Array(64).fill(0),
    currentPlayerIndex: 1,
    status: 'playing',
    winner: null,
  };
  const view = draughtsAdapter.draughtsSnapshotToRemote(state, 'bottom');
  assert.equal(view.humanSide, 'black');
  assert.equal(view.turn, 'black');
  assert.equal(view.canMove, true);
  assert.equal(view.gameOver, false);
  const other = draughtsAdapter.draughtsSnapshotToRemote(state, 'top');
  assert.equal(other.humanSide, 'white');
  assert.equal(other.canMove, false);
  const done = draughtsAdapter.draughtsSnapshotToRemote({ ...state, status: 'completed', winner: 'top' }, 'bottom');
  assert.equal(done.gameOver, true);
  assert.equal(done.winnerSide, 'white');
  assert.equal(done.canMove, false);
  assert.equal(draughtsAdapter.draughtsSnapshotToRemote(null, 'top'), null);
});

test('Draughts converts engine moves (with multi-captures) to server coordinates', () => {
  assert.deepEqual(draughtsAdapter.engineMoveToServer({ from: 40, to: 24, captures: [33, 51] }), {
    fromRow: 5, fromCol: 0, toRow: 3, toCol: 0,
    captures: [{ row: 4, col: 1 }, { row: 6, col: 3 }],
  });
  assert.deepEqual(draughtsAdapter.engineMoveToServer({ from: 17, to: 26, captures: [] }), {
    fromRow: 2, fromCol: 1, toRow: 3, toCol: 2, captures: undefined,
  });
});

test('Draughts CheckersEngine checkGameEnd correctly resolves wins for player or Oba', () => {
  // Board with only black pieces (white has 0 pieces) -> black wins
  const onlyBlack = Array(64).fill(null);
  onlyBlack[1] = { side: 'black', king: false };
  assert.deepEqual(checkersEngine.checkGameEnd(onlyBlack, 'white'), { isOver: true, winner: 'black' });

  // Board with only white pieces (black has 0 pieces) -> white wins
  const onlyWhite = Array(64).fill(null);
  onlyWhite[62] = { side: 'white', king: false };
  assert.deepEqual(checkersEngine.checkGameEnd(onlyWhite, 'black'), { isOver: true, winner: 'white' });
});

test('Whot GameOver detection accurately identifies Oba win when bot hand empties', () => {
  const state = {
    players: [
      { uid: 'human_uid', displayName: 'Player', handSize: 3 },
      { uid: 'bot_oba', displayName: 'Oba 👑', handSize: 0 },
    ],
    playerHand: [{ shape: 'circle', number: 5 }],
    botCardCount: 0,
    topCard: { shape: 'circle', number: 2 },
    status: 'completed',
    winner: 'bot_oba',
  };
  const view = whotAdapter.practiceSnapshotToEngine(state, { selfUid: 'human_uid', vsOba: true });
  assert.equal(view.gameStatus, 'game_over');
  assert.equal(view.winner.name, 'Oba 👑');
  assert.equal(view.winner.id, 1);
});

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

// Deterministic hook runner: exercises the production transport hook with
// controlled REST/socket responses, no live credentials or native runtime.
function sessionHarness({ gameType = 'ayo', roomId = null, uid = 'first', start = snapshot() } = {}) {
  const cells = [];
  let cursor = 0, dirty = true, effects = [], current;
  const depsChanged = (a, b) => !a || !b || a.length !== b.length || a.some((value, i) => !Object.is(value, b[i]));
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in cells)) cells[index] = typeof initial === 'function' ? initial() : initial;
      return [cells[index], (next) => { cells[index] = typeof next === 'function' ? next(cells[index]) : next; dirty = true; }];
    },
    useRef(initial) { const index = cursor++; return cells[index] ||= { current: initial }; },
    useCallback(fn, deps) { const index = cursor++; if (depsChanged(cells[index]?.deps, deps)) cells[index] = { deps, fn }; return cells[index].fn; },
    useEffect(fn, deps) {
      const index = cursor++;
      if (depsChanged(cells[index]?.deps, deps)) {
        const old = cells[index];
        cells[index] = { deps };
        effects.push(() => { old?.cleanup?.(); cells[index].cleanup = fn(); });
      }
    },
  };
  const moveReply = deferred();
  let serverState = start;
  const calls = [];
  const api = {
    start: async () => ({ ...start, sessionId: 'practice-session' }),
    state: async () => { calls.push(['state']); return serverState; },
    move: (...args) => { calls.push(['move', ...args]); return moveReply.promise; },
    roll: (...args) => { calls.push(['roll', ...args]); return moveReply.promise; },
  };
  const handlers = {};
  const socket = {
    connected: false,
    on: (event, callback) => { handlers[event] = callback; },
    connect() { this.connected = true; handlers.connect(); },
    timeout() { return this; },
    emit(event, payload, callback) {
      calls.push([event, payload]);
      if (event === 'join_room') callback(null, { success: true, data: { gameState: serverState, status: serverState.status } });
      else if (event === 'make_move') moveReply.promise.then((reply) => callback(null, { success: true, data: reply }), (err) => callback(err));
    },
    removeAllListeners() { Object.keys(handlers).forEach((key) => delete handlers[key]); },
    disconnect() { this.connected = false; },
  };
  const { useServerGame } = load('src/games/useServerGame.js', {
    react, 'react-native': { AppState: { addEventListener: () => ({ remove() {} }) } },
    'socket.io-client': { io: () => socket }, '../config/appConfig': { NODE_API_BASE: 'https://example.invalid' },
    '../services/firebase': { getIdToken: async () => 'test-token' },
    '../services/api': { practice: { [gameType]: api }, practiceControl: (...args) => { calls.push(['control', ...args]); return moveReply.promise; } }, './ayo/ayoPresentation': presentation,
  });
  async function flush() {
    for (let i = 0; i < 20; i++) {
      if (dirty) {
        dirty = false; cursor = 0;
        current = useServerGame({ gameType, roomId, uid });
        const pending = effects; effects = []; pending.forEach((effect) => effect());
      }
      await Promise.resolve();
    }
    return current;
  }
  return { flush, calls, socket, handlers, moveReply, state: () => current,
    server: (state) => { serverState = state; },
    unmount: () => cells.forEach((cell) => cell?.cleanup?.()),
  };
}

for (const gameType of ['ayo', 'whot', 'draughts']) {
  test(`${gameType} practice waits for the server, suppresses duplicate taps, never applies a local move`, async () => {
    const h = sessionHarness({ gameType });
    let state = await h.flush();
    if (state.update) { state.complete(state.update.id); state = await h.flush(); }
    assert.equal(state.canMove, true);
    const move = gameType === 'ludo' ? { action: 'roll_dice' } : gameType === 'ayo' ? { pitIndex: 0 } : { sample: true };
    const before = state.snapshot;
    state.move(move); state.move(move);
    state = await h.flush();
    assert.equal(state.pending, true);
    assert.equal(state.snapshot, before);
    assert.equal(state.canMove, false);
    assert.equal(h.calls.filter(([type]) => type === 'move' || type === 'roll').length, 1);
    h.moveReply.resolve(snapshot({ turnCount: 1, stateVersion: 1, currentPlayerUid: 'second' }));
    state = await h.flush();
    assert.equal(state.snapshot.currentPlayerUid, 'second');
    assert.equal(state.canMove, false);
    h.unmount();
  });
}

test('multiplayer respects the second seat, reconnects, and never replays a timed-out move', async () => {
  const h = sessionHarness({ roomId: 'room', uid: 'second' });
  let state = await h.flush();
  state.complete(state.update.id); state = await h.flush();
  assert.equal(state.canMove, false);
  const next = snapshot({ currentPlayerUid: 'second', turnCount: 1, stateVersion: 1 });
  h.handlers.move_made({ gameState: next });
  state = await h.flush();
  assert.equal(state.canMove, false); // animation still queued
  state.complete(state.update.id); state = await h.flush();
  assert.equal(state.canMove, true);
  state.move({ pitIndex: 6 });
  h.server(snapshot({ turnCount: 2, stateVersion: 2 }));
  h.moveReply.reject(new Error('Timeout'));
  state = await h.flush();
  assert.equal(state.snapshot.turnCount, 2);
  assert.equal(state.canMove, false);
  assert.equal(h.calls.filter(([event]) => event === 'make_move').length, 1);
  assert.equal(state.update.animate, false);
  h.handlers.disconnect(); state = await h.flush();
  assert.equal(state.canMove, false);
  h.unmount();
  assert.equal(h.socket.connected, false);
});

test('completed multiplayer cannot be overwritten by a late playing snapshot', async () => {
  const h = sessionHarness({ gameType: 'whot', roomId: 'room' });
  await h.flush();
  h.handlers.game_over({ winner: 'first', gameState: snapshot({ status: 'completed', stateVersion: 2 }) });
  h.handlers.move_made({ gameState: snapshot({ stateVersion: 1 }) });
  const state = await h.flush();
  assert.equal(state.snapshot.status, 'completed');
  assert.equal(state.canMove, false);
  h.unmount();
});


test('server clock compensates phone skew, counts down and blocks expired input', async () => {
  const originalNow = Date.now;
  let time = 1000000;
  Date.now = () => time;
  const h = sessionHarness({ gameType: 'whot', start: snapshot({ serverTime: time + 3600000, turnDeadline: time + 3600000 + 30000 }) });
  try {
    let state = await h.flush();
    assert.equal(state.secondsRemaining, 30);
    assert.equal(state.canMove, true);
    time += 11000;
    await new Promise(resolve => setTimeout(resolve, 275));
    state = await h.flush();
    assert.equal(state.secondsRemaining, 19);
    time += 19000;
    await new Promise(resolve => setTimeout(resolve, 275));
    state = await h.flush();
    assert.equal(state.secondsRemaining, 0);
    assert.equal(state.canMove, false);
    state.move({ sample: true });
    assert.equal(h.calls.filter(([event]) => event === 'move').length, 0);
  } finally { h.unmount(); Date.now = originalNow; }
});




for (const gameType of ['ayo']) {
  test(`${gameType} undo waits for server then restores its snapshot without replay`, async () => {
    const h = sessionHarness({ gameType, start: snapshot({ turnCount: 4, stateVersion: 10 }) });
    let state = await h.flush();
    if (state.update) { state.complete(state.update.id); state = await h.flush(); }
    state.control('undo'); state.control('undo');
    state = await h.flush();
    assert.equal(state.pending, true);
    assert.equal(state.snapshot.turnCount, 4);
    assert.equal(h.calls.filter(([type]) => type === 'control').length, 1);
    h.server(snapshot({ turnCount: 2, stateVersion: 11 }));
    h.moveReply.resolve({ action: 'undo' });
    state = await h.flush();
    assert.equal(state.snapshot.turnCount, 2);
    assert.equal(state.pending, false);
    if (state.update) assert.equal(state.update.animate, false);
    h.unmount();
  });
}
test('practice controls never send a request in multiplayer', async () => {
  const h = sessionHarness({ roomId: 'room' });
  const state = await h.flush();
  await state.control('undo');
  assert.equal(h.calls.filter(([type]) => type === 'control').length, 0);
  h.unmount();
});

test('Whot pile exhaustion ends the game with checkup evaluation', () => {
  const state = {
    players: [
      { uid: 'me', hand: [{ number: 2, shape: 'circle' }] },
      { uid: 'foe', hand: 3 },
    ],
    deckSize: 0,
    status: 'playing',
    winner: null,
  };
  const view = whotAdapter.socketStateToEngine(state, 'me');
  assert.equal(view.gameStatus, 'game_over');
  assert.ok(view.winner);
});

test('Whot vs Oba strictly shows Oba and player, while multiplayer shows usernames', () => {
  const vsObaState = {
    players: [
      { uid: 'me', username: 'Champion', displayName: 'Champ Full' },
      { uid: 'bot_oba', displayName: 'Bot Oba' },
    ],
    deckSize: 5,
    status: 'playing',
  };
  const obaView = whotAdapter.socketStateToEngine(vsObaState, 'me', { vsOba: true });
  assert.equal(obaView.players.length, 2);
  assert.equal(obaView.players[0].name, 'Champion');
  assert.equal(obaView.players[1].name, 'Oba 👑');

  const multiState = {
    players: [
      { uid: 'me', username: 'GamerOne', displayName: 'John Doe' },
      { uid: 'p2', username: 'ProShooter', displayName: 'Jane Smith' },
    ],
    deckSize: 5,
    status: 'playing',
  };
  const multiView = whotAdapter.socketStateToEngine(multiState, 'me');
  assert.equal(multiView.players[0].name, 'GamerOne');
  assert.equal(multiView.players[1].name, 'ProShooter');
});

test('Draughts remote descriptor exposes server legalMoves and forcedCapture', () => {
  const state = {
    players: [{ uid: 'top', displayName: 'Top' }, { uid: 'bottom', displayName: 'Bottom' }],
    board: Array(64).fill(0),
    currentPlayerIndex: 0,
    status: 'playing',
    winner: null,
    legalMoves: [{ fromRow: 2, fromCol: 1, toRow: 4, toCol: 3 }],
    forcedCapture: { row: 2, col: 1 },
  };
  const view = draughtsAdapter.draughtsSnapshotToRemote(state, 'top');
  assert.equal(view.legalMoves.length, 1);
  assert.deepEqual(view.legalMoves[0], {
    from: 17,
    to: 35,
    captures: [26],
    path: [17, 35],
  });
  assert.equal(view.forcedCapture, 17);
});

test('CheckersEngine supports player freedom with captures and simple moves', () => {
  // Setup board where white at 17 can jump black at 26 landing at 35,
  // and another white piece at 1 has only a simple move.
  const board = Array(64).fill(null);
  board[17] = { side: 'white', king: false };
  board[26] = { side: 'black', king: false };
  board[1] = { side: 'white', king: false };

  const captures = checkersEngine.getAllCaptureMoves(board, 'white');
  assert.equal(captures.length, 1);
  assert.equal(captures[0].from, 17);
  assert.equal(captures[0].to, 35);
  assert.deepEqual(captures[0].captures, [26]);

  // Player has move freedom: piece at 1 can still be selected and moved even when a jump is available
  const movesFor1 = checkersEngine.getLegalMovesForSquare(board, 'white', 1);
  assert.ok(movesFor1.length > 0);

  // Legal moves for piece at 17 includes the jump
  const movesFor17 = checkersEngine.getLegalMovesForSquare(board, 'white', 17);
  assert.ok(movesFor17.some((m) => m.to === 35 && m.captures.length > 0));
});

test('Ludo diceValueForMove returns matching legal move diceValue or fallback', () => {
  const vmWithMoves = {
    legalMoves: [
      { pieceId: 0, diceValue: 6 },
      { pieceId: 1, diceValue: 4 },
    ],
    dice: [6, 4],
  };
  assert.equal(ludoAdapter.diceValueForMove(vmWithMoves, 0), 6);
  assert.equal(ludoAdapter.diceValueForMove(vmWithMoves, 1), 4);
  assert.equal(ludoAdapter.diceValueForMove(vmWithMoves, 2), 6); // fallback to dice[0]

  const vmNoMoves = { legalMoves: [], dice: [] };
  assert.equal(ludoAdapter.diceValueForMove(vmNoMoves, 0), null);
});

test('Ludo 4-player layout separates 2 players above and 2 players below board', () => {
  const fourPlayersSnapshot = {
    players: [
      { uid: 'human', displayName: 'Player 1', pieces: [{ position: -1, colorIdx: 0 }] },
      { uid: 'bot_2', displayName: 'Oba 2', pieces: [{ position: -1, colorIdx: 1 }] },
      { uid: 'bot_3', displayName: 'Oba 3', pieces: [{ position: -1, colorIdx: 2 }] },
      { uid: 'bot_4', displayName: 'Oba 4', pieces: [{ position: -1, colorIdx: 3 }] },
    ],
    currentPlayerIndex: 0,
    currentPlayerUid: 'human',
    diceValues: [6],
    diceRolled: true,
    status: 'playing',
  };

  const vm = ludoAdapter.ludoViewModel(fourPlayersSnapshot, 'human');
  assert.equal(vm.players.length, 4);

  // 4-player layout: 2 above the board, 2 below the board
  const isFourPlayer = vm.players.length === 4;
  assert.equal(isFourPlayer, true);

  const topPlayers = [vm.players[0], vm.players[3]].filter(Boolean);
  const bottomPlayers = [vm.players[1], vm.players[2]].filter(Boolean);

  assert.equal(topPlayers.length, 2);
  assert.equal(bottomPlayers.length, 2);

  // Top players match Top-Left (Red) and Top-Right (Green) quadrants
  assert.equal(topPlayers[0].pieces[0].colorIdx, 0); // Red
  assert.equal(topPlayers[1].pieces[0].colorIdx, 3); // Green

  // Bottom players match Bottom-Left (Yellow) and Bottom-Right (Blue) quadrants
  assert.equal(bottomPlayers[0].pieces[0].colorIdx, 1); // Yellow
  assert.equal(bottomPlayers[1].pieces[0].colorIdx, 2); // Blue
});

test('Ludo start star coordinates match color tile star positions on 15x15 board', () => {
  // Main track positions for player exits:
  // Red (0): r: 1, c: 6 -> x: (6.5 - 7.5)/15 = -0.067, y: (1.5 - 7.5)/15 = -0.400
  // Yellow (1): r: 8, c: 1 -> x: (1.5 - 7.5)/15 = -0.400, y: (8.5 - 7.5)/15 = 0.067
  // Blue (2): r: 13, c: 8 -> x: (8.5 - 7.5)/15 = 0.067, y: (13.5 - 7.5)/15 = 0.400
  // Green (3): r: 6, c: 13 -> x: (13.5 - 7.5)/15 = 0.400, y: (6.5 - 7.5)/15 = -0.067
  const startCoords = [
    ludoEngine.MAIN_TRACK[0],  // Red
    ludoEngine.MAIN_TRACK[13], // Yellow
    ludoEngine.MAIN_TRACK[26], // Blue
    ludoEngine.MAIN_TRACK[39], // Green
  ];

  assert.deepEqual(startCoords[0], { r: 1, c: 6 });
  assert.deepEqual(startCoords[1], { r: 8, c: 1 });
  assert.deepEqual(startCoords[2], { r: 13, c: 8 });
  assert.deepEqual(startCoords[3], { r: 6, c: 13 });
});

test('Ludo rules: reaching home, captures, and rolling 6 grant extra turns', () => {
  const fs = require('fs');
  const validator = require(path.join(root, '..', 'Backend_manager', 'src', 'validators', 'ludo.js'));
  const gs = validator.initLudoGame('test_rules_room', [
    { uid: 'u1', displayName: 'Player 1' },
    { uid: 'u2', displayName: 'Player 2' },
  ]);

  // Test 1: Rolling a 6 to enter from yard grants extra turn
  const enterMove = validator.validateLudoMove({ pieceId: 0, diceValue: 6 }, gs, 'u1');
  assert.equal(enterMove.action, 'enter');
  assert.equal(enterMove.extraTurn, true);

  // Test 2: Moving onto an opponent on a non-safe square captures and grants extra turn
  gs.players[1].pieces[0] = { position: 10, inHomeStretch: false, homePosition: 0, completed: false, colorIdx: 2 };
  gs.players[0].pieces[0] = { position: 6, inHomeStretch: false, homePosition: 0, completed: false, colorIdx: 0 };
  const captureMove = validator.validateLudoMove({ pieceId: 0, diceValue: 4 }, gs, 'u1');
  assert.equal(captureMove.action, 'move');
  assert.ok(captureMove.capture);
  assert.equal(captureMove.extraTurn, true);

  // Test 3: Safe zone protection: opponent cannot be captured on square 8
  gs.players[1].pieces[0].position = 8;
  gs.players[0].pieces[0].position = 4;
  const safeMove = validator.validateLudoMove({ pieceId: 0, diceValue: 4 }, gs, 'u1');
  assert.equal(safeMove.capture, null);

  // Test 4: Reaching home grants extra turn according to standard online Ludo rules
  gs.players[0].pieces[0] = { position: 55, inHomeStretch: true, homePosition: 5, completed: false, colorIdx: 0 };
  const homeMove = validator.validateLudoMove({ pieceId: 0, diceValue: 1 }, gs, 'u1');
  assert.equal(homeMove.action, 'reach_home');
  assert.equal(homeMove.isHome, true);
  assert.equal(homeMove.extraTurn, true);

  // Test 5: Verify SafeAreaView is imported from react-native-safe-area-context, not react-native
  const ludoScreenCode = fs.readFileSync(path.join(root, 'src', 'games', 'ludo', 'LudoScreen.js'), 'utf8');
  assert.ok(ludoScreenCode.includes("from 'react-native-safe-area-context'"));
  assert.ok(!ludoScreenCode.match(/SafeAreaView[\s\S]*from ['"]react-native['"]/));
});





