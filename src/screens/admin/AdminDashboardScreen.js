import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Switch,
  Modal,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Users,
  Trophy,
  Award,
  Gift,
  DollarSign,
  Activity,
  RefreshCw,
  Server,
  ScrollText,
  SlidersHorizontal,
  ShieldAlert,
  Search,
  Trash2,
  X,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GACard from '../../components/GACard';
import { useTheme } from '../../context/ThemeContext';
import { admin, leaderboard as leaderboardApi, referral as referralApi } from '../../services/api';
import { fetchAllPlatformPlayers } from '../../utils/platformPlayers';

const formatNaira = (n) => `${Math.floor(Number(n || 0) / 50).toLocaleString()} VP`;
const statusColor = (theme, status) => {
  switch (status) {
    case 'active':
    case 'in_progress':
    case 'registration_open':
      return theme.success;
    case 'suspended':
    case 'scheduled':
      return theme.accent;
    case 'banned':
    case 'deleted':
    case 'cancelled':
      return theme.danger || '#FF6B6B';
    default:
      return theme.textSecondary;
  }
};

const TABS = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'tournaments', label: 'Tournaments', icon: Trophy },
  { key: 'winners', label: 'Winners & Rewards', icon: Award },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'settings', label: 'Settings', icon: SlidersHorizontal },
  { key: 'logs', label: 'Logs', icon: ScrollText },
  { key: 'system', label: 'System', icon: Server },
  { key: 'identity', label: 'Identity', icon: ShieldAlert },
];

function InfoRow({ theme, label, value }) {
  return (
    <View style={[infoStyles.row, { borderColor: theme.cardBorderSubtle }]}>
      <Text style={[infoStyles.label, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[infoStyles.value, { color: theme.textPrimary }]} numberOfLines={2}>
        {value == null || value === '' ? '—' : String(value)}
      </Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, gap: 12 },
  label: { fontSize: 13, flexShrink: 0 },
  value: { fontSize: 13, fontWeight: '700', flex: 1, textAlign: 'right' },
});

export default function AdminDashboardScreen({ navigation }) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState(null);
  const [verifiedUsers, setVerifiedUsers] = useState(null);
  const [tournamentsData, setTournamentsData] = useState(null);
  const [tournamentQuery, setTournamentQuery] = useState('');
  const [deletingTournamentId, setDeletingTournamentId] = useState(null);
  const [winnersData, setWinnersData] = useState({ winners: [], candidates: [], topByPeriod: {} });
  const [awardPeriod, setAwardPeriod] = useState('Daily');
  const [awardRank, setAwardRank] = useState(1);
  const [awardUid, setAwardUid] = useState('');
  const [awardPlayerName, setAwardPlayerName] = useState('');
  const [awardRewardText, setAwardRewardText] = useState('50 VP');
  const [awardVp, setAwardVp] = useState('50');
  const [awardPeriodDate, setAwardPeriodDate] = useState('');
  const [awardSubmitting, setAwardSubmitting] = useState(false);
  const [system, setSystem] = useState(null);
  const [settings, setSettings] = useState(null);
  const [logs, setLogs] = useState(null);
  const [logFile, setLogFile] = useState('app');
  const [logLevel, setLogLevel] = useState('all');
  const [logQuery, setLogQuery] = useState('');
  const [users, setUsers] = useState(null);
  const [userQuery, setUserQuery] = useState('');
  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadOverview = useCallback(async () => {
    const [s, v, t] = await Promise.allSettled([
      admin.stats(),
      admin.verifiedUsers(),
      admin.tournaments(),
    ]);
    if (s.status === 'fulfilled') setStats(s.value);
    if (v.status === 'fulfilled') setVerifiedUsers(v.value);
    if (t.status === 'fulfilled') setTournamentsData(t.value);
  }, []);

  const loadTab = useCallback(async (tab) => {
    setTabLoading(true);
    try {
      if (tab === 'overview') await loadOverview();
      else if (tab === 'tournaments') setTournamentsData(await admin.tournaments({ q: tournamentQuery || undefined }));
      else if (tab === 'winners') {
        const [wRes, cachedWRes, dailyRes, weeklyRes, monthlyRes, yearlyRes, refRes, commRes] = await Promise.allSettled([
          admin.leaderboardWinners(),
          AsyncStorage.getItem('@gamearn_winners_cache'),
          leaderboardApi.get('daily'),
          leaderboardApi.get('weekly'),
          leaderboardApi.get('monthly'),
          leaderboardApi.get('yearly'),
          fetchAllPlatformPlayers(),
          AsyncStorage.getItem('@gamearn_community_users_cache'),
        ]);
        const serverW = wRes.status === 'fulfilled' ? (wRes.value?.data || wRes.value || {}) : {};
        let cachedWinners = [];
        try {
          if (cachedWRes.status === 'fulfilled' && cachedWRes.value) {
            cachedWinners = JSON.parse(cachedWRes.value) || [];
          }
        } catch {}

        const wMap = new Map();
        (Array.isArray(cachedWinners) ? cachedWinners : []).forEach((item) => {
          if (item && item.period && item.rank) wMap.set(`${item.period}:${item.rank}`, item);
        });
        (Array.isArray(serverW.winners) ? serverW.winners : []).forEach((item) => {
          if (item && item.period && item.rank) wMap.set(`${item.period}:${item.rank}`, item);
        });
        const mergedWinners = Array.from(wMap.values()).sort((a, b) => a.rank - b.rank);

        // Build full candidate pool sorted by highest GP DESC
        const candMap = new Map();
        const addCand = (u) => {
          if (!u) return;
          const uid = u.uid || u.id;
          if (!uid) return;
          const prev = candMap.get(uid) || {};
          const displayName = u.displayName || u.name || u.username || prev.displayName || 'Player';
          const gp = Math.max(Number(u.gp ?? 0), Number(prev.gp ?? 0));
          const plays = Math.max(Number(u.plays ?? u.gamesPlayed ?? 0), Number(prev.plays ?? 0));
          const wins = Math.max(Number(u.wins ?? u.gamesWon ?? 0), Number(prev.wins ?? 0));
          const vp = Math.max(Number(u.vp ?? u.valuePoints ?? 0), Number(prev.vp ?? 0));
          candMap.set(uid, {
            uid,
            displayName,
            username: u.username || prev.username || displayName,
            avatar: u.avatar || u.avatarUrl || prev.avatar || null,
            gp,
            plays,
            wins,
            vp,
          });
        };

        (Array.isArray(serverW.candidates) ? serverW.candidates : []).forEach(addCand);
        if (refRes.status === 'fulfilled') {
          const rList = Array.isArray(refRes.value?.data) ? refRes.value.data : (Array.isArray(refRes.value) ? refRes.value : []);
          rList.forEach(addCand);
        }
        try {
          if (commRes.status === 'fulfilled' && commRes.value) {
            const cList = JSON.parse(commRes.value) || [];
            cList.forEach(addCand);
          }
        } catch {}
        [dailyRes, weeklyRes, monthlyRes, yearlyRes].forEach((pRes) => {
          if (pRes.status === 'fulfilled') {
            const pList = Array.isArray(pRes.value) ? pRes.value : (pRes.value?.data || []);
            pList.forEach(addCand);
          }
        });

        const allCandidates = Array.from(candMap.values()).sort(
          (a, b) => (b.gp - a.gp) || (b.wins - a.wins) || (b.plays - a.plays)
        );

        const buildPeriodTop3 = (pRes, serverList) => {
          if (Array.isArray(serverList) && serverList.length >= 3) {
            return serverList.slice(0, 3);
          }
          const periodMap = new Map();
          allCandidates.forEach((c) => periodMap.set(c.uid, { ...c }));
          if (pRes.status === 'fulfilled') {
            const rows = Array.isArray(pRes.value) ? pRes.value : (pRes.value?.data || []);
            rows.forEach((r) => {
              const uid = r.uid || r.id;
              if (!uid) return;
              const existing = periodMap.get(uid) || {};
              periodMap.set(uid, {
                uid,
                displayName: r.displayName || r.name || existing.displayName || 'Player',
                username: r.username || existing.username || 'Player',
                avatar: r.avatar || r.avatarUrl || existing.avatar || null,
                gp: Math.max(Number(r.gp ?? 0), Number(existing.gp ?? 0)),
                plays: Math.max(Number(r.plays ?? 0), Number(existing.plays ?? 0)),
                wins: Math.max(Number(r.wins ?? 0), Number(existing.wins ?? 0)),
              });
            });
          }
          return Array.from(periodMap.values())
            .sort((a, b) => (b.gp - a.gp) || (b.wins - a.wins) || (b.plays - a.plays))
            .slice(0, 3)
            .map((c, idx) => ({ ...c, rank: idx + 1 }));
        };

        const topByPeriod = {
          Daily: buildPeriodTop3(dailyRes, serverW.topByPeriod?.Daily),
          Weekly: buildPeriodTop3(weeklyRes, serverW.topByPeriod?.Weekly),
          Monthly: buildPeriodTop3(monthlyRes, serverW.topByPeriod?.Monthly),
          Yearly: buildPeriodTop3(yearlyRes, serverW.topByPeriod?.Yearly),
        };

        setWinnersData({
          winners: mergedWinners,
          candidates: allCandidates,
          topByPeriod,
        });
      }
      else if (tab === 'system') setSystem(await admin.system());
      else if (tab === 'settings') setSettings(await admin.settings());
      else if (tab === 'users') setUsers(await admin.users({ q: userQuery || undefined }));
      else if (tab === 'identity') setIdentity(await admin.identityMismatches());
      else if (tab === 'logs') setLogs(await admin.logs({ file: logFile, level: logLevel, q: logQuery || undefined }));
    } catch (err) {
      Alert.alert('Load failed', err?.message || 'Could not load data.');
    } finally {
      setTabLoading(false);
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadOverview, tournamentQuery, userQuery, logFile, logLevel, logQuery]);

  useEffect(() => {
    loadTab(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTab(activeTab);
  };

  const openUser = async (uid) => {
    setSelected(uid);
    setDetail(null);
    setDetailLoading(true);
    try {
      setDetail(await admin.user(uid));
    } catch (err) {
      Alert.alert('Load failed', err?.message || 'Could not load user.');
    } finally {
      setDetailLoading(false);
    }
  };

  const runAction = async (label, fn) => {
    setBusy(true);
    try {
      await fn();
      Alert.alert(label, 'Done.');
      await openUser(selected);
      if (activeTab === 'users') setUsers(await admin.users({ q: userQuery || undefined }));
    } catch (err) {
      Alert.alert(`${label} failed`, err?.message || 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  const confirm = (title, message, fn) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'destructive', onPress: fn },
    ]);


  const getPeriodDateString = (p) => {
    const now = new Date();
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (p === 'Daily') return `${now.getDate()} ${shortMonths[now.getMonth()]} ${now.getFullYear()}`;
    if (p === 'Weekly') return `Wk ${Math.ceil(now.getDate() / 7)}, ${shortMonths[now.getMonth()]} ${now.getFullYear()}`;
    if (p === 'Monthly') return `${fullMonths[now.getMonth()]} ${now.getFullYear()}`;
    return `${now.getFullYear()}`;
  };

  const assignVpToWinner = async ({ period, rank, uid, playerName, vpValue, gp, plays, wins, avatar, periodDate }) => {
    const cleanUid = String(uid || '').trim();
    if (!cleanUid) {
      Alert.alert('Required', 'Please select a player or enter a Player UID.');
      return;
    }
    const numericVp = Number(vpValue) || parseInt(String(vpValue || '').replace(/[^0-9.]/g, ''), 10) || 0;
    if (numericVp <= 0) {
      Alert.alert('Required', 'Please enter a valid Value Points (VP) reward greater than 0.');
      return;
    }
    const cleanRewardText = `${numericVp} VP`;
    const resolvedDate = (periodDate && periodDate.trim()) ? periodDate.trim() : getPeriodDateString(period);

    setAwardSubmitting(true);
    try {
      let serverWinner = null;
      try {
        const res = await admin.assignLeaderboardWinner({
          period,
          rank,
          uid: cleanUid,
          playerName: playerName || undefined,
          rewardText: cleanRewardText,
          rewardVp: numericVp,
          periodDate: resolvedDate,
        });
        serverWinner = res?.winner || res?.data?.winner || null;
      } catch {
        // Fallback: credit user wallet directly via admin credit endpoint if leaderboard_winners route fails
        await admin.creditUser(cleanUid, numericVp * 50, `${period} Leaderboard Rank #${rank} Reward (${numericVp} VP)`).catch(() => {});
      }

      const cand = (winnersData?.candidates || []).find((c) => c.uid === cleanUid) || {};
      const winnerEntry = {
        id: serverWinner?.id || `${period}_${rank}_${Date.now()}`,
        period,
        rank: Number(rank),
        uid: cleanUid,
        name: playerName || cand.displayName || cand.username || 'Player',
        avatar: avatar || cand.avatar || null,
        gp: Number(gp ?? cand.gp ?? 0),
        plays: Number(plays ?? cand.plays ?? 0),
        wins: Number(wins ?? cand.wins ?? 0),
        reward: cleanRewardText,
        rewardVp: numericVp,
        periodDate: resolvedDate,
      };

      // Persist immediately in @gamearn_winners_cache so Dashboard Leaderboard Winners displays it in 0ms
      try {
        const raw = await AsyncStorage.getItem('@gamearn_winners_cache');
        const list = raw ? JSON.parse(raw) : [];
        const filtered = (Array.isArray(list) ? list : []).filter(
          (w) => !(w.period === period && Number(w.rank) === Number(rank))
        );
        filtered.push(winnerEntry);
        filtered.sort((a, b) => a.rank - b.rank);
        await AsyncStorage.setItem('@gamearn_winners_cache', JSON.stringify(filtered));
      } catch {}

      // Also update local permanent VP floor if awarded player is on this device
      try {
        const existingVpRaw = await AsyncStorage.getItem(`@gamearn_permanent_vp_${cleanUid}`);
        const baseVp = Math.max(Number(existingVpRaw || 10), 10);
        await AsyncStorage.setItem(`@gamearn_permanent_vp_${cleanUid}`, String(baseVp + numericVp));
      } catch {}

      // Dispatch local notification in AsyncStorage as well
      try {
        const notif = {
          id: `winner_${period}_${rank}_${Date.now()}`,
          type: 'leaderboard_winner',
          title: `🏆 ${period} Leaderboard Rank #${rank} Winner!`,
          message: `Congratulations ${winnerEntry.name}! You have been awarded +${numericVp} VP on the ${period} Leaderboard (${resolvedDate}).`,
          createdAt: Date.now(),
          read: false,
        };
        const rawAll = await AsyncStorage.getItem('@gamearn_notifications_all');
        const listAll = rawAll ? JSON.parse(rawAll) : [];
        listAll.unshift(notif);
        await AsyncStorage.setItem('@gamearn_notifications_all', JSON.stringify(listAll.slice(0, 50)));
      } catch {}

      setWinnersData((prev) => {
        const prevList = Array.isArray(prev?.winners) ? prev.winners : [];
        const nextList = prevList
          .filter((w) => !(w.period === period && Number(w.rank) === Number(rank)))
          .concat([winnerEntry])
          .sort((a, b) => a.rank - b.rank);
        return { ...prev, winners: nextList };
      });

      Alert.alert(
        '🏆 VP Reward Assigned!',
        `${winnerEntry.name} has been awarded ${numericVp} VP for Rank #${rank} in the ${period} Leaderboard (${resolvedDate}). It is now live on Leaderboard Winners!`
      );
      setAwardVp('50');
      setAwardRewardText('50 VP');
    } catch (err) {
      Alert.alert('Award Failed', err?.message || 'Could not assign winner.');
    } finally {
      setAwardSubmitting(false);
    }
  };

  const handleAwardWinner = async () => {
    const vpNum = Number(awardVp) || parseInt(String(awardRewardText || '').replace(/[^0-9.]/g, ''), 10) || 0;
    await assignVpToWinner({
      period: awardPeriod,
      rank: awardRank,
      uid: awardUid,
      playerName: awardPlayerName,
      vpValue: vpNum,
      periodDate: awardPeriodDate,
    });
  };

  const handleDeleteWinner = (w) => {
    Alert.alert(
      'Remove Winner',
      `Remove ${w.name || 'player'} from Rank #${w.rank} (${w.period})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              if (w.id && !String(w.id).includes('_')) {
                await admin.deleteLeaderboardWinner(w.id).catch(() => {});
              }
              try {
                const raw = await AsyncStorage.getItem('@gamearn_winners_cache');
                const list = raw ? JSON.parse(raw) : [];
                const next = (Array.isArray(list) ? list : []).filter(
                  (item) => !(item.period === w.period && Number(item.rank) === Number(w.rank))
                );
                await AsyncStorage.setItem('@gamearn_winners_cache', JSON.stringify(next));
              } catch {}
              setWinnersData((prev) => ({
                ...prev,
                winners: (prev?.winners || []).filter(
                  (item) => !(item.period === w.period && Number(item.rank) === Number(w.rank))
                ),
              }));
              Alert.alert('Removed', 'Leaderboard winner removed.');
            } catch (err) {
              Alert.alert('Delete Failed', err?.message || 'Could not remove winner.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteTournament = (t) => {
    Alert.alert(
      'Delete Tournament',
      `Are you sure you want to permanently delete "${t.name || 'this tournament'}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingTournamentId(t.id);
            try {
              await admin.deleteTournament(t.id);
              setTournamentsData((prev) => {
                if (!prev) return prev;
                const list = Array.isArray(prev)
                  ? prev
                  : prev.tournaments || prev.data?.tournaments || [];
                const filtered = list.filter((item) => item.id !== t.id);
                return { ...prev, count: filtered.length, tournaments: filtered };
              });
              setStats((prev) => {
                if (!prev?.tournaments) return prev;
                return {
                  ...prev,
                  tournaments: {
                    ...prev.tournaments,
                    total: Math.max(0, Number(prev.tournaments.total || 1) - 1),
                  },
                };
              });
              Alert.alert('Deleted', `"${t.name || 'Tournament'}" has been deleted.`);
            } catch (err) {
              Alert.alert('Delete failed', err?.message || 'Could not delete tournament.');
            } finally {
              setDeletingTournamentId(null);
            }
          },
        },
      ]
    );
  };

  const renderTournamentRow = (t) => {
    const isDeleting = deletingTournamentId === t.id;
    const displayStatus = t.isLive ? 'live' : (t.rawStatus || t.status || 'scheduled');
    const gameLabel = String(t.gameType || 'all').toUpperCase();
    const rewardVp = Number(t.rewardPoolVp ?? t.prizePoolVp ?? t.prizePool ?? 0);
    const entryVp = Number(t.entryFeeVp ?? t.entryFee ?? 0);
    return (
      <GACard key={t.id} style={styles.userRow}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={[styles.userName, { color: theme.textPrimary }]}>{t.name || 'Untitled Tournament'}</Text>
            <View style={[styles.badge, { borderColor: statusColor(theme, t.rawStatus || t.status) }]}>
              <Text style={[styles.badgeText, { color: statusColor(theme, t.rawStatus || t.status) }]}>
                {displayStatus}
              </Text>
            </View>
          </View>
          <Text style={[styles.userMeta, { color: theme.textSecondary }]}>
            {gameLabel} · {t.currentParticipants ?? 0}/{t.maxParticipants ?? 0} players · Pool: {rewardVp} VP · Entry: {entryVp} VP
          </Text>
          <Text style={[styles.userMeta, { color: theme.textMuted }]}>
            Host: {t.creatorName || 'System'}
          </Text>
        </View>
        <TouchableOpacity
          disabled={isDeleting}
          onPress={() => handleDeleteTournament(t)}
          style={[
            styles.deleteTournamentBtn,
            { borderColor: theme.danger || '#FF6B6B', opacity: isDeleting ? 0.5 : 1 },
          ]}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={theme.danger || '#FF6B6B'} />
          ) : (
            <>
              <Trash2 size={14} color={theme.danger || '#FF6B6B'} />
              <Text style={[styles.deleteTournamentText, { color: theme.danger || '#FF6B6B' }]}>Delete</Text>
            </>
          )}
        </TouchableOpacity>
      </GACard>
    );
  };

  const renderOverview = () => {
    const tList = Array.isArray(tournamentsData)
      ? tournamentsData
      : tournamentsData?.tournaments || tournamentsData?.data?.tournaments || [];

    const metrics = [
      { key: 'users', onPress: () => setActiveTab('users'), icon: <Users size={24} color={theme.primary} />, value: stats?.users?.total_users != null ? Number(stats.users.total_users).toLocaleString() : '—', label: 'Total Users' },
      { key: 'live', icon: <Activity size={24} color={theme.success} />, value: stats?.liveMatches?.count != null ? Number(stats.liveMatches.count).toLocaleString() : '—', label: 'Live Matches' },
      { key: 'revenue', icon: <DollarSign size={24} color={theme.accent} />, value: stats?.revenue?.totalNaira != null ? formatNaira(stats.revenue.totalNaira) : '—', label: 'Platform Revenue' },
      { key: 'tournaments', onPress: () => setActiveTab('tournaments'), icon: <Trophy size={24} color={theme.secondary} />, value: stats?.tournaments?.total != null ? Number(stats.tournaments.total).toLocaleString() : String(tList.length || '—'), label: 'Tournaments' },
    ];
    const vData = verifiedUsers?.users ? verifiedUsers : verifiedUsers?.data || {};
    const vList = vData.users || [];
    return (
      <>
        <View style={styles.metricsGrid}>
          {metrics.map((m) => (
            <TouchableOpacity
              key={m.key}
              activeOpacity={m.onPress ? 0.75 : 1}
              onPress={m.onPress}
              disabled={!m.onPress}
              style={{ width: '47%' }}
            >
              <GACard style={[styles.metricCard, { width: '100%' }]}>
                {m.icon}
                <Text style={[styles.metricVal, { color: theme.textPrimary }]}>{m.value}</Text>
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{m.label}</Text>
              </GACard>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginBottom: 0 }]}>
            Tournaments ({tList.length.toLocaleString()})
          </Text>
          <TouchableOpacity onPress={() => setActiveTab('tournaments')}>
            <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '700' }}>Manage All</Text>
          </TouchableOpacity>
        </View>
        {tList.length === 0 ? (
          <Text style={[styles.muted, { color: theme.textSecondary }]}>No tournaments found.</Text>
        ) : (
          tList.slice(0, 5).map((t) => renderTournamentRow(t))
        )}

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Verified Users ({(vData.pagination?.total ?? vList.length).toLocaleString()})
        </Text>
        {vList.slice(0, 8).map((u) => (
          <GACard key={u.uid} style={styles.userRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: theme.textPrimary }]}>{u.displayName || '—'}</Text>
              <Text style={[styles.userMeta, { color: theme.textSecondary }]}>{u.phoneNumber || u.email || u.uid}</Text>
            </View>
            <Text style={[styles.userBalance, { color: theme.success }]}>{formatNaira(u.balanceNaira ?? Number(u.balanceKobo || 0) / 100)}</Text>
          </GACard>
        ))}
      </>
    );
  };

  const renderTournaments = () => {
    const list = Array.isArray(tournamentsData)
      ? tournamentsData
      : tournamentsData?.tournaments || tournamentsData?.data?.tournaments || [];
    const qLower = tournamentQuery.trim().toLowerCase();
    const filtered = qLower
      ? list.filter((t) =>
        String(t.name || '').toLowerCase().includes(qLower) ||
        String(t.gameType || '').toLowerCase().includes(qLower) ||
        String(t.creatorName || '').toLowerCase().includes(qLower)
      )
      : list;

    return (
      <>
        <View style={[styles.searchRow, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
          <Search size={16} color={theme.textMuted} />
          <TextInput
            value={tournamentQuery}
            onChangeText={setTournamentQuery}
            onSubmitEditing={() => loadTab('tournaments')}
            placeholder="Search tournament, game or host"
            placeholderTextColor={theme.textMuted}
            returnKeyType="search"
            style={[styles.searchInput, { color: theme.textPrimary }]}
          />
        </View>
        <Text style={[styles.muted, { color: theme.textSecondary }]}>
          {filtered.length.toLocaleString()} tournament{filtered.length === 1 ? '' : 's'}
        </Text>
        {filtered.length === 0 ? (
          <Text style={[styles.muted, { color: theme.textSecondary }]}>No tournaments match your search.</Text>
        ) : (
          filtered.map((t) => renderTournamentRow(t))
        )}
      </>
    );
  };


  const renderWinners = () => {
    const winners = Array.isArray(winnersData?.winners) ? winnersData.winners : [];
    const candidates = Array.isArray(winnersData?.candidates) ? winnersData.candidates : [];
    const currentPeriodWinners = winners
      .filter((w) => w.period === awardPeriod)
      .sort((a, b) => a.rank - b.rank);

    const periodTop3 = (winnersData?.topByPeriod?.[awardPeriod] && winnersData.topByPeriod[awardPeriod].length > 0)
      ? winnersData.topByPeriod[awardPeriod]
      : candidates.slice(0, 3).map((c, idx) => ({ ...c, rank: idx + 1 }));

    const presetVpAmounts = [10, 20, 25, 50, 100, 200, 500];
    const defaultVpByRank = { 1: 100, 2: 50, 3: 25 };

    return (
      <View style={{ gap: 14 }}>
        {/* Period Selector Tabs with Dates */}
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((p) => {
            const on = awardPeriod === p;
            const dateStr = getPeriodDateString(p);
            return (
              <TouchableOpacity
                key={p}
                onPress={() => {
                  setAwardPeriod(p);
                  const topForP = winnersData?.topByPeriod?.[p] || candidates.slice(0, 3);
                  const rankPlayer = topForP[awardRank - 1];
                  if (rankPlayer) {
                    setAwardUid(rankPlayer.uid);
                    setAwardPlayerName(rankPlayer.displayName || rankPlayer.username || '');
                  }
                }}
                style={[
                  styles.chip,
                  {
                    flex: 1,
                    minWidth: 78,
                    alignItems: 'center',
                    paddingVertical: 8,
                    backgroundColor: on ? theme.primary : theme.inputBg,
                    borderColor: on ? theme.primary : theme.inputBorder,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: on ? '#fff' : theme.textPrimary, fontWeight: '900' }]}>
                  {p}
                </Text>
                <Text style={{ color: on ? '#E0F2FE' : theme.textSecondary, fontSize: 10, fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
                  {dateStr}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Top 1st - 3rd Players by Highest GP for Selected Period */}
        <GACard style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: 0, marginBottom: 0 }]}>
              🏅 Top 1st – 3rd by Highest GP ({awardPeriod})
            </Text>
            <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '800' }}>
              {getPeriodDateString(awardPeriod)}
            </Text>
          </View>
          <Text style={[styles.muted, { color: theme.textSecondary, marginBottom: 10 }]}>
            Automatically ranked by highest GP for {awardPeriod}. Tap a VP preset or Award button to assign their VP reward and publish to Leaderboard Winners.
          </Text>

          {periodTop3.length === 0 ? (
            <Text style={[styles.muted, { color: theme.textSecondary }]}>
              No players found yet.
            </Text>
          ) : (
            periodTop3.map((player, idx) => {
              const rank = idx + 1;
              const medal = rank === 1 ? '🥇 1st' : rank === 2 ? '🥈 2nd' : '🥉 3rd';
              const badgeColor = rank === 1 ? '#F59E0B' : rank === 2 ? '#94A3B8' : '#D97706';
              const alreadyAwarded = currentPeriodWinners.find((w) => Number(w.rank) === rank);
              const selectedVp = Number(awardRank === rank && awardVp ? awardVp : (alreadyAwarded?.rewardVp || defaultVpByRank[rank] || 50));

              return (
                <View
                  key={player.uid || rank}
                  style={{
                    borderWidth: 1,
                    borderColor: alreadyAwarded ? '#10B981' : theme.cardBorderSubtle,
                    backgroundColor: theme.inputBg,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 5,
                          borderRadius: 8,
                          backgroundColor: badgeColor,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: '#000', fontWeight: '900', fontSize: 12 }}>{medal}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.userName, { color: theme.textPrimary }]} numberOfLines={1}>
                          {player.displayName || player.username || 'Player'}
                        </Text>
                        <Text style={[styles.userMeta, { color: theme.textSecondary }]}>
                          ⚡ {Number(player.gp || 0).toLocaleString()} GP • {player.plays || 0}P / {player.wins || 0}W
                        </Text>
                        {alreadyAwarded ? (
                          <Text style={{ color: '#10B981', fontWeight: '800', fontSize: 11, marginTop: 2 }}>
                            ✓ Awarded: {alreadyAwarded.rewardVp ? `${alreadyAwarded.rewardVp} VP` : alreadyAwarded.reward}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <TouchableOpacity
                      disabled={awardSubmitting}
                      onPress={() =>
                        assignVpToWinner({
                          period: awardPeriod,
                          rank,
                          uid: player.uid,
                          playerName: player.displayName || player.username,
                          vpValue: selectedVp,
                          gp: player.gp,
                          plays: player.plays,
                          wins: player.wins,
                          avatar: player.avatar,
                        })
                      }
                      style={{
                        backgroundColor: '#F59E0B',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ color: '#000', fontWeight: '900', fontSize: 12 }}>
                        Award {selectedVp} VP
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Quick VP amount selector for this rank */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700' }}>Set VP:</Text>
                    {[10, 25, 50, 100, 200].map((vpOpt) => {
                      const activeVp = selectedVp === vpOpt;
                      return (
                        <TouchableOpacity
                          key={vpOpt}
                          onPress={() => {
                            setAwardRank(rank);
                            setAwardUid(player.uid);
                            setAwardPlayerName(player.displayName || player.username || '');
                            setAwardVp(String(vpOpt));
                            setAwardRewardText(`${vpOpt} VP`);
                          }}
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6,
                            borderWidth: 1,
                            backgroundColor: activeVp ? theme.primary : 'transparent',
                            borderColor: activeVp ? theme.primary : theme.inputBorder,
                          }}
                        >
                          <Text style={{ color: activeVp ? '#fff' : theme.textPrimary, fontSize: 11, fontWeight: '800' }}>
                            {vpOpt} VP
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                    <TouchableOpacity
                      onPress={() => {
                        setAwardRank(rank);
                        setAwardUid(player.uid);
                        setAwardPlayerName(player.displayName || player.username || '');
                        setAwardVp(String(selectedVp));
                        setAwardRewardText(`${selectedVp} VP`);
                      }}
                      style={{ marginLeft: 'auto' }}
                    >
                      <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '800' }}>
                        Custom VP ↓
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </GACard>

        {/* Currently Awarded Winners on Leaderboard Winners */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Current {awardPeriod} Winners ({getPeriodDateString(awardPeriod)})
        </Text>
        {currentPeriodWinners.length === 0 ? (
          <Text style={[styles.muted, { color: theme.textSecondary }]}>
            No winners assigned for {awardPeriod} yet. Award 1st–3rd above to display them on Leaderboard Winners.
          </Text>
        ) : (
          currentPeriodWinners.map((w) => (
            <GACard key={w.id || `${w.period}_${w.rank}`} style={{ padding: 12, marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: w.rank === 1 ? '#F59E0B' : w.rank === 2 ? '#94A3B8' : '#D97706',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 }}>#{w.rank}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.userName, { color: theme.textPrimary }]} numberOfLines={1}>
                      {w.name || 'Player'}
                    </Text>
                    <Text style={[styles.userMeta, { color: theme.textSecondary }]}>
                      ⚡ {Number(w.gp || 0).toLocaleString()} GP • {w.plays || 0}P / {w.wins || 0}W • {w.periodDate || getPeriodDateString(w.period)}
                    </Text>
                    <Text style={{ color: '#F59E0B', fontWeight: '800', fontSize: 12, marginTop: 2 }}>
                      🏆 Reward: {w.rewardVp ? `${w.rewardVp} VP` : w.reward}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteWinner(w)}
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: theme.danger || '#FF6B6B',
                  }}
                >
                  <Trash2 size={16} color={theme.danger || '#FF6B6B'} />
                </TouchableOpacity>
              </View>
            </GACard>
          ))
        )}

        <GACard style={{ padding: 14, marginTop: 6 }}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: 0 }]}>
            🏆 Assign Custom VP Reward ({awardPeriod})
          </Text>
          <Text style={[styles.muted, { color: theme.textSecondary }]}>
            Assign a Value Points (VP) reward to any 1st–3rd place winner for {awardPeriod}. Rewards are strictly in VP and immediately appear on the Dashboard Leaderboard Winners.
          </Text>

          <Text style={[styles.userMeta, { color: theme.textSecondary, marginBottom: 4, fontWeight: '700' }]}>
            SELECT RANK (1ST – 3RD):
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {[1, 2, 3].map((r) => {
              const on = awardRank === r;
              const label = r === 1 ? '1st Place 🥇' : r === 2 ? '2nd Place 🥈' : '3rd Place 🥉';
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => {
                    setAwardRank(r);
                    const topPlayer = periodTop3[r - 1];
                    if (topPlayer) {
                      setAwardUid(topPlayer.uid);
                      setAwardPlayerName(topPlayer.displayName || topPlayer.username || '');
                    }
                  }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: on ? '#F59E0B' : theme.inputBg,
                      borderColor: on ? '#F59E0B' : theme.inputBorder,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: on ? '#000' : theme.textPrimary, fontWeight: '800' }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {candidates.length > 0 && (
            <>
              <Text style={[styles.userMeta, { color: theme.textSecondary, marginBottom: 4, fontWeight: '700' }]}>
                PLAYERS RANKED BY HIGHEST GP:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {candidates.map((c, i) => {
                    const isSelected = awardUid === c.uid;
                    return (
                      <TouchableOpacity
                        key={c.uid}
                        onPress={() => {
                          setAwardUid(c.uid);
                          setAwardPlayerName(c.displayName || c.username || '');
                          if (i < 3) setAwardRank(i + 1);
                        }}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? theme.primary : theme.inputBg,
                            borderColor: isSelected ? theme.primary : theme.inputBorder,
                          },
                        ]}
                      >
                        <Text style={[styles.chipText, { color: isSelected ? '#fff' : theme.textPrimary }]}>
                          #{i + 1} {c.displayName || c.username || c.uid.slice(0, 8)} ({c.gp || 0} GP)
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </>
          )}

          <Text style={[styles.userMeta, { color: theme.textSecondary, marginBottom: 4, fontWeight: '700' }]}>
            PLAYER UID:
          </Text>
          <View style={[styles.searchRow, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, marginBottom: 10 }]}>
            <TextInput
              value={awardUid}
              onChangeText={setAwardUid}
              placeholder="Select a top GP player above or enter UID"
              placeholderTextColor={theme.textMuted}
              style={[styles.searchInput, { color: theme.textPrimary }]}
            />
          </View>

          <Text style={[styles.userMeta, { color: theme.textSecondary, marginBottom: 4, fontWeight: '700' }]}>
            PLAYER DISPLAY NAME:
          </Text>
          <View style={[styles.searchRow, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, marginBottom: 10 }]}>
            <TextInput
              value={awardPlayerName}
              onChangeText={setAwardPlayerName}
              placeholder="e.g. jessejesutoni"
              placeholderTextColor={theme.textMuted}
              style={[styles.searchInput, { color: theme.textPrimary }]}
            />
          </View>

          <Text style={[styles.userMeta, { color: theme.textSecondary, marginBottom: 4, fontWeight: '700' }]}>
            VP REWARD PRESETS (VP ONLY):
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {presetVpAmounts.map((vpAmt) => {
              const isSelected = Number(awardVp) === vpAmt;
              return (
                <TouchableOpacity
                  key={vpAmt}
                  onPress={() => {
                    setAwardVp(String(vpAmt));
                    setAwardRewardText(`${vpAmt} VP`);
                  }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? '#F59E0B' : theme.inputBg,
                      borderColor: isSelected ? '#F59E0B' : theme.inputBorder,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: isSelected ? '#000' : theme.textPrimary, fontWeight: '800' }]}>
                    {vpAmt} VP
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.userMeta, { color: theme.textSecondary, marginBottom: 4, fontWeight: '700' }]}>
            VALUE POINTS (VP) REWARD AMOUNT:
          </Text>
          <View style={[styles.searchRow, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, marginBottom: 14 }]}>
            <TextInput
              value={awardVp}
              onChangeText={(val) => {
                const clean = val.replace(/[^0-9.]/g, '');
                setAwardVp(clean);
                setAwardRewardText(clean ? `${clean} VP` : '');
              }}
              keyboardType="numeric"
              placeholder="Enter VP reward amount (e.g. 50)"
              placeholderTextColor={theme.textMuted}
              style={[styles.searchInput, { color: theme.textPrimary }]}
            />
          </View>

          <TouchableOpacity
            disabled={awardSubmitting}
            onPress={handleAwardWinner}
            style={{
              backgroundColor: '#F59E0B',
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {awardSubmitting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 14 }}>
                🏆 Award {awardVp || '50'} VP & Publish to Leaderboard Winners
              </Text>
            )}
          </TouchableOpacity>
        </GACard>
      </View>
    );
  };

  const renderUsers = () => {
    const list = users?.users || [];
    return (
      <>
        <View style={[styles.searchRow, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
          <Search size={16} color={theme.textMuted} />
          <TextInput
            value={userQuery}
            onChangeText={setUserQuery}
            onSubmitEditing={() => loadTab('users')}
            placeholder="Search name, phone or email"
            placeholderTextColor={theme.textMuted}
            returnKeyType="search"
            style={[styles.searchInput, { color: theme.textPrimary }]}
          />
        </View>
        {(users?.pagination?.total != null) && (
          <Text style={[styles.muted, { color: theme.textSecondary }]}>{users.pagination.total.toLocaleString()} users</Text>
        )}
        {list.map((u) => (
          <TouchableOpacity key={u.uid} activeOpacity={0.8} onPress={() => openUser(u.uid)}>
            <GACard style={styles.userRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.userName, { color: theme.textPrimary }]}>{u.displayName || '—'}</Text>
                <Text style={[styles.userMeta, { color: theme.textSecondary }]}>{u.phoneNumber || u.email || u.uid}</Text>
              </View>
              <View style={[styles.badge, { borderColor: statusColor(theme, u.status) }]}>
                <Text style={[styles.badgeText, { color: statusColor(theme, u.status) }]}>{u.status}</Text>
              </View>
            </GACard>
          </TouchableOpacity>
        ))}
      </>
    );
  };

  const renderSettings = () => {
    return (
      <>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Feature Flags</Text>
        {settings == null && <ActivityIndicator color={theme.primary} />}
        {Array.isArray(settings) && settings.map((s) => (
          <GACard key={s.key} style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: theme.textPrimary }]}>{s.key}</Text>
              <Text style={[styles.userMeta, { color: theme.textSecondary }]}>
                {s.description || (typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value))}
              </Text>
            </View>
            {typeof s.value === 'boolean' ? (
              <Switch
                value={!!s.value}
                onValueChange={(next) => runSettingToggle(s.key, next)}
                trackColor={{ false: '#475569', true: theme.primary }}
                thumbColor="#fff"
              />
            ) : (
              <Text style={[styles.userMeta, { color: theme.textSecondary }]}>
                {typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value)}
              </Text>
            )}
          </GACard>
        ))}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: 20 }]}>Leaderboard Rewards</Text>
        <Text style={[styles.muted, { color: theme.textSecondary }]}>Edit reward config from the backend console.</Text>
      </>
    );
  };

  const renderLogs = () => (
    <>
      <View style={styles.chipRow}>
        {['app', 'error'].map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => { setLogFile(f); }}
            style={[styles.chip, { borderColor: theme.inputBorder, backgroundColor: logFile === f ? theme.primary : theme.inputBg }]}
          >
            <Text style={[styles.chipText, { color: logFile === f ? '#fff' : theme.textSecondary }]}>{f}</Text>
          </TouchableOpacity>
        ))}
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => loadTab('logs')} style={[styles.chip, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}>
          <Text style={[styles.chipText, { color: theme.textPrimary }]}>Fetch</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chipRow}>
        {['all', 'error', 'warn', 'info'].map((l) => (
          <TouchableOpacity
            key={l}
            onPress={() => setLogLevel(l)}
            style={[styles.chip, { borderColor: theme.inputBorder, backgroundColor: logLevel === l ? theme.primary : theme.inputBg }]}
          >
            <Text style={[styles.chipText, { color: logLevel === l ? '#fff' : theme.textSecondary }]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={[styles.searchRow, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
        <Search size={16} color={theme.textMuted} />
        <TextInput
          value={logQuery}
          onChangeText={setLogQuery}
          onSubmitEditing={() => loadTab('logs')}
          placeholder="Filter text"
          placeholderTextColor={theme.textMuted}
          returnKeyType="search"
          style={[styles.searchInput, { color: theme.textPrimary }]}
        />
      </View>
      {(logs?.count != null) && (
        <Text style={[styles.muted, { color: theme.textSecondary }]}>{logs.file} · {logs.count} lines{logs.note ? ` · ${logs.note}` : ''}</Text>
      )}
      <GACard style={styles.logCard}>
        <ScrollView style={{ maxHeight: 420 }} nestedScrollEnabled>
          {(logs?.lines || []).map((line, i) => (
            <Text key={i} style={[styles.logLine, { color: theme.textSecondary }]}>{line}</Text>
          ))}
        </ScrollView>
      </GACard>
    </>
  );

  const renderSystem = () => {
    const s = system || {};
    const db = s.database || {};
    return (
      <>
        <GACard style={styles.blockCard}>
          <InfoRow theme={theme} label="Service" value={s.service} />
          <InfoRow theme={theme} label="Environment" value={s.environment} />
          <InfoRow theme={theme} label="Node" value={s.nodeVersion} />
          <InfoRow theme={theme} label="PID" value={s.pid} />
          <InfoRow theme={theme} label="Uptime" value={s.uptimeSeconds != null ? `${Math.floor(s.uptimeSeconds / 60)} min` : null} />
          <InfoRow theme={theme} label="Started" value={s.startedAt} />
          <InfoRow theme={theme} label="Git SHA" value={s.gitSha} />
          <InfoRow theme={theme} label="Image tag" value={s.imageTag} />
          <InfoRow theme={theme} label="Database" value={db.name} />
          <InfoRow theme={theme} label="Postgres" value={db.version} />
        </GACard>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: 16 }]}>Migrations ({s.migrations?.length || 0})</Text>
        <GACard style={styles.blockCard}>
          {(s.migrations || []).map((m) => (
            <Text key={m} style={[styles.logLine, { color: theme.textSecondary }]}>{m}</Text>
          ))}
        </GACard>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: 16 }]}>Env keys ({s.envKeys?.length || 0})</Text>
        <GACard style={styles.blockCard}>
          <Text style={[styles.logLine, { color: theme.textSecondary }]}>{(s.envKeys || []).join(', ')}</Text>
        </GACard>
      </>
    );
  };

  const renderIdentity = () => {
    const d = identity || {};
    return (
      <>
        <GACard style={styles.blockCard}>
          <InfoRow theme={theme} label="Firebase identities" value={identity?.firebaseCount} />
          <InfoRow theme={theme} label="Postgres profiles" value={d.profileCount} />
          <InfoRow theme={theme} label="Mismatches" value={d.count} />
        </GACard>
        {(d.mismatches || []).length === 0 && (
          <Text style={[styles.muted, { color: theme.textSecondary }]}>No identity mismatches. 🎉</Text>
        )}
        {(d.mismatches || []).map((m) => (
          <GACard key={`${m.type}:${m.uid}`} style={styles.userRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: theme.textPrimary }]}>
                {m.displayName || (m.type === 'db_only' ? 'DB-only profile' : 'Firebase-only orphan')}
              </Text>
              <Text style={[styles.userMeta, { color: theme.textSecondary }]}>{m.uid}</Text>
              <Text style={[styles.userMeta, { color: theme.textMuted }]}>{m.action}</Text>
            </View>
            <TouchableOpacity
              disabled={busy}
              onPress={() => confirm('Resolve', `Run ${m.type === 'db_only' ? 'purge-profile' : 'finalize-delete'} for this uid?`, () =>
                runAction('Reconcile', () => (m.type === 'db_only'
                  ? admin.purgeProfile(m.uid)
                  : admin.finalizeOrphanDelete(m.uid))).then(() => loadTab('identity')))}
              style={[styles.actionBtn, { borderColor: theme.danger, opacity: busy ? 0.5 : 1 }]}
            >
              <Text style={[styles.chipText, { color: theme.danger }]}>{m.type === 'db_only' ? 'Purge' : 'Delete'}</Text>
            </TouchableOpacity>
          </GACard>
        ))}
      </>
    );
  };

  const runSettingToggle = async (key, next) => {
    try {
      const res = await admin.updateSettings({ [key]: next });
      setSettings(res || settings);
    } catch (err) {
      Alert.alert('Update failed', err?.message || 'Could not update setting.');
    }
  };

  const p = detail?.profile || {};

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.bg }]} keyboardShouldPersistTaps="handled">
      <TouchableOpacity
        onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
        style={styles.backBtn}
      >
        <ArrowLeft size={24} color={theme.textPrimary} />
      </TouchableOpacity>

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Admin Control Center</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Platform operations & diagnostics</Text>
        </View>
        <TouchableOpacity
          onPress={onRefresh}
          style={[styles.refreshBtn, { backgroundColor: theme.surface || 'rgba(255,255,255,0.08)' }]}
        >
          {refreshing ? <ActivityIndicator size="small" color={theme.textPrimary} /> : <RefreshCw size={18} color={theme.textPrimary} />}
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={{ gap: 8 }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const on = activeTab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={[styles.tab, { borderColor: on ? theme.primary : theme.inputBorder, backgroundColor: on ? theme.primary : theme.inputBg }]}
            >
              <Icon size={15} color={on ? '#fff' : theme.textSecondary} />
              <Text style={[styles.tabText, { color: on ? '#fff' : theme.textSecondary }]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading && activeTab === 'overview' ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <View>
          {tabLoading && <ActivityIndicator color={theme.primary} style={{ marginVertical: 8 }} />}
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'tournaments' && renderTournaments()}
          {activeTab === 'winners' && renderWinners()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'settings' && renderSettings()}
          {activeTab === 'logs' && renderLogs()}
          {activeTab === 'system' && renderSystem()}
          {activeTab === 'identity' && renderIdentity()}
        </View>
      )}

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Manage User</Text>
              <TouchableOpacity onPress={() => setSelected(null)} disabled={busy}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            {detailLoading ? (
              <ActivityIndicator color={theme.primary} style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView style={{ maxHeight: 460 }}>
                <InfoRow theme={theme} label="Name" value={p.displayName} />
                <InfoRow theme={theme} label="Phone" value={p.phoneNumber} />
                <InfoRow theme={theme} label="Email" value={p.email} />
                <InfoRow theme={theme} label="UID" value={p.uid} />
                <InfoRow theme={theme} label="Status" value={p.status} />
                <InfoRow theme={theme} label="Suspended until" value={p.suspendedUntil} />
                <InfoRow theme={theme} label="Balance" value={formatNaira(p.balanceNaira)} />
                <InfoRow theme={theme} label="Verified" value={p.isVerified ? 'Yes' : 'No'} />
                <InfoRow theme={theme} label="Created" value={p.createdAt} />

                <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: 14 }]}>Actions</Text>
                <View style={styles.actionGrid}>
                  {[1, 7, 30].map((d) => (
                    <TouchableOpacity
                      key={d}
                      disabled={busy}
                      onPress={() => runAction('Suspend', () => admin.suspendUser(selected, { days: d }))}
                      style={[styles.actionBtn, { borderColor: theme.accent }]}
                    >
                      <Text style={[styles.actionText, { color: theme.accent }]}>Suspend {d}d</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    disabled={busy}
                    onPress={() => runAction('Unsuspend', () => admin.unsuspendUser(selected, {}))}
                    style={[styles.actionBtn, { borderColor: theme.success }]}
                  >
                    <Text style={[styles.actionText, { color: theme.success }]}>Unsuspend</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={busy}
                    onPress={() => runAction('Revoke sessions', () => admin.revokeSessions(selected))}
                    style={[styles.actionBtn, { borderColor: theme.primary }]}
                  >
                    <Text style={[styles.actionText, { color: theme.primary }]}>Revoke sessions</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={busy}
                    onPress={() => runAction('Toggle admin', () => admin.updateClaims(selected, { isAdmin: !detail?.isAdmin }))}
                    style={[styles.actionBtn, { borderColor: theme.textMuted }]}
                  >
                    <Text style={[styles.actionText, { color: theme.textMuted }]}>Toggle admin claim</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={busy}
                    onPress={() =>
                      Alert.alert('Soft-delete user', 'Anonymizes the profile. Cannot be undone.', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => runAction('Soft-delete', () => admin.softDeleteUser(selected, {})) },
                      ])
                    }
                    style={[styles.actionBtn, { borderColor: theme.danger || '#FF6B6B' }]}
                  >
                    <Text style={[styles.actionText, { color: theme.danger || '#FF6B6B' }]}>Soft-delete</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, paddingTop: 50 },
  backBtn: { marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 4 },
  tabBar: { marginVertical: 16, flexGrow: 0 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  tabText: { fontSize: 13, fontWeight: '700' },
  loading: { paddingVertical: 60, alignItems: 'center' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: { width: '47%', padding: 14, gap: 6 },
  metricVal: { fontSize: 20, fontWeight: '800' },
  metricLabel: { fontSize: 12 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginTop: 12, marginBottom: 8 },
  userRow: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 8, gap: 10 },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 8, gap: 10 },
  userName: { fontSize: 15, fontWeight: '700' },
  userMeta: { fontSize: 12, marginTop: 2 },
  userBalance: { fontSize: 14, fontWeight: '800' },
  badge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  deleteTournamentBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  deleteTournamentText: { fontSize: 12, fontWeight: '700' },
  muted: { fontSize: 12, marginBottom: 8 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 2 },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  chip: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  logCard: { padding: 12, marginTop: 4 },
  logLine: { fontSize: 11, fontFamily: 'monospace', marginBottom: 3 },
  blockCard: { padding: 14, marginBottom: 6 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  actionBtn: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  actionText: { fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, padding: 20, maxHeight: '85%' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
});
