import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import {
  ArrowLeft,
  Flame,
  Check,
  TrendingUp,
  Lock,
  Gift,
  Award,
  Medal,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export default function DailyStreakScreen({ navigation }) {
  const { theme, isDark } = useTheme();

  return (
    <View style={[styles.screenRoot, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
      <LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
          style={[styles.backCircleBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}
        >
          <ArrowLeft size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Daily Streak</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Flame Hero Circle & Streak Count */}
        <View style={styles.heroCenterBlock}>
          <View style={styles.flameGraphicRing}>
            <Svg width={120} height={120}>
              <Circle
                cx={60}
                cy={60}
                r={54}
                stroke="rgba(255, 85, 0, 0.2)"
                strokeWidth={4}
                fill="none"
              />
              <Circle
                cx={60}
                cy={60}
                r={54}
                stroke="#FF5500"
                strokeWidth={4}
                strokeDasharray={340}
                strokeDashoffset={60}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>

            <View style={styles.flameIconInnerCircle}>
              <Flame size={44} color="#FF5500" fill="#FF5500" />
            </View>
          </View>

          <Text style={[styles.bigDaysNum, { color: theme.textPrimary }]}>42</Text>
          <Text style={styles.daysActiveLabel}>DAYS ACTIVE</Text>

          {/* Status Pill */}
          <View style={[styles.streakStatusPill, { backgroundColor: isDark ? 'rgba(0, 229, 255, 0.08)' : 'rgba(0, 180, 216, 0.12)', borderColor: isDark ? 'rgba(0, 229, 255, 0.4)' : 'rgba(0, 180, 216, 0.4)' }]}>
            <View style={[styles.cyanDot, { backgroundColor: theme.primary }]} />
            <Text style={[styles.streakStatusText, { color: theme.primary }]}>STREAK MAINTAINED</Text>
          </View>
        </View>

        {/* Next Milestone Card */}
        <View style={[styles.milestoneCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
          <View style={styles.milestoneHeader}>
            <View>
              <Text style={[styles.milestoneSubLabel, { color: theme.textSecondary }]}>Next Milestone</Text>
              <Text style={[styles.milestoneTitle, { color: theme.textPrimary }]}>50 Day Badge</Text>
            </View>
            <Text style={[styles.daysLeftBadge, { color: theme.primary }]}>8 DAYS LEFT</Text>
          </View>

          {/* Progress Bar Track */}
          <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]}>
            <LinearGradient
              colors={theme.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: '80%' }]}
            />
          </View>

          <View style={styles.progressLabelsRow}>
            <Text style={[styles.progressFootnote, { color: theme.textMuted }]}>DAY 30 REACHED</Text>
            <Text style={[styles.progressFootnote, { color: theme.textMuted }]}>DAY 50 MILESTONE</Text>
          </View>
        </View>

        {/* Rewards Journey Section */}
        <View style={styles.journeySection}>
          <Text style={[styles.journeySectionTitle, { color: theme.textPrimary }]}>Rewards Journey</Text>

          {/* Timeline Nodes */}
          <View style={styles.timelineList}>
            {/* Timeline Connecting Line */}
            <View style={[styles.verticalLineTrack, { backgroundColor: isDark ? 'rgba(0, 229, 255, 0.2)' : 'rgba(0, 180, 216, 0.2)' }]} />

            {/* Node 1: Day 7 (Completed) */}
            <View style={styles.nodeItemRow}>
              <View style={[styles.checkedNodeCircle, { backgroundColor: theme.primary }]}>
                <Check size={16} color="#FFFFFF" strokeWidth={3} />
              </View>
              <View style={[styles.nodeCardBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nodeDayLabelText, { color: theme.primary }]}>DAY 7</Text>
                  <Text style={[styles.nodeTitleText, { color: theme.textPrimary }]}>Starter Pack Unlock</Text>
                </View>
                <Gift size={20} color={theme.primary} />
              </View>
            </View>

            {/* Node 2: Day 50 (In Progress) */}
            <View style={styles.nodeItemRow}>
              <View style={[styles.trendingNodeCircle, { backgroundColor: theme.cardBg, borderColor: theme.primary }]}>
                <TrendingUp size={16} color={theme.primary} strokeWidth={2.5} />
              </View>
              <View style={[styles.nodeCardBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nodeDayLabelText, { color: theme.primary }]}>DAY 50</Text>
                  <Text style={[styles.nodeTitleText, { color: theme.textPrimary }]}>Silver Badge + 500 Coins</Text>
                </View>
                <Lock size={18} color={theme.textMuted} />
              </View>
            </View>

            {/* Node 3: Day 90 (Ultimate Reward - Highlighted Cyan Card) */}
            <View style={styles.nodeItemRow}>
              <View style={[styles.lockedNodeCircle, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
                <Lock size={16} color={theme.textMuted} />
              </View>
              <LinearGradient
                colors={theme.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ultimateRewardCard}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.ultimatePill}>
                    <Text style={styles.ultimatePillText}>ULTIMATE REWARD</Text>
                  </View>
                  <Text style={[styles.nodeDayLabelTextDark, { color: '#FFFFFF' }]}>DAY 90</Text>
                  <Text style={[styles.ultimateTitleText, { color: '#FFFFFF' }]}>Elite Champion Title</Text>
                </View>
                <Medal size={24} color="#FFFFFF" strokeWidth={2.5} />
              </LinearGradient>
            </View>
          </View>
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
    paddingBottom: 50,
  },
  heroCenterBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  flameGraphicRing: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  flameIconInnerCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 85, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigDaysNum: {
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: '900',
    lineHeight: 56,
  },
  daysActiveLabel: {
    color: '#FF5500',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  streakStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 8,
  },
  cyanDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E5FF',
  },
  streakStatusText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  milestoneCard: {
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 28,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  milestoneSubLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  milestoneTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  daysLeftBadge: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressFootnote: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  journeySection: {
    marginBottom: 20,
  },
  journeySectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 18,
  },
  timelineList: {
    position: 'relative',
    gap: 16,
  },
  verticalLineTrack: {
    position: 'absolute',
    left: 19,
    top: 20,
    bottom: 30,
    width: 2,
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
  },
  nodeItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  checkedNodeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  trendingNodeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 25, 45, 0.9)',
    borderWidth: 2,
    borderColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  lockedNodeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 25, 45, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeCardBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
  },
  nodeDayLabelText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  nodeDayLabelTextDark: {
    color: '#070C1B',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  nodeTitleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  ultimateRewardCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#00E5FF',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  ultimatePill: {
    backgroundColor: 'rgba(7, 12, 27, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  ultimatePillText: {
    color: '#070C1B',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  ultimateTitleText: {
    color: '#070C1B',
    fontSize: 17,
    fontWeight: '900',
  },
});
