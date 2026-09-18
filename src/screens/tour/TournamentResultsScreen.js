import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Crown, Trophy, Award } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export default function TournamentResultsScreen({ navigation }) {
  const { theme, isDark } = useTheme();

  const LEADERBOARD = [
    { rank: '42', name: 'YOU (JIDEPAY)', points: '2,840', isUser: true },
    { rank: '43', name: 'AYO_TECH', points: '2,815', isUser: false },
    { rank: '44', name: 'CYBER_SAMURAI', points: '2,790', isUser: false },
    { rank: '45', name: 'SHADOW_NINJA', points: '2,750', isUser: false },
  ];

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
          <Text style={[styles.tourTitle, { color: theme.textPrimary }]}>Dráfù Grandmaster Championship</Text>
          <Text style={styles.prizePoolLabel}>TOTAL PRIZE POOL</Text>
          <Text style={styles.prizePoolVal}>₦2,500,000.00</Text>
        </View>

        {/* Podium Top 3 Winners */}
        <View style={styles.podiumContainer}>
          {/* Rank 2 (Left) */}
          <View style={styles.podiumItemSide}>
            <View style={styles.sideAvatarWrap}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' }}
                style={styles.podiumAvatar}
              />
              <View style={[styles.rankBadgeNum, { backgroundColor: '#94A3B8' }]}>
                <Text style={styles.rankNumText}>2</Text>
              </View>
            </View>
            <Text style={[styles.winnerNameText, { color: theme.textPrimary }]}>OLUWASEUN</Text>
            <Text style={styles.winnerRewardText}>₦350,000</Text>
          </View>

          {/* Rank 1 (Center Elevated with Crown) */}
          <View style={styles.podiumItemCenter}>
            <Crown size={28} color="#F59E0B" fill="#F59E0B" style={{ marginBottom: 4 }} />
            <View style={styles.centerAvatarWrap}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' }}
                style={styles.centerPodiumAvatar}
              />
              <View style={[styles.rankBadgeNum, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.rankNumText}>1</Text>
              </View>
            </View>
            <Text style={styles.centerWinnerName}>KING_BURNA</Text>
            <Text style={styles.centerWinnerReward}>₦750,000</Text>
          </View>

          {/* Rank 3 (Right) */}
          <View style={styles.podiumItemSide}>
            <View style={styles.sideAvatarWrap}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' }}
                style={styles.podiumAvatar}
              />
              <View style={[styles.rankBadgeNum, { backgroundColor: '#D97706' }]}>
                <Text style={styles.rankNumText}>3</Text>
              </View>
            </View>
            <Text style={[styles.winnerNameText, { color: theme.textPrimary }]}>CHIDEX</Text>
            <Text style={styles.winnerRewardText}>₦150,000</Text>
          </View>
        </View>

        {/* User Final Rank & Rewards Card */}
        <View style={[styles.performanceCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={styles.perfStatCol}>
            <Text style={styles.perfLabel}>YOUR FINAL RANK</Text>
            <Text style={[styles.perfRankVal, { color: theme.textPrimary }]}>#42</Text>
          </View>

          <View style={styles.perfDivider} />

          <View style={styles.perfStatColRight}>
            <Text style={styles.perfLabel}>EARNED REWARDS</Text>
            <Text style={styles.perfRewardVal}>₦4,500.00</Text>
          </View>
        </View>

        {/* Leaderboard Table Section */}
        <View style={styles.lbSection}>
          <View style={styles.lbHeaderRow}>
            <Text style={styles.lbSectionTitle}>LEADERBOARD</Text>
            <Text style={styles.lbPointsLabel}>POINTS</Text>
          </View>

          <View style={styles.lbList}>
            {LEADERBOARD.map((item) => (
              <View
                key={item.rank}
                style={[
                  styles.lbRowCard,
                  { backgroundColor: item.isUser ? 'rgba(0, 229, 255, 0.12)' : theme.cardBg, borderColor: item.isUser ? '#00E5FF' : theme.cardBorderSubtle },
                ]}
              >
                <Text style={[styles.lbRankNum, { color: item.isUser ? '#00E5FF' : theme.textSecondary }]}>{item.rank}</Text>
                <View style={styles.lbAvatarCircle}>
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' }}
                    style={styles.lbAvatarImg}
                  />
                </View>
                <Text style={[styles.lbNameText, { color: item.isUser ? '#00E5FF' : theme.textPrimary }]}>{item.name}</Text>
                <Text style={[styles.lbPointsVal, { color: item.isUser ? '#00E5FF' : theme.textPrimary }]}>{item.points}</Text>
              </View>
            ))}
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
  lbAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    marginRight: 12,
  },
  lbAvatarImg: {
    width: '100%',
    height: '100%',
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
