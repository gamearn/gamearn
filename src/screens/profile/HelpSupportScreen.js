import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Swords,
  Wallet,
  Key,
  ExternalLink,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export default function HelpSupportScreen({ navigation }) {
  const { theme, isDark } = useTheme();

  const handleOpenCategory = (title) => {
    Alert.alert('Help Topic', `Opening help documentation for "${title}".`);
  };

  return (
    <View style={[styles.screenRoot, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
      <LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
          style={[styles.backCircleBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}
        >
          <ArrowLeft size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Title Section */}
        <View style={styles.heroTitleBlock}>
          <Text style={styles.centerOpsLabel}>CENTER OF OPERATIONS</Text>
          <Text style={[styles.mainHeroTitle, { color: theme.textPrimary }]}>HOW CAN WE</Text>
          <Text style={styles.orangeHeroTitle}>HELP YOU?</Text>
        </View>

        {/* Category Card 1: Tournament Rules */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => handleOpenCategory('Tournament Rules')}
          style={[styles.categoryCardHero, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
        >
          <View style={styles.iconCircleCyan}>
            <Swords size={24} color="#00E5FF" />
          </View>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>TOURNAMENT RULES</Text>
          <Text style={[styles.cardSubText, { color: theme.textSecondary }]}>
            Master the arena. Everything you need to know about fair play and scoring.
          </Text>

          {/* Decorative Pattern Lines in Card Corner */}
          <View style={styles.decorLinesPattern}>
            <View style={styles.decorLineBar} />
            <View style={[styles.decorLineBar, { width: 36 }]} />
            <View style={[styles.decorLineBar, { width: 20 }]} />
          </View>
        </TouchableOpacity>

        {/* Category Card 2: Wallet & Payments */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => navigation.navigate('WalletTab')}
          style={[styles.categoryCardRow, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}
        >
          <View style={styles.rowLeftContent}>
            <View style={styles.rowHeaderInline}>
              <Wallet size={20} color="#00E5FF" style={{ marginRight: 10 }} />
              <Text style={[styles.rowTitleText, { color: theme.textPrimary }]}>WALLET & PAYMENTS</Text>
            </View>
            <Text style={[styles.rowSubText, { color: theme.textSecondary }]}>
              Secure withdrawals and credit processing.
            </Text>
          </View>
          <ExternalLink size={20} color="#64748B" />
        </TouchableOpacity>

        {/* Category Card 3: Account Recovery */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => handleOpenCategory('Account Recovery')}
          style={[styles.categoryCardRow, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}
        >
          <View style={styles.rowLeftContent}>
            <View style={styles.rowHeaderInline}>
              <Key size={20} color="#00E5FF" style={{ marginRight: 10 }} />
              <Text style={[styles.rowTitleText, { color: theme.textPrimary }]}>ACCOUNT RECOVERY</Text>
            </View>
            <Text style={[styles.rowSubText, { color: theme.textSecondary }]}>
              Lost access or need credential reset assistance.
            </Text>
          </View>
          <ChevronRight size={20} color="#64748B" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroTitleBlock: {
    marginTop: 10,
    marginBottom: 28,
  },
  centerOpsLabel: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  mainHeroTitle: {
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 38,
  },
  orangeHeroTitle: {
    color: '#FF5500',
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 40,
  },
  categoryCardHero: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  iconCircleCyan: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cardSubText: {
    fontSize: 14,
    lineHeight: 20,
    maxWidth: '85%',
  },
  decorLinesPattern: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    gap: 6,
    transform: [{ rotate: '-45deg' }],
  },
  decorLineBar: {
    width: 50,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  categoryCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  rowLeftContent: {
    flex: 1,
    paddingRight: 10,
  },
  rowHeaderInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rowTitleText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  rowSubText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
