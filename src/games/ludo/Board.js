import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import Svg, {
  Rect,
  Circle,
  Polygon,
  Defs,
  RadialGradient,
  Stop,
  G,
  Text as SvgText,
} from 'react-native-svg';
import {
  RING,
  START_RING,
  SAFE_RING,
  LANE_BY_COLORIDX,
  COLOR_BY_INDEX,
  DARK_BY_INDEX,
  CENTRE,
} from './serverAdapter';

const CELLS = 15;
const key = (r, c) => `${r},${c}`;

// Precompute lookup tables once.
const ringIndexByCoord = new Map();
RING.forEach((cell, idx) => ringIndexByCoord.set(key(cell.r, cell.c), idx));

const startByCoord = new Map();
START_RING.forEach((idx, colorIdx) => {
  const cell = RING[idx];
  if (cell) startByCoord.set(key(cell.r, cell.c), colorIdx);
});

const safeCoord = new Set(
  SAFE_RING.map((idx) => RING[idx]).filter(Boolean).map((c) => key(c.r, c.c))
);

const laneColorByCoord = new Map();
LANE_BY_COLORIDX.forEach((lane, colorIdx) => {
  (lane || []).forEach((cell) => laneColorByCoord.set(key(cell.r, cell.c), colorIdx));
});

function isCross(r, c) {
  return (r >= 6 && r <= 8) || (c >= 6 && c <= 8);
}

function star(cx, cy, r) {
  return Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const d = i % 2 ? r * 0.44 : r;
    return `${cx + Math.cos(a) * d},${cy + Math.sin(a) * d}`;
  }).join(' ');
}

// 4 Yard Base Configurations (matching reference board)
const CORNER_YARDS = [
  {
    colorIdx: 0,
    x: 0,
    y: 0,
    color: COLOR_BY_INDEX[0], // Red (Top-Left)
    bases: [[1.8, 1.8], [4.2, 1.8], [1.8, 4.2], [4.2, 4.2]],
  },
  {
    colorIdx: 3,
    x: 9,
    y: 0,
    color: COLOR_BY_INDEX[3], // Green (Top-Right)
    bases: [[10.8, 1.8], [13.2, 1.8], [10.8, 4.2], [13.2, 4.2]],
  },
  {
    colorIdx: 2,
    x: 9,
    y: 9,
    color: COLOR_BY_INDEX[2], // Blue (Bottom-Right)
    bases: [[10.8, 10.8], [13.2, 10.8], [10.8, 13.2], [13.2, 13.2]],
  },
  {
    colorIdx: 1,
    x: 0,
    y: 9,
    color: COLOR_BY_INDEX[1], // Yellow (Bottom-Left)
    bases: [[1.8, 10.8], [4.2, 10.8], [1.8, 13.2], [4.2, 13.2]],
  },
];

export default function Board({ size, viewModel, onMove, legalIds }) {
  const legal = new Set(legalIds ?? viewModel?.legalPieceIds ?? []);
  const myTurn = !!viewModel?.isMyTurn;
  const canPick = myTurn && viewModel?.diceRolled && (viewModel?.legalPieceIds || []).length > 0;

  // Replay each new server 'move' event square-by-square. Frames come straight
  // from the server (serverAdapter moveEvents); we animate a temporary token
  // through them and hide the piece's static token for the duration.
  const moveEvents = viewModel?.moveEvents || [];
  const queueRef = useRef([]);
  const processedRef = useRef(null);
  const animatingRef = useRef(false);
  const [activeMove, setActiveMove] = useState(null);
  const [animStep, setAnimStep] = useState(1);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = progress.addListener(({ value }) => {
      if (activeMove && activeMove.cells && activeMove.cells.length > 1) {
        const total = activeMove.cells.length - 1;
        const current = Math.min(total, Math.max(1, Math.floor(value + 0.5)));
        setAnimStep(current);
      }
    });
    return () => {
      progress.removeListener(id);
    };
  }, [progress, activeMove]);

  const runQueue = useCallback(() => {
    if (animatingRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;
    animatingRef.current = true;
    const n = next.cells.length - 1;
    // Slow down square-by-square movement (~380ms per cell) so players can count along.
    const stepMs = 380;
    const duration = Math.max(400, stepMs * n);
    setAnimStep(1);
    progress.setValue(0);
    setActiveMove(next);
    Animated.timing(progress, {
      toValue: n,
      duration,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(() => {
      animatingRef.current = false;
      setActiveMove(null);
      if (queueRef.current.length) runQueue();
    });
  }, [progress]);

  useEffect(() => {
    const maxId = moveEvents.length ? moveEvents[moveEvents.length - 1].id : 0;
    // Baseline the first board we render so pre-existing history is never
    // replayed; only moves that arrive after that animate.
    if (processedRef.current == null) {
      if (!viewModel) return;
      processedRef.current = maxId;
      return;
    }
    if (maxId < processedRef.current) {
      processedRef.current = maxId;
      queueRef.current = [];
      animatingRef.current = false;
      progress.setValue(0);
      setActiveMove(null);
      return;
    }
    const fresh = moveEvents.filter((event) => event.id > processedRef.current);
    if (!fresh.length) return;
    processedRef.current = maxId;
    queueRef.current.push(...fresh);
    runQueue();
  }, [moveEvents, viewModel, progress, runQueue]);

  const active = activeMove;
  const isAnimating = (token) => (
    !!active && token.playerIndex === active.playerIndex && token.pieceId === active.pieceId
  );

  // Flatten pieces and fan out stacked pieces sharing a cell.
  const tokens = [];
  (viewModel?.players || []).forEach((player) => {
    (player.pieces || []).forEach((piece) => {
      tokens.push({
        playerIndex: player.index,
        pieceId: piece.pieceId,
        colorIdx: piece.colorIdx,
        color: piece.color,
        dark: piece.dark,
        legal: canPick && player.index === viewModel.currentPlayerIndex && legal.has(piece.pieceId),
        completed: piece.completed,
        cell: piece.cell || CENTRE,
      });
    });
  });

  const groups = new Map();
  tokens.forEach((t) => {
    const k = key(Math.round(t.cell.r * 4) / 4, Math.round(t.cell.c * 4) / 4);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(t);
  });
  groups.forEach((group) => {
    if (group.length < 2) return;
    group.forEach((t, i) => {
      const a = (i * Math.PI * 2) / group.length;
      t.x = t.cell.c + 0.5 + Math.cos(a) * 0.16;
      t.y = t.cell.r + 0.5 + Math.sin(a) * 0.16;
    });
  });
  tokens.forEach((t) => {
    if (t.x == null) {
      t.x = t.cell.c + 0.5;
      t.y = t.cell.r + 0.5;
    }
  });

  const cs = size / CELLS;
  const tokenDiameter = cs * 0.84;
  const animInput = active ? active.cells.map((_, i) => i) : [0, 1];
  const animLeft = progress.interpolate({
    inputRange: animInput,
    outputRange: active ? active.cells.map((cell) => (cell.c + 0.5) * cs - tokenDiameter / 2) : [0, 0],
  });
  const animTop = progress.interpolate({
    inputRange: animInput,
    outputRange: active ? active.cells.map((cell) => (cell.r + 0.5) * cs - tokenDiameter / 2) : [0, 0],
  });

  const currentCellIndex = Math.min(
    (active?.cells?.length || 1) - 1,
    Math.max(0, animStep)
  );
  const currentCell = active?.cells ? active.cells[currentCellIndex] : null;
  const isNearTop = currentCell && currentCell.r <= 1;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.04,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        elevation: 8,
      }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${CELLS} ${CELLS}`}>
        <Defs>
          {COLOR_BY_INDEX.map((color, i) => (
            <RadialGradient key={i} id={`token${i}`} cx="32%" cy="25%" r="80%">
              <Stop offset="0" stopColor={color} />
              <Stop offset="0.65" stopColor={color} />
              <Stop offset="1" stopColor={DARK_BY_INDEX[i]} />
            </RadialGradient>
          ))}
        </Defs>

        {/* 4 Corner Yards matching reference board */}
        {CORNER_YARDS.map(({ colorIdx, x, y, color, bases }) => (
          <G key={colorIdx}>
            {/* Outer Colored Frame */}
            <Rect x={x} y={y} width="6" height="6" fill={color} stroke="#1e293b" strokeWidth="0.04" />
            {/* Inner White Box */}
            <Rect
              x={x + 0.8}
              y={y + 0.8}
              width="4.4"
              height="4.4"
              rx="0.36"
              fill="#ffffff"
              stroke="#1e293b"
              strokeWidth="0.03"
            />
            {/* 4 Yard Circular Bases */}
            {bases.map(([cx, cy], i) => (
              <G key={i}>
                <Circle cx={cx} cy={cy} r="0.65" fill={color} stroke="#ffffff" strokeWidth="0.09" />
                <Circle cx={cx} cy={cy} r="0.48" fill={color} />
              </G>
            ))}
          </G>
        ))}

        {/* Grid Cells & Colored Pathways */}
        {Array.from({ length: CELLS }, (_, r) =>
          Array.from({ length: CELLS }, (_, c) => {
            if (!isCross(r, c)) return null;
            if (r >= 6 && r <= 8 && c >= 6 && c <= 8) return null;
            const k = key(r, c);
            const laneColor = laneColorByCoord.get(k);
            const startColor = startByCoord.get(k);

            let fillColor = '#ffffff';
            if (laneColor !== undefined) {
              fillColor = COLOR_BY_INDEX[laneColor];
            } else if (startColor !== undefined) {
              fillColor = COLOR_BY_INDEX[startColor];
            }

            return (
              <Rect
                key={k}
                x={c + 0.01}
                y={r + 0.01}
                width="0.98"
                height="0.98"
                rx="0.03"
                fill={fillColor}
                stroke="#2b3954"
                strokeWidth="0.025"
              />
            );
          })
        )}

        {/* Center Triangles */}
        <Polygon points="6,6 9,6 7.5,7.5" fill={COLOR_BY_INDEX[0]} stroke="#1e293b" strokeWidth="0.04" />
        <Polygon points="9,6 9,9 7.5,7.5" fill={COLOR_BY_INDEX[3]} stroke="#1e293b" strokeWidth="0.04" />
        <Polygon points="9,9 6,9 7.5,7.5" fill={COLOR_BY_INDEX[2]} stroke="#1e293b" strokeWidth="0.04" />
        <Polygon points="6,9 6,6 7.5,7.5" fill={COLOR_BY_INDEX[1]} stroke="#1e293b" strokeWidth="0.04" />

        {/* 8 Star Safe Haven Symbols (4 Start Squares + 4 Secondary Safe Squares) */}
        {[...safeCoord].map((k) => {
          const [r, c] = k.split(',').map(Number);
          return (
            <Polygon
              key={`s-${k}`}
              points={star(c + 0.5, r + 0.5, 0.36)}
              fill="#ffd700"
              stroke="#000000"
              strokeWidth="0.03"
            />
          );
        })}

        {/* Home Directional Indicators */}
        {[[7.5, 6.5, '↓'], [8.5, 7.5, '←'], [7.5, 8.5, '↑'], [6.5, 7.5, '→']].map(([x, y, text]) => (
          <SvgText key={text} x={x} y={y + 0.3} fontSize="0.85" fontWeight="bold" textAnchor="middle" fill="#ffffffaa">
            {text}
          </SvgText>
        ))}

        {/* Center Target Circle & Crown */}
        <Circle cx="7.5" cy="7.5" r="0.88" fill="#09267f" stroke="#1186ff" strokeWidth="0.07" />
        <Polygon points="6.92,7.19 7.13,7.77 7.87,7.77 8.08,7.19 7.75,7.41 7.5,7.03 7.25,7.41" fill="#ffffff" />

        {/* Interactive Player Tokens */}
        {tokens.map((t) => (isAnimating(t) ? null : (
          <G key={`p-${t.playerIndex}-${t.pieceId}`}>
            {t.legal && (
              <Circle
                cx={t.x}
                cy={t.y}
                r="0.52"
                fill="none"
                stroke="#ffea00"
                strokeWidth="0.08"
              />
            )}
            <Circle
              cx={t.x}
              cy={t.y}
              r="0.42"
              fill={`url(#token${t.colorIdx ?? 0})`}
              stroke={t.dark}
              strokeWidth="0.05"
            />
            <Circle cx={t.x - 0.13} cy={t.y - 0.17} r="0.085" fill="#ffffff77" />
            <SvgText
              x={t.x}
              y={t.y + 0.12}
              fontSize="0.32"
              fontWeight="bold"
              textAnchor="middle"
              fill="#ffffff"
            >
              {t.pieceId + 1}
            </SvgText>
          </G>
        )))}

        {/* Outer Board Border */}
        <Rect x="0.06" y="0.06" width="14.88" height="14.88" rx="0.3" fill="none" stroke="#2b3954" strokeWidth="0.12" />
      </Svg>

      {/* Moving token — replays the server's per-square path during a move. */}
      {active && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: animLeft,
            top: animTop,
            width: tokenDiameter,
            height: tokenDiameter,
            borderRadius: tokenDiameter / 2,
            backgroundColor: COLOR_BY_INDEX[active.colorIdx] || '#ffffff',
            borderWidth: Math.max(1, cs * 0.06),
            borderColor: DARK_BY_INDEX[active.colorIdx] || '#000000',
            elevation: 6,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Floating Arrow & Step Counter (Counts 1 to 6 / N steps above the moving seed) */}
          {active.cells && active.cells.length > 1 && (
            <View
              style={{
                position: 'absolute',
                ...(isNearTop
                  ? { top: tokenDiameter + 4 }
                  : { bottom: tokenDiameter + 4 }),
                left: (tokenDiameter - 74) / 2,
                width: 74,
                alignItems: 'center',
                zIndex: 1000,
              }}
            >
              {isNearTop && (
                <View
                  style={{
                    width: 0,
                    height: 0,
                    borderLeftWidth: 6,
                    borderRightWidth: 6,
                    borderBottomWidth: 8,
                    borderLeftColor: 'transparent',
                    borderRightColor: 'transparent',
                    borderBottomColor: '#00E5FF',
                    marginBottom: 2,
                  }}
                />
              )}
              <View
                style={{
                  backgroundColor: '#070C1B',
                  borderColor: '#00E5FF',
                  borderWidth: 1.5,
                  borderRadius: 10,
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                  alignItems: 'center',
                  shadowColor: '#00E5FF',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.9,
                  shadowRadius: 5,
                  elevation: 10,
                }}
              >
                <Text
                  style={{
                    color: '#00E5FF',
                    fontWeight: '900',
                    fontSize: Math.max(11, cs * 0.35),
                  }}
                >
                  Step {animStep}
                </Text>
              </View>
              {!isNearTop && (
                <View
                  style={{
                    width: 0,
                    height: 0,
                    borderLeftWidth: 6,
                    borderRightWidth: 6,
                    borderTopWidth: 8,
                    borderLeftColor: 'transparent',
                    borderRightColor: 'transparent',
                    borderTopColor: '#00E5FF',
                    marginTop: 2,
                  }}
                />
              )}
            </View>
          )}

          <View
            style={{
              position: 'absolute',
              left: tokenDiameter * 0.18,
              top: tokenDiameter * 0.12,
              width: tokenDiameter * 0.22,
              height: tokenDiameter * 0.22,
              borderRadius: tokenDiameter * 0.11,
              backgroundColor: '#ffffff',
              opacity: 0.6,
            }}
          />
          <Text
            style={{
              color: '#ffffff',
              fontSize: tokenDiameter * 0.38,
              fontWeight: 'bold',
            }}
          >
            {active.pieceId + 1}
          </Text>
        </Animated.View>
      )}

      {/* Interaction overlay */}
      {tokens.map((t) => (isAnimating(t) ? null : (
        <Pressable
          key={`pt-${t.playerIndex}-${t.pieceId}`}
          accessibilityRole="button"
          accessibilityLabel={`Player ${t.playerIndex + 1}, piece ${t.pieceId + 1}${t.legal ? ', legal move' : ''}`}
          disabled={!t.legal}
          onPress={() => onMove && onMove(t.pieceId)}
          style={{
            position: 'absolute',
            left: (t.x - 0.6) * cs,
            top: (t.y - 0.6) * cs,
            width: cs * 1.2,
            height: cs * 1.2,
            borderRadius: cs,
          }}
        />
      )))}
    </View>
  );
}
