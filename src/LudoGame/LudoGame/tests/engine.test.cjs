const test=require('node:test');const assert=require('node:assert/strict');
const {TRACK,START,SAFE,FINISH,fresh,globalIndex,coordinate,legal,reduce}=require('../src/engine');
const roll=(s,dice)=>reduce(s,{type:'ROLL',dice,now:100});
test('reference ring contains 44 unique cells and home entries align',()=>{
  assert.equal(TRACK.length,44);assert.equal(new Set(TRACK.map(c=>c.join(','))).size,44);
  assert.deepEqual([0,1,2,3].map(p=>TRACK[globalIndex(p,42)]),[[6,0],[12,6],[0,6],[6,12]]);
});
test('all tokens start in yards; first player has 165 seconds',()=>{
  const s=fresh(0);assert.equal(s.deadline,165000);assert.equal(s.turn,0);assert.equal(s.tokens.flat().filter(n=>n===-1).length,16);
});
test('no six and no available token automatically passes turn',()=>{
  const s=roll(fresh(0),[2,5]);assert.equal(s.turn,1);assert.equal(s.phase,'roll');
});
test('a six exits yard and consumes exactly one die',()=>{
  let s=roll(fresh(0),[6,2]);assert.deepEqual(legal(s),[0,1,2,3]);
  s=reduce(s,{type:'MOVE',token:0,now:100});assert.equal(s.tokens[0][0],0);assert.deepEqual(s.available,[1]);assert.equal(s.selected,1);
  s=reduce(s,{type:'MOVE',token:0,now:100});assert.equal(s.tokens[0][0],2);assert.equal(s.turn,0);assert.equal(s.phase,'roll');
});
test('either die may be selected and consumed',()=>{
  let s=fresh(0);s.tokens[0][0]=0;s=roll(s,[2,3]);s=reduce(s,{type:'SELECT',index:1});s=reduce(s,{type:'MOVE',token:0,now:100});
  assert.equal(s.tokens[0][0],3);assert.deepEqual(s.available,[0]);
});
test('invalid rolls and illegal moves are ignored',()=>{
  const s=fresh(0);assert.equal(roll(s,[0,7]),s);const m=roll(s,[6,2]);assert.equal(reduce(m,{type:'MOVE',token:99}),m);assert.equal(roll(m,[6,6]),m);
});
test('landing on an unsafe square captures an opponent',()=>{
  let s=fresh(0);s.tokens[0][0]=10;s.tokens[1][0]=1;s=roll(s,[2,1]);
  s=reduce(s,{type:'MOVE',token:0,now:100});assert.equal(s.tokens[1][0],-1);
});
test('safe starting squares protect opponents',()=>{
  let s=fresh(0);s.tokens[0][0]=9;s.tokens[1][0]=0;s=roll(s,[2,1]);
  s=reduce(s,{type:'MOVE',token:0,now:100});assert.equal(s.tokens[1][0],0);
});
test('private lanes cannot be captured and require exact finish',()=>{
  let s=fresh(0);s.tokens[0]=[46,47,47,47];s=roll(s,[2,1]);assert.equal(s.selected,1);assert.deepEqual(legal(s,0),[]);
  s=reduce(s,{type:'MOVE',token:0,now:100});assert.equal(s.winner,0);assert.equal(s.phase,'won');
});
test('finish coordinates are in center; all yards are bounded',()=>{
  for(let p=0;p<4;p++)for(let t=0;t<4;t++){
    assert.deepEqual(coordinate(p,t,FINISH),[6.5,6.5]);assert.ok(coordinate(p,t,-1).every(v=>v>0&&v<13));
  }
});
test('undo restores a roll and a move without rerolling',()=>{
  const initial=fresh(0);const rolled=roll(initial,[6,3]);const moved=reduce(rolled,{type:'MOVE',token:0,now:100});
  const undone=reduce(moved,{type:'UNDO',now:200});assert.deepEqual(undone.tokens,rolled.tokens);assert.deepEqual(undone.dice,[6,3]);assert.deepEqual(undone.available,[0,1]);
  const reset=reduce(undone,{type:'UNDO',now:300});assert.equal(reset.phase,'roll');assert.deepEqual(reset.tokens,initial.tokens);
});
test('turn order goes red green blue yellow',()=>{
  let s=fresh(0);const turns=[];for(let i=0;i<4;i++){s=roll(s,[1,2]);turns.push(s.turn);}assert.deepEqual(turns,[1,3,2,0]);
});
test('timeout discards dice and undo history but not pieces',()=>{
  const s=roll(fresh(0),[6,6]);assert.equal(reduce(s,{type:'TIMEOUT',now:10}),s);
  const next=reduce(s,{type:'TIMEOUT',now:165001});assert.equal(next.turn,1);assert.equal(next.history.length,0);assert.equal(next.phase,'roll');assert.deepEqual(next.tokens,s.tokens);
});
test('pause shifts deadline by paused duration',()=>{
  assert.equal(reduce(fresh(0),{type:'RESUME',duration:5000}).deadline,170000);
});
test('hint selects a legal move and prioritizes winning',()=>{
  let s=fresh(0);s.tokens[0]=[46,0,-1,-1];s=roll(s,[1,6]);s=reduce(s,{type:'HINT'});assert.equal(s.hint,0);assert.equal(s.selected,0);
});
test('completed games reject subsequent rolls',()=>{
  const s={...fresh(0),phase:'won',winner:0};assert.equal(roll(s,[6,6]),s);
});
