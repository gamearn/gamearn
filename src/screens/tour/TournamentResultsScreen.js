import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Crown } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { tournaments } from '../../services/api';
import { naira, koboToN } from '../../config/appConfig';

export default function TournamentResultsScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { userProfile } = useAuth();
  const myUid = userProfile?.uid;
  const tourId = route.params?.tourId;

  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(!!tourId);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!tourId) {
      setLoading(false);
      return;
    }
    try {
      const data = await tournaments.get(tourId);
      setTour(data);
      setError('');
    } catch (err) {
      setError(err?.message || 'Could not load the results.');
    } finally {
      setLoading(false);
    }
  }, [tourId]);

  useEffect(() => {
    load();
  }, [load]);

  const participants = tour?.participants || [];
  const winner = participants.find((p) => p.uid === tour?.winner);
  const winnerName = winner?.display_name || '—';
  const prizePool = naira(tour?.prizePool || 0);

  const podium = [
    participants.find((p) => p.final_position === 2),
    participants.find((p) => p.final_position === 1),
    participants.find((p) => p.final_position === 3),
  ];
  const podiumRank = [2, 1, 3];
  const podiumBadge = ['#94A3B8', '#F59E0B', '#D97706'];

  const myEntry = participants.find((p) => p.uid === myUid);
  const myRank = myEntry
    ? myEntry.final_position != null
      ? `#${myEntry.final_position}`
      : myEntry.eliminated_at_round != null
      ? `Eliminated R${myEntry.eliminated_at_round}`
      : '#—'
    : '#—';
  const myReward =
    myEntry && myEntry.prize_kobo != null ? naira(koboToN(myEntry.prize_kobo)) : '—';

  const leaderboard = participants
    .filter((p) => p.final_position != null)
    .sort((a, b) => a.final_position - b.final_position);

  if (loading) {
    return (
      <View style={[styles.screenRoot, { backgroundColor: theme.bg }]}>
        <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
        <LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#00E5FF" />
          <Text style={[styles.centerText, { color: theme.textSecondary }]}>Loading results...</Text>
        </View>
      </View>
    );
  }

  if (error !== '' && !tour) {
    return (
      <View style={[styles.screenRoot, { backgroundColor: theme.bg }]}>
        <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
        <LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />
        <View style={styles.topHeader}>
          <TouchableOpacity
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
            style={[styles.backCircleBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}
          >
            <ArrowLeft size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Tournament Results</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerBox}>
          <Text style={[styles.centerText, { color: theme.textSecondary }]}>{error}</Text>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <Text style={styles.retryText}>RETRY</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Tournament Results</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Pill */}
        <View style={styles.statusPillWrap}>
          <View style={styles.completedPill}>
            <View style={styles.greenDot} />
            <Text style={styles.completedText}>COMPLETED</Text>
          </View>
        </View>

        {/* Tournament Title & Prize Pool */}
        <View style={styles.titleSection}>
          <Text style={[styles.tourTitle, { color: theme.textPrimary }]}>{tour?.name || 'Tournament'}</Text>
          <Text style={styles.prizePoolLabel}>TOTAL PRIZE POOL</Text>
          <Text style={styles.prizePoolVal}>{prizePool}</Text>
          <Text style={styles.winnerLine}>CHAMPION: {winnerName}</Text>
        </View>

        {/* Podium Top 3 Winners */}
        <View style={styles.podiumContainer}>
          {podium.map((entry, idx) => {
            const rank = podiumRank[idx];
            const isCenter = rank === 1;
            const name = entry?.display_name || '—';
            const reward = naira(koboToN(entry?.prize_kobo ?? 0));
            return (
              <View key={rank} style={isCenter ? styles.podiumItemCenter : styles.podiumItemSide}>
                {isCenter ? <Crown size={28} color="#F59E0B" fill="#F59E0B" style={{ marginBottom: 4 }} /> : null}
                <View style={isCenter ? styles.centerAvatarWrap : styles.sideAvatarWrap}>
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' }}
                    style={isCenter ? styles.centerPodiumAvatar : styles.podiumAvatar}
                  />
                  <View style={[styles.rankBadgeNum, { backgroundColor: podiumBadge[idx] }]}>
                    <Text style={styles.rankNumText}>{rank}</Text>
                  </View>
                </View>
                <Text style={isCenter ? styles.centerWinnerName : [styles.winnerNameText, { color: theme.textPrimary }]}>{name}</Text>
                <Text style={isCenter ? styles.centerWinnerReward : styles.winnerRewardText}>{reward}</Text>
              </View>
            );
          })}
        </View>

        {/* User Final Rank & Rewards Card */}
        <View style={[styles.performanceCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={styles.perfStatCol}>
            <Text style={styles.perfLabel}>YOUR FINAL RANK</Text>
            <Text style={[styles.perfRankVal, { color: theme.textPrimary }]}>{myRank}</Text>
          </View>

          <View style={styles.perfDivider} />

          <View style={styles.perfStatColRight}>
            <Text style={styles.perfLabel}>EARNED REWARDS</Text>
            <Text style={styles.perfRewardVal}>{myReward}</Text>
          </View>
        </View>

        {/* Leaderboard Table Section */}
        <View style={styles.lbSection}>
          <View style={styles.lbHeaderRow}>
            <Text style={styles.lbSectionTitle}>LEADERBOARD</Text>
            <Text style={styles.lbPointsLabel}>PRIZE</Text>
          </View>

          <View style={styles.lbList}>
            {leaderboard.length === 0 ? (
              <Text style={[styles.centerText, { color: theme.textSecondary, textAlign: 'center', paddingVertical: 12 }]}>
                No final rankings yet.
              </Text>
            ) : (
              leaderboard.map((item) => {
                const isUser = item.uid === myUid;
                const prize = item.prize_kobo != null ? naira(koboToN(item.prize_kobo)) : '—';
                return (
                  <View
                    key={item.uid}
                    style={[
                      styles.lbRowCard,
                      { backgroundColor: isUser ? 'rgba(0, 229, 255, 0.12)' : theme.cardBg, borderColor: isUser ? '#00E5FF' : theme.cardBorderSubtle },
                    ]}
                  >
                    <Text style={[styles.lbRankNum, { color: isUser ? '#00E5FF' : theme.textSecondary }]}>{item.final_position}</Text>
                    <Text style={[styles.lbNameText, { color: isUser ? '#00E5FF' : theme.textPrimary }]}>{item.display_name || 'Player'}</Text>
                    <Text style={[styles.lbPointsVal, { color: isUser ? '#00E5FF' : theme.textPrimary }]}>{prize}</Text>
                  </View>
                );
              })
            )}
          </View>
        </View>
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
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 30,
  },
  centerText: {
    fontSize: 14,
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#00E5FF',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  retryText: {
    color: '#00E5FF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  statusPillWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  completedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  completedText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  tourTitle: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  prizePoolLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  prizePoolVal: {
    color: '#F59E0B',
    fontSize: 26,
    fontWeight: '900',
  },
  winnerLine: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 6,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 28,
  },
  podiumItemSide: {
    alignItems: 'center',
    width: 100,
  },
  podiumItemCenter: {
    alignItems: 'center',
    width: 120,
    marginHorizontal: 10,
  },
  sideAvatarWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  centerAvatarWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  podiumAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#94A3B8',
  },
  centerPodiumAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  rankBadgeNum: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#070C1B',
  },
  rankNumText: {
    color: '#070C1B',
    fontSize: 12,
    fontWeight: '900',
  },
  winnerNameText: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
    textAlign: 'center',
  },
  winnerRewardText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
  },
  centerWinnerName: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 2,
    textAlign: 'center',
  },
  centerWinnerReward: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '900',
  },
  performanceCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
  },
  perfStatCol: {
    flex: 1,
  },
  perfStatColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  perfLabel: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  perfRankVal: {
    fontSize: 32,
    fontWeight: '900',
  },
  perfRewardVal: {
    color: '#F59E0B',
    fontSize: 26,
    fontWeight: '900',
  },
  perfDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
  lbSection: {},
  lbHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  lbSectionTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  lbPointsLabel: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  lbList: {
    gap: 10,
  },
  lbRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  lbRankNum: {
    fontSize: 14,
    fontWeight: '900',
    width: 30,
  },
  lbNameText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  lbPointsVal: {
    fontSize: 15,
    fontWeight: '900',
  },
});