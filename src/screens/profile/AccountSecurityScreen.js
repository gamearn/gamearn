import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Shield,
  Lock,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export default function AccountSecurityScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  const handleToggle2FA = (val) => {
    setTwoFactorEnabled(val);
    Alert.alert(
      val ? '2FA Protection Enabled 🔒' : '2FA Protection Disabled ⚠️',
      val
        ? 'Your account is now protected with a 2FA verification code on new logins.'
        : 'Two-factor authentication has been turned off for this account.'
    );
  };

  return (
    <View style={[styles.screenRoot, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
      <LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
          style={[styles.backCircleBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}
        >
          <ArrowLeft size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Account Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Hero Section: YOUR ACCOUNT IS FORTIFIED */}
        <View style={styles.heroSection}>
          <Text style={[styles.ratingTag, { color: theme.primary }]}>SECURITY RATING</Text>
          <Text style={[styles.heroMainTitle, { color: theme.textPrimary }]}>
            YOUR ACCOUNT{'\n'}IS <Text style={[styles.cyanHighlight, { color: theme.primary }]}>FORTIFIED</Text>
          </Text>
          <Text style={[styles.heroSubText, { color: theme.textSecondary }]}>
            Multi-layer encryption is active. Your gaming assets are protected by Gamearn Void protocols.
          </Text>

          <View style={styles.updatedRow}>
            <CheckCircle2 size={16} color={theme.primary} />
            <Text style={[styles.updatedText, { color: theme.primary }]}>UPDATED 2M AGO</Text>
          </View>
        </View>

        {/* Vault Status Card */}
        <LinearGradient
          colors={isDark ? ['#131B2E', '#0B1220'] : ['#FFFFFF', '#F1F5F9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.vaultCard, { borderColor: isDark ? 'rgba(255, 85, 0, 0.25)' : 'rgba(255, 85, 0, 0.4)' }]}
        >
          {/* Orange Shield Icon */}
          <View style={styles.orangeShieldCircle}>
            <Lock size={26} color="#FFFFFF" fill="#FFFFFF" />
          </View>

          <Text style={[styles.vaultTitle, { color: theme.textPrimary }]}>VAULT STATUS</Text>

          {/* Pill Badge */}
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>LEVEL 4 ACCESS</Text>
          </View>
        </LinearGradient>

        {/* Section: TWO-FACTOR AUTH */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.orangeBar} />
          <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>TWO-FACTOR AUTH</Text>
        </View>

        {/* 2FA Toggle Card */}
        <View style={[styles.twoFactorCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
          <View style={styles.twoFactorTextWrap}>
            <Text style={[styles.twoFactorCardTitle, { color: theme.textPrimary }]}>Enable 2FA Protection</Text>
            <Text style={[styles.twoFactorCardSub, { color: theme.textSecondary }]}>
              Secure your account with a code from your email or phone on every new login attempt.
            </Text>
          </View>

          <Switch
            value={twoFactorEnabled}
            onValueChange={handleToggle2FA}
            trackColor={{ false: '#334155', true: '#FF5500' }}
            thumbColor={twoFactorEnabled ? '#FFFFFF' : '#94A3B8'}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: '#070C1B',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
  },
  backCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroSection: {
    marginBottom: 24,
  },
  ratingTag: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroMainTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
    marginBottom: 12,
  },
  cyanHighlight: {
    color: '#00E5FF',
  },
  heroSubText: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
    maxWidth: 320,
  },
  updatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  updatedText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  vaultCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 85, 0, 0.25)',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  orangeShieldCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF5500',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF5500',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    marginBottom: 16,
  },
  vaultTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 10,
  },
  levelBadge: {
    backgroundColor: '#FF5500',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  orangeBar: {
    width: 4,
    height: 18,
    backgroundColor: '#FF5500',
    borderRadius: 2,
  },
  sectionTitleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  twoFactorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 25, 45, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 20,
  },
  twoFactorTextWrap: {
    flex: 1,
    marginRight: 16,
  },
  twoFactorCardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  twoFactorCardSub: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
});
