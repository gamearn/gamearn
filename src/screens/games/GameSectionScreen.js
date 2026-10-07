import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Wallet, Flame, Users, Play, Trophy } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { wallet, tournaments, leaderboard as leaderboardApi } from '../../services/api';
import { leaderboard } from '../home/model';
import { resolveAvatarSource } from '../../utils/avatarPresets';

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
  const [dbLeaderRows, setDbLeaderRows] = useState([]);
  const [leaderLoading, setLeaderLoading] = useState(true);

  useEffect(() => {
    let live = true;
    Promise.allSettled([wallet.get(), tournaments.list(key), leaderboardApi.get('Daily', key)]).then(([a, c, l]) => {
      if (!live) return;
      if (a.status === 'fulfilled') setW(a.value);
      if (c.status === 'fulfilled') {
        const list = Array.isArray(c.value) ? c.value : (c.value?.tournaments || c.value?.data || []);
        setTs(list.filter((t) => ['open', 'live', 'registration_open', 'pending', 'scheduled', 'in_progress'].includes(String(t.status || t.state || 'registration_open').toLowerCase())));
      }
      if (l.status === 'fulfilled') {
        const rowsList = Array.isArray(l.value) ? l.value : l.value?.data || [];
        setDbLeaderRows(rowsList);
      }
      setLoading(false);
      setLeaderLoading(false);
    });
    return () => { live = false; };
  }, [key]);

  const leaderRows = useMemo(() => leaderboard(dbLeaderRows, userProfile), [dbLeaderRows, userProfile]);

  const play = () => navigation.navigate('GameLobby', { gameId: key, gameName: game.title, targetScreen: game.target, setupTarget: 'GameSetup' });
  const balance = Number(w?.balance ?? userProfile?.walletBalance ?? 0);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#070C1B" />
      <LinearGradient colors={['#091026', '#060919', '#040612']} style={StyleSheet.absoluteFillObject} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{game.title.toUpperCase()}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
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
              <Text style={styles.muted}>Wallet Balance</Text>
            </View>
            <Text style={styles.amount}>₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
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
              <TouchableOpacity key={t.id} onPress={() => navigation.navigate('TournamentDetails', { tournamentId: t.id })} style={styles.tour}>
                <Text style={styles.live}>LIVE</Text>
                <Text style={styles.tourTitle}>{t.name || `${game.title} tournament`}</Text>
                <View style={styles.row}>
                  <Users size={13} color="#fff" />
                  <Text style={styles.muted}>{t.currentPlayers || t.playerCount || 0} players</Text>
                </View>
                <Text style={styles.prize}>Prize: ₦{Number(t.prizePool || 0).toLocaleString('en-NG')}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity onPress={play} style={styles.play}>
          <Play size={19} color="#fff" fill="#fff" />
          <Text style={styles.playText}>Play Now</Text>
        </TouchableOpacity>

        <Text style={styles.section}>LIVE GAME LEADERBOARD</Text>
        <View style={{ gap: 8, marginTop: 4 }}>
          {leaderLoading ? (
            <ActivityIndicator color="#00E5FF" style={{ padding: 20 }} />
          ) : leaderRows.length === 0 ? (
            <Text style={styles.empty}>No {game.title} leaderboard activity recorded yet.</Text>
          ) : (
            leaderRows.map((player, idx) => (
              <View
                key={player.id}
                style={[
                  styles.leaderRow,
                  idx === 0 && { borderColor: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.12)' },
                  player.isUser && { borderColor: '#00E5FF', backgroundColor: 'rgba(0, 229, 255, 0.1)' },
                ]}
              >
                <View style={[styles.rankBadge, idx === 0 && { backgroundColor: '#F59E0B' }]}>
                  <Text style={{ color: idx === 0 ? '#070C1B' : '#FFF', fontWeight: '900', fontSize: 13 }}>#{idx + 1}</Text>
                </View>
                <Image source={resolveAvatarSource(player.avatar)} style={{ width: 32, height: 32, borderRadius: 16, marginLeft: 10 }} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>{player.name}</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 11 }}>{player.wins} Wins · Live</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: '#00E5FF', fontWeight: '900', fontSize: 14 }}>{player.gpText || `${player.gp || 0}% GP`}</Text>
                </View>
              </View>
            ))
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
  section: { color: '#94A3B8', fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 12, marginTop: 10 },
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
