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
  RotateCcw,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import GAButton from '../../components/GAButton';
import { getLocalDateString } from '../../utils/recordGameStreak';

export default function DailyStreakScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { userProfile, updateProfileData } = useAuth();
  const [loading, setLoading] = useState(false);

  const streakDays = userProfile?.streak ?? 0;
  const lastStreakDate = userProfile?.lastStreakDate || null;
  const lastCheckInDate = userProfile?.lastCheckInDate || null;
  const lastPlayedDate = userProfile?.lastPlayedDate || null;
  const todayStr = getLocalDateString();
  // A check-in and a played game share the same "today" marker so neither can
  // double-count the streak.
  const isClaimedToday = lastStreakDate === todayStr || lastCheckInDate === todayStr;
  const touchedToday = lastCheckInDate === todayStr || lastPlayedDate === todayStr;
  const isActive = streakDays > 0;

  // Next milestone calculation
  const nextMilestone = streakDays < 7 ? 7 : streakDays < 30 ? 30 : streakDays < 50 ? 50 : 90;
  const daysLeft = Math.max(0, nextMilestone - streakDays);
  const progressPercent = Math.min(100, Math.max(0, Math.floor((streakDays / nextMilestone) * 100)));

  const handleClaimStreak = async () => {
    if (isClaimedToday) {
      Alert.alert('Streak Active! 🔥', 'You have already checked in today! Come back tomorrow to continue your streak.');
      return;
    }
    setLoading(true);
    try {
      // If a game already advanced the streak today, claiming only marks the
      // day as checked-in without bumping it a second time.
      const nextStreak = touchedToday ? streakDays : streakDays + 1;
      await updateProfileData({
        streak: nextStreak,
        lastStreakDate: todayStr,
        lastCheckInDate: todayStr,
        lastStreakPersistedDate: todayStr,
      });
      Alert.alert(
        'Daily Streak Active! 🔥',
        `Great job! You checked in today. Your streak is now ${nextStreak} day${nextStreak === 1 ? '' : 's'} ACTIVE!`
      );
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not update daily streak.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetStreak = async () => {
    Alert.alert(
      'Reset Daily Streak',
      'Reset streak count to 0 days (Inactive in RED)?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to 0 Days',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await updateProfileData({
                streak: 0,
                lastStreakDate: null,
                lastCheckInDate: null,
              });
              Alert.alert('Streak Reset', 'Daily streak is now 0 days and INACTIVE in RED.');
            } catch (e) {
              console.warn(e);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

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
                stroke={isActive ? "rgba(255, 85, 0, 0.2)" : "rgba(239, 68, 68, 0.2)"}
                strokeWidth={4}
                fill="none"
              />
              <Circle
                cx={60}
                cy={60}
                r={54}
                stroke={isActive ? "#10B981" : "#EF4444"}
                strokeWidth={4}
                strokeDasharray={340}
                strokeDashoffset={isActive ? 60 : 340}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>

            <View style={[styles.flameIconInnerCircle, { backgroundColor: isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)' }]}>
              <Flame size={44} color={isActive ? "#10B981" : "#EF4444"} fill={isActive ? "#10B981" : "none"} />
            </View>
          </View>

          <Text style={[styles.bigDaysNum, { color: isActive ? theme.textPrimary : '#EF4444' }]}>{streakDays}</Text>
          <Text style={[styles.daysActiveLabel, { color: isActive ? '#10B981' : '#EF4444' }]}>
            {isActive ? `${streakDays === 1 ? 'DAY' : 'DAYS'} STREAK ACTIVE` : 'DAYS ACTIVE (0)'}
          </Text>

          {/* Dynamic Status Pill */}
          <View
            style={[
              styles.streakStatusPill,
              {
                backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                borderColor: isActive ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)',
              },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: isActive ? '#10B981' : '#EF4444' }]} />
            <Text style={[styles.streakStatusText, { color: isActive ? '#10B981' : '#EF4444' }]}>
              {isActive ? 'ACTIVE STREAK' : 'INACTIVE'}
            </Text>
          </View>

          {/* Action CTAs */}
          <View style={styles.actionBlock}>
            <GAButton
              title={isClaimedToday ? "Streak Claimed Today! ✓" : "Check In & Claim Streak 🔥"}
              onPress={handleClaimStreak}
              loading={loading}
              variant={isClaimedToday ? "outline" : "primary"}
              disabled={isClaimedToday}
              style={{ width: '100%' }}
            />

            <TouchableOpacity onPress={handleResetStreak} style={styles.resetBtn} activeOpacity={0.8}>
              <RotateCcw size={14} color="#94A3B8" style={{ marginRight: 6 }} />
              <Text style={styles.resetBtnText}>Reset Streak (Set to 0 Days)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Next Milestone Card */}
        <View style={[styles.milestoneCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
          <View style={styles.milestoneHeader}>
            <View>
              <Text style={[styles.milestoneSubLabel, { color: theme.textSecondary }]}>Next Milestone</Text>
              <Text style={[styles.milestoneTitle, { color: theme.textPrimary }]}>{nextMilestone} Day Badge</Text>
            </View>
            <Text style={[styles.daysLeftBadge, { color: isActive ? theme.primary : '#EF4444' }]}>
              {daysLeft > 0 ? `${daysLeft} DAYS LEFT` : 'MILESTONE UNLOCKED!'}
            </Text>
          </View>

          {/* Progress Bar Track */}
          <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]}>
            <LinearGradient
              colors={isActive ? theme.gradientPrimary : ['#EF4444', '#DC2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progressPercent}%` }]}
            />
          </View>

          <View style={styles.progressLabelsRow}>
            <Text style={[styles.progressFootnote, { color: theme.textMuted }]}>{streakDays} DAYS CURRENT</Text>
            <Text style={[styles.progressFootnote, { color: theme.textMuted }]}>DAY {nextMilestone} TARGET</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  streakStatusText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  actionBlock: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 6,
  },
  resetBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
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
