import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

// Pip map for a 3x3 grid (index 0..8 -> row/col).
const PIPS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function Die({ value, size }) {
  const pips = PIPS[value] || PIPS[1];
  const dot = size * 0.17;
  return (
    <View
      style={[
        styles.die,
        { width: size, height: size, borderRadius: size * 0.22, padding: size * 0.1 },
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
              borderRadius: dot,
              backgroundColor: '#12203f',
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
 * Dice tumble overlay. While `rolling` is true the dice spin and hop across the
 * board area; when it flips to false they spring back to the centre and settle
 * on the server-provided `values`.
 */
export default function DiceRoll({ boardSize, count = 1, values = [], rolling, settleMs = 220 }) {
  const n = Math.max(1, Math.min(2, count || 1));
  const dieSize = boardSize * 0.105;
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const [liveFace, setLiveFace] = useState(() => Array(n).fill(1));
  const motionLoop = useRef(null);
  const spinLoop = useRef(null);
  const faceTimer = useRef(null);

  useEffect(() => {
    if (rolling) {
      faceTimer.current = setInterval(() => {
        setLiveFace(Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6)));
      }, 90);

      const r = boardSize * 0.34;
      const waypoints = Array.from({ length: 7 }, () => ({
        x: (Math.random() * 2 - 1) * r,
        y: (Math.random() * 2 - 1) * r,
      }));
      tx.setValue(0);
      ty.setValue(0);
      spin.setValue(0);
      const steps = waypoints.map((p) =>
        Animated.parallel([
          Animated.timing(tx, { toValue: p.x, duration: 260, useNativeDriver: true }),
          Animated.timing(ty, { toValue: p.y, duration: 260, useNativeDriver: true }),
        ])
      );
      motionLoop.current = Animated.loop(Animated.sequence(steps));
      motionLoop.current.start();
      spinLoop.current = Animated.loop(
        Animated.timing(spin, { toValue: 1, duration: 850, useNativeDriver: true })
      );
      spinLoop.current.start();
    } else {
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
      Animated.parallel([
        Animated.spring(tx, { toValue: 0, useNativeDriver: true, friction: 6, tension: 90 }),
        Animated.spring(ty, { toValue: 0, useNativeDriver: true, friction: 6, tension: 90 }),
        Animated.timing(spin, { toValue: 0, duration: Math.min(300, settleMs), useNativeDriver: true }),
      ]).start();
    }
    return () => {
      if (faceTimer.current) clearInterval(faceTimer.current);
      if (motionLoop.current) motionLoop.current.stop();
      if (spinLoop.current) spinLoop.current.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolling, boardSize, n]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const faces = Array.from({ length: n }, (_, i) =>
    rolling ? liveFace[i] || 1 : values[i] ?? values[0] ?? 1
  );

  return (
    <View pointerEvents="none" style={[styles.overlay, { width: boardSize, height: boardSize }]}>
      <Animated.View
        style={{
          flexDirection: 'row',
          transform: [{ translateX: tx }, { translateY: ty }, { rotate }],
        }}
      >
        {faces.map((f, i) => (
          <View key={i} style={{ marginHorizontal: dieSize * 0.1 }}>
            <Die value={f} size={dieSize} />
          </View>
        ))}
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
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.35)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
});
