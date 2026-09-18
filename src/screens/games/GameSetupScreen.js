import React, { useState } from 'react';
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
import { ArrowLeft, Trophy, Play } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export default function GameSetupScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const gameName = route.params?.gameName || 'Dráfù Game';
  const targetScreen = route.params?.targetScreen || 'DraughtsGame';
  const leaderboardRank = route.params?.rank || '2,625';
  const entryFee = route.params?.entryFee || '$70.00';

  const [selectedTimer, setSelectedTimer] = useState('2m');
  const TIMERS = ['30s', '1m', '2m', '3m'];

  const handleStartGame = () => {
    navigation.navigate(targetScreen, { timer: selectedTimer });
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
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{gameName} Set-up</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title & Subtitle */}
        <View style={styles.titleSection}>
          <Text style={[styles.mainTitle, { color: theme.textPrimary }]}>Game Setup</Text>
          <Text style={[styles.subTitle, { color: theme.textSecondary }]}>Configure your match settings</Text>
        </View>

        {/* Turn Timer Setting */}
        <View style={styles.settingBlock}>
          <View style={styles.settingHeaderRow}>
            <Text style={styles.settingLabel}>Turn Timer</Text>
            <Text style={styles.selectedTimerValue}>{selectedTimer === '2m' ? '2 min' : selectedTimer}</Text>
          </View>

          {/* Slider Line & Nodes */}
          <View style={styles.sliderTrackContainer}>
            <View style={styles.sliderTrackBackground} />
            <LinearGradient
              colors={['#00E5FF', '#0284C7']}
              style={[
                styles.sliderTrackActive,
                {
                  width:
                    selectedTimer === '30s'
                      ? '0%'
                      : selectedTimer === '1m'
                      ? '33%'
                      : selectedTimer === '2m'
                      ? '66%'
                      : '100%',
                },
              ]}
            />
            <View style={styles.nodesRow}>
              {TIMERS.map((t) => {
                const isSelected = selectedTimer === t;
                return (
                  <TouchableOpacity
                    key={t}
                    activeOpacity={0.8}
                    onPress={() => setSelectedTimer(t)}
                    style={styles.nodeTouchable}
                  >
                    <View style={[styles.nodeCircle, isSelected && styles.nodeCircleSelected]} />
                    <Text style={[styles.nodeText, isSelected && { color: '#00E5FF', fontWeight: '900' }]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1, minHeight: 180 }} />

        {/* Leaderboard Position & Entry Fee Card */}
        <View style={styles.metaCard}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>LEADERBOARD POSITION</Text>
            <View style={styles.metaValueRow}>
              <Trophy size={16} color="#00E5FF" style={{ marginRight: 6 }} />
              <Text style={styles.metaValueCyan}>{leaderboardRank}</Text>
            </View>
          </View>

          <View style={styles.metaItemRight}>
            <Text style={styles.metaLabel}>ENTRY FEE</Text>
            <Text style={styles.metaValueWhite}>{entryFee}</Text>
          </View>
        </View>

        {/* Start Game Orange CTA */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleStartGame}
          style={styles.primaryOrangeBtn}
        >
          <Text style={styles.primaryOrangeBtnText}>START GAME ▷</Text>
        </TouchableOpacity>

        {/* Terms Disclaimer */}
        <Text style={styles.disclaimerText}>
          By starting, you agree to the Game Rules and Terms of Service.
        </Text>

        {/* Footer Brand Logo */}
        <View style={styles.footerBrandWrap}>
          <Text style={styles.brandTitle}>GAMEARN</Text>
          <Text style={styles.brandSub}>WHERE SKILL BECOMES REWARD</Text>
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
    flexGrow: 1,
  },
  titleSection: {
    marginTop: 10,
    marginBottom: 30,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  subTitle: {
    color: '#94A3B8',
    fontSize: 13,
  },
  settingBlock: {
    marginBottom: 30,
  },
  settingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  selectedTimerValue: {
    color: '#00E5FF',
    fontSize: 16,
    fontWeight: '900',
  },
  sliderTrackContainer: {
    height: 50,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrackBackground: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
  },
  sliderTrackActive: {
    position: 'absolute',
    left: 10,
    height: 6,
    borderRadius: 3,
  },
  nodesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nodeTouchable: {
    alignItems: 'center',
    width: 40,
  },
  nodeCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#334155',
    marginBottom: 8,
  },
  nodeCircleSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00E5FF',
    borderWidth: 3,
    borderColor: '#070C1B',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  nodeText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  metaCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },
  metaItem: {},
  metaItemRight: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaValueCyan: {
    color: '#00E5FF',
    fontSize: 22,
    fontWeight: '900',
  },
  metaValueWhite: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  primaryOrangeBtn: {
    backgroundColor: '#FF5500',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF5500',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    marginBottom: 16,
  },
  primaryOrangeBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  disclaimerText: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 30,
  },
  footerBrandWrap: {
    alignItems: 'center',
  },
  brandTitle: {
    color: '#FF5500',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandSub: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
});
