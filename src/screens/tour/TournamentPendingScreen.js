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
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { tournaments } from '../../services/api';
import { naira } from '../../config/appConfig';

export default function TournamentPendingScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const tourId = route.params?.tourId;

  const tourTitle = route.params?.title || 'Dráfù Grandmaster Championship';
  const entryFee = route.params?.entryFee || '₦500.00';
  const durationDays = route.params?.duration || '14 DAYS';
  const startAt = route.params?.startAt;

  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(!!tourId);
  const [error, setError] = useState('');

  const target = tour?.scheduledStart || startAt || null;
  const fallbackSeconds = 12 * 3600;

  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!target) return fallbackSeconds;
    const diff = Math.floor((new Date(target).getTime() - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  });

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
      setError(err?.message || 'Could not load the tournament.');
    } finally {
      setLoading(false);
    }
  }, [tourId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (!target) return prev > 0 ? prev - 1 : 0;
        const diff = Math.floor((new Date(target).getTime() - Date.now()) / 1000);
        return diff > 0 ? diff : 0;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [target]);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const displayTitle = tour?.name || tourTitle;
  const feeValue = tour ? (tour.entryFee > 0 ? naira(tour.entryFee) : 'FREE') : entryFee;
  const participantsTag = tour
    ? `PARTICIPANTS: ${tour.currentParticipants ?? 0} / ${tour.maxParticipants ?? 0} JOINED`
    : 'PARTICIPANTS: AWAITING PLAYERS';

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
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Tournament Pending</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Pending Badge Pill */}
        <View style={styles.pendingPillWrap}>
          <View style={styles.pendingPill}>
            <Text style={styles.pendingPillText}>PENDING</Text>
          </View>
        </View>

        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Image
            source={require('../../../assets/games/draughts_3d.jpg')}
            style={styles.heroBannerBg}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(7, 12, 27, 0.1)', 'rgba(7, 12, 27, 0.85)']}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.heroCardContent}>
            <Text style={styles.heroCardTitle}>{displayTitle}</Text>

            <View style={styles.heroTagsRow}>
              <View style={styles.tagBlue}>
                <Text style={styles.tagBlueText}>WIN-BASED TOURNAMENT</Text>
              </View>
            </View>

            {loading && !tour ? (
              <View style={styles.tagDarkRow}>
                <ActivityIndicator size="small" color="#00E5FF" />
                <Text style={styles.tagDarkText}>LOADING... </Text>
              </View>
            ) : (
              <View style={styles.tagDarkRow}>
                <Text style={styles.tagDarkText}>{participantsTag}</Text>
              </View>
            )}
          </View>
        </View>

        {error !== '' ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={load} style={styles.retryBtn}>
              <Text style={styles.retryText}>RETRY</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Duration Card */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.blockLabel, { color: theme.textPrimary }]}>Duration</Text>
          <View style={[styles.cyanGlowBox, { backgroundColor: theme.cardBg }]}>
            <Text style={styles.durationBigNum}>{durationDays.split(' ')[0]}</Text>
            <Text style={styles.durationSubLabel}>DAYS</Text>
          </View>
        </View>

        {/* Entry Fee Card */}
        <View style={[styles.infoBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
          <Text style={styles.infoBoxLabel}>ENTRY FEE</Text>
          <Text style={styles.entryFeeVal}>{feeValue}</Text>
        </View>

        {/* Countdown Starts In Card */}
        <View style={[styles.infoBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
          <Text style={styles.infoBoxLabel}>STARTS IN</Text>
          <View style={styles.timerRow}>
            <Text style={styles.timerVal}>{String(hours).padStart(2, '0')}</Text>
            <Text style={styles.colonVal}>:</Text>
            <Text style={styles.timerVal}>{String(minutes).padStart(2, '0')}</Text>
            <Text style={styles.colonVal}>:</Text>
            <Text style={styles.timerVal}>{String(seconds).padStart(2, '0')}</Text>
          </View>

          <View style={styles.timerSubRow}>
            <Text style={styles.timerSubText}>HRS</Text>
            <Text style={styles.timerSubText}>MIN</Text>
            <Text style={styles.timerSubText}>SEC</Text>
          </View>
        </View>

        {/* Expiry Footnote */}
        <Text style={styles.expiryFootnote}>
          if criteria is not meet within 24hrs, it will expire and be cancelled
        </Text>
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
  pendingPillWrap: {
    alignItems: 'center',
    marginBottom: 18,
  },
  pendingPill: {
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 28,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  pendingPillText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  heroCard: {
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    justifyContent: 'flex-end',
    marginBottom: 24,
  },
  heroBannerBg: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroCardContent: {
    padding: 20,
  },
  heroCardTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 10,
    lineHeight: 30,
  },
  heroTagsRow: {
    marginBottom: 8,
  },
  tagBlue: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagBlueText: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tagDarkRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagDarkText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '800',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryBtn: {
    borderWidth: 1,
    borderColor: '#00E5FF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  retryText: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sectionBlock: {
    marginBottom: 18,
  },
  blockLabel: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  cyanGlowBox: {
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  durationBigNum: {
    color: '#00E5FF',
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 46,
  },
  durationSubLabel: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  infoBoxLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  entryFeeVal: {
    color: '#F59E0B',
    fontSize: 36,
    fontWeight: '900',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerVal: {
    color: '#00E5FF',
    fontSize: 32,
    fontWeight: '900',
  },
  colonVal: {
    color: '#94A3B8',
    fontSize: 28,
    fontWeight: '900',
  },
  timerSubRow: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 4,
  },
  timerSubText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  expiryFootnote: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
});