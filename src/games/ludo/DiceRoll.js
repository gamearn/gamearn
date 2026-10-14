import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, Easing, Pressable } from 'react-native';

// Pip map for a 3x3 grid (index 0..8 -> row/col).
const PIPS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

// Offsets from center (boardSize * offset) for each house color's start star tile:
// 0: Red (top-left exit: r: 1, c: 6) -> x: -0.067, y: -0.400
// 1: Yellow (bottom-left exit: r: 8, c: 1) -> x: -0.400, y: 0.067
// 2: Blue (bottom-right exit: r: 13, c: 8) -> x: 0.067, y: 0.400
// 3: Green (top-right exit: r: 6, c: 13) -> x: 0.400, y: -0.067
const HOUSE_STAR_OFFSETS = {
  0: { x: -0.067, y: -0.400 }, // Red Start Star Tile (Top-Left Track Entry)
  1: { x: -0.400, y: 0.067 },  // Yellow Start Star Tile (Bottom-Left Track Entry)
  2: { x: 0.067, y: 0.400 },   // Blue Start Star Tile (Bottom-Right Track Entry)
  3: { x: 0.400, y: -0.067 },  // Green Start Star Tile (Top-Right Track Entry)
};


function Die({ value, size }) {
  const pips = PIPS[value] || PIPS[1];
  const dot = size * 0.18;
  return (
    <View
      style={[
        styles.die,
        { width: size, height: size, borderRadius: size * 0.24, padding: size * 0.1 },
      ]}
    >
      {pips.map((p) => {
        const row = Math.floor(p / 3);
        const col = p % 3;
        return (
          <View
            key={p}
            style={{
              position: 'absolute',
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              backgroundColor: '#0F174A',
              left: size * 0.1 + col * (size * 0.4 - dot / 1.5) + (size * 0.4 - dot) / 2,
              top: size * 0.1 + row * (size * 0.4 - dot / 1.5) + (size * 0.4 - dot) / 2,
            }}
          />
        );
      })}
    </View>
  );
}

/**
 * Animated Dice Roll that originates from the active player/Oba house color star,
 * tumbles dynamically into the board center while rolling, displays the result,
 * and glides smoothly back to the player's house star until the next turn.
 */
export default function DiceRoll({
  boardSize,
  count = 2,
  values = [],
  rolling = false,
  activeColorIdx = 0,
  settleMs = 260,
  fadeForPieceMove = false,
  onPress,
}) {
  const n = Math.max(1, Math.min(2, count || 2));
  const dieSize = boardSize * 0.11;

  const currentStar = HOUSE_STAR_OFFSETS[activeColorIdx] || HOUSE_STAR_OFFSETS[0];
  const starX = currentStar.x * boardSize;
  const starY = currentStar.y * boardSize;

  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const [liveFace, setLiveFace] = useState(() => Array(n).fill(1));
  const motionLoop = useRef(null);
  const spinLoop = useRef(null);
  const faceTimer = useRef(null);
  const settleTimeout = useRef(null);

  useEffect(() => {
    if (rolling) {
      if (settleTimeout.current) clearTimeout(settleTimeout.current);

      // Start live random pip face transitions
      faceTimer.current = setInterval(() => {
        setLiveFace(Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6)));
      }, 75);

      // Emerge from active player's house star into center
      tx.setValue(starX);
      ty.setValue(starY);
      scale.setValue(0.7);
      opacity.setValue(1);

      Animated.parallel([
        Animated.timing(tx, { toValue: 0, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(ty, { toValue: 0, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.25, duration: 240, useNativeDriver: true }),
      ]).start();

      // Step 2: Tumble and hop around center
      const r = boardSize * 0.16;
      const waypoints = [
        { x: -r * 0.7, y: -r * 0.5 },
        { x: r * 0.8, y: -r * 0.3 },
        { x: r * 0.4, y: r * 0.7 },
        { x: -r * 0.6, y: r * 0.5 },
        { x: 0, y: 0 },
      ];
      const steps = waypoints.map((p) =>
        Animated.parallel([
          Animated.timing(tx, { toValue: p.x, duration: 160, useNativeDriver: true }),
          Animated.timing(ty, { toValue: p.y, duration: 160, useNativeDriver: true }),
        ])
      );
      motionLoop.current = Animated.loop(Animated.sequence(steps));
      motionLoop.current.start();

      spinLoop.current = Animated.loop(
        Animated.timing(spin, { toValue: 1, duration: 450, easing: Easing.linear, useNativeDriver: true })
      );
      spinLoop.current.start();
    } else {
      // Stopping roll
      if (faceTimer.current) {
        clearInterval(faceTimer.current);
        faceTimer.current = null;
      }
      if (motionLoop.current) {
        motionLoop.current.stop();
        motionLoop.current = null;
      }
      if (spinLoop.current) {
        spinLoop.current.stop();
        spinLoop.current = null;
      }

      // Settle in the middle of the board (middle of the middle) so pieces are never obstructed!
      Animated.parallel([
        Animated.spring(tx, { toValue: 0, friction: 6, tension: 120, useNativeDriver: true }),
        Animated.spring(ty, { toValue: 0, friction: 6, tension: 120, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1.05, friction: 5, useNativeDriver: true }),
        Animated.timing(spin, { toValue: 0, duration: settleMs, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      // Sits neatly in the center triangle without covering any track pieces
      settleTimeout.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(scale, { toValue: 0.88, duration: 300, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.92, duration: 300, useNativeDriver: true }),
        ]).start();
      }, 1200);
    }

    return () => {
      if (faceTimer.current) clearInterval(faceTimer.current);
      if (motionLoop.current) motionLoop.current.stop();
      if (spinLoop.current) spinLoop.current.stop();
      if (settleTimeout.current) clearTimeout(settleTimeout.current);
    };
  }, [rolling, boardSize, n, starX, starY, settleMs, tx, ty, scale, spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const faces = Array.from({ length: n }, (_, i) =>
    rolling ? liveFace[i] || 1 : values[i] ?? values[0] ?? 1
  );

  return (
    <View pointerEvents="box-none" style={[styles.overlay, { width: boardSize, height: boardSize }]}>
      <Animated.View
        pointerEvents={fadeForPieceMove ? 'none' : 'box-none'}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: fadeForPieceMove ? 0.35 : opacity,
          transform: [
            { translateX: tx },
            { translateY: ty },
            { scale: fadeForPieceMove ? 0.75 : scale },
            { rotate },
          ],
        }}
      >
        <Pressable
          onPress={onPress}
          disabled={!onPress || rolling || fadeForPieceMove}
          style={{ flexDirection: 'row', alignItems: 'center' }}
          accessibilityLabel="Roll dice"
          accessibilityRole="button"
        >
          {faces.map((f, i) => (
            <View
              key={i}
              style={{
                marginHorizontal: dieSize * 0.12,
                shadowColor: '#00E5FF',
                shadowOpacity: rolling ? 0.8 : 0.45,
                shadowRadius: 10,
                elevation: 12,
              }}
            >
              <Die value={f} size={dieSize} />
            </View>
          ))}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  die: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#00E5FF',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
