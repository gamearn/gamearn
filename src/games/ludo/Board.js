import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Pressable, Animated, Easing } from 'react-native';
import Svg, {
  Rect,
  Circle,
  Polygon,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';
import {
  RING,
  START_RING,
  SAFE_RING,
  LANE_BY_COLORIDX,
  YARD_ORIGIN,
  COLOR_BY_INDEX,
  DARK_BY_INDEX,
  CENTRE,
} from './serverAdapter';

const CELLS = 15;
// Route colours are a visual board treatment. The authoritative server positions
// remain unchanged; this maps the four arms to the supplied reference image.
const PATH_COLOR_BY_TEAM = [3, 0, 1, 2];

const key = (r, c) => `${r},${c}`;

// Precompute lookup tables once.
const ringIndexByCoord = new Map();
RING.forEach((cell, idx) => ringIndexByCoord.set(key(cell.r, cell.c), idx));

const startByCoord = new Map();
START_RING.forEach((idx, colorIdx) => {
  const cell = RING[idx];
  if (cell) startByCoord.set(key(cell.r, cell.c), PATH_COLOR_BY_TEAM[colorIdx]);
});

const safeCoord = new Set(SAFE_RING.map((idx) => RING[idx]).filter(Boolean).map((c) => key(c.r, c.c)));

const laneColorByCoord = new Map();
LANE_BY_COLORIDX.forEach((lane, colorIdx) => {
  (lane || []).forEach((cell) => laneColorByCoord.set(key(cell.r, cell.c), PATH_COLOR_BY_TEAM[colorIdx]));
});

function isCross(r, c) {
  return (r >= 6 && r <= 8) || (c >= 6 && c <= 8);
}

function star(cx, cy, r) {
  return Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const d = i % 2 ? r * 0.45 : r;
    return `${cx + Math.cos(a) * d},${cy + Math.sin(a) * d}`;
  }).join(' ');
}

function yardSlots(colorIdx) {
  const o = YARD_ORIGIN[colorIdx] || YARD_ORIGIN[0];
  return [
    [o.c + 2, o.r + 2],
    [o.c + 4, o.r + 2],
    [o.c + 2, o.r + 4],
    [o.c + 4, o.r + 4],
  ];
}

function arrow(cx, cy, direction) {
  const points = {
    down: [[0, -0.32], [-0.28, 0.02], [-0.12, 0.02], [-0.12, 0.34], [0.12, 0.34], [0.12, 0.02], [0.28, 0.02]],
    left: [[0.32, 0], [-0.02, -0.28], [-0.02, -0.12], [-0.34, -0.12], [-0.34, 0.12], [-0.02, 0.12], [-0.02, 0.28]],
    up: [[0, 0.32], [-0.28, -0.02], [-0.12, -0.02], [-0.12, -0.34], [0.12, -0.34], [0.12, -0.02], [0.28, -0.02]],
    right: [[-0.32, 0], [0.02, -0.28], [0.02, -0.12], [0.34, -0.12], [0.34, 0.12], [0.02, 0.12], [0.02, 0.28]],
  };
  return points[direction].map(([x, y]) => `${cx + x},${cy + y}`).join(' ');
}

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
  const progress = useRef(new Animated.Value(0)).current;

  const runQueue = useCallback(() => {
    if (animatingRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;
    animatingRef.current = true;
    const n = next.cells.length - 1;
    const stepMs = Math.max(90, Math.min(170, Math.round(1400 / n)));
    progress.setValue(0);
    setActiveMove(next);
    Animated.timing(progress, {
      toValue: n,
      duration: stepMs * n,
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
  const tokenDiameter = cs * 0.8;
  const animInput = active ? active.cells.map((_, i) => i) : [0, 1];
  const animLeft = progress.interpolate({
    inputRange: animInput,
    outputRange: active ? active.cells.map((cell) => (cell.c + 0.5) * cs - tokenDiameter / 2) : [0, 0],
  });
  const animTop = progress.interpolate({
    inputRange: animInput,
    outputRange: active ? active.cells.map((cell) => (cell.r + 0.5) * cs - tokenDiameter / 2) : [0, 0],
  });

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.03,
        overflow: 'hidden',
        backgroundColor: '#0f172e',
        elevation: 8,
      }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${CELLS} ${CELLS}`}>
        <Defs>
          <LinearGradient id="boardEdge" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#233a78" />
            <Stop offset="1" stopColor="#101d49" />
          </LinearGradient>
          {COLOR_BY_INDEX.map((color, i) => (
            <RadialGradient key={i} id={`tk${i}`} cx="32%" cy="25%" r="80%">
              <Stop offset="0" stopColor={color} />
              <Stop offset="0.65" stopColor={color} />
              <Stop offset="1" stopColor={DARK_BY_INDEX[i]} />
            </RadialGradient>
          ))}
        </Defs>

        <Rect x="0" y="0" width={CELLS} height={CELLS} fill="url(#boardEdge)" />

        {/* Cross base */}
        <Rect x={0} y={6} width={CELLS} height={3} fill="#f8fafc" />
        <Rect x={6} y={0} width={3} height={CELLS} fill="#f8fafc" />

        {/* Yards */}
        {YARD_ORIGIN.map((o, colorIdx) => (
          <G key={colorIdx}>
            <Rect
              x={o.c}
              y={o.r}
              width={6}
              height={6}
              fill={COLOR_BY_INDEX[colorIdx]}
              stroke="#102044"
              strokeWidth="0.12"
            />
            <Rect
              x={o.c + 0.75}
              y={o.r + 0.75}
              width={4.5}
              height={4.5}
              rx="0.58"
              fill="#ffffff"
              fillOpacity="0.88"
              stroke="#102044"
              strokeWidth="0.07"
            />
            {yardSlots(colorIdx).map(([cx, cy], i) => (
              <Circle
                key={i}
                cx={cx}
                cy={cy}
                r="0.7"
                fill={COLOR_BY_INDEX[colorIdx]}
                opacity="0.22"
              />
            ))}
          </G>
        ))}

        {/* Cross squares */}
        {Array.from({ length: CELLS }, (_, r) =>
          Array.from({ length: CELLS }, (_, c) => {
            if (!isCross(r, c)) return null;
            const k = key(r, c);
            const laneColor = laneColorByCoord.get(k);
            const startColor = startByCoord.get(k);
            const inRing = ringIndexByCoord.has(k);
            if (!inRing && laneColor === undefined) return null;

            let fill = '#ffffff';
            if (laneColor !== undefined) fill = COLOR_BY_INDEX[laneColor];
            else if (startColor !== undefined) fill = COLOR_BY_INDEX[startColor];

            return (
              <Rect
                key={k}
                x={c + 0.04}
                y={r + 0.04}
                width={0.92}
                height={0.92}
                rx="0.04"
                fill={fill}
                stroke="#17213d"
                strokeWidth="0.07"
              />
            );
          })
        )}

        {/* Safe stars */}
        {[...safeCoord].map((k) => {
          const [r, c] = k.split(',').map(Number);
          return (
            <Polygon
              key={`s-${k}`}
              points={star(c + 0.5, r + 0.5, 0.3)}
              fill="#FFD700"
              stroke="#0b1225"
              strokeWidth="0.04"
            />
          );
        })}

        {/* Centre home triangles */}
        <Polygon points={`6,6 9,6 ${CENTRE.c + 0.5},${CENTRE.r + 0.5}`} fill={COLOR_BY_INDEX[3]} stroke="#0b1225" strokeWidth="0.05" />
        <Polygon points={`9,6 9,9 ${CENTRE.c + 0.5},${CENTRE.r + 0.5}`} fill={COLOR_BY_INDEX[2]} stroke="#0b1225" strokeWidth="0.05" />
        <Polygon points={`9,9 6,9 ${CENTRE.c + 0.5},${CENTRE.r + 0.5}`} fill={COLOR_BY_INDEX[1]} stroke="#0b1225" strokeWidth="0.05" />
        <Polygon points={`6,9 6,6 ${CENTRE.c + 0.5},${CENTRE.r + 0.5}`} fill={COLOR_BY_INDEX[0]} stroke="#0b1225" strokeWidth="0.05" />

        {/* The coloured entry squares are easier to read with the reference-style arrows. */}
        <Polygon points={arrow(7.5, 5.5, 'up')} fill="#ffffff" fillOpacity="0.5" />
        <Polygon points={arrow(9.5, 7.5, 'right')} fill="#ffffff" fillOpacity="0.5" />
        <Polygon points={arrow(7.5, 9.5, 'down')} fill="#ffffff" fillOpacity="0.5" />
        <Polygon points={arrow(5.5, 7.5, 'left')} fill="#ffffff" fillOpacity="0.5" />

        {/* Pieces */}
        {tokens.map((t) => (isAnimating(t) ? null : (
          <G key={`p-${t.playerIndex}-${t.pieceId}`}>
            {t.legal && <Circle cx={t.x} cy={t.y} r="0.58" fill="none" stroke="#00E5FF" strokeWidth="0.11" />}
            <Circle cx={t.x} cy={t.y} r="0.4" fill={`url(#tk${t.colorIdx ?? 0})`} stroke={t.dark} strokeWidth="0.08" />
            <Circle cx={t.x - 0.11} cy={t.y - 0.13} r="0.1" fill="#ffffff" opacity={0.6} />
          </G>
        )))}
        <Rect x="0.08" y="0.08" width="14.84" height="14.84" rx="0.28" fill="none" stroke="#102044" strokeWidth="0.16" />
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
            borderWidth: Math.max(1, cs * 0.08),
            borderColor: DARK_BY_INDEX[active.colorIdx] || '#000000',
            elevation: 6,
          }}
        >
          <View
            style={{
              position: 'absolute',
              left: tokenDiameter * 0.24,
              top: tokenDiameter * 0.16,
              width: tokenDiameter * 0.22,
              height: tokenDiameter * 0.22,
              borderRadius: tokenDiameter * 0.11,
              backgroundColor: '#ffffff',
              opacity: 0.6,
            }}
          />
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
