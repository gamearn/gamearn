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
  './whotGameEngine': { SHAPE_COLORS: {}, parseTimerSec: () => 120 },
});
const draughtsAdapter = load('src/games/checkers/draughtsAdapter.js');


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


