import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Wallet,
  Flame,
  Users,
  Trophy,
  Play,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

const GAME_DATA = {
  ludo: {
    id: 'ludo',
    headerTitle: 'Lúùdò GAME',
    heroTitle: 'Lúùdò Game',
    heroSub: 'Dice Masters Arena',
    image: require('../../../assets/games/ludo_3d.jpg'),
    walletBal: '₦2,500.00',
    units: '+250/units',
    streak: '5 Days',
    rewardSub: 'Next reward in 5 days',
    targetScreen: 'LudoSetup',
    leaderboardTitle: 'Lúùdò Game Leaderboard',
  },
  ayo: {
    id: 'ayo',
    headerTitle: 'Ayò Ọ̀pọ́n GAME',
    heroTitle: 'Ayò Ọ̀pọ́n',
    heroSub: 'Master the seeds, conquer the board.',
    image: require('../../../assets/games/ayo_3d.jpg'),
    walletBal: '₦3,500.00',
    units: '+350/units',
    streak: '10 Days',
    rewardSub: 'Next reward in 5 days',
    targetScreen: 'GameSetup',
    rank: '1,525',
    leaderboardTitle: 'Ayò Ọ̀pọ́n Game Leaderboard',
  },
  whot: {
    id: 'whot',
    headerTitle: 'Wọ́t GAME',
    heroTitle: 'Wọ́t Game',
    heroSub: 'Play the Cards, Win the Prize',
    image: require('../../../assets/games/whot_3d.jpg'),
    walletBal: '₦4,500.00',
    units: '+600/units',
    streak: '12 Days',
    rewardSub: 'Next reward in 7 days',
    targetScreen: 'WhotSetup',
    leaderboardTitle: 'Wọ́t Game Leaderboard',
  },
  draft: {
    id: 'draft',
    headerTitle: 'Dráfù GAME',
    heroTitle: 'Dráfù Game',
    heroSub: 'Brings out your strategic and intellectual thinking',
    image: require('../../../assets/games/draughts_3d.jpg'),
    walletBal: '₦1,500.00',
    units: '+75/units',
    streak: '5 Days',
    rewardSub: 'Next reward in 7 days',
    targetScreen: 'GameSetup',
    rank: '2,625',
    leaderboardTitle: 'Dráfù Game Leaderboard',
  },
};

const LEADERBOARD_SAMPLES = [
  { rank: '01', name: 'VOX_CRIMSON', wins: 88, xp: '5,920 XP', emoji: '🥷', bg: '#3B82F6' },
  { rank: '02', name: 'ShadowReaper', wins: 74, xp: '5,450 XP', emoji: '👨🏻‍🎤', bg: '#EAB308' },
  { rank: '03', name: 'Luna_Cyber', wins: 62, xp: '4,910 XP', emoji: '👩🏽‍💻', bg: '#A855F7' },
  { rank: '04', name: 'GhostProtocol', wins: 51, xp: '4,280 XP', emoji: '👨🏼‍💻', bg: '#64748B' },
];

export default function GameSectionScreen({ route, navigation }) {
  const { userProfile } = useAuth();
  const gameKey = route.params?.gameId || 'ludo';
  const game = GAME_DATA[gameKey] || GAME_DATA.ludo;

  const [period, setPeriod] = useState('Daily');

  const handlePlayNow = () => {
    if (game.targetScreen === 'GameSetup') {
      navigation.navigate('GameSetup', {
        gameName: game.heroTitle,
        targetScreen: game.id === 'draft' ? 'DraughtsGame' : 'AyoGame',
        rank: game.rank || '2,625',
        entryFee: '$70.00',
      });
    } else {
      navigation.navigate(game.targetScreen, { stake: 250 });
    }
  };

  return (
    <View style={styles.screenRoot}>
      <StatusBar barStyle="light-content" backgroundColor="#070C1B" />
      <LinearGradient colors={['#091026', '#060919', '#040612']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
          style={styles.backCircleBtn}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{game.headerTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Featured Banner */}
        <View style={styles.heroCard}>
          <Image source={game.image} style={styles.heroBannerBg} resizeMode="cover" />
          <LinearGradient
            colors={['#070C1B00', '#070C1B88', '#070C1BE6']}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.heroBody}>
            <Text style={styles.featuredLabel}>FEATURED CLASSIC</Text>
            <Text style={styles.heroTitle}>{game.heroTitle}</Text>
            <Text style={styles.heroSub}>{game.heroSub}</Text>
          </View>
        </View>

        {/* Stats Row Cards */}
        <View style={styles.statsRow}>
          {/* Card 1: Wallet Balance */}
          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <Wallet size={15} color="#00E5FF" />
              <Text style={styles.statCardLabel}>Wallet Balance</Text>
            </View>
            <Text style={styles.statAmountText}>{game.walletBal}</Text>
            <Text style={styles.statCyanUnits}>{game.units}</Text>
          </View>

          {/* Card 2: Daily Streak */}
          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <Flame size={15} color="#FF5500" />
              <Text style={styles.statCardLabel}>Daily Streak</Text>
            </View>
            <Text style={styles.statAmountText}>{game.streak}</Text>
            <Text style={styles.statCyanUnits}>{game.rewardSub}</Text>
          </View>
        </View>

        {/* Section: All Tournaments */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>All Tournaments</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tourList}>
            {/* Tour Card 1 */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('LiveTournament')}
              style={styles.tourCard}
            >
              <Image
                source={require('../../../assets/games/ayo_3d.jpg')}
                style={styles.tourCardBg}
                resizeMode="cover"
              />
              <LinearGradient colors={['#070C1B22', '#070C1BDD']} style={StyleSheet.absoluteFillObject} />

              <View style={styles.tourCardBody}>
                <View style={styles.tourBadgesRow}>
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>Live Now</Text>
                  </View>
                  <View style={styles.playersBadge}>
                    <Users size={12} color="#FFF" />
                    <Text style={styles.playersBadgeText}>1,240 Players</Text>
                  </View>
                </View>

                <Text style={styles.tourCardTitle}>Ayò Ọ̀pọ́n Grandmaster Tournament</Text>
                <Text style={styles.tourCardSub}>Win Tournament</Text>

                <View style={styles.prizeRow}>
                  <Text style={styles.prizeLabel}>Prize Pool</Text>
                  <Text style={styles.prizeVal}>$5,000.00</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Tour Card 2 */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('TournamentDetails')}
              style={styles.tourCard}
            >
              <Image
                source={require('../../../assets/games/ludo_3d.jpg')}
                style={styles.tourCardBg}
                resizeMode="cover"
              />
              <LinearGradient colors={['#070C1B22', '#070C1BDD']} style={StyleSheet.absoluteFillObject} />

              <View style={styles.tourCardBody}>
                <View style={styles.tourBadgesRow}>
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>Live Now</Text>
                  </View>
                </View>

                <Text style={styles.tourCardTitle}>Lúùdò Masters Cup 2026</Text>
                <Text style={styles.tourCardSub}>Win Tournament</Text>

                <View style={styles.prizeRow}>
                  <Text style={styles.prizeLabel}>Entry Fee</Text>
                  <Text style={styles.prizeVal}>$10.00</Text>
                </View>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Play Now CTA Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlePlayNow}
          style={styles.primaryOrangeBtn}
        >
          <Play size={20} color="#FFFFFF" fill="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.primaryOrangeBtnText}>Play Now</Text>
        </TouchableOpacity>

        {/* Game Leaderboard Section */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>{game.leaderboardTitle}</Text>

          {/* Filter Tabs */}
          <View style={styles.filterTabBar}>
            {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                style={[styles.filterTabItem, period === p && styles.filterTabActive]}
              >
                <Text style={[styles.filterTabText, period === p && styles.filterTabTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Leaderboard Ranks */}
          <View style={styles.leaderboardCard}>
            {LEADERBOARD_SAMPLES.map((player) => (
              <View key={player.rank} style={styles.leaderRow}>
                <Text style={styles.rankNum}>{player.rank}</Text>
                <View style={[styles.avatarBox, { backgroundColor: player.bg }]}>
                  <Text style={{ fontSize: 18 }}>{player.emoji}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Text style={styles.playerWins}>{player.wins} Wins</Text>
                </View>
                <Text style={styles.playerXp}>{player.xp}</Text>
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
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    marginBottom: 20,
    height: 210,
    justifyContent: 'flex-end',
  },
  heroBannerBg: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroBody: {
    padding: 20,
  },
  featuredLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroTitle: {
    color: '#FF5500',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
    marginBottom: 4,
  },
  heroSub: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 25, 45, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    padding: 16,
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statCardLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  statAmountText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  statCyanUnits: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionWrap: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 14,
  },
  tourList: {
    gap: 14,
  },
  tourCard: {
    width: 260,
    height: 160,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'flex-end',
  },
  tourCardBg: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  tourCardBody: {
    padding: 14,
  },
  tourBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  liveBadge: {
    backgroundColor: '#00FF66',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  liveBadgeText: {
    color: '#070C1B',
    fontSize: 10,
    fontWeight: '900',
  },
  playersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 45, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  playersBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  tourCardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  tourCardSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 8,
  },
  prizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  prizeLabel: {
    color: '#94A3B8',
    fontSize: 10,
  },
  prizeVal: {
    color: '#00E5FF',
    fontSize: 16,
    fontWeight: '900',
  },
  primaryOrangeBtn: {
    flexDirection: 'row',
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
    marginBottom: 28,
  },
  primaryOrangeBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  filterTabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 25, 45, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
  },
  filterTabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  filterTabActive: {
    backgroundColor: '#00E5FF',
  },
  filterTabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  filterTabTextActive: {
    color: '#070C1B',
    fontWeight: '900',
  },
  leaderboardCard: {
    backgroundColor: 'rgba(15, 25, 45, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    padding: 16,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  rankNum: {
    color: '#00E5FF',
    fontSize: 16,
    fontWeight: '900',
    width: 30,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  playerWins: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  playerXp: {
    color: '#00E5FF',
    fontSize: 14,
    fontWeight: '900',
  },
});
