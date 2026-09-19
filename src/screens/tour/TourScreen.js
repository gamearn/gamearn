import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Trophy, Coins, Users, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { tournaments } from '../../services/api';
import { ApiError } from '../../services/apiClient';
import { naira } from '../../config/appConfig';

const STATUS_META = {
  registration_open: { label: 'REGISTRATION OPEN', color: '#00E5FF' },
  scheduled: { label: 'PENDING ENTRY', color: '#F59E0B' },
  pending: { label: 'PENDING ENTRY', color: '#F59E0B' },
  in_progress: { label: 'LIVE NOW', color: '#00E5FF' },
  completed: { label: 'COMPLETED', color: '#10B981' },
  cancelled: { label: 'CANCELLED', color: '#EF4444' },
};

const GAME_LABELS = { whot: 'Wọ́t', ludo: 'Lúùdò', ayo: 'Ayò Ọ̀pọ́n', draughts: 'Dráfù' };

export default function TourScreen({ navigation }) {
  const { userProfile } = useAuth();
  const { theme, isDark } = useTheme();
  const userName = userProfile?.name || userProfile?.username || 'Adebayo';

  const [upcoming, setUpcoming] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [list, myTours] = await Promise.all([tournaments.list(), tournaments.my()]);
      setUpcoming(list || []);
      setMine(myTours || []);
      setError('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load tournaments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const openTournament = (item) => {
    const status = item.status;
    if (status === 'in_progress') {
      navigation.navigate('LiveTournament', { tourId: item.id, title: item.name });
    } else if (status === 'completed') {
      navigation.navigate('TournamentResults', { tourId: item.id, title: item.name });
    } else {
      navigation.navigate('TournamentDetails', { tourId: item.id, title: item.name });
    }
  };

  const renderCard = (item, rightLabel) => {
    const meta = STATUS_META[item.status] || { label: 'PENDING ENTRY', color: '#F59E0B' };
    const slot = `${item.currentParticipants} / ${item.maxParticipants}`;
    const game = GAME_LABELS[item.gameType] || item.gameType || 'Game';
    const isCompleted = item.status === 'completed';
    const isCancelled = item.status === 'cancelled';
    const prize = isCompleted || item.prizePool > 0 ? item.prizePool : null;

    return (
      <View key={item.id} style={styles.tourCard}>
        <LinearGradient
          colors={isDark ? ['rgba(15, 30, 55, 0.75)', 'rgba(10, 20, 40, 0.75)'] : ['#FFFFFF', '#F8FAFC']}
          style={[styles.tourCardGradient, { borderColor: theme.cardBorderSubtle }]}
        >
          <View style={styles.tourCardHeader}>
            <View style={styles.statusRow}>
              <View style={[styles.dot, { backgroundColor: meta.color }]} />
              <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
            </View>

            <View style={[styles.gcBadge, { backgroundColor: isDark ? 'rgba(0, 229, 255, 0.1)' : 'rgba(0, 180, 216, 0.1)' }]}>
              <Coins size={14} color={theme.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.gcBadgeText, { color: theme.primary }]}>{item.entryFee > 0 ? naira(item.entryFee) : 'FREE'}</Text>
            </View>
          </View>

          <Text style={[styles.tourCardTitle, { color: theme.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.tourCardType, { color: theme.textSecondary }]}>
            {game.toUpperCase()} · WIN-BASED
          </Text>

          {prize !== null && (
            <Text style={styles.prizeLine}>Prize pool: {naira(prize)}</Text>
          )}
          {isCancelled && <Text style={styles.cancelLine}>This tournament was cancelled.</Text>}

          <View style={styles.tourCardFooter}>
            <View>
              <View style={styles.participantsRow}>
                <Users size={14} color={theme.primary} style={{ marginRight: 6 }} />
                <Text style={styles.joinedCountText}>{slot} PLAYERS</Text>
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.8} onPress={() => openTournament(item)} style={styles.viewDetailsBtn}>
              <Text style={styles.viewDetailsText}>{rightLabel || 'VIEW DETAILS'}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={[styles.screenRoot, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
      <LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />

      <View style={styles.topHeader}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Tournaments</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00E5FF" />}
      >
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => navigation.navigate('CreateTournament')}
          style={styles.hostBannerContainer}
        >
          <LinearGradient
            colors={isDark ? ['#0D192F', '#091326'] : ['#E0F2FE', '#BAE6FD']}
            style={styles.hostBannerGradient}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.hostLabel, { color: theme.primary }]}>HOST YOUR OWN</Text>
              <Text style={[styles.hostTitle, { color: theme.textPrimary }]}>Create Tournament</Text>
            </View>
            <View style={styles.orangePlusCircle}>
              <Plus size={24} color="#FFFFFF" strokeWidth={3} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#00E5FF" />
            <Text style={styles.centerText}>Loading tournaments…</Text>
          </View>
        ) : error !== '' ? (
          <View style={styles.centerBox}>
            <Text style={[styles.centerText, { color: theme.textPrimary }]}>{error}</Text>
            <TouchableOpacity onPress={load} style={styles.retryBtn}>
              <Text style={styles.retryText}>TRY AGAIN</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.sectionLabelRow}>
              <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>OPEN & UPCOMING</Text>
              {upcoming.length > 0 && (
                <Text style={styles.sectionCount}>{upcoming.length} FOUND</Text>
              )}
            </View>

            <View style={styles.tourList}>
              {upcoming.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No tournaments open right now — check back soon or host your own above.
                </Text>
              ) : (
                upcoming.map((item) => renderCard(item))
              )}
            </View>

            <View style={styles.sectionLabelRow}>
              <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>MY TOURNAMENTS</Text>
            </View>

            <View style={styles.tourList}>
              {mine.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  You haven't joined any tournaments yet.
                </Text>
              ) : (
                mine.map((item) =>
                  renderCard(item, item.status === 'completed' ? 'SEE RESULTS' : 'OPEN'),
                )
              )}
            </View>
          </>
        )}
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
    paddingTop: 60,
    paddingBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 110,
  },
  hostBannerContainer: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FF5500',
    overflow: 'hidden',
    marginBottom: 16,
  },
  hostBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  hostLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  hostTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  orangePlusCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF5500',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF5500',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '900',
  },
  sectionCount: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  centerBox: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  centerText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
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
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
  },
  tourList: {
    gap: 16,
    marginBottom: 8,
  },
  tourCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  tourCardGradient: {
    padding: 18,
    borderWidth: 1,
  },
  tourCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  gcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  gcBadgeText: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '900',
  },
  tourCardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  tourCardType: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  prizeLine: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  cancelLine: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  tourCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  joinedCountText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
  },
  viewDetailsBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  viewDetailsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});