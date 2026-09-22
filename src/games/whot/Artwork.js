import React from 'react';
import { Platform } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop, Text as T } from 'react-native-svg';

export const FONT = Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-condensed';

export const HAND = [
  { id: 'red8', value: 8, color: '#f9002c', shape: 'cross' },
  { id: 'wild20', value: 20, color: '#ffcc00', shape: 'whot' },
  { id: 'green2', value: 2, color: '#00bb50', shape: 'square' },
  { id: 'blue4', value: 4, color: '#0065ff', shape: 'cross' },
  { id: 'purple10', value: 10, color: '#9400df', shape: 'circle' },
  { id: 'black14', value: 14, color: '#292533', shape: 'triangle' },
];

export function getCardCenters(count) {
  if (count <= 0) return [];
  if (count === 1) return [{ x: 512, y: 1115, a: 0 }];

  const startX = 200;
  const endX = 824;
  const startAngle = -16;
  const endAngle = 16;
  const centers = [];

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const x = startX + t * (endX - startX);
    const norm = (t - 0.5) * 2;
    const y = 1115 + norm * norm * 35;
    const a = startAngle + t * (endAngle - startAngle);
    centers.push({ x, y, a });
  }
  return centers;
}

export const CARD_CENTERS = getCardCenters(6);
export const PORTRAITS = [
  { x: 35, y: 422, w: 169, h: 156 },
  { x: 813, y: 425, w: 164, h: 151 },
  { x: 345, y: 238, w: 127, h: 126 },
  { x: 685, y: 1298, w: 96, h: 96 },
];

export function Crown({ x, y, size = 40, color = 'url(#gold)' }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${size / 100})`}>
      <Path d="M-40 -25 L-20 0 L0 -40 L21 0 L40 -25 L29 29 Q0 20 -29 29Z" fill={color} stroke="#bd8106" strokeWidth="2" />
      <Path d="M-28 34 Q0 26 28 34" stroke={color} strokeWidth="5" fill="none" />
      {[-40, 0, 40].map((cx, i) => (
        <Circle key={i} cx={cx} cy={i === 1 ? -42 : -26} r="6" fill={color} />
      ))}
    </G>
  );
}

function Gradients() {
  return (
    <Defs>
      <RadialGradient id="bg">
        <Stop offset="0" stopColor="#0344c0" />
        <Stop offset="0.65" stopColor="#10177b" />
        <Stop offset="1" stopColor="#210066" />
      </RadialGradient>
      <LinearGradient id="panel" x2="0" y2="1">
        <Stop offset="0" stopColor="#14126f" />
        <Stop offset="1" stopColor="#070737" />
      </LinearGradient>
      <LinearGradient id="purple" x2="0" y2="1">
        <Stop offset="0" stopColor="#e74cff" />
        <Stop offset="0.35" stopColor="#9000ee" />
        <Stop offset="1" stopColor="#4700bc" />
      </LinearGradient>
      <LinearGradient id="blue" x2="0" y2="1">
        <Stop offset="0" stopColor="#21c7ff" />
        <Stop offset="0.4" stopColor="#005dff" />
        <Stop offset="1" stopColor="#002dce" />
      </LinearGradient>
      <LinearGradient id="gold" x2="0" y2="1">
        <Stop offset="0" stopColor="#fff3a3" />
        <Stop offset="0.5" stopColor="#ffcf28" />
        <Stop offset="1" stopColor="#f79000" />
      </LinearGradient>
      <LinearGradient id="orange" x2="0" y2="1">
        <Stop offset="0" stopColor="#ffc12b" />
        <Stop offset="0.35" stopColor="#f99300" />
        <Stop offset="1" stopColor="#b64200" />
      </LinearGradient>
      <LinearGradient id="logo" x2="0" y2="1">
        <Stop offset="0" stopColor="#fff" />
        <Stop offset="0.7" stopColor="#e1ecff" />
        <Stop offset="1" stopColor="#6aafff" />
      </LinearGradient>
      <RadialGradient id="table">
        <Stop offset="0" stopColor="#194de3" />
        <Stop offset="1" stopColor="#052ca5" />
      </RadialGradient>
    </Defs>
  );
}

export function Panel({ x, y, w, h, stroke = '#7435ff', radius = 28 }) {
  return (
    <G>
      <Rect x={x} y={y + 5} width={w} height={h} rx={radius} fill="#080027" opacity={0.5} />
      <Rect x={x} y={y} width={w} height={h} rx={radius} fill="url(#panel)" stroke={stroke} strokeWidth="3" />
    </G>
  );
}

export function Shape({ shape, x, y, size = 63, color = '#be001d' }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${size / 70})`}>
      {shape === 'cross' && <Path d="M-12 -34 H12 V-12 H34 V12 H12 V34 H-12 V12 H-34 V-12 H-12Z" fill={color} stroke={color} strokeWidth="5" />}
      {shape === 'square' && <Rect x="-29" y="-29" width="58" height="58" fill={color} stroke={color} strokeWidth="7" />}
      {shape === 'circle' && <Circle r="31" fill="none" stroke={color} strokeWidth="11" />}
      {shape === 'triangle' && <Path d="M0 -34 L34 29 H-34Z" fill="none" stroke={color} strokeWidth="7" />}
      {shape === 'star' && <Path d="M0 -33 L8.5 -11 L33 -11 L14.5 6 L22.5 32 L0 18 L-22.5 32 L-14.5 6 L-33 -11 L-8.5 -11Z" fill={color} stroke={color} strokeWidth="4" />}
      {shape === 'whot' && (
        <G>
          <Crown x={0} y={-15} size={49} color={color} />
          <T x="0" y="24" textAnchor="middle" fontFamily={FONT} fontSize="25" fontWeight="900" fill={color}>
            WHOT
          </T>
        </G>
      )}
      {(shape === 'cross' || shape === 'square') && (
        <Path d={shape === 'cross' ? 'M-8 -29 H8 V-8 H29 V8 H8 V29 H-8 V8 H-29 V-8 H-8Z' : 'M-25 -25 H25 V25 H-25Z'} fill="none" stroke="#ffffff55" strokeWidth="2" />
      )}
    </G>
  );
}

export function CardBack({ x, y, w = 82, h = 123, angle = 0 }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle})`}>
      <Rect x={-w / 2 + 2} y={-h / 2 + 5} width={w} height={h} rx="7" fill="#170037" opacity={0.6} />
      <Rect x={-w / 2} y={-h / 2} width={w} height={h} rx="7" fill="#6200bc" stroke="#fff" strokeWidth="3" />
      <Rect x={-w / 2 + 7} y={-h / 2 + 8} width={w - 14} height={h - 16} rx="3" fill="#430095" stroke="#8626e7" strokeWidth="3" />
      {[0, 1, 2].map((i) => (
        <Path key={i} d={`M${-w / 2 + 10} ${-h / 2 + 15 + (i * h) / 4} L${w / 2 - 10} ${-h / 2 + 43 + (i * h) / 4} L0 ${-h / 2 + 70 + (i * h) / 4}Z`} fill="#7815d3" opacity={0.38} />
      ))}
      <Crown x={0} y={-h * 0.12} size={w * 0.3} />
      <T x="0" y={h * 0.12} textAnchor="middle" fill="#fff" fontFamily={FONT} fontSize={w * 0.24} fontWeight="900">
        WHOT
      </T>
    </G>
  );
}

export function PlayingCard({
  x,
  y,
  card,
  angle = 0,
  selected = false,
  w = 134,
  h = 238,
  white = false,
}) {
  const ink = card.shape === 'whot' ? '#462400' : white ? '#dc0927' : '#fff';
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle})`}>
      <Rect x={-w / 2 + 3} y={-h / 2 + 6} width={w} height={h} rx="13" fill="#050028" opacity={0.5} />
      {selected && <Rect x={-w / 2 - 6} y={-h / 2 - 6} width={w + 12} height={h + 12} rx="17" fill="none" stroke="#00e9ff" strokeWidth="7" opacity={0.8} />}
      <Rect x={-w / 2} y={-h / 2} width={w} height={h} rx="12" fill={white ? '#fffcfc' : card.color} stroke={selected ? '#57faff' : '#f4e9ff'} strokeWidth="4" />
      <Rect x={-w / 2 + 5} y={-h / 2 + 5} width={w - 10} height={h - 10} rx="8" fill="none" stroke={white ? '#006bff' : '#ffffff44'} strokeWidth="2" />
      {!white && <Rect x={-w * 0.37} y={-h * 0.25} width={w * 0.74} height={h * 0.55} rx="14" fill="#ffffffd9" transform="rotate(-7)" />}
      <Shape x={0} y={9} shape={card.shape} size={w * 0.53} color={card.shape === 'whot' ? '#482700' : white ? '#c60024' : card.color} />
      {[false, true].map((flip) => (
        <G key={String(flip)} transform={flip ? 'rotate(180)' : ''}>
          <T x={-w / 2 + 14} y={-h / 2 + 43} fontFamily={FONT} fontSize="39" fontWeight="900" fill={ink}>
            {card.value}
          </T>
          <T x={-w / 2 + 15} y={-h / 2 + 71} fontFamily={FONT} fontSize="31" fontWeight="900" fill={ink}>
            +
          </T>
        </G>
      ))}
    </G>
  );
}

export function Icon({ x, y, name, color = '#fff', scale = 1 }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
      {name === 'menu' && <Path d="M-16 -12 H16 M-16 0 H16 M-16 12 H16" />}
      {name === 'settings' && (
        <G>
          <Circle r="12" strokeWidth="9" />
          {Array.from({ length: 8 }, (_, i) => (
            <Path key={i} transform={`rotate(${i * 45})`} d="M0 -15 V-20" strokeWidth="7" />
          ))}
        </G>
      )}
      {name === 'plus' && <Path d="M-14 0 H14 M0 -14 V14" />}
      {name === 'home' && (
        <G>
          <Path d="M-19 -3 L0 -20 L19 -3 M-13 -4 V16 H-3 V3 H5 V16 H14 V-4" strokeWidth="4" />
        </G>
      )}
      {name === 'wifi' && <Path d="M-18 -4 Q0 -20 18 -4 M-11 4 Q0 -6 11 4 M-3 12 H3" strokeWidth="5" />}
      {name === 'people' && (
        <G fill={color} stroke="none">
          <Circle cy="-10" r="7" />
          <Circle cx="-13" cy="-6" r="5" />
          <Circle cx="13" cy="-6" r="5" />
          <Path d="M-9 16 V3 Q0 -5 9 3 V16Z M-21 16 V6 Q-17 -2 -11 2 V16Z M11 16 V2 Q18 -2 21 6 V16Z" />
        </G>
      )}
      {(name === 'play' || name === 'send') && <Path d="M-13 -20 L20 0 L-13 20Z" fill={color} strokeWidth="2" />}
      {name === 'smile' && (
        <G>
          <Circle r="21" fill={color} strokeWidth="1" />
          <Circle cx="-7" cy="-6" r="3" fill="#4c05ab" stroke="none" />
          <Circle cx="7" cy="-6" r="3" fill="#4c05ab" stroke="none" />
          <Path d="M-10 6 Q0 18 10 6" stroke="#4c05ab" strokeWidth="6" />
        </G>
      )}
      {name === 'draw' && (
        <G transform="rotate(15)">
          <Rect x="-12" y="-18" width="28" height="37" rx="3" stroke="#151ca8" fill="#87baff" strokeWidth="2" />
          <Rect x="-17" y="-21" width="28" height="37" rx="3" fill="#fff" strokeWidth="1" />
        </G>
      )}
    </G>
  );
}

export function Background() {
  return (
    <G>
      <Rect width="1024" height="1536" fill="url(#bg)" />
      {[-470, -200, 650, 940].map((x) => (
        <Path key={x} d={`M${x} 1500 L${x + 100} 1500 L${x + 1300} 0 L${x + 1220} 0Z`} fill="#7400eb" opacity={0.17} />
      ))}
      {[[120, 319], [241, 328], [756, 249], [789, 355]].map(([x, y], i) => (
        <G key={i} transform={`translate(${x} ${y}) rotate(22)`} opacity={0.27}>
          <Rect x="-30" y="-35" width="60" height="70" rx="7" fill="#7135ff" />
          <Circle r="16" fill="#150479" />
        </G>
      ))}
      <Ellipse cx="512" cy="1468" rx="610" ry="395" fill="#023bb4" opacity={0.5} stroke="#7825ff" strokeWidth="3" />
      <Ellipse cx="512" cy="1570" rx="560" ry="300" fill="#071960" stroke="#0855d9" strokeWidth="8" />
    </G>
  );
}

export function Logo() {
  return (
    <G>
      <CardBack x={418} y={103} w={64} h={105} angle={-24} />
      <PlayingCard x={448} y={94} w={58} h={99} angle={-18} card={HAND[0]} />
      <PlayingCard x={578} y={94} w={58} h={99} angle={18} card={HAND[3]} />
      <Crown x={512} y={53} size={103} />
      <T x="512" y="180" textAnchor="middle" fontFamily={FONT} fontWeight="900" fontSize="111" stroke="#3d03a1" strokeWidth="13" fill="#130f73">
        WHOT
      </T>
      <T x="512" y="174" textAnchor="middle" fontFamily={FONT} fontWeight="900" fontSize="111" stroke="#427bff" strokeWidth="2" fill="url(#logo)">
        WHOT
      </T>
      <Path d="M387 196 Q512 163 639 196" stroke="#ffb713" fill="none" strokeWidth="4" />
      <T x="512" y="220" textAnchor="middle" fontFamily={FONT} fontWeight="800" fontSize="19" letterSpacing="2" fill="#fff">
        PLAY • STRATEGIZE • WIN
      </T>
    </G>
  );
}

export function Gift() {
  return (
    <G transform="translate(78 194)">
      <Ellipse cx="-12" cy="-18" rx="12" ry="8" fill="none" stroke="#ffd224" strokeWidth="6" transform="rotate(28 -12 -18)" />
      <Ellipse cx="12" cy="-18" rx="12" ry="8" fill="none" stroke="#ffd224" strokeWidth="6" transform="rotate(-28 12 -18)" />
      <Path d="M-31 -5 L1 -13 L32 -5 V29 L1 45 L-30 31Z" fill="#ffbd00" stroke="#ff7000" strokeWidth="3" />
      <Path d="M-31 -5 L1 6 L32 -5 M1 6 V44" stroke="#e43600" strokeWidth="8" />
      <Path d="M-17 -10 L16 0 V37" stroke="#ffda30" strokeWidth="7" />
    </G>
  );
}

export function Badge({ x, y, value }) {
  return (
    <G>
      <Circle cx={x} cy={y + 3} r="22" fill="#210047" />
      <Circle cx={x} cy={y} r="21" fill="url(#purple)" stroke="#c278ff" strokeWidth="2" />
      <T x={x} y={y + 11} textAnchor="middle" fontFamily={FONT} fontWeight="900" fontSize="31" fill="#fff">
        {value}
      </T>
    </G>
  );
}

export const BUTTONS = [
  { id: 'menu', x: 24, y: 24, w: 83, h: 83 },
  { id: 'settings', x: 920, y: 24, w: 81, h: 83 },
  { id: 'undo', x: 131, y: 23, w: 220, h: 80 },
  { id: 'hint', x: 671, y: 23, w: 220, h: 80 },
  { id: 'draw', x: 33, y: 1400, w: 292, h: 84 },
  { id: 'play', x: 348, y: 1400, w: 328, h: 84 },
  { id: 'whot', x: 699, y: 1400, w: 292, h: 84 },
  { id: 'emoji', x: 41, y: 1307, w: 75, h: 70 },
  { id: 'chat', x: 136, y: 1314, w: 520, h: 62 },
];

export function BottomControls() {
  return (
    <G>
      {[
        ['draw', 33, 292, 'url(#blue)', '#36d6ff'],
        ['play', 348, 328, 'url(#purple)', '#ed80ff'],
        ['whot', 699, 292, 'url(#orange)', '#ffd658'],
      ].map(([id, x, w, fill, stroke]) => (
        <G key={String(id)}>
          <Rect x={Number(x)} y="1406" width={Number(w)} height="83" rx="43" fill="#120032" />
          <Rect x={Number(x)} y="1400" width={Number(w)} height="83" rx="43" fill={String(fill)} stroke={String(stroke)} strokeWidth="5" />
          {id === 'whot' ? <Crown x={777} y={1443} size={57} /> : <Icon x={Number(x) + 100} y={1443} name={id === 'draw' ? 'draw' : 'play'} scale={1.1} />}
          <T x={Number(x) + (id === 'whot' ? 188 : Number(w) * 0.62)} y="1452" textAnchor="middle" fontFamily={FONT} fontSize={id === 'whot' ? 28 : 36} fontWeight="800" fill="#fff">
            {id === 'whot' ? 'Call WHOT!' : id === 'draw' ? 'Draw' : 'Play'}
          </T>
        </G>
      ))}
    </G>
  );
}

export function Artwork({
  width,
  height,
  selected,
  seconds,
  bonus,
  drawCount,
  hand,
  last,
  requestedShape,
  activePlayerIndex = 0,
  opponentCounts = [5, 4, 6],
  coinBalance = 1250,
  statusText,
  undoSecondsLeft = 0,
  canUndo = false,
}) {
  const centers = getCardCenters(hand.length);

  return (
    <Svg width={width} height={height} viewBox="0 0 1024 1536">
      <Gradients />
      <Background />

      {/* 10-Second Undo Button Panel */}
      <Panel x={131} y={23} w={220} h={80} stroke={canUndo && undoSecondsLeft > 0 ? '#ffea00' : '#475569'} />
      <T x="241" y="62" textAnchor="middle" fontFamily={FONT} fontSize="24" fontWeight="900" fill={canUndo && undoSecondsLeft > 0 ? '#ffea00' : '#94a3b8'}>
        {canUndo && undoSecondsLeft > 0 ? `↺ UNDO (${undoSecondsLeft}s)` : '↺ UNDO (10s)'}
      </T>

      <Circle cx="65" cy="65" r="41" fill="url(#purple)" stroke="#9144ff" strokeWidth="3" />
      <Icon x={65} y={65} name="menu" />
      <Circle cx="960" cy="65" r="41" fill="url(#purple)" stroke="#9144ff" strokeWidth="3" />
      <Icon x={960} y={65} name="settings" />

      {/* Hint Button Panel */}
      <Panel x={671} y={23} w={220} h={80} stroke="#00e5ff" />
      <T x="781" y="62" textAnchor="middle" fontFamily={FONT} fontSize="24" fontWeight="900" fill="#00e5ff">
        💡 HINT
      </T>

      <Circle cx="906" cy={219} r="83" fill="url(#panel)" stroke="#6722ff" strokeWidth="3" />
      <Circle cx="906" cy={219} r="67" fill="none" stroke="#b800f9" strokeWidth="12" />
      <Path d="M903 152 A67 67 0 1 0 903 286" fill="none" stroke={activePlayerIndex === 0 ? '#00e5ff' : '#ff9900'} strokeWidth="12" strokeLinecap="round" />
      <T x="906" y="228" textAnchor="middle" fontFamily={FONT} fontSize="57" fontWeight="900" fill="#fff">
        {seconds}
      </T>
      <T x="906" y="256" textAnchor="middle" fontFamily={FONT} fontSize="28" fontWeight="800" fill="#00ddff">
        sec
      </T>

      <Panel x={410} y={253} w={272} h={91} stroke={activePlayerIndex === 2 ? '#57faff' : '#7435ff'} />
      <T x="493" y="290" fontFamily={FONT} fontSize="26" fontWeight="800" fill="#fff">
        ♟ Oba
      </T>
      <T x="493" y="323" fontFamily={FONT} fontSize="23" fill={activePlayerIndex === 2 ? '#00e5ff' : '#00d5ff'}>
        {activePlayerIndex === 2 ? 'Playing...' : 'Waiting'}
      </T>
      {[616, 635, 653].map((x) => (
        <Circle key={x} cx={x} cy="316" r="4" fill={activePlayerIndex === 2 ? '#00e5ff' : '#5944ff'} />
      ))}

      <Ellipse cx="512" cy="767" rx="367" ry="302" fill="#063aae" stroke="#8019ff" strokeWidth="6" />
      <Ellipse cx="512" cy="757" rx="347" ry="284" fill="url(#table)" stroke="#2558ff" strokeWidth="5" />
      <Ellipse cx="512" cy="753" rx="288" ry="247" fill="none" stroke="#265cf1" strokeWidth="3" />
      <G opacity={0.4}>
        <Crown x={511} y={582} size={162} color="#5062ff" />
      </G>

      {requestedShape && (
        <G transform="translate(512 650)">
          <Rect x="-120" y="-30" width="240" height="60" rx="30" fill="#ffcc00" stroke="#fff" strokeWidth="3" />
          <Shape shape={requestedShape} x={-70} y={0} size={40} color="#000" />
          <T x="20" y="10" textAnchor="middle" fontFamily={FONT} fontSize="24" fontWeight="900" fill="#000">
            {requestedShape.toUpperCase()}
          </T>
        </G>
      )}

      <Panel x={31} y={568} w={190} h={55} stroke={activePlayerIndex === 1 ? '#57faff' : '#bf35ff'} />
      <T x="111" y="603" textAnchor="middle" fontFamily={FONT} fontSize="24" fontWeight="800" fill="#fff">
        QueenBee
      </T>
      <Crown x={180} y={596} size={29} />

      <Panel x={811} y={569} w={185} h={55} stroke={activePlayerIndex === 3 ? '#57faff' : '#b630ff'} />
      <Circle cx={844} cy="597" r="8" fill="#00ec58" />
      <T x="913" y="605" textAnchor="middle" fontFamily={FONT} fontSize="25" fontWeight="800" fill="#fff">
        KingTee
      </T>

      {[-1, 0, 1].map((i) => (
        <CardBack key={`q_${i}`} x={126 + i * 40} y={701 + Math.abs(i) * 7} angle={i * 17} w={76} h={118} />
      ))}
      {[-1, 0, 1].map((i) => (
        <CardBack key={`k_${i}`} x={895 + i * 40} y={701 + Math.abs(i) * 7} angle={i * 17} w={76} h={118} />
      ))}

      {[5, 4, 3, 2, 1, 0].map((i) => (
        <CardBack key={i} x={373 + i * 4} y={730 + i * 5} w={126} h={190} angle={2} />
      ))}
      <PlayingCard x={604} y={748} w={162} h={210} white card={last} selected />

      <Panel x={309} y={862} w={150} h={80} />
      <T x="383" y="889" textAnchor="middle" fontFamily={FONT} fontSize="23" fontWeight="700" fill="#00d6ff">
        Draw Pile
      </T>
      <T x="383" y="926" textAnchor="middle" fontFamily={FONT} fontSize="32" fontWeight="800" fill="#fff">
        ▱ {drawCount}
      </T>

      <Panel x={525} y={864} w={163} h={79} />
      <T x="607" y="889" textAnchor="middle" fontFamily={FONT} fontSize="23" fontWeight="700" fill="#00d6ff">
        Last Played
      </T>
      <T x="607" y="926" textAnchor="middle" fontFamily={FONT} fontSize="32" fontWeight="800" fill="#fff">
        {last.value === 20 ? 'WHOT' : `${last.value}`}
      </T>

      {hand.map((card, i) => {
        const c = centers[i] || { x: 512, y: 1115, a: 0 };
        return <PlayingCard key={card.id} x={c.x} y={c.y} angle={c.a} card={card} selected={selected === card.id} />;
      })}

      <Panel x={35} y={1304} w={627} h={77} />
      <Circle cx="80" cy="1343" r="34" fill="url(#purple)" stroke="#7937fa" strokeWidth="2" />
      <Icon x={80} y={1343} name="smile" />
      <Panel x={137} y={1315} w={511} h={57} radius={27} stroke="#3830e7" />
      <T x="164" y="1351" fontFamily={FONT} fontSize="24" fill="#8a7edf">
        Type a message...
      </T>
      <Icon x={612} y={1342} name="send" color="#7042ff" />

      <Panel x={719} y={1305} w={270} h={76} stroke={activePlayerIndex === 0 ? '#57faff' : '#7435ff'} />
      <T x="799" y="1352" fontFamily={FONT} fontSize="30" fontWeight="800" fill="#fff">
        You
      </T>
      <Circle cx="864" cy="1343" r="8" fill={activePlayerIndex === 0 ? '#00ec5f' : '#ff9900'} />
      <Crown x={733} y={1295} size={40} />
      <Badge x={951} y={1343} value={hand.length} />

      <BottomControls />
    </Svg>
  );
}
