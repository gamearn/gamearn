import React from 'react';
import { Platform } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop, Text as T } from 'react-native-svg';

export const BOARD = { x: 189, y: 238, w: 876, h: 774 };
export const FONT = Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-condensed';
export const SCRIPT = Platform.OS === 'ios' ? 'Snell Roundhand' : 'cursive';
export const initialBoard = () => Array.from({ length: 64 }, (_, i) => {
  const r = Math.floor(i / 8), c = i % 8;
  return (r + c) % 2 === 0 ? null : r < 3 ? { side: 'white' } : r > 4 ? { side: 'black' } : null;
});

function Gradients() {
  return (
    <Defs>
      <LinearGradient id="bg"><Stop offset="0" stopColor="#211b0a" /><Stop offset="0.45" stopColor="#071018" /><Stop offset="1" stopColor="#002344" /></LinearGradient>
      <LinearGradient id="gold" x2="0.8" y2="1"><Stop offset="0" stopColor="#fff4a1" /><Stop offset="0.3" stopColor="#ffcf36" /><Stop offset="0.67" stopColor="#a65e08" /><Stop offset="1" stopColor="#ffd149" /></LinearGradient>
      <LinearGradient id="blue" x2="0.9" y2="1"><Stop offset="0" stopColor="#6feaff" /><Stop offset="0.3" stopColor="#00a7ff" /><Stop offset="0.65" stopColor="#0053bd" /><Stop offset="1" stopColor="#29c5ff" /></LinearGradient>
      <LinearGradient id="panel"><Stop offset="0" stopColor="#261b07" /><Stop offset="0.65" stopColor="#060909" /><Stop offset="1" stopColor="#382300" /></LinearGradient>
      <LinearGradient id="bluePanel"><Stop offset="0" stopColor="#031f39" /><Stop offset="0.5" stopColor="#020a19" /><Stop offset="1" stopColor="#003969" /></LinearGradient>
      <LinearGradient id="frame"><Stop offset="0" stopColor="#07121e" /><Stop offset="0.5" stopColor="#172b3e" /><Stop offset="1" stopColor="#01080e" /></LinearGradient>
      <LinearGradient id="square" x2="1" y2="1"><Stop offset="0" stopColor="#ffdb2c" /><Stop offset="1" stopColor="#ffbd08" /></LinearGradient>
      <LinearGradient id="dark" x2="1" y2="1"><Stop offset="0" stopColor="#272b32" /><Stop offset="1" stopColor="#14181d" /></LinearGradient>
      <LinearGradient id="whitePiece" x2="0.8" y2="1"><Stop offset="0" stopColor="#fff" /><Stop offset="0.48" stopColor="#fefefe" /><Stop offset="0.78" stopColor="#d3d1db" /><Stop offset="1" stopColor="#fff" /></LinearGradient>
      <LinearGradient id="blackPiece" x2="0.7" y2="1"><Stop offset="0" stopColor="#a7adba" /><Stop offset="0.3" stopColor="#27394d" /><Stop offset="0.68" stopColor="#00040a" /><Stop offset="1" stopColor="#31475e" /></LinearGradient>
      <RadialGradient id="whiteFace"><Stop offset="0" stopColor="#f4f4f7" /><Stop offset="0.8" stopColor="#eeeef2" /><Stop offset="1" stopColor="#fff" /></RadialGradient>
      <LinearGradient id="blackFace" x2="0" y2="1"><Stop offset="0" stopColor="#293647" /><Stop offset="1" stopColor="#060d17" /></LinearGradient>
      <LinearGradient id="surrender" x2="0" y2="1"><Stop offset="0" stopColor="#075ce3" /><Stop offset="1" stopColor="#00328d" /></LinearGradient>
      <RadialGradient id="avatarGold"><Stop offset="0" stopColor="#624500" /><Stop offset="1" stopColor="#020301" /></RadialGradient>
      <RadialGradient id="avatarBlue"><Stop offset="0" stopColor="#004071" /><Stop offset="1" stopColor="#000611" /></RadialGradient>
    </Defs>
  );
}

export function Crown({ x, y, color = '#ffd04b', scale = 1 }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      <Path d="M-39 -20 L-16 -3 L0 -35 L17 -3 L39 -20 L29 22 Q0 13 -29 22Z" fill={color} />
      <Path d="M-28 29 Q0 21 28 29" stroke={color} strokeWidth="6" fill="none" />
      {[-39, 0, 39].map((cx, i) => <Circle key={cx} cx={cx} cy={i === 1 ? -37 : -21} r="5" fill={color} />)}
    </G>
  );
}

export function Background() {
  return (
    <G>
      <Rect width="1254" height="1254" fill="url(#bg)" />
      {[-690, -370, -95, 805, 1090].map((x, i) => <Path key={x} d={`M${x} 1254 h87 L${x + 1160} 0 h-87Z`} fill={i < 3 ? '#9d6a0a' : '#0051a2'} opacity={i < 3 ? 0.12 : 0.16} />)}
      {Array.from({ length: 15 }, (_, r) => Array.from({ length: 6 }, (_, c) => <Circle key={`l${r}-${c}`} cx={18 + c * 22} cy={418 + r * 22} r="3.6" fill="#8b6517" opacity={0.32 - r * 0.019} />))}
      {Array.from({ length: 18 }, (_, r) => Array.from({ length: 6 }, (_, c) => <Circle key={`r${r}-${c}`} cx={1118 + c * 25} cy={832 + r * 25} r="3.6" fill="#00132a" />))}
      {Array.from({ length: 8 }, (_, r) => Array.from({ length: 9 }, (_, c) => <Circle key={`t${r}-${c}`} cx={1022 + c * 26} cy={17 + r * 25} r="3.7" fill="#002549" />))}
      <Crown x={79} y={347} color="#685215" /><Crown x={1178} y={358} color="#004b91" />
      <G transform="rotate(-10 70 837)">{['THINK', 'PLAN', 'MOVE', 'WIN'].map((s, i) => <T key={s} x="34" y={810 + i * 33} fontFamily={FONT} fontSize="24" fontWeight="800" fontStyle="italic" fill="#735715">{s}</T>)}</G>
      <G transform="rotate(-10 1200 680)">{['GOOD', 'MOVES', 'GREAT', 'MINDS'].map((s, i) => <T key={s} x="1163" y={638 + i * 35} fontFamily={FONT} fontSize="23" fontWeight="800" fontStyle="italic" fill="#064a87">{s}</T>)}</G>
      <G transform="rotate(-13 1190 1025)"><T x="1189" y="1017" textAnchor="middle" fontFamily={SCRIPT} fontSize="48" fontStyle="italic" fill="#ffbd19">Play</T><T x="1189" y="1066" textAnchor="middle" fontFamily={SCRIPT} fontSize="48" fontStyle="italic" fill="#ffbd19">Smart</T></G>
    </G>
  );
}

export function CheckerPiece({ x, y, size = 82, white, king = false, selected = false }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${size / 100})`}>
      <Ellipse cy="9" rx="50" ry="47" fill="#000" opacity={0.55} />
      <Circle cy="4" r="47" fill={white ? '#9996a7' : '#000'} />
      <Circle r="47" fill={white ? 'url(#whitePiece)' : 'url(#blackPiece)'} />
      <Circle r="39" fill={white ? '#bcbac6' : '#01070f'} />
      <Circle cy="-1" r="36" fill={white ? 'url(#whiteFace)' : 'url(#blackFace)'} stroke={white ? '#fff' : '#26384b'} strokeWidth="2" />
      <Circle cy="-1" r="23" fill="none" stroke={white ? '#c4c3ce' : '#7c8797'} strokeWidth="1.4" />
      <Path d="M-33 -13 A35 35 0 0 1 27 -24" fill="none" stroke={white ? '#fff' : '#a3acba'} strokeWidth="1.5" />
      {king && <Crown x={0} y={0} color={white ? '#b68217' : '#ffd04b'} scale={0.47} />}
      {selected && <Circle r="50" fill="none" stroke="#5eeaff" strokeWidth="4" />}
    </G>
  );
}

export function Avatar({ x, y, blue = false }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Circle cy="4" r="57" fill="#000" /><Circle r="55" fill={blue ? 'url(#blue)' : 'url(#gold)'} /><Circle r="49" fill="#020502" /><Circle r="44" fill={blue ? 'url(#avatarBlue)' : 'url(#avatarGold)'} />
      <Circle cy="-20" r="15" fill={blue ? 'url(#blue)' : 'url(#gold)'} />
      <Path d="M-26 27 Q-25 0 -9 0 Q0 6 9 0 Q25 0 26 27 Q0 45 -26 27Z" fill={blue ? 'url(#blue)' : 'url(#gold)'} />
    </G>
  );
}

export function PlayerPanel({ x, blue, count }) {
  return (
    <G transform={`translate(${x} 64)`}>
      <Rect y="7" width="371" height="120" rx="61" fill="#000" opacity={0.5} />
      <Rect width="371" height="120" rx="61" fill={blue ? 'url(#bluePanel)' : 'url(#panel)'} stroke={blue ? 'url(#blue)' : 'url(#gold)'} strokeWidth="6" />
      <Rect x="7" y="6" width="357" height="108" rx="53" fill="none" stroke={blue ? '#0079c1' : '#9e6e12'} strokeWidth="1.4" />
      <Avatar x={blue ? 310 : 63} y={61} blue={blue} />
      <T x={blue ? 248 : 128} y="50" textAnchor={blue ? 'end' : 'start'} fontFamily={FONT} fontWeight="800" fontSize="29" fill="#fff">Player {blue ? '2' : '1'}</T>
      <T x={blue ? 228 : 128} y="89" textAnchor={blue ? 'end' : 'start'} fontFamily={FONT} fontWeight="600" fontSize="22" fill="#b6b6c2">{blue ? 'Black' : 'White'}</T>
      <G transform={`translate(${blue ? 17 : 236} 26)`}>
        <Rect width="113" height="73" rx="34" fill={blue ? '#00325a' : '#614000'} fillOpacity={0.38} stroke={blue ? '#075995' : '#8e6319'} strokeWidth="2" />
        <CheckerPiece x={34} y={37} size={49} white={!blue} />
        <T x="83" y="51" textAnchor="middle" fontFamily={FONT} fontSize="36" fontWeight="900" fill={blue ? '#20b6fc' : '#ffd04a'}>{count}</T>
      </G>
    </G>
  );
}

export function Icon({ name, x, y, color = '#ffd04b', scale = 1 }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`} stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {name === 'back' && <Path d="M8 -15 L-8 0 L8 15" strokeWidth="10" />}
      {name === 'settings' && <G><Circle r="14" strokeWidth="10" />{Array.from({ length: 8 }, (_, i) => <Path key={i} d="M0 -18 V-23" transform={`rotate(${i * 45})`} strokeWidth="9" />)}</G>}
      {name === 'undo' && <G><Path d="M-11 -10 H2 A16 16 0 1 1 -2 22" /><Path d="M-7 -20 L-20 -10 L-7 0Z" fill={color} strokeWidth="2" /></G>}
      {name === 'hint' && <G><Path d="M-7 12 C-7 3 -17 0 -14 -12 C-9 -28 12 -24 15 -11 C19 0 8 5 8 12Z" fill={color} strokeWidth="1" /><Path d="M-6 18 H6 M-3 24 H3" strokeWidth="4" />{[-70, -35, 0, 35, 70].map(a => <Path key={a} d="M0 -30 V-33" transform={`rotate(${a})`} strokeWidth="3" />)}</G>}
      {name === 'flag' && <G><Path d="M-15 23 V-25" strokeWidth="4" /><Path d="M-10 -22 Q0 -27 10 -21 Q19 -16 24 -21 V5 Q14 12 4 7 Q-3 4 -10 7Z" fill={color} strokeWidth="1" /></G>}
      {(name === 'sound' || name === 'muted') && <G><Path d="M-21 -6 H-11 L1 -17 V17 L-11 6 H-21Z" fill={color} strokeWidth="2" />{name === 'sound' ? <Path d="M10 -9 Q19 0 10 9 M19 -17 Q34 0 19 17" strokeWidth="4" /> : <Path d="M10 -10 L28 10 M28 -10 L10 10" strokeWidth="4" />}</G>}
      {name === 'signal' && <G fill={color} stroke="none"><Rect x="-20" y="6" width="8" height="14" rx="2" /><Rect x="-6" y="-5" width="8" height="25" rx="2" /><Rect x="8" y="-18" width="8" height="38" rx="2" /></G>}
      {name === 'timer' && <G><Circle cy="4" r="18" strokeWidth="5" /><Path d="M0 4 L4 -8 M0 -17 V-24 M-6 -24 H6 M13 -13 L18 -18" strokeWidth="4" /></G>}
    </G>
  );
}

export function TimerPanel({ time }) {
  return (
    <G transform="translate(504 55)">
      <Rect width="247" height="128" rx="50" fill="#020607" stroke="#586a80" strokeWidth="4" />
      <Path d="M16 15 Q-6 29 -3 71 Q-3 101 15 115 M231 15 Q251 29 249 71 Q250 101 232 115" stroke="#ffd33d" strokeWidth="13" opacity={0.16} fill="none" />
      <Path d="M16 15 Q-6 29 -3 71 Q-3 101 15 115 M231 15 Q251 29 249 71 Q250 101 232 115" stroke="#ffe572" strokeWidth="5" fill="none" />
      <Rect x="98" y="-12" width="49" height="44" fill="#050909" /><Icon name="timer" x={123} y={10} />
      <T x="123" y="58" textAnchor="middle" fill="#b9bbc4" fontFamily={FONT} fontSize="18" fontWeight="700">TIME REMAINING</T>
      <T x="123" y="110" textAnchor="middle" fill="#ffd34b" fontFamily={FONT} fontSize="55" fontWeight="900">{time}</T>
    </G>
  );
}

export function BoardFrame() {
  return (
    <G>
      <Path d="M159 417 L127 455 V759 L158 805Z" fill="url(#gold)" stroke="#ffe25b" strokeWidth="3" />
      <Path d="M1098 417 L1128 455 V759 L1098 805Z" fill="url(#blue)" stroke="#20caff" strokeWidth="3" />
      <Path d="M142 545 V670 M1111 545 V670" stroke="#fff9a2" strokeWidth="9" strokeLinecap="round" />
      <Rect x="155" y="215" width="945" height="836" rx="52" fill="#000" opacity={0.7} />
      <Rect x="154" y="205" width="946" height="843" rx="52" fill="url(#gold)" stroke="#ffe882" strokeWidth="2" />
      <Rect x="161" y="211" width="932" height="831" rx="46" fill="url(#frame)" stroke="#547084" strokeWidth="3" />
      <Rect x="175" y="225" width="904" height="802" rx="33" fill="#000a12" />
      <Rect x="187" y="235" width="880" height="779" rx="20" fill="#0c1217" stroke="url(#gold)" strokeWidth="4" />
      <Path d="M532 198 H722 Q730 198 724 204 L704 220 H552 L530 203 Q525 198 532 198Z" fill="url(#gold)" stroke="#7b4a0b" strokeWidth="3" />
      <Path d="M554 1032 H701 L725 1050 Q730 1056 722 1056 H532 Q525 1056 531 1050Z" fill="url(#gold)" stroke="#8d570b" strokeWidth="3" />
    </G>
  );
}

export function CheckerBoard({ board, selected, validDests = [], hintMove = null }) {
  return (
    <G>
      {Array.from({ length: 64 }, (_, i) => {
        const r = Math.floor(i / 8), c = i % 8, x = BOARD.x + c * BOARD.w / 8, y = BOARD.y + r * BOARD.h / 8, p = board[i];
        const isValidDest = validDests.includes(i);
        const isHintFrom = hintMove?.from === i;
        const isHintTo = hintMove?.to === i;
        return (
          <G key={i}>
            <Rect x={x} y={y} width={BOARD.w / 8} height={BOARD.h / 8} fill={(r + c) % 2 ? 'url(#dark)' : 'url(#square)'} stroke={(r + c) % 2 ? '#10171d' : '#dda616'} strokeWidth={0.7} />
            {isHintFrom && <Rect x={x + 2} y={y + 2} width={BOARD.w / 8 - 4} height={BOARD.h / 8 - 4} rx="8" fill="none" stroke="#ffd04b" strokeWidth="4" opacity={0.9} />}
            {isHintTo && <Rect x={x + 2} y={y + 2} width={BOARD.w / 8 - 4} height={BOARD.h / 8 - 4} rx="8" fill="#ffd04b30" stroke="#ffd04b" strokeWidth="4" />}
            {isValidDest && <G transform={`translate(${x + BOARD.w / 16} ${y + BOARD.h / 16})`}>
              <Circle r="18" fill="#5eeaff40" stroke="#5eeaff" strokeWidth="3" />
              <Circle r="8" fill="#5eeaff" />
            </G>}
            {p && <CheckerPiece x={x + BOARD.w / 16} y={y + BOARD.h / 16 - 1} white={p.side === 'white'} king={p.king} selected={selected === i} />}
          </G>
        );
      })}
    </G>
  );
}

export const BUTTONS = [
  { id: 'undo', x: 97, y: 1102, w: 196, h: 77, label: 'UNDO', icon: 'undo' },
  { id: 'hint', x: 320, y: 1102, w: 192, h: 77, label: 'HINT', icon: 'hint' },
  { id: 'surrender', x: 541, y: 1101, w: 370, h: 78, label: 'SURRENDER', icon: 'flag' },
  { id: 'sound', x: 947, y: 1102, w: 91, h: 77, label: '', icon: 'sound' },
  { id: 'signal', x: 1065, y: 1102, w: 90, h: 77, label: '', icon: 'signal' },
  { id: 'back', x: 22, y: 21, w: 78, h: 77, label: '', icon: 'back' },
  { id: 'settings', x: 1156, y: 21, w: 76, h: 77, label: '', icon: 'settings' },
];

export function ControlButton({ button, muted }) {
  const blue = button.id === 'surrender' || button.id === 'settings';
  const hasLabel = !!button.label;
  return (
    <G transform={`translate(${button.x} ${button.y})`}>
      <Rect y="6" width={button.w} height={button.h} rx="38" fill="#000" opacity={0.4} />
      <Rect width={button.w} height={button.h} rx="38" fill={button.id === 'surrender' ? 'url(#surrender)' : blue ? 'url(#bluePanel)' : 'url(#panel)'} stroke={blue ? 'url(#blue)' : 'url(#gold)'} strokeWidth="5" />
      <Rect x="5" y="5" width={button.w - 10} height={button.h - 10} rx="33" fill="none" stroke={blue ? '#0064bf' : '#634611'} strokeWidth="1" />
      <Icon name={button.id === 'sound' && muted ? 'muted' : button.icon} x={hasLabel ? (button.id === 'surrender' ? 97 : 55) : button.w / 2} y={button.h / 2} color={blue ? '#e5edff' : '#ffd04b'} scale={button.id === 'settings' ? 0.85 : 1} />
      {hasLabel && <T x={button.id === 'surrender' ? 211 : button.w * 0.65} y={button.h / 2 + 8} textAnchor="middle" fontFamily={FONT} fontWeight="800" fontSize="23" fill="#fff">{button.label}</T>}
    </G>
  );
}

export function CheckersArtwork({ size, board, selected, time, muted, validDests = [], hintMove = null }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1254 1254">
      <Gradients /><Background /><PlayerPanel x={117} blue={false} count={board.filter(p => p?.side === 'white').length} /><PlayerPanel x={768} blue count={board.filter(p => p?.side === 'black').length} />
      <TimerPanel time={time} /><BoardFrame /><CheckerBoard board={board} selected={selected} validDests={validDests} hintMove={hintMove} />
      {BUTTONS.map(button => <ControlButton key={button.id} button={button} muted={muted} />)}
    </Svg>
  );
}
