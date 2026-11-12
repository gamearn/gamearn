import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Wallet, Flame, Users, Play, Trophy, Settings } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { wallet, tournaments, leaderboard as leaderboardApi } from '../../services/api';
import { leaderboard } from '../home/model';
import { resolveAvatarSource } from '../../utils/avatarPresets';
import { fetchAllPlatformPlayers } from '../../utils/platformPlayers';
import ActiveMatchBanner from '../../components/ActiveMatchBanner';

const GAMES = {
  ludo: { title: 'Ludo', sub: 'Race your tokens home.', image: require('../../../assets/games/ludo_3d.jpg'), target: 'LudoGame' },
  ayo: { title: 'Ayo Ọ̀pọ́n', sub: 'Master the seeds and board.', image: require('../../../assets/games/ayo_3d.jpg'), target: 'AyoGame' },
  whot: { title: 'Whot', sub: 'Match shapes and numbers.', image: require('../../../assets/games/whot_3d.jpg'), target: 'WhotGame' },
  draft: { title: 'Draft', sub: 'Capture pieces and crown kings.', image: require('../../../assets/games/draughts_3d.jpg'), target: 'DraughtsGame' },
};

export default function GameSectionScreen({ route, navigation }) {
  const key = route.params?.gameId || 'ludo';
  const game = GAMES[key] || GAMES.ludo;
  const { userProfile } = useAuth();
  
  const [w, setW] = useState(null);
  const [ts, setTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('Daily');
  const [dbLeaderRows, setDbLeaderRows] = useState([]);
  const [leaderLoading, setLeaderLoading] = useState(true);

  const fetchLeaderboard = useCallback(() => {
    let active = true;
    setLeaderLoading(true);
    Promise.allSettled([
      leaderboardApi.get(period, key),
      fetchAllPlatformPlayers(),
      AsyncStorage.getItem('@gamearn_deleted_uids').catch(() => null),
    ])
      .then(([lbRes, allPlayersRes, delUidsRes]) => {
        if (!active) return;
        const lbRows = lbRes.status === 'fulfilled'
          ? (Array.isArray(lbRes.value) ? lbRes.value : lbRes.value?.data || [])
          : [];
        const refRows = allPlayersRes.status === 'fulfilled' && Array.isArray(allPlayersRes.value)
          ? allPlayersRes.value
          : [];
        let deletedUidsSet = new Set();
        try {
          const rawDel = delUidsRes.status === 'fulfilled' ? delUidsRes.value : null;
          if (rawDel) {
            const parsed = JSON.parse(rawDel);
            if (Array.isArray(parsed)) deletedUidsSet = new Set(parsed);
          }
        } catch {}

        const d = new Date();
        const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const map = new Map();
        const addEntry = (item, isFromGameLb = false) => {
          if (!item) return;
          const uid = item.uid || item.id;
          if (!uid || deletedUidsSet.has(uid)) return;
          const existing = map.get(uid);

          // If entry is already populated authoritatively from the server database, do not overwrite plays/wins/gp with local phone data
          if (existing && !isFromGameLb) {
            if (!existing.avatar && (item.avatar || item.avatarUrl)) {
              existing.avatar = item.avatar || item.avatarUrl;
            }
            if ((!existing.username || existing.username === 'Player') && item.username) {
              existing.username = item.username;
            }
            return;
          }

          const name = item.displayName || item.name || item.username || existing?.name || 'Player';
          let plays = existing?.plays ?? 0;
          let wins = existing?.wins ?? 0;
          if (isFromGameLb) {
            const rawPlays = period === 'Daily' && item.periodPlays !== undefined
              ? Number(item.periodPlays)
              : Number(item.plays ?? item.gamesPlayed ?? 0);
            const rawWins = period === 'Daily' && item.periodWins !== undefined
              ? Number(item.periodWins)
              : Number(item.wins ?? item.gamesWon ?? 0);
            plays = Math.max(plays, rawPlays);
            wins = Math.max(wins, rawWins);
          } else {
            const gs = item.gameStats || {};
            const gSt = gs[key] || (key === 'draft' ? (gs.draughts || gs.checkers) : null) || {};
            if (period === 'Daily') {
              const isToday = (gSt.lastPlayedDate === todayStr || item.lastPlayedDate === todayStr) && Number(gSt.dailyPlays ?? 0) > 0;
              plays = Math.max(plays, isToday ? Number(gSt.dailyPlays ?? 0) : 0);
              wins = Math.max(wins, isToday ? Number(gSt.dailyWins ?? 0) : 0);
            } else if (period === 'Weekly') {
              const now = new Date();
              const currentWeek = `${now.getFullYear()}-W${Math.ceil((((now - new Date(now.getFullYear(), 0, 1)) / 86400000) + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7)}`;
              const isThisWeek = gSt.lastPlayedWeek === currentWeek;
              const wPlays = isThisWeek ? Number(gSt.weeklyPlays ?? gSt.gamesPlayed ?? 0) : (gSt.weeklyPlays != null ? Number(gSt.weeklyPlays) : Math.min(Number(gSt.gamesPlayed ?? gSt.plays ?? 0), 10));
              const wWins = isThisWeek ? Number(gSt.weeklyWins ?? gSt.wins ?? 0) : (gSt.weeklyWins != null ? Number(gSt.weeklyWins) : Math.min(Number(gSt.wins ?? 0), wPlays));
              plays = Math.max(plays, wPlays);
              wins = Math.max(wins, wWins);
            } else if (period === 'Monthly') {
              const now = new Date();
              const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
              const isThisMonth = gSt.lastPlayedMonth === currentMonth;
              const mPlays = isThisMonth ? Number(gSt.monthlyPlays ?? gSt.gamesPlayed ?? 0) : (gSt.monthlyPlays != null ? Number(gSt.monthlyPlays) : Number(gSt.gamesPlayed ?? gSt.plays ?? 0));
              const mWins = isThisMonth ? Number(gSt.monthlyWins ?? gSt.wins ?? 0) : (gSt.monthlyWins != null ? Number(gSt.monthlyWins) : Number(gSt.wins ?? 0));
              plays = Math.max(plays, mPlays);
              wins = Math.max(wins, mWins);
            } else {
              plays = Math.max(plays, Number(gSt.yearlyPlays ?? gSt.gamesPlayed ?? gSt.plays ?? 0));
              wins = Math.max(wins, Number(gSt.yearlyWins ?? gSt.wins ?? 0));
            }
          }
          const gp = (item.gp != null && Number(item.gp) > 0)
            ? Number(item.gp)
            : ((item.initialGp != null && Number(item.initialGp) > 0)
                ? Number(item.initialGp)
                : (existing?.gp != null ? existing.gp : 0));
          const careerPlays = Math.max(Number(item.careerPlays ?? item.totalPlays ?? plays), Number(existing?.careerPlays ?? 0));
          const careerWins = Math.max(Number(item.careerWins ?? item.totalWins ?? wins), Number(existing?.careerWins ?? 0));

          map.set(uid, {
            id: uid,
            uid,
            name,
            displayName: name,
            username: item.username || existing?.username || name,
            avatar: item.avatar || item.avatarUrl || existing?.avatar || null,
            plays,
            wins,
            careerPlays,
            careerWins,
            periodPlays: period === 'Daily' ? plays : (isFromGameLb ? plays : (existing?.periodPlays ?? plays)),
            periodWins: period === 'Daily' ? wins : (isFromGameLb ? wins : (existing?.periodWins ?? wins)),
            gp: Math.max(gp, existing?.gp || 0),
            isUser: Boolean(userProfile?.uid && uid === userProfile.uid),
          });
        };

        lbRows.forEach((r) => addEntry(r, true));
        refRows.forEach((r) => addEntry(r, false));

        setDbLeaderRows(
          Array.from(map.values())
            .filter((row) => !deletedUidsSet.has(row.uid) && !deletedUidsSet.has(row.id))
        );
      })
      .catch(() => {
        if (active) setDbLeaderRows([]);
      })
      .finally(() => {
        if (active) setLeaderLoading(false);
      });
    return () => {
      active = false;
    };
  }, [period, key, userProfile?.uid, userProfile?.gamesPlayed, userProfile?.wins]);

  useEffect(() => {
    let live = true;
    Promise.allSettled([wallet.get(), tournaments.list(key)]).then(([a, c]) => {
      if (!live) return;
      if (a.status === 'fulfilled') setW(a.value);
      if (c.status === 'fulfilled') {
        const list = Array.isArray(c.value) ? c.value : (c.value?.tournaments || c.value?.data || []);
        setTs(list.filter((t) => ['open', 'live', 'registration_open', 'pending', 'scheduled', 'in_progress'].includes(String(t.status || t.state || 'registration_open').toLowerCase())));
      }
      setLoading(false);
    });
    return () => { live = false; };
  }, [key]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (!navigation) return;
    const unsubscribe = navigation.addListener('focus', () => {
      fetchLeaderboard();
      wallet.get().then(setW).catch(() => {});
      tournaments.list(key).then((val) => {
        const list = Array.isArray(val) ? val : (val?.tournaments || val?.data || []);
        setTs(list.filter((t) => ['open', 'live', 'registration_open', 'pending', 'scheduled', 'in_progress'].includes(String(t.status || t.state || 'registration_open').toLowerCase())));
      }).catch(() => {});
    });
    return unsubscribe;
  }, [navigation, fetchLeaderboard, key]);

  const leaderRows = useMemo(() => leaderboard(dbLeaderRows, userProfile, period, key), [dbLeaderRows, userProfile, period, key]);

  const play = () => navigation.navigate('GameLobby', { gameId: key, gameName: game.title, targetScreen: game.target, setupTarget: 'GameSetup' });
  const balance = Number(w?.balance ?? userProfile?.walletBalance ?? 0);
  const currentVp = Math.max(0, Math.round(Number(userProfile?.valuePoints ?? userProfile?.vp ?? (balance / 50)) * 10) / 10);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#070C1B" />
      <LinearGradient colors={['#091026', '#060919', '#040612']} style={StyleSheet.absoluteFillObject} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('MainTabs')} style={styles.back} accessibilityLabel="Back to Dashboard">
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{game.title.toUpperCase()}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <ActiveMatchBanner navigation={navigation} gameId={key} style={{ marginHorizontal: 0, marginTop: 0, marginBottom: 14 }} />
        <View style={styles.hero}>
          <Image source={game.image} style={styles.heroImage} />
          <LinearGradient colors={['#070C1B00', '#070C1BE6']} style={StyleSheet.absoluteFillObject} />
          <View style={styles.heroText}>
            <Text style={styles.label}>GAME</Text>
            <Text style={styles.heroTitle}>{game.title}</Text>
            <Text style={styles.sub}>{game.sub}</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={[styles.card, { flex: 1 }]}>
            <View style={styles.row}>
              <Wallet size={15} color="#00E5FF" />
              <Text style={styles.muted}>Acquired Value Points</Text>
            </View>
            <Text style={styles.amount}>{currentVp.toLocaleString()} VP</Text>
          </View>
        </View>

        <Text style={styles.section}>LIVE TOURNAMENTS</Text>
        {loading ? (
          <ActivityIndicator color="#00E5FF" style={{ padding: 20 }} />
        ) : ts.length === 0 ? (
          <Text style={styles.empty}>No live tournaments right now.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {ts.map((t) => (
              <TouchableOpacity key={t.id} onPress={() => navigation.navigate('TournamentDetails', { tourId: t.id, title: t.name })} style={styles.tour}>
                <Text style={styles.live}>LIVE</Text>
                <Text style={styles.tourTitle}>{t.name || `${game.title} tournament`}</Text>
                <View style={styles.row}>
                  <Users size={13} color="#fff" />
                  <Text style={styles.muted}>{t.currentPlayers || t.playerCount || 0} players</Text>
                </View>
                <Text style={styles.prize}>Prize: {Math.floor(Number(t.prizePool || 0) / 50).toLocaleString()} VP</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={{ flexDirection: 'row', gap: 10, marginVertical: 14 }}>
          <TouchableOpacity onPress={play} style={[styles.play, { flex: 1, marginVertical: 0 }]}>
            <Play size={19} color="#fff" fill="#fff" />
            <Text style={styles.playText}>Play Now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.leaderHeaderRow}>
          <Text style={styles.section}>LIVE GAME LEADERBOARD</Text>
          <View style={styles.filters}>
            {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                style={[styles.filterChip, period === p && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, period === p && styles.filterTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={{ gap: 8, marginTop: 4 }}>
          {leaderLoading ? (
            <ActivityIndicator color="#00E5FF" style={{ padding: 20 }} />
          ) : leaderRows.length === 0 ? (
            <Text style={styles.empty}>No {game.title} leaderboard activity recorded yet.</Text>
          ) : (
            (() => {
              const top10 = leaderRows.slice(0, 10);
              const userInTop10 = top10.some((p) => p.isUser);
              const userRow = !userInTop10 ? leaderRows.find((p) => p.isUser) : null;

              const renderItem = (player, displayRank) => {
                const rankIdx = displayRank - 1;
                const isFirst = rankIdx === 0;
                return (
                  <View
                    key={player.id}
                    style={[
                      styles.leaderRow,
                      isFirst && { borderColor: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.12)' },
                      player.isUser && { borderColor: '#00E5FF', backgroundColor: 'rgba(0, 229, 255, 0.1)' },
                    ]}
                  >
                    <View style={[styles.rankBadge, isFirst && { backgroundColor: '#F59E0B' }, player.isUser && !isFirst && { backgroundColor: '#0284C7' }]}>
                      <Text style={{ color: isFirst ? '#070C1B' : '#FFF', fontWeight: '900', fontSize: 13 }}>#{displayRank}</Text>
                    </View>
                    <Image source={resolveAvatarSource(player.avatar)} style={{ width: 32, height: 32, borderRadius: 16, marginLeft: 10 }} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ color: player.isUser ? '#00E5FF' : '#FFF', fontWeight: '800', fontSize: 14 }}>{player.name}</Text>
                      <Text style={{ color: '#94A3B8', fontSize: 11 }}>{player.plays} Plays · {player.wins} Wins</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: player.isUser ? '#00E5FF' : '#00E5FF', fontWeight: '900', fontSize: 14 }}>{player.gpText || `${player.gp || 0} GP`}</Text>
                    </View>
                  </View>
                );
              };

              return (
                <>
                  {top10.map((player, idx) => renderItem(player, player.rank || idx + 1))}
                  {userRow && (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 6, gap: 8 }}>
                        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
                        <Text style={{ color: '#00E5FF', fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>
                          Your Standing
                        </Text>
                        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
                      </View>
                      {renderItem(userRow, userRow.rank || (leaderRows.indexOf(userRow) + 1))}
                    </>
                  )}
                </>
              );
            })()
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#070C1B' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.08)' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  content: { padding: 20, paddingBottom: 50 },
  hero: { height: 210, borderRadius: 22, overflow: 'hidden', justifyContent: 'flex-end', marginBottom: 18 },
  heroImage: { position: 'absolute', width: '100%', height: '100%' },
  heroText: { padding: 18 },
  label: { color: '#94A3B8', fontSize: 10, fontWeight: '800' },
  heroTitle: { color: '#FF5500', fontSize: 28, fontWeight: '900' },
  sub: { color: '#fff' },
  stats: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  card: { flex: 1, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.1)', backgroundColor: 'rgba(15,25,45,.7)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  muted: { color: '#94A3B8', fontSize: 12 },
  amount: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 8 },
  section: { color: '#94A3B8', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  leaderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 8,
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterChipActive: {
    backgroundColor: '#00E5FF',
  },
  filterText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#070C1B',
    fontWeight: '900',
  },
  empty: { color: '#94A3B8', textAlign: 'center', padding: 24 },
  tour: { width: 235, padding: 16, borderRadius: 16, marginRight: 12, backgroundColor: 'rgba(15,25,45,.8)', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)' },
  live: { color: '#10B981', fontSize: 11, fontWeight: '900' },
  tourTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginVertical: 10 },
  prize: { color: '#00E5FF', marginTop: 12, fontWeight: '700' },
  play: { marginVertical: 25, backgroundColor: '#FF5500', padding: 15, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  playText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  leaderRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: 'rgba(15,25,45,.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,.08)' },
  rankBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' },
});
