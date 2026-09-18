// Reference-board variant: 13x13 grid, 44 outer squares, two dice.
const COLORS = ['#ff202c', '#00c852', '#ffc400', '#0086ff'];
const NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
const ORDER = [0, 1, 3, 2]; // clockwise: red, green, blue, yellow
const TRACK = [
  [5,0],[6,0],[7,0],[7,1],[7,2],[7,3],[7,4],
  [8,5],[9,5],[10,5],[11,5],[12,5],[12,6],[12,7],
  [11,7],[10,7],[9,7],[8,7],[7,8],[7,9],[7,10],[7,11],[7,12],
  [6,12],[5,12],[5,11],[5,10],[5,9],[5,8],
  [4,7],[3,7],[2,7],[1,7],[0,7],[0,6],[0,5],
  [1,5],[2,5],[3,5],[4,5],[5,4],[5,3],[5,2],[5,1],
];
const START = [3,14,36,25];
const SAFE = new Set([1,3,12,14,23,25,34,36]);
const FINISH = 47;
function fresh(now = Date.now()) {
  return { tokens: Array.from({length:4}, () => [-1,-1,-1,-1]), turn:0,
    dice:[5,2], available:[], selected:0, phase:'roll', winner:null,
    extra:false, deadline:now+165000, message:'Player 1: roll both dice.', history:[], hint:null };
}
function globalIndex(player, progress) { return (START[player] + progress) % 44; }
function coordinate(player, token, progress) {
  if (progress < 0) {
    const origin = [[0,0],[8,0],[0,8],[8,8]][player];
    return [origin[0] + (token % 2 ? 3.25 : 1.6), origin[1] + (token > 1 ? 3.25 : 1.6)];
  }
  if (progress < 43) return TRACK[globalIndex(player, progress)].map(v => v + .5);
  const step = progress - 43;
  const homes = [[6,1+step],[11-step,6],[1+step,6],[6,11-step]];
  return progress === FINISH ? [6.5,6.5] : homes[player].map(v => v + .5);
}
function legal(state, dieIndex = state.selected) {
  if (state.phase !== 'move' || !state.available.includes(dieIndex)) return [];
  const die = state.dice[dieIndex];
  return state.tokens[state.turn].flatMap((p,i) => p === FINISH || (p < 0 && die !== 6) || (p >= 0 && p + die > FINISH) ? [] : [i]);
}
function settle(state, now) {
  if (state.tokens[state.turn].every(p => p === FINISH)) return {...state, winner:state.turn, phase:'won', available:[], message:`${NAMES[state.turn]} wins!`};
  const playable = state.available.filter(i => legal(state,i).length);
  if (playable.length) return {...state, selected:playable.includes(state.selected) ? state.selected : playable[0]};
  const next = state.extra ? state.turn : ORDER[(ORDER.indexOf(state.turn)+1)%4];
  return {...state, turn:next, phase:'roll', available:[], selected:0, extra:false, deadline:now+165000,
    message:`${NAMES[next]}: ${state.extra ? 'bonus turn — ' : ''}roll both dice.`, hint:null};
}
function reduce(state, action) {
  const now = action.now ?? Date.now();
  if (action.type === 'RESET') return fresh(now);
  if (action.type === 'UNDO') {
    if (!state.history.length) return state;
    const previous = state.history[state.history.length-1];
    return {...previous, history:state.history.slice(0,-1), deadline:now+165000, hint:null, message:'Last action undone. Continue your turn.'};
  }
  if (action.type === 'RESUME') return {...state, deadline:state.deadline + Math.max(0,action.duration)};
  if (state.phase === 'won') return state;
  if (action.type === 'TIMEOUT') {
    if (now < state.deadline) return state;
    const next = ORDER[(ORDER.indexOf(state.turn)+1)%4];
    return {...state, turn:next, phase:'roll', available:[], extra:false, selected:0, hint:null, history:[], deadline:now+165000, message:`Time expired. ${NAMES[next]} rolls next.`};
  }
  if (action.type === 'SELECT') return state.available.includes(action.index) ? {...state, selected:action.index, hint:null} : state;
  if (action.type === 'HINT') {
    let best = null;
    for (const d of state.available) for (const t of legal(state,d)) {
      const p = state.tokens[state.turn][t]; const target = p < 0 ? 0 : p + state.dice[d];
      const capture = target < 43 && !SAFE.has(globalIndex(state.turn,target)) && state.tokens.some((team, player) => player !== state.turn && team.some(v => v >= 0 && v < 43 && globalIndex(player,v) === globalIndex(state.turn,target)));
      const score = target === FINISH ? 1000 : capture ? 500 : p < 0 ? 200 : target;
      if (!best || score > best.score) best = {die:d,token:t,score};
    }
    return best ? {...state, selected:best.die, hint:best.token, message:`Hint: use ${state.dice[best.die]} on token ${best.token+1}.`} : {...state, message:'Roll the dice first to get a move hint.'};
  }
  const {history, ...snapshot} = state;
  const saved = [...history,snapshot].slice(-40);
  if (action.type === 'ROLL') {
    if (state.phase !== 'roll' || !Array.isArray(action.dice) || action.dice.length !== 2 || action.dice.some(d => !Number.isInteger(d) || d<1 || d>6)) return state;
    return settle({...state, dice:action.dice, available:[0,1], selected:0, phase:'move', extra:action.dice.includes(6), history:saved,
      hint:null, message:'Select a die, then tap a highlighted token.'},now);
  }
  if (action.type === 'MOVE') {
    if (!legal(state).includes(action.token)) return state;
    const tokens = state.tokens.map(t => [...t]);
    const p = tokens[state.turn][action.token]; const target = p<0 ? 0 : p+state.dice[state.selected];
    tokens[state.turn][action.token] = target;
    if (target < 43 && !SAFE.has(globalIndex(state.turn,target))) {
      tokens.forEach((team,player) => { if (player !== state.turn) team.forEach((v,i) => {
        if (v >= 0 && v < 43 && globalIndex(player,v) === globalIndex(state.turn,target)) team[i] = -1;
      }); });
    }
    return settle({...state, tokens, available:state.available.filter(i=>i!==state.selected), history:saved, hint:null, message:'Move complete. Use your remaining die.'},now);
  }
  return state;
}
module.exports = { COLORS,NAMES,TRACK,START,SAFE,FINISH,fresh,globalIndex,coordinate,legal,reduce };
