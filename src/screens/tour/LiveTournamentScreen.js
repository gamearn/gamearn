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
import { ArrowLeft, Users, DollarSign, Trophy } from 'lucide-react-native';
import { tournaments } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { naira } from '../../config/appConfig';

export default function LiveTournamentScreen({ navigation, route }) {
  const tourId = route.params?.tourId;
  const fallbackTitle = route.params?.title || 'Dráfù Grandmaster Championship';
  const { userProfile } = useAuth();
  const myUid = userProfile?.uid;

  const [tour, setTour] = useState(null);
  const [standings, setStandings] = useState(null);
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
      standingsLoad();
      setError('');
    } catch (err) {
      setError(err?.message || 'Could not load the tournament.');
    } finally {
      setLoading(false);
    }
  }, [tourId]);

  const standingsLoad = useCallback(async () => {
    if (!tourId) return;
    try {
      const res = await tournaments.standings(tourId);
      setStandings(res?.data || res || null);
    } catch (err) {
      console.log('Error loading standings:', err?.message || err);
    }
  }, [tourId]);

  useEffect(() => {
    load();
  }, [load]);

  const target = tour?.scheduledStart || null;
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!target) return;
    const tick = () => {
      const diff = Math.floor((new Date(target).getTime() - Date.now()) / 1000);
      setSecondsLeft(diff > 0 ? diff : 0);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [target]);

  const days = Math.floor(secondsLeft / 86400);
  const hours = Math.floor((secondsLeft % 86400) / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const title = tour?.name || fallbackTitle;
  const activePlayers = tour?.currentParticipants ?? 0;
  const totalPool = naira(tour?.prizePool || 0);
  const countdownLabel = tour?.status === 'in_progress' ? 'ENDS IN' : 'STARTS IN';

  const bracketByRound = {};
  (tour?.bracket || []).forEach((match) => {
    const round = match.round != null ? match.round : 0;
    if (!bracketByRound[round]) bracketByRound[round] = [];
    bracketByRound[round].push(match);
  });
  const rounds = Object.keys(bracketByRound)
    .map(Number)
    .sort((a, b) => a - b);

  if (loading) {
    return (
      <View style={styles.screenRoot}>
        <StatusBar barStyle="light-content" backgroundColor="#070C1B" />
        <LinearGradient colors={['#091026', '#060919', '#040612']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#00E5FF" />
          <Text style={styles.centerText}>Loading tournament...</Text>
        </View>
      </View>
    );
  }

  if (error !== '' && !tour) {
    return (
      <View style={styles.screenRoot}>
        <StatusBar barStyle="light-content" backgroundColor="#070C1B" />
        <LinearGradient colors={['#091026', '#060919', '#040612']} style={StyleSheet.absoluteFillObject} />
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
        <View style={styles.centerBox}>
          <Text style={[styles.centerText, { color: '#CBD5E1' }]}>{error}</Text>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <Text style={styles.retryText}>RETRY</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
              <Text style={styles.endsInLabel}>{countdownLabel}</Text>

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

        {/* Match Bracket Section */}
        <View style={styles.leaderboardCard}>
          <View style={styles.lbHeaderRow}>
            <Text style={styles.lbTitle}>MATCH BRACKET</Text>
          </View>

          {rounds.length === 0 ? (
            <Text style={styles.emptyText}>Bracket will be generated when the tournament starts.</Text>
          ) : (
            rounds.map((round) => (
              <View key={round} style={styles.roundBlock}>
                <Text style={styles.roundLabel}>ROUND {round}</Text>
                {bracketByRound[round].map((match, idx) => (
                  <View key={`${round}-${match.match_number}-${idx}`} style={styles.matchCard}>
                    <Text style={styles.matchPlayers}>
                      {match.player1_name || 'TBD'}  VS  {match.player2_name || 'TBD'}
                    </Text>
                    {match.winner_name ? (
                      <Text style={styles.winnerLine}>WINNER: {match.winner_name}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ))
          )}
        </View>

        {/* Standings Section — ranked by wins then plays */}
        <View style={[styles.leaderboardCard, styles.playersSection]}>
          <View style={styles.lbHeaderRow}>
            <Text style={styles.lbTitle}>LIVE STANDINGS</Text>
            {standings?.poolKobo != null && (
              <Text style={styles.standingsPool}>POOL {naira(standings.poolKobo)}</Text>
            )}
          </View>

          {!standings?.ranked?.length ? (
            <Text style={styles.emptyText}>Standings update as games are played.</Text>
          ) : (
            <>
              <View style={styles.standingsHeadRow}>
                <Text style={[styles.standingsHeadText, styles.posHead]}>POS</Text>
                <Text style={[styles.standingsHeadText, { flex: 1 }]}>PLAYER</Text>
                <Text style={[styles.standingsHeadText, styles.winsHead]}>WINS</Text>
                <Text style={[styles.standingsHeadText, styles.playsHead]}>PLAYS</Text>
              </View>
              {standings.ranked.map((row, idx) => {
                const isMe = String(row.uid || row.user_id || row.id) === String(myUid);
                return (
                  <View
                    key={row.uid || row.user_id || row.id || idx}
                    style={[styles.standingsRow, isMe && styles.myStandingsRow]}
                  >
                    <Text style={[styles.posCell, isMe && { color: '#00E5FF' }]}>{idx + 1}.</Text>
                    <Text
                      style={[
                        styles.standingsName,
                        { color: isMe ? '#00E5FF' : '#E2E8F0' },
                        { fontWeight: isMe ? '900' : '600' },
                      ]}
                      numberOfLines={1}
                    >
                      {row.display_name || 'Player'}
                      {row.is_bot ? '  (Oba)' : ''}
                      {isMe ? '  You' : ''}
                    </Text>
                    <Text style={styles.winsCell}>{row.wins || 0}</Text>
                    <Text style={styles.playsCell}>{row.plays || 0}</Text>
                  </View>
                );
              })}
            </>
          )}
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
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 30,
  },
  centerText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
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
  leaderboardCard: {
    backgroundColor: 'rgba(15, 25, 45, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 20,
  },
  playersSection: {
    marginTop: 20,
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
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  roundBlock: {
    marginBottom: 16,
  },
  roundLabel: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  matchCard: {
    backgroundColor: 'rgba(7, 12, 27, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  matchPlayers: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  winnerLine: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  participantRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  participantName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  standingsPool: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  standingsHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 4,
  },
  standingsHeadText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  posHead: {
    width: 34,
  },
  winsHead: {
    width: 48,
  },
  playsHead: {
    width: 52,
  },
  standingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  myStandingsRow: {
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderBottomColor: 'rgba(0, 229, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  posCell: {
    width: 34,
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
  },
  standingsName: {
    flex: 1,
    fontSize: 14,
  },
  winsCell: {
    width: 48,
    color: '#10B981',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  playsCell: {
    width: 52,
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});