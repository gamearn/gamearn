import React, { useRef } from 'react';
import { View, Image, StyleSheet, Pressable, Text, Animated } from 'react-native';

const LOGOS = {
  icon: require('../../assets/logos/logo_icon.png'),
  horizontal: require('../../assets/logos/logo_horizontal.png'),
  dark: require('../../assets/logos/logo_dark.png'),
  light: require('../../assets/logos/logo_light.png'),
};

const TAPS_NEEDED = 7;
const TAP_WINDOW_MS = 3000;
const SECRET_TEXT = 'You found the secret! Gamearn says thank you for playing Oba.';

export default function BrandLogo({ size = 44, iconOnly = false, variant = 'light', style }) {
  const taps = useRef([]);
  const scale = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(0)).current;

  let source = LOGOS.light;
  let width = size * 3.2;
  let height = size * 1.15;

  if (iconOnly || variant === 'icon') {
    source = LOGOS.icon;
    width = size * 1.25;
    height = size * 1.25;
  } else if (variant === 'dark') {
    source = LOGOS.dark;
    width = size * 3.2;
    height = size * 1.15;
  } else if (variant === 'horizontal') {
    source = LOGOS.horizontal;
    width = size * 3.2;
    height = size * 1.15;
  } else {
    source = LOGOS.light;
    width = size * 3.2;
    height = size * 1.15;
  }

  const handlePress = () => {
    const now = Date.now();
    taps.current = taps.current.filter((t) => now - t <= TAP_WINDOW_MS);
    taps.current.push(now);
    if (taps.current.length < TAPS_NEEDED) return;
    taps.current = [];
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.15, duration: 120, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: 600, useNativeDriver: true }).start();
    }, 2600);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="imagebutton"
      accessibilityLabel="Gamearn logo"
      hitSlop={8}
      style={({ pressed }) => [{ borderRadius: 30 }, pressed && { opacity: 0.85 }]}
    >
      <Animated.View style={[styles.container, style, { transform: [{ scale }] }]}>
        <Image
          source={source}
          style={{ width, height, borderRadius: 30 }}
          resizeMode="contain"
        />
        <Animated.View pointerEvents="none" style={[styles.secretBadge, { opacity: fade }]}>
          <Text
            numberOfLines={2}
            style={[styles.secretText, { fontSize: Math.max(10, Math.min(14, size * 0.28)) }]}
          >
            {SECRET_TEXT}
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    overflow: 'hidden',
  },
  secretBadge: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 30,
  },
  secretText: {
    color: '#00E5FF',
    fontWeight: '900',
    textAlign: 'center',
  },
});