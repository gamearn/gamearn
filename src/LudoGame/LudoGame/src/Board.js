import React from 'react';
import { View, Pressable } from 'react-native';
import Svg, { Rect, Circle, Polygon, Defs, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
const {COLORS, coordinate, legal, FINISH} = require('./engine');

function star(cx,cy,r) {
  return Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5; const d=i%2?r*.44:r;return `${cx+Math.cos(a)*d},${cy+Math.sin(a)*d}`;}).join(' ');
}
export default function Board({ size, state, onMove }) {
  const candidates = legal(state);
  const tokens = state.tokens.flatMap((team,p)=>team.map((progress,t)=>({p,t,progress,xy:coordinate(p,t,progress)})));
  const groups = {};
  tokens.forEach(token=>{const key=token.xy.join(','); (groups[key] ||= []).push(token);});
  for(const group of Object.values(groups)) group.forEach((token,i)=>{
    if(group.length>1) { const a=i*Math.PI*2/group.length;token.xy=[token.xy[0]+Math.cos(a)*.22,token.xy[1]+Math.sin(a)*.22]; }
  });
  return <View style={{width:size,height:size,borderRadius:size*.04,overflow:'hidden',backgroundColor:'#fff'}}>
    <Svg width={size} height={size} viewBox="0 0 13 13">
      <Defs>{COLORS.map((color,i)=><RadialGradient key={i} id={`token${i}`} cx="32%" cy="25%" r="80%"><Stop offset="0" stopColor={color}/><Stop offset=".65" stopColor={color}/><Stop offset="1" stopColor={['#980014','#006320','#bb7300','#0023a8'][i]}/></RadialGradient>)}</Defs>
      {[[0,0],[8,0],[0,8],[8,8]].map(([x,y],p)=><React.Fragment key={p}>
        <Rect x={x} y={y} width="5" height="5" fill={COLORS[p]}/>
        <Rect x={x+.65} y={y+.65} width="3.7" height="3.7" rx=".5" fill={['#ffd0ce','#c8ffce','#fff4b4','#b8e9ff'][p]}/>
      </React.Fragment>)}
      {Array.from({length:13},(_,y)=>Array.from({length:13},(_,x)=>{
        if(!((x>=5&&x<=7)||(y>=5&&y<=7)) || (x>=5&&x<=7&&y>=5&&y<=7)) return null;
        let color='#f1f1f3';
        if(x===6&&y<5)color=COLORS[0];if(x===6&&y>7)color=COLORS[3];
        if(y===6&&x<5)color=COLORS[2];if(y===6&&x>7)color=COLORS[1];
        return <Rect key={`${x}-${y}`} x={x+.01} y={y+.01} width=".98" height=".98" rx=".045" fill={color} stroke="#233048" strokeWidth=".025"/>;
      }))}
      <Polygon points="5,5 8,5 6.5,6.5" fill={COLORS[0]} stroke="#30313c" strokeWidth=".04"/>
      <Polygon points="8,5 8,8 6.5,6.5" fill={COLORS[1]} stroke="#30313c" strokeWidth=".04"/>
      <Polygon points="8,8 5,8 6.5,6.5" fill={COLORS[3]} stroke="#30313c" strokeWidth=".04"/>
      <Polygon points="5,8 5,5 6.5,6.5" fill={COLORS[2]} stroke="#30313c" strokeWidth=".04"/>
      {[[6.5,.5],[12.5,6.5],[6.5,12.5],[.5,6.5]].map(([x,y],i)=><Polygon key={i} points={star(x,y,.34)} fill="#fffde0"/>)}
      {[[6.5,4.5,'↓'],[8.5,6.5,'←'],[6.5,8.5,'↑'],[4.5,6.5,'→']].map(([x,y,text])=><SvgText key={text} x={x} y={y+.28} fontSize=".8" fontWeight="bold" textAnchor="middle" fill="#ffffff66">{text}</SvgText>)}
      <Circle cx="6.5" cy="6.5" r=".76" fill="#09267f" stroke="#1186ff" strokeWidth=".06"/>
      <Polygon points="6.03,6.25 6.2,6.72 6.8,6.72 6.97,6.25 6.7,6.43 6.5,6.12 6.3,6.43" fill="#fff"/>
      {tokens.filter(t=>t.progress!==FINISH).map(({p,t,xy:[x,y]})=><React.Fragment key={`${p}-${t}`}>
        {p===state.turn&&candidates.includes(t)&&<Circle cx={x} cy={y} r=".49" fill="none" stroke={state.hint===t?'#fff':'#ffef70'} strokeWidth=".07"/>}
        <Circle cx={x} cy={y} r=".42" fill={`url(#token${p})`} stroke={['#a30714','#006522','#b87700','#0731ae'][p]} strokeWidth=".05"/>
        <Circle cx={x-.13} cy={y-.17} r=".085" fill="#ffffff77"/>
        {state.tokens[p][t]>=0&&<SvgText x={x} y={y+.12} fontSize=".32" fontWeight="bold" textAnchor="middle" fill="#fff">{t+1}</SvgText>}
      </React.Fragment>)}
    </Svg>
    {tokens.filter(t=>t.progress!==FINISH).map(({p,t,xy:[x,y]})=><Pressable key={`${p}-${t}`}
      accessibilityRole="button" accessibilityLabel={`Player ${p+1}, token ${t+1}${p===state.turn&&candidates.includes(t)?', legal move':''}`}
      disabled={p!==state.turn||!candidates.includes(t)} onPress={()=>onMove(t)}
      style={{position:'absolute',left:(x-.45)/13*size,top:(y-.45)/13*size,width:size*.9/13,height:size*.9/13,borderRadius:size}} />)}
  </View>;
}
