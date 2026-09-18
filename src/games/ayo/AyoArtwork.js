import React from 'react';
import { Platform } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Path, Circle, Ellipse, G, Text as SvgText, ClipPath } from 'react-native-svg';

export const ART_WIDTH = 1409;
export const ART_HEIGHT = 1116;
export const PIT_X = [292, 458, 623, 787, 952, 1117];
export const PIT_Y = [327, 869];

export const FONTS = {
  label: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-condensed',
  title: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif',
  script: Platform.OS === 'ios' ? 'Snell Roundhand' : 'cursive',
};

export function AyoGradients() {
  return (
    <Defs>
      <RadialGradient id="forest"><Stop offset="0" stopColor="#074531" /><Stop offset="1" stopColor="#001e17" /></RadialGradient>
      <LinearGradient id="rim" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#f4b36a" /><Stop offset="0.14" stopColor="#ad5725" /><Stop offset="0.48" stopColor="#713418" /><Stop offset="0.8" stopColor="#a35427" /><Stop offset="1" stopColor="#4a1d0b" /></LinearGradient>
      <LinearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#54280f" /><Stop offset="0.4" stopColor="#47200f" /><Stop offset="0.64" stopColor="#391b0e" /><Stop offset="1" stopColor="#5c2c15" /></LinearGradient>
      <LinearGradient id="plaque" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#a55c2e" /><Stop offset="0.4" stopColor="#6c3216" /><Stop offset="1" stopColor="#572510" /></LinearGradient>
      <LinearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#fff7b1" /><Stop offset="0.42" stopColor="#ffd563" /><Stop offset="1" stopColor="#efa324" /></LinearGradient>
      <LinearGradient id="panel" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#39291b" /><Stop offset="1" stopColor="#120e07" /></LinearGradient>
      <RadialGradient id="bowl" cx="50%" cy="62%" r="62%"><Stop offset="0" stopColor="#a04f1f" /><Stop offset="0.55" stopColor="#7d350d" /><Stop offset="0.86" stopColor="#522005" /><Stop offset="1" stopColor="#2d1003" /></RadialGradient>
      <LinearGradient id="bowlRim" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#ffc174" /><Stop offset="0.24" stopColor="#c57830" /><Stop offset="0.65" stopColor="#71310d" /><Stop offset="1" stopColor="#d9883b" /></LinearGradient>
      <RadialGradient id="seed" cx="35%" cy="24%" r="85%"><Stop offset="0" stopColor="#fffef9" /><Stop offset="0.5" stopColor="#fffdf4" /><Stop offset="0.8" stopColor="#f1dfc6" /><Stop offset="1" stopColor="#c69f73" /></RadialGradient>
      <LinearGradient id="leaf" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#82b92c" /><Stop offset="0.55" stopColor="#418c28" /><Stop offset="1" stopColor="#10531e" /></LinearGradient>
      <LinearGradient id="die" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#fffef8" /><Stop offset="1" stopColor="#f6e5bf" /></LinearGradient>
      <ClipPath id="inside"><Rect x="66" y="188" width="1277" height="824" rx="75" /></ClipPath>
      <ClipPath id="outer"><Rect x="22" y="134" width="1365" height="927" rx="139" /></ClipPath>
    </Defs>
  );
}

export function Leaf({ x, y, rotation = 0, scale = 1 }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}>
      <Path d="M0 0 Q-37 -42 -24 -95 Q23 -73 28 -30 Q28 -7 0 0Z" fill="url(#leaf)" stroke="#386f20" strokeWidth="2" />
      <Path d="M0 0 Q-2 -41 -20 -83 M-5 -28 L-22 -47 M-10 -50 L9 -67" fill="none" stroke="#306b25" strokeWidth="2" opacity={0.7} />
    </G>
  );
}

export function ForestBackground() {
  return (
    <G>
      <Rect width={1409} height={1116} fill="url(#forest)" />
      {[0, 1].map((side) => (
        <G key={side} transform={side ? 'translate(1409 0) scale(-1 1)' : ''} opacity={0.19} fill="#3a7255">
          <Path d="M55 142 L39 0 H48 L69 103 L145 14 L160 5 L77 120Z M44 81 L0 22 L0 6 L42 50Z M82 61 Q77 2 93 0 L105 0 L99 52Z M96 75 L163 31 L173 52 L118 96Z M210 164 L265 31 L287 14 L268 79 L296 126 L275 133 L256 100 L229 172Z" />
          <Path d="M58 1116 L31 1035 L4 991 L0 958 L61 1008 L96 956 L108 969 L71 1036 L85 1116Z M120 1104 L169 1034 L176 1049 L149 1107Z" />
        </G>
      ))}
    </G>
  );
}

export function WoodGrain({ outer = false }) {
  return (
    <G clipPath={outer ? 'url(#outer)' : 'url(#inside)'} opacity={outer ? 0.21 : 0.15}>
      {Array.from({ length: outer ? 38 : 65 }, (_, i) => {
        const y = 134 + i * (outer ? 25 : 14);
        const shift = (i * 137) % 430;
        return <Path key={i} d={`M${-230 + shift} ${y} C${190 + shift} ${y - 26} ${245 + shift} ${y + 23} ${520 + shift} ${y} S${1010 + shift} ${y - 15} 1480 ${y + 10}`} fill="none" stroke={i % 3 ? '#cd783d' : '#2a0d02'} strokeWidth={i % 4 === 0 ? 8 : 3} />;
      })}
    </G>
  );
}

export function WoodenBoard() {
  return (
    <G>
      <Rect x="15" y="137" width="1380" height="939" rx="144" fill="#00150e" opacity={0.75} />
      <Rect x="16" y="125" width="1377" height="943" rx="144" fill="url(#rim)" stroke="#240c03" strokeWidth="8" />
      <Rect x="29" y="138" width="1351" height="914" rx="129" fill="none" stroke="#b45e2c" strokeWidth="7" />
      <Rect x="41" y="151" width="1327" height="888" rx="116" fill="none" stroke="#8a3c17" strokeWidth="7" />
      <WoodGrain outer />
      <Rect x="61" y="187" width="1288" height="829" rx="80" fill="url(#wood)" stroke="#351306" strokeWidth="10" />
      <WoodGrain />
      <Path d="M67 473 H1343 M67 741 H1343" stroke="#1f0c04" strokeWidth="11" />
      <Path d="M67 478 H1343 M67 746 H1343" stroke="#bf6e39" strokeWidth="4" />
      <Path d="M130 131 H1277 M142 1057 H1268" stroke="#f4b16b" strokeWidth="4" opacity={0.8} />
      <Leaf x={57} y={210} rotation={58} scale={0.82} />
      <Leaf x={1353} y={210} rotation={-58} scale={0.82} />
      <Leaf x={57} y={986} rotation={123} scale={0.82} />
      <Leaf x={1353} y={986} rotation={-123} scale={0.82} />
    </G>
  );
}

export function AyoTitle() {
  return (
    <G>
      <Leaf x={480} y={124} rotation={-16} scale={1.15} />
      <Leaf x={447} y={127} rotation={-41} scale={0.8} />
      <Leaf x={512} y={128} rotation={27} scale={0.8} />
      <Leaf x={932} y={124} rotation={40} scale={1.1} />
      <Leaf x={970} y={127} rotation={64} scale={0.8} />
      <Leaf x={898} y={128} rotation={-14} scale={0.8} />
      <Path d="M465 107 H531 Q548 64 583 70 H826 Q859 66 877 107 H944 Q1001 107 1001 164 Q1001 218 945 219 H469 Q409 216 407 164 Q407 109 465 107Z" fill="#261003" opacity={0.7} />
      <Path d="M465 96 H531 Q548 57 582 64 H826 Q859 60 877 96 H944 Q992 96 995 152 Q996 209 944 210 H468 Q415 209 415 153 Q415 100 465 96Z" fill="url(#plaque)" stroke="#301002" strokeWidth="8" />
      <Path d="M465 100 H532 M880 100 H943 Q987 101 988 151" fill="none" stroke="#e8a361" strokeWidth="6" />
      <Rect x="430" y="107" width="551" height="91" rx="39" fill="none" stroke="#bd6f3b" strokeWidth="3" />
      <SvgText x="705" y="153" textAnchor="middle" fontFamily={FONTS.title} fontWeight="900" fontSize="151" fill="#371300" stroke="#351100" strokeWidth="20">AYÒ</SvgText>
      <SvgText x="705" y="142" textAnchor="middle" fontFamily={FONTS.title} fontWeight="900" fontSize="151" fill="url(#gold)" stroke="#fff0a2" strokeWidth="2">AYÒ</SvgText>
      <SvgText x="705" y="185" textAnchor="middle" fontFamily={FONTS.label} fontWeight="700" letterSpacing="1.6" fontSize="25" fill="#fff2cb">TRADITIONAL   •   STRATEGY   •   FUN</SvgText>
    </G>
  );
}

export function Crown({ x, y }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Path d="M-23 -9 L-14 3 L-5 -4 L0 -17 L7 2 L15 -4 L23 -9 L17 14 Q0 9 -17 14Z" fill="url(#gold)" stroke="#382307" strokeWidth="1.5" />
      <Path d="M-17 19 Q0 14 17 19" fill="none" stroke="#f3c45c" strokeWidth="3" />
      {[-23, -10, 0, 12, 23].map((cx, i) => <Circle key={i} cx={cx} cy={[-10, -8, -20, -9, -10][i]} r="3.4" fill="#ffda73" />)}
    </G>
  );
}

export function ScorePanel({ x, y, player, score, label = "PLAYER" }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Rect x="-6" y="5" width="146" height="241" rx="35" fill="#210d03" opacity={0.8} />
      <Rect width="134" height="230" rx="30" fill="url(#panel)" stroke="#582607" strokeWidth="12" />
      <Rect width="134" height="230" rx="30" fill="none" stroke="#eca34c" strokeWidth="6" />
      <Rect x="6" y="6" width="122" height="217" rx="25" fill="none" stroke="#ffe6a0" strokeWidth="2" />
      <Crown x={67} y={43} />
      <SvgText x="67" y="87" textAnchor="middle" fontFamily={FONTS.label} fontWeight="700" fontSize="18" fill="#fff3d1">{label}</SvgText>
      <SvgText x="67" y="142" textAnchor="middle" fontFamily={FONTS.title} fontWeight="800" fontSize="64" fill="url(#gold)">{player}</SvgText>
      <Path d="M26 158 H108" stroke="#efc264" strokeWidth="3" strokeLinecap="round" />
      <SvgText x="67" y="200" textAnchor="middle" fontFamily={FONTS.label} fontWeight="800" fontSize="36" fill="#fffbed">{score}</SvgText>
    </G>
  );
}

export function Seed({ x, y, angle = 0, scale = 1 }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
      <Ellipse cx="2" cy="5" rx="22" ry="15" fill="#311101" opacity={0.45} />
      <Ellipse rx="22" ry="15" fill="url(#seed)" stroke="#ddc3a0" strokeWidth="1" />
      <Ellipse cx="-4" cy="-5" rx="13" ry="6" fill="#fffefa" opacity={0.72} />
    </G>
  );
}

const seedPositions = [
  [-29, -13, -47], [14, -21, 26], [34, 10, 71],
  [-31, 27, 65], [3, 15, -8], [8, 47, -10], [35, 35, -47],
  [-2, -4, 10], [-12, 36, 50], [0, -35, 15],
];

export function SeedPit({ x, y, count, number, selected, variation = 0 }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Ellipse cy="9" rx="81" ry="83" fill="#220b01" opacity={0.7} />
      <Circle r="79" fill="url(#bowlRim)" stroke="#4e2109" strokeWidth="4" />
      <Circle r="77" fill="none" stroke="#efb164" strokeWidth="2" />
      <Circle cy="2" r="65" fill="url(#bowl)" />
      <Path d="M-53 37 Q0 98 54 37" fill="none" stroke="#bf6b26" strokeWidth="5" opacity={0.7} />
      <G transform={`rotate(${variation * 8})`}>
        {Array.from({ length: Math.min(count, 10) }, (_, i) => <Seed key={i} x={seedPositions[i][0]} y={seedPositions[i][1] - 6} angle={seedPositions[i][2] + variation * 6} scale={0.96} />)}
      </G>
      {count > 10 && <SvgText x="0" y="14" textAnchor="middle" fill="#fff6cd" stroke="#391806" strokeWidth="1" fontSize="32" fontWeight="bold">{count}</SvgText>}
      {selected && <Circle r="82" fill="none" stroke="#fff39a" strokeWidth="5" />}
      <Rect x="-43" y="79" width="86" height="43" rx="21" fill="#210d03" />
      <Rect x="-40" y="78" width="80" height="38" rx="18" fill="url(#panel)" stroke="#f1c064" strokeWidth="2.5" />
      <SvgText x="0" y="109" textAnchor="middle" fontFamily={FONTS.label} fontWeight="800" fontSize="32" fill="#fffdef">{number}</SvgText>
    </G>
  );
}

export function SideLettering({ x }) {
  return (
    <G transform={`translate(${x} 507)`}>
      <SvgText x="112" y="90" textAnchor="middle" fontFamily={FONTS.script} fontStyle="italic" fontSize="102" fill="#f4b757">Ayò</SvgText>
      <Path d="M20 121 Q100 102 188 96" fill="none" stroke="#f0b24e" strokeWidth="4" />
      <G transform="rotate(-5 110 160)">
        <SvgText x="112" y="155" textAnchor="middle" fontFamily={FONTS.label} fontSize="32" fontWeight="500" fill="#ffedb3">Small Stones...</SvgText>
        <SvgText x="112" y="192" textAnchor="middle" fontFamily={FONTS.label} fontSize="32" fontWeight="500" fill="#ffedb3">Big Moves!</SvgText>
      </G>
      <Path d="M22 221 L101 209 M114 208 L196 197 M101 209 L108 202 L115 208 L108 215Z" fill="none" stroke="#f0b14e" strokeWidth="3" />
    </G>
  );
}

export function Die({ x, y, value, angle }) {
  const dots = [];
  if (value % 2) dots.push([0, 0]);
  if (value >= 2) dots.push([-23, -23], [23, 23]);
  if (value >= 4) dots.push([-23, 23], [23, -23]);
  if (value === 6) dots.push([-23, 0], [23, 0]);
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle})`}>
      <Rect x="-39" y="-25" width="89" height="94" rx="17" fill="#291000" opacity={0.5} />
      <Rect x="-42" y="-33" width="84" height="87" rx="14" fill="#d4a86f" stroke="#f1cf9d" strokeWidth="2" />
      <Rect x="-42" y="-43" width="84" height="85" rx="12" fill="url(#die)" stroke="#fffbed" strokeWidth="3" />
      {dots.map(([cx, cy], i) => <Circle key={i} cx={cx} cy={cy} r="7.1" fill="#181813" />)}
      <Path d="M-29 46 h9 M-29 50 h9 M19 46 h8 M19 50 h8" stroke="#442811" strokeWidth="2" strokeLinecap="round" />
    </G>
  );
}

export function DiceTray({ dice, rolling }) {
  return (
    <G transform="translate(704 609)">
      <Circle cy="11" r="185" fill="#1d0901" opacity={0.8} />
      <Circle r="177" fill="url(#bowlRim)" stroke="#341100" strokeWidth="7" />
      <Circle cy="-1" r="174" fill="none" stroke="#f3b060" strokeWidth="5" />
      <Circle r="157" fill="url(#bowl)" stroke="#ba652c" strokeWidth="5" />
      {[115, 102, 89, 77, 66].map((r, i) => <Ellipse key={r} cx={i % 2 ? 8 : -5} cy={30} rx={r} ry={r * 0.68} fill="none" stroke={i % 2 ? '#b66a32' : '#592006'} strokeWidth="4" opacity={0.27} />)}
      <Die x={-49} y={-8} value={dice[0]} angle={rolling ? 15 : -28} />
      <Die x={44} y={6} value={dice[1]} angle={rolling ? -10 : 21} />
    </G>
  );
}

export function AyoArtwork({ width, height, pits, scores, dice, selected, rolling = false }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 1409 1116">
      <AyoGradients />
      <ForestBackground />
      <WoodenBoard />
      <AyoTitle />
      {/* Top Panels: Player 2 (AI Bot) */}
      <ScorePanel x={67} y={220} player={2} score={scores[1]} label="BOT" />
      <ScorePanel x={1207} y={220} player={2} score={scores[1]} label="BOT" />
      {/* Bottom Panels: Player 1 (You) */}
      <ScorePanel x={67} y={757} player={1} score={scores[0]} label="YOU" />
      <ScorePanel x={1207} y={757} player={1} score={scores[0]} label="YOU" />
      {PIT_Y.map((y, row) => PIT_X.map((x, col) => <SeedPit key={`${row}-${col}`} x={x} y={y} number={col + 1} count={pits[row * 6 + col] ?? 0} variation={(col + row) % 3 - 1} selected={selected === row * 6 + col} />))}
      <SideLettering x={94} />
      <SideLettering x={1110} />
      <Path d="M361 596 H491 M361 619 H491 M911 596 H1047 M911 619 H1047" stroke="#f2ac4f" strokeWidth="4" strokeLinecap="round" />
      <Leaf x={333} y={635} rotation={8} scale={0.57} />
      <Leaf x={1074} y={635} rotation={-8} scale={0.57} />
      <DiceTray dice={dice} rolling={rolling} />
    </Svg>
  );
}
