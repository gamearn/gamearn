import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, {
  Rect,
  Circle,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  G,
  Path,
} from 'react-native-svg';

export default function Dice3D({ value = 6, size = 36 }) {
  const getPips = (val) => {
    switch (val) {
      case 1:
        return [{ x: 18, y: 18 }];
      case 2:
        return [{ x: 10, y: 10 }, { x: 26, y: 26 }];
      case 3:
        return [{ x: 10, y: 10 }, { x: 18, y: 18 }, { x: 26, y: 26 }];
      case 4:
        return [{ x: 10, y: 10 }, { x: 26, y: 10 }, { x: 10, y: 26 }, { x: 26, y: 26 }];
      case 5:
        return [{ x: 10, y: 10 }, { x: 26, y: 10 }, { x: 18, y: 18 }, { x: 10, y: 26 }, { x: 26, y: 26 }];
      case 6:
        return [
          { x: 10, y: 9 }, { x: 26, y: 9 },
          { x: 10, y: 18 }, { x: 26, y: 18 },
          { x: 10, y: 27 }, { x: 26, y: 27 },
        ];
      default:
        return [{ x: 18, y: 18 }];
    }
  };

  const pips = getPips(value);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 36 36">
        <Defs>
          {/* 3D Top Face Gradient */}
          <LinearGradient id="diceTop" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="0.7" stopColor="#F1F5F9" />
            <Stop offset="1" stopColor="#E2E8F0" />
          </LinearGradient>

          {/* 3D Side Shading Gradient */}
          <LinearGradient id="diceSide" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#CBD5E1" />
            <Stop offset="1" stopColor="#94A3B8" />
          </LinearGradient>

          {/* 3D Pip Inset Gradient */}
          <RadialGradient id="pipGradient" cx="30%" cy="30%" r="70%">
            <Stop offset="0" stopColor="#334155" />
            <Stop offset="0.6" stopColor="#0F172A" />
            <Stop offset="1" stopColor="#020617" />
          </RadialGradient>
        </Defs>

        {/* 3D Shadow Base */}
        <Rect x="2" y="4" width="32" height="30" rx="7" fill="#020617" opacity={0.35} />

        {/* 3D Side Bevel Bottom */}
        <Rect x="2" y="2" width="32" height="31" rx="7" fill="url(#diceSide)" />

        {/* 3D Main Top Face */}
        <Rect x="2" y="1" width="32" height="29" rx="6" fill="url(#diceTop)" stroke="#E2E8F0" strokeWidth="1" />

        {/* 3D Edge Specular Reflection Line */}
        <Path d="M 6 3 H 30" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity={0.9} />

        {/* Render 3D Inset Pips */}
        {pips.map((p, idx) => (
          <G key={idx}>
            <Circle cx={p.x} cy={p.y} r="3.2" fill="url(#pipGradient)" />
            <Circle cx={p.x - 0.8} cy={p.y - 0.8} r="1" fill="#64748B" opacity={0.6} />
          </G>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
});
