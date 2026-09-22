import React from 'react';
import { View, Pressable } from 'react-native';
import Svg, { Rect, Circle, Polygon, Defs, RadialGradient, Stop, Text as SvgText, G } from 'react-native-svg';
const { COLORS, coordinate, legal, FINISH } = require('./engine');

function star(cx, cy, r) {
  return Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const d = i % 2 ? r * 0.44 : r;
    return `${cx + Math.cos(a) * d},${cy + Math.sin(a) * d}`;
  }).join(' ');
}

export default function Board({ size, state, onMove }) {
  const candidates = legal(state);
  const tokens = state.tokens.flatMap((team, p) =>
    team.map((progress, t) => ({ p, t, progress, xy: coordinate(p, t, progress) }))
  );
  const groups = {};
  tokens.forEach((token) => {
    const key = token.xy.join(',');
    (groups[key] ||= []).push(token);
  });
  for (const group of Object.values(groups)) {
    group.forEach((token, i) => {
      if (group.length > 1) {
        const a = (i * Math.PI * 2) / group.length;
        token.xy = [token.xy[0] + Math.cos(a) * 0.22, token.xy[1] + Math.sin(a) * 0.22];
      }
    });
  }

  // 4 Yard Base Configurations (matching image)
  const YARDS = [
    { p: 0, x: 0, y: 0, color: '#e61c24', light: '#ffffff', tokenColor: '#e61c24' }, // Red (Top-Left)
    { p: 1, x: 8, y: 0, color: '#00b843', light: '#ffffff', tokenColor: '#00b843' }, // Green (Top-Right)
    { p: 2, x: 0, y: 8, color: '#0085ff', light: '#ffffff', tokenColor: '#0085ff' }, // Blue (Bottom-Left)
    { p: 3, x: 8, y: 8, color: '#ffcc00', light: '#ffffff', tokenColor: '#ffcc00' }, // Yellow (Bottom-Right)
  ];

  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.04, overflow: 'hidden', backgroundColor: '#ffffff', elevation: 8 }}>
      <Svg width={size} height={size} viewBox="0 0 13 13">
        <Defs>
          {COLORS.map((color, i) => (
            <RadialGradient key={i} id={`token${i}`} cx="32%" cy="25%" r="80%">
              <Stop offset="0" stopColor={color} />
              <Stop offset="0.65" stopColor={color} />
              <Stop offset="1" stopColor={['#980014', '#006320', '#0033a8', '#bb7300'][i]} />
            </RadialGradient>
          ))}
        </Defs>

        {/* 4 Corner Yards matching reference board */}
        {YARDS.map(({ p, x, y, color, tokenColor }) => (
          <G key={p}>
            {/* Outer Colored Frame */}
            <Rect x={x} y={y} width="5" height="5" fill={color} stroke="#1e293b" strokeWidth="0.04" />
            {/* Inner White Box */}
            <Rect x={x + 0.7} y={y + 0.7} width="3.6" height="3.6" rx="0.3" fill="#ffffff" stroke="#1e293b" strokeWidth="0.03" />
            {/* 4 Yard Circular Bases */}
            {[
              [x + 1.6, y + 1.6],
              [x + 3.4, y + 1.6],
              [x + 1.6, y + 3.4],
              [x + 3.4, y + 3.4],
            ].map(([cx, cy], i) => (
              <G key={i}>
                <Circle cx={cx} cy={cy} r="0.6" fill={tokenColor} stroke="#ffffff" strokeWidth="0.08" />
                <Circle cx={cx} cy={cy} r="0.45" fill={tokenColor} />
              </G>
            ))}
          </G>
        ))}

        {/* Grid Cells & Colored Pathways */}
        {Array.from({ length: 13 }, (_, y) =>
          Array.from({ length: 13 }, (_, x) => {
            if (!((x >= 5 && x <= 7) || (y >= 5 && y <= 7)) || (x >= 5 && x <= 7 && y >= 5 && y <= 7)) return null;

            let fillColor = '#ffffff';
            let strokeColor = '#2b3954';

            // Colored Home Pathways leading to center
            if (x === 6 && y > 0 && y < 5) fillColor = COLORS[0]; // Red pathway (Top)
            if (x === 6 && y > 7 && y < 12) fillColor = COLORS[3]; // Blue pathway (Bottom)
            if (y === 6 && x > 0 && x < 5) fillColor = COLORS[2]; // Blue/Red pathway (Left)
            if (y === 6 && x > 7 && x < 12) fillColor = COLORS[1]; // Green pathway (Right)

            // Starting Entry Cells (matching Ludo rules)
            if (x === 1 && y === 5) fillColor = COLORS[0]; // Red Start
            if (x === 7 && y === 1) fillColor = COLORS[1]; // Green Start
            if (x === 11 && y === 7) fillColor = COLORS[3]; // Yellow Start
            if (x === 5 && y === 11) fillColor = COLORS[2]; // Blue Start

            return (
              <Rect
                key={`${x}-${y}`}
                x={x + 0.01}
                y={y + 0.01}
                width="0.98"
                height="0.98"
                rx="0.03"
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth="0.025"
              />
            );
          })
        )}

        {/* Center Triangles */}
        <Polygon points="5,5 8,5 6.5,6.5" fill={COLORS[0]} stroke="#1e293b" strokeWidth="0.04" />
        <Polygon points="8,5 8,8 6.5,6.5" fill={COLORS[1]} stroke="#1e293b" strokeWidth="0.04" />
        <Polygon points="8,8 5,8 6.5,6.5" fill={COLORS[3]} stroke="#1e293b" strokeWidth="0.04" />
        <Polygon points="5,8 5,5 6.5,6.5" fill={COLORS[2]} stroke="#1e293b" strokeWidth="0.04" />

        {/* Star Safe Haven Symbols */}
        {[[6.5, 0.5], [12.5, 6.5], [6.5, 12.5], [0.5, 6.5]].map(([x, y], i) => (
          <Polygon key={i} points={star(x, y, 0.34)} fill="#ffd700" />
        ))}

        {/* Home Directional Indicators */}
        {[[6.5, 4.5, '↓'], [8.5, 6.5, '←'], [6.5, 8.5, '↑'], [4.5, 6.5, '→']].map(([x, y, text]) => (
          <SvgText key={text} x={x} y={y + 0.28} fontSize="0.8" fontWeight="bold" textAnchor="middle" fill="#ffffffaa">
            {text}
          </SvgText>
        ))}

        {/* Center Target Circle */}
        <Circle cx="6.5" cy="6.5" r="0.76" fill="#09267f" stroke="#1186ff" strokeWidth="0.06" />
        <Polygon points="6.03,6.25 6.2,6.72 6.8,6.72 6.97,6.25 6.7,6.43 6.5,6.12 6.3,6.43" fill="#ffffff" />

        {/* Interactive Player Tokens */}
        {tokens
          .filter((t) => t.progress !== FINISH)
          .map(({ p, t, xy: [x, y] }) => (
            <React.Fragment key={`${p}-${t}`}>
              {p === state.turn && candidates.includes(t) && (
                <Circle
                  cx={x}
                  cy={y}
                  r="0.52"
                  fill="none"
                  stroke={state.hint === t ? '#ffffff' : '#ffea00'}
                  strokeWidth="0.08"
                />
              )}
              <Circle cx={x} cy={y} r="0.42" fill={`url(#token${p})`} stroke={['#980014', '#006320', '#0033a8', '#bb7300'][p]} strokeWidth="0.05" />
              <Circle cx={x - 0.13} cy={y - 0.17} r="0.085" fill="#ffffff77" />
              {state.tokens[p][t] >= 0 && (
                <SvgText x={x} y={y + 0.12} fontSize="0.32" fontWeight="bold" textAnchor="middle" fill="#ffffff">
                  {t + 1}
                </SvgText>
              )}
            </React.Fragment>
          ))}
      </Svg>

      {/* Pressable Tokens Overlay */}
      {tokens
        .filter((t) => t.progress !== FINISH)
        .map(({ p, t, xy: [x, y] }) => (
          <Pressable
            key={`${p}-${t}`}
            accessibilityRole="button"
            accessibilityLabel={`Player ${p + 1}, token ${t + 1}${p === state.turn && candidates.includes(t) ? ', legal move' : ''}`}
            disabled={p !== state.turn || !candidates.includes(t)}
            onPress={() => onMove(t)}
            style={{
              position: 'absolute',
              left: ((x - 0.45) / 13) * size,
              top: ((y - 0.45) / 13) * size,
              width: (size * 0.9) / 13,
              height: (size * 0.9) / 13,
              borderRadius: size,
            }}
          />
        ))}
    </View>
  );
}
