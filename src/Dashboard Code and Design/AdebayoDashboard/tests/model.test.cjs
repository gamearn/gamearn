const test = require('node:test');
const assert = require('node:assert/strict');
const { INITIAL_STATE, reducer, restore, parseAmount, money, previousDay, leaderboard } = require('../src/model');

test('amounts are converted to integer kobo without rounding errors', () => {
  assert.equal(parseAmount('100.01'), 10001);
  assert.equal(parseAmount(' 1250.50 '), 125050);
  assert.equal(parseAmount('1000000'), 100000000);
});
test('invalid and out-of-range deposits are rejected', () => {
  for (const value of ['', '-100', '1e4', 'NaN', '0', '99.99', '1,000', '100.001', '1000000.01', 'Infinity']) assert.equal(parseAmount(value), null, value);
});
test('naira formatting matches the reference', () => {
  assert.equal(money(125000), '₦1,250.00'); assert.equal(money(500000), '₦5,000.00');
});
test('deposits update history and repeated request ids are idempotent', () => {
  const action = { type: 'TOP_UP', amount: 10001, id: 'deposit-1', date: '2026-09-17T10:00:00Z' };
  const next = reducer(INITIAL_STATE, action);
  assert.equal(next.balance, 135001); assert.equal(next.transactions.length, 1);
  assert.equal(reducer(next, action), next);
  assert.equal(reducer(next, { ...action, id: 'bad', amount: -10000 }), next);
});
test('first demo completion increments the seeded streak exactly once per day', () => {
  const action = { type: 'COMPLETE_DEMO', day: '2026-09-17' };
  const next = reducer(INITIAL_STATE, action);
  assert.equal(next.streak, 16); assert.equal(reducer(next, action).streak, 16);
});
test('consecutive days increment, missed days reset', () => {
  const state = { ...INITIAL_STATE, lastPlayed: '2026-09-17' };
  assert.equal(reducer(state, { type: 'COMPLETE_DEMO', day: '2026-09-18' }).streak, 16);
  assert.equal(reducer(state, { type: 'COMPLETE_DEMO', day: '2026-09-19' }).streak, 1);
});
test('calendar boundaries handle leap years and year transitions', () => {
  assert.equal(previousDay('2024-03-01'), '2024-02-29');
  assert.equal(previousDay('2026-03-01'), '2026-02-28');
  assert.equal(previousDay('2026-01-01'), '2025-12-31');
});
test('rewards cannot be claimed before day 30 or twice', () => {
  assert.equal(reducer(INITIAL_STATE, { type: 'CLAIM' }).claimed, false);
  const next = reducer({ ...INITIAL_STATE, streak: 30 }, { type: 'CLAIM' });
  assert.equal(next.claimed, true); assert.equal(reducer(next, { type: 'CLAIM' }), next);
});
test('registration and notification read states persist through restoration', () => {
  const next = reducer(reducer(INITIAL_STATE, { type: 'JOIN' }), { type: 'READ_NOTIFICATIONS' });
  assert.equal(restore(JSON.parse(JSON.stringify(next))).joined, true);
  assert.equal(restore(next).notificationsRead, true);
});
test('corrupted persisted state falls back to usable defaults', () => {
  const state = restore({ balance: -5, name: {}, streak: 'oops', settings: null, transactions: [null, {}] });
  assert.equal(state.balance, 125000); assert.equal(state.name, 'Adebayo');
  assert.equal(state.streak, 15); assert.deepEqual(state.transactions, []);
});
test('leaderboard periods change rankings and include the edited name', () => {
  assert.equal(leaderboard('Daily', 'Test')[0].name, 'Test');
  assert.equal(leaderboard('Weekly', 'Test')[0].name, 'PixelSlayer');
  assert.equal(leaderboard('Monthly', 'Test')[0].name, 'Nova_01');
  assert.equal(leaderboard('Yearly', 'Test')[0].name, 'ShadowKing');
});
test('profile validation and settings updates are bounded', () => {
  assert.equal(reducer(INITIAL_STATE, { type: 'NAME', value: '  ' }), INITIAL_STATE);
  assert.equal(reducer(INITIAL_STATE, { type: 'NAME', value: ' Ada ' }).name, 'Ada');
  assert.equal(reducer(INITIAL_STATE, { type: 'SETTING', key: 'sound', value: false }).settings.sound, false);
  assert.equal(reducer(INITIAL_STATE, { type: 'SETTING', key: 'unknown', value: true }), INITIAL_STATE);
});
