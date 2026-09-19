import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G } from 'react-native-svg';
import { ArrowLeft, Zap, CheckCircle2, Swords, Trophy, Users } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { tournaments } from '../../services/api';
import { ApiError } from '../../services/apiClient';
import { naira, koboToN } from '../../config/appConfig';

const GAME_IMAGES = {
  whot: require('../../../assets/games/whot_3d.jpg'),
  ludo: require('../../../assets/games/ludo_3d.jpg'),
  ayo: require('../../../assets/games/ayo_3d.jpg'),
  draughts: require('../../../assets/games/draughts_3d.jpg'),
};

const STATUS_META = {
  registration_open: { label: 'REGISTRATION OPEN', color: '#00E5FF' },
  scheduled: { label: 'PENDING ENTRY', color: '#F59E0B' },
  pending: { label: 'PENDING ENTRY', color: '#F59E0B' },
  in_progress: { label: 'LIVE NOW', color: '#00E5FF' },
  completed: { label: 'COMPLETED', color: '#10B981' },
  cancelled: { label: 'CANCELLED', color: '#EF4444' },
};

function useCountdown(targetIso) {
  const calc = () => {
    if (!targetIso) return 0;
    const diff = new Date(targetIso).getTime() - Date.now();
    return diff > 0 ? Math.floor(diff / 1000) : 0;
  };
  const [seconds, setSeconds] = useState(calc);
  useEffect(() => {
    const timer = setInterval(() => setSeconds(calc()), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetIso]);
  return seconds;
}

export default function TournamentDetailsScreen({ route, navigation }) {
  const { userProfile, refreshWallet } = useAuth();
  const tourId = route.params?.tourId;
  const fallbackTitle = route.params?.title || 'Dráfù Grandmaster Championship';

  const [tour, setTour] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const myUid = userProfile?.uid;
  const stillLoading = !tour;

  const deadline =
    tour?.registrationClosesAt ||
    (tour?.status === 'scheduled' || tour?.status === 'pending' ? tour?.scheduledStart : null);
  const countdown = useCountdown(deadline);

  const load = useCallback(async () => {
    if (!tourId) {
      setLoading(false);
      setError('This tournament is awaiting approval. It will appear in the lobby once it opens.');
      return;
    }
    try {
      const data = await tournaments.get(tourId);
      setTour(data);
      setError('');
    } catch (err) {
      const msg = err instanceof ApiError && (err.code === 'NOT_FOUND' || err.code === 'API_ERROR')
        ? 'This tournament is awaiting approval. It will appear in the lobby once it opens.'
        : err.message || 'Could not load the tournament.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [tourId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || stillLoading && tour === null) {
    return (
      <View style={styles.screenRoot}>
        <StatusBar barStyle="light-content" backgroundColor="#070C1B" />
        <LinearGradient colors={['#091026', '#060919', '#040612']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#00E5FF" />
          <Text style={styles.centerText}>Loading tournament…</Text>
        </View>
      </View>
    );
  }

  if (error !== '') {
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
          <Text style={styles.headerTitle}>Tournament</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerBox}>
          <Text style={[styles.centerText, { color: '#CBD5E1' }]}>{error}</Text>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <Text style={styles.retryText}>REFRESH</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const status = tour.status;
  const meta = STATUS_META[status] || { label: 'PENDING ENTRY', color: '#F59E0B' };
  const entryFee = tour.entryFee || 0;
  const requiredKobo = Math.round(entryFee * 100);
  const balanceKobo = userProfile?.coins ?? 0;
  const joined = (tour.participants || []).some((p) => p.uid === myUid);
  const fill = Math.min(1, (tour.currentParticipants || 0) / (tour.maxParticipants || 1));
  const banner = GAME_IMAGES[tour.gameType] || GAME_IMAGES.draughts;

  const hours = Math.floor(countdown / 3600);
  const minutes = Math.floor((countdown % 3600) / 60);
  const seconds = countdown % 60;

  const size = 200;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - circumference * fill;

  const handleJoinTournament = async () => {
    if (!tourId) {
      Alert.alert('Tournament pending', 'This tournament is awaiting approval from Gamearn.');
      return;
    }
    if (joining) return;

    if (entryFee > 0 && balanceKobo < requiredKobo) {
      Alert.alert(
        'Insufficient Balance',
        `Entry costs ${naira(entryFee)} but your balance is ${naira(koboToN(balanceKobo))}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy Coins', onPress: () => navigation.navigate('BuyCoins') },
        ],
      );
      return;
    }

    setJoining(true);
    try {
      const res = await tournaments.register(tourId);
      await refreshWallet();
      setJoining(false);
      if (status === 'in_progress') {
        navigation.replace('LiveTournament', { tourId, title: tour.name });
        return;
      }
      Alert.alert('Registration Confirmed 🏆', `You're in "${tour.name}". The entry fee of ${naira(entryFee)} was paid from your wallet.`, [
        {
          text: 'View Pending',
          onPress: () =>
            navigation.navigate('TournamentPending', {
              tourId,
              title: tour.name,
              entryFee: naira(entryFee),
              startAt: tour.scheduledStart,
            }),
        },
        { text: 'OK' },
      ]);
    } catch (err) {
      setJoining(false);
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Could not complete registration. Please try again.';
      Alert.alert('Registration failed', msg);
    }
  };

  const actionLabel = (() => {
    if (status === 'cancelled') return 'Tournament Cancelled';
    if (status === 'completed') return 'View Results';
    if (status === 'in_progress') return 'View Live Bracket';
    if (joined) return `Registered · Check-ins open soon`;
    return entryFee > 0 ? `Join Tournament (${naira(entryFee)})` : 'Join Free Tournament';
  })();

  const onActionPress = () => {
    if (status === 'completed') {
      navigation.navigate('TournamentResults', { tourId, title: tour.name });
      return;
    }
    if (status === 'in_progress') {
      navigation.navigate('LiveTournament', { tourId, title: tour.name });
      return;
    }
    handleJoinTournament();
  };

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
        <Text style={styles.headerTitle}>Tournament Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Image source={banner} style={styles.bannerImage} resizeMode="cover" />
          <View style={styles.heroBody}>
            <View style={styles.badgeRow}>
              <View style={[styles.statusPill, { borderColor: meta.color }]}>
                <Text style={[styles.statusPillText, { color: meta.color }]}>{meta.label}</Text>
              </View>
              <View style={styles.officialBadge}>
                <CheckCircle2 size={12} color="#00E5FF" />
                <Text style={styles.officialText}>Official</Text>
              </View>
            </View>

            <Text style={styles.tournamentTitle}>{tour.name}</Text>
            <Text style={styles.tournamentSub}>
              {tour.gameType ? `${(tour.gameType || 'game').toUpperCase()} · WIN-BASED TOURNAMENT` : ''}
            </Text>
          </View>
        </View>

        {deadline && tour.status !== 'in_progress' && tour.status !== 'completed' && tour.status !== 'cancelled' ? (
          <View style={styles.timerGrid}>
            <View style={styles.timerBox}>
              <Text style={styles.timerNum}>{String(hours).padStart(2, '0')}</Text>
              <Text style={styles.timerLabel}>HOURS</Text>
            </View>
            <View style={styles.timerBox}>
              <Text style={styles.timerNum}>{String(minutes).padStart(2, '0')}</Text>
              <Text style={styles.timerLabel}>MINUTES</Text>
            </View>
            <View style={styles.timerBox}>
              <Text style={styles.timerNum}>{String(seconds).padStart(2, '0')}</Text>
              <Text style={styles.timerLabel}>SECONDS</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.activationCard}>
          <View style={styles.activationHeader}>
            <View style={styles.inlineRow}>
              <Zap size={18} color="#00E5FF" style={{ marginRight: 6 }} />
              <Text style={styles.activationTitle}>Participation</Text>
            </View>
            <Text style={styles.activationValue}>
              {tour.currentParticipants} / {tour.maxParticipants} Players
            </Text>
          </View>

          <View style={styles.activationTrack}>
            <LinearGradient
              colors={['#00E5FF', '#0284C7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.activationFill, { width: `${Math.round(fill * 100)}%` }]}
            />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>ENTRY FEE</Text>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                {entryFee > 0 ? naira(entryFee) : 'FREE'}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>PRIZE POOL</Text>
              <Text style={[styles.statValue, { color: '#00E5FF' }]}>{naira(tour.prizePool || 0)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>MATCHES</Text>
              <Text style={[styles.statValue, { color: '#10B981' }]}>{(tour.bracket || []).length}</Text>
            </View>
          </View>

          <Text style={styles.activationFootnote}>
            Tournament auto-starts once players are ready. You'll be notified before each round.
          </Text>
        </View>

        <View style={styles.circleChartContainer}>
          <Svg width={size} height={size}>
            <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#00E5FF"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </G>
          </Svg>

          <View style={styles.circleCenterTextWrap}>
            <Text style={styles.circleBigNum}>{tour.currentParticipants}</Text>
            <Text style={styles.circleSubLabel}>PLAYERS JOINED</Text>
            <Text style={styles.circleFilledTag}>{Math.round(fill * 100)}% FILLED</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onActionPress}
          disabled={status === 'cancelled'}
          style={[styles.primaryOrangeBtn, (status === 'cancelled' || joining) && { backgroundColor: '#64748B' }]}
        >
          {joining ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Swords size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryOrangeBtnText}>{actionLabel}</Text>
            </>
          )}
        </TouchableOpacity>
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
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  bannerImage: {
    width: '100%',
    height: 160,
  },
  heroBody: {
    padding: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  officialText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '800',
  },
  tournamentTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
  },
  tournamentSub: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timerGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  timerBox: {
    flex: 1,
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerNum: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  timerLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
  },
  activationCard: {
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 28,
  },
  activationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activationTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  activationValue: {
    color: '#00E5FF',
    fontSize: 14,
    fontWeight: '800',
  },
  activationTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  activationFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  activationFootnote: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
  },
  circleChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  circleCenterTextWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBigNum: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 46,
  },
  circleSubLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  circleFilledTag: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 4,
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
  },
  primaryOrangeBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
});