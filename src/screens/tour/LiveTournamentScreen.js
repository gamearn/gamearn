import React, { useState, useEffect } from 'react';
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
  Users,
  DollarSign,
  Trophy,
  Flame,
  Award,
  Zap,
} from 'lucide-react-native';

const INITIAL_LEADERBOARD = [
  {
    rank: '01',
    name: 'VOX_CRIMSON',
    league: 'MASTER LEAGUE',
    pts: '5,920',
    lastChange: '+120 LAST MATCH',
    avatarEmoji: '🥷',
    avatarBg: '#3B82F6',
  },
  {
    rank: '02',
    name: 'ShadowReaper',
    league: 'DIAMOND TIER',
    pts: '5,450',
    lastChange: '+95 LAST MATCH',
    avatarEmoji: '👨🏻‍🎤',
    avatarBg: '#EAB308',
  },
  {
    rank: '03',
    name: 'Luna_Cyber',
    league: 'MASTER TIER',
    pts: '4,910',
    lastChange: '+110 LAST MATCH',
    avatarEmoji: '👩🏽‍💻',
    avatarBg: '#A855F7',
  },
  {
    rank: '04',
    name: 'GhostProtocol',
    league: 'PLATINUM I',
    pts: '4,280',
    lastChange: '+60 LAST MATCH',
    avatarEmoji: '👨🏼‍💻',
    avatarBg: '#64748B',
  },
  {
    rank: '05',
    name: 'StormWalker',
    league: 'GOLD III',
    pts: '3,890',
    lastChange: '+45 LAST MATCH',
    avatarEmoji: '👨🏽‍🚀',
    avatarBg: '#10B981',
  },
];

export default function LiveTournamentScreen({ navigation, route }) {
  const title = route.params?.title || 'Dráfù Grandmaster Championship';
  const totalPool = route.params?.totalPool || '$25,000';
  const activePlayers = route.params?.activePlayers || '1,248';

  const [secondsLeft, setSecondsLeft] = useState(
    5 * 86400 + 12 * 3600 + 48 * 60 + 12
  );
  const [leaderboard, setLeaderboard] = useState(INITIAL_LEADERBOARD);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const days = Math.floor(secondsLeft / 86400);
  const hours = Math.floor((secondsLeft % 86400) / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  return (
    <View style={styles.screenRoot}>
      <StatusBar barStyle="light-content" backgroundColor="#070C1B" />
      <LinearGradient colors={['#091026', '#060919', '#040612']} style={StyleSheet.absoluteFillObject} />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
          style={styles.backCircleBtn}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Tournament</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Hero Banner Card */}
        <View style={styles.heroCard}>
          <Image
            source={require('../../../assets/games/draughts_3d.jpg')}
            style={styles.heroBannerBg}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['#070C1B00', '#070C1BDD', '#070C1B']}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.heroBody}>
            {/* Title */}
            <View style={styles.titleUnderlineBox}>
              <View style={styles.cyanAccentLine} />
              <Text style={styles.heroTitle}>{title}</Text>
            </View>

            {/* Stats Meta */}
            <View style={styles.metaRow}>
              <View style={styles.metaBadge}>
                <Users size={14} color="#00E5FF" />
                <Text style={styles.metaText}>{activePlayers} Active</Text>
              </View>

              <View style={styles.metaBadge}>
                <DollarSign size={14} color="#00E5FF" />
                <Text style={styles.metaText}>{totalPool} Total Pool</Text>
              </View>
            </View>

            {/* Countdown Box */}
            <View style={styles.countdownContainer}>
              <Text style={styles.endsInLabel}>ENDS IN</Text>

              <View style={styles.timerRow}>
                <View style={styles.unitBox}>
                  <Text style={styles.unitNum}>{String(days).padStart(2, '0')}</Text>
                  <Text style={styles.unitLabel}>Days</Text>
                </View>
                <Text style={styles.colonText}>:</Text>

                <View style={styles.unitBox}>
                  <Text style={styles.unitNum}>{String(hours).padStart(2, '0')}</Text>
                  <Text style={styles.unitLabel}>HRS</Text>
                </View>
                <Text style={styles.colonText}>:</Text>

                <View style={styles.unitBox}>
                  <Text style={styles.unitNum}>{String(minutes).padStart(2, '0')}</Text>
                  <Text style={styles.unitLabel}>MIN</Text>
                </View>
                <Text style={styles.colonText}>:</Text>

                <View style={styles.unitBox}>
                  <Text style={styles.unitNum}>{String(seconds).padStart(2, '0')}</Text>
                  <Text style={styles.unitLabel}>SEC</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Performance Card */}
        <View style={styles.performanceCard}>
          <Text style={styles.performanceTag}>YOUR PERFORMANCE</Text>

          <View style={styles.performanceMainRow}>
            <View>
              <Text style={styles.rankBigText}>#42</Text>
              <Text style={styles.rankSubLabel}>GLOBAL RANK</Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.ptsBigText}>2,850</Text>
              <Text style={styles.rankSubLabel}>TOTAL PTS</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '85%' }]} />
          </View>

          <Text style={styles.progressFootnote}>
            Top 5% of all participants. Next rank in 150 pts.
          </Text>
        </View>

        {/* Live Leaderboard Section */}
        <View style={styles.leaderboardCard}>
          <View style={styles.lbHeaderRow}>
            <Text style={styles.lbTitle}>LIVE LEADERBOARD</Text>
            <View style={styles.realtimeTag}>
              <Text style={styles.realtimeText}>UPDATING REAL-TIME</Text>
            </View>
          </View>

          {leaderboard.map((item) => (
            <View key={item.rank} style={styles.lbRankRow}>
              <Text style={styles.rankNum}>{item.rank}</Text>

              <View style={[styles.avatarBox, { backgroundColor: item.avatarBg }]}>
                <Text style={{ fontSize: 18 }}>{item.avatarEmoji}</Text>
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.playerName}>{item.name}</Text>
                <Text style={styles.playerLeague}>{item.league}</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.playerPts}>{item.pts}</Text>
                <Text style={styles.lastChangeText}>{item.lastChange}</Text>
              </View>
            </View>
          ))}
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
    borderColor: 'rgba(0, 229, 255, 0.25)',
    marginBottom: 20,
    minHeight: 280,
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
  titleUnderlineBox: {
    marginBottom: 12,
  },
  cyanAccentLine: {
    width: 80,
    height: 3,
    backgroundColor: '#00E5FF',
    borderRadius: 2,
    marginBottom: 8,
    shadowColor: '#00E5FF',
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  countdownContainer: {
    backgroundColor: 'rgba(7, 12, 27, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    alignItems: 'center',
  },
  endsInLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unitBox: {
    alignItems: 'center',
    minWidth: 42,
  },
  unitNum: {
    color: '#00E5FF',
    fontSize: 26,
    fontWeight: '900',
  },
  unitLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  colonText: {
    color: '#00E5FF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: -10,
  },
  performanceCard: {
    backgroundColor: 'rgba(15, 25, 45, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  performanceTag: {
    color: '#00FF66',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  performanceMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  rankBigText: {
    color: '#00E5FF',
    fontSize: 44,
    fontWeight: '900',
    lineHeight: 46,
  },
  ptsBigText: {
    color: '#00E5FF',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 36,
  },
  rankSubLabel: {
    color: '#FFB800',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  progressFootnote: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '600',
  },
  leaderboardCard: {
    backgroundColor: 'rgba(15, 25, 45, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 20,
  },
  lbHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  lbTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  realtimeTag: {
    backgroundColor: 'rgba(0, 255, 102, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  realtimeText: {
    color: '#00FF66',
    fontSize: 10,
    fontWeight: '800',
  },
  lbRankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  rankNum: {
    color: '#00E5FF',
    fontSize: 18,
    fontWeight: '900',
    width: 32,
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  playerLeague: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  playerPts: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  lastChangeText: {
    color: '#00FF66',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
});
