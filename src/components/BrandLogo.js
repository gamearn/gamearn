import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const LOGOS = {
  icon: require('../../assets/logos/logo_icon.png'),
  horizontal: require('../../assets/logos/logo_horizontal.png'),
  dark: require('../../assets/logos/logo_dark.png'),
  light: require('../../assets/logos/logo_light.png'),
};

export default function BrandLogo({ size = 44, iconOnly = false, variant = 'light', style }) {
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

  return (
    <View style={[styles.container, style]}>
      <Image
        source={source}
        style={{ width, height, borderRadius: 30 }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    overflow: 'hidden',
  },
});
