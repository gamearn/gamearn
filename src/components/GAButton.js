import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export default function GAButton({
  title,
  onPress,
  variant = 'primary', // primary, secondary, outline, social, danger
  loading = false,
  disabled = false,
  icon,
  showArrow = false,
  style,
  textStyle,
  gradientColors,
}) {
  const { theme } = useTheme();

  // Primary variant uses glowing orange/red gradient as seen in the screenshots
  const orangeGradient = gradientColors || ['#FF6B00', '#FF2E00'];

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        style={[styles.wrapper, style]}
      >
        <LinearGradient
          colors={orangeGradient}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.gradientBtn, disabled && styles.disabledBtn]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.rowBetween}>
              <View style={styles.rowLeft}>
                {icon && <View style={styles.iconMargin}>{icon}</View>}
                <Text style={[styles.primaryText, textStyle]}>{title}</Text>
              </View>
              {showArrow && <ArrowRight size={20} color="#FFFFFF" style={styles.arrowIcon} />}
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'social') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[styles.socialBtn, disabled && styles.disabledBtn, style]}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <View style={styles.rowCenter}>
            {icon && <View style={styles.iconMargin}>{icon}</View>}
            <Text style={[styles.socialText, textStyle]}>{title}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  const getBgColor = () => {
    if (variant === 'secondary') return 'rgba(30, 41, 59, 0.8)';
    if (variant === 'danger') return theme.danger;
    if (variant === 'outline') return 'rgba(10, 14, 26, 0.6)';
    return theme.primary;
  };

  const getBorderColor = () => {
    if (variant === 'outline') return 'rgba(71, 85, 105, 0.6)';
    return 'transparent';
  };

  const getTextColor = () => {
    if (variant === 'outline') return '#FFFFFF';
    return '#FFFFFF';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.solidBtn,
        {
          backgroundColor: getBgColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1.5 : 0,
        },
        disabled && styles.disabledBtn,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={showArrow ? styles.rowBetween : styles.rowCenter}>
          <View style={styles.rowLeft}>
            {icon && <View style={styles.iconMargin}>{icon}</View>}
            <Text style={[styles.solidText, { color: getTextColor() }, textStyle]}>
              {title}
            </Text>
          </View>
          {showArrow && <ArrowRight size={20} color="#FFFFFF" style={styles.arrowIcon} />}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  gradientBtn: {
    height: 54,
    paddingHorizontal: 24,
    borderRadius: 28,
    justifyContent: 'center',
  },
  solidBtn: {
    height: 54,
    paddingHorizontal: 24,
    borderRadius: 28,
    justifyContent: 'center',
  },
  socialBtn: {
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMargin: {
    marginRight: 10,
  },
  arrowIcon: {
    position: 'absolute',
    right: 4,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  solidText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  socialText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
