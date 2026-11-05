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
import GACard from '../../components/GACard';
import { useTheme } from '../../context/ThemeContext';
import { admin } from '../../services/api';

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
  const [winnersData, setWinnersData] = useState({ winners: [], candidates: [] });
  const [awardPeriod, setAwardPeriod] = useState('Daily');
  const [awardRank, setAwardRank] = useState(1);
  const [awardUid, setAwardUid] = useState('');
  const [awardPlayerName, setAwardPlayerName] = useState('');
  const [awardRewardText, setAwardRewardText] = useState('₦10,000 voucher');
  const [awardVp, setAwardVp] = useState('');
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
      else if (tab === 'winners') { const w = await admin.leaderboardWinners(); setWinnersData(w?.data || w || { winners: [], candidates: [] }); }
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


  const handleAwardWinner = async () => {
    if (!awardUid.trim()) {
      Alert.alert('Required', 'Please enter or select a Player UID');
      return;
    }
    if (!awardRewardText.trim()) {
      Alert.alert('Required', 'Please enter reward text (e.g., ₦10,000 voucher)');
      return;
    }
    setAwardSubmitting(true);
    try {
      const res = await admin.assignLeaderboardWinner({
        period: awardPeriod,
        rank: awardRank,
        uid: awardUid.trim(),
        playerName: awardPlayerName.trim() || undefined,
        rewardText: awardRewardText.trim(),
        rewardVp: awardVp ? Number(awardVp) : 0,
        periodDate: awardPeriodDate.trim() || undefined,
      });
      Alert.alert('🏆 Winner Awarded!', res?.message || `Assigned Rank #${awardRank} in ${awardPeriod} Leaderboard.`);
      setAwardUid('');
      setAwardPlayerName('');
      setAwardVp('');
      setAwardPeriodDate('');
      loadTab('winners');
    } catch (err) {
      Alert.alert('Award Failed', err?.message || 'Could not assign winner.');
    } finally {
      setAwardSubmitting(false);
    }
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
              await admin.deleteLeaderboardWinner(w.id);
              Alert.alert('Removed', 'Leaderboard winner removed.');
              loadTab('winners');
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

    const presetRewards = [
      '₦10,000 voucher',
      '₦5,000 voucher',
      '₦2,500 voucher',
      '50 VP Bonus',
      '100 VP Grand Prize',
    ];

    return (
      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((p) => {
            const on = awardPeriod === p;
            return (
              <TouchableOpacity
                key={p}
                onPress={() => setAwardPeriod(p)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: on ? theme.primary : theme.inputBg,
                    borderColor: on ? theme.primary : theme.inputBorder,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: on ? '#fff' : theme.textPrimary }]}>
                  {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Current {awardPeriod} Winners
        </Text>
        {currentPeriodWinners.length === 0 ? (
          <Text style={[styles.muted, { color: theme.textSecondary }]}>
            No winners assigned for {awardPeriod} yet.
          </Text>
        ) : (
          currentPeriodWinners.map((w) => (
            <GACard key={w.id} style={{ padding: 12, marginBottom: 6 }}>
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
                      UID: {w.uid} • {w.gp || 0} GP • {w.plays || 0}P / {w.wins || 0}W
                    </Text>
                    <Text style={{ color: '#F59E0B', fontWeight: '700', fontSize: 12, marginTop: 2 }}>
                      🎁 {w.reward} {w.rewardVp ? `(+ ${w.rewardVp} VP)` : ''}
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

        <GACard style={{ padding: 14, marginTop: 10 }}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: 0 }]}>
            🏆 Assign / Replace Winner
          </Text>
          <Text style={[styles.muted, { color: theme.textSecondary }]}>
            Manually assign a reward to a player for {awardPeriod}. It will automatically credit their account, dispatch an in-app notification, and display on the Leaderboard Winners board.
          </Text>

          <Text style={[styles.userMeta, { color: theme.textSecondary, marginBottom: 4, fontWeight: '700' }]}>
            SELECT RANK:
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {[1, 2, 3].map((r) => {
              const on = awardRank === r;
              const label = r === 1 ? '1st Place 🥇' : r === 2 ? '2nd Place 🥈' : '3rd Place 🥉';
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => setAwardRank(r)}
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
                QUICK-SELECT ACTIVE PLAYER:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {candidates.map((c) => {
                    const isSelected = awardUid === c.uid;
                    return (
                      <TouchableOpacity
                        key={c.uid}
                        onPress={() => {
                          setAwardUid(c.uid);
                          setAwardPlayerName(c.displayName || c.username || '');
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
                          {c.displayName || c.username || c.uid.slice(0, 8)} ({c.gp || 0} GP)
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
              placeholder="e.g. user_123 or select above"
              placeholderTextColor={theme.textMuted}
              style={[styles.searchInput, { color: theme.textPrimary }]}
            />
          </View>

          <Text style={[styles.userMeta, { color: theme.textSecondary, marginBottom: 4, fontWeight: '700' }]}>
            PLAYER DISPLAY NAME (OPTIONAL):
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
            REWARD PRESETS:
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {presetRewards.map((pr) => (
              <TouchableOpacity
                key={pr}
                onPress={() => setAwardRewardText(pr)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: awardRewardText === pr ? '#F59E0B' : theme.inputBg,
                    borderColor: awardRewardText === pr ? '#F59E0B' : theme.inputBorder,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: awardRewardText === pr ? '#000' : theme.textPrimary }]}>
                  {pr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.userMeta, { color: theme.textSecondary, marginBottom: 4, fontWeight: '700' }]}>
            REWARD TEXT:
          </Text>
          <View style={[styles.searchRow, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, marginBottom: 10 }]}>
            <TextInput
              value={awardRewardText}
              onChangeText={setAwardRewardText}
              placeholder="e.g. ₦10,000 voucher or iPhone 15"
              placeholderTextColor={theme.textMuted}
              style={[styles.searchInput, { color: theme.textPrimary }]}
            />
          </View>

          <Text style={[styles.userMeta, { color: theme.textSecondary, marginBottom: 4, fontWeight: '700' }]}>
            VALUE POINTS (VP) TO CREDIT (OPTIONAL):
          </Text>
          <View style={[styles.searchRow, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, marginBottom: 10 }]}>
            <TextInput
              value={awardVp}
              onChangeText={setAwardVp}
              keyboardType="numeric"
              placeholder="e.g. 50 (leaves wallet uncredited if 0)"
              placeholderTextColor={theme.textMuted}
              style={[styles.searchInput, { color: theme.textPrimary }]}
            />
          </View>

          <Text style={[styles.userMeta, { color: theme.textSecondary, marginBottom: 4, fontWeight: '700' }]}>
            PERIOD DATE LABEL (OPTIONAL):
          </Text>
          <View style={[styles.searchRow, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, marginBottom: 14 }]}>
            <TextInput
              value={awardPeriodDate}
              onChangeText={setAwardPeriodDate}
              placeholder="Auto-calculated if blank (e.g. Tuesday, 3 November 2026)"
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
                🏆 Award Winner & Send Reward
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
