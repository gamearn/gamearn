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
  DollarSign,
  Activity,
  RefreshCw,
  Server,
  ScrollText,
  SlidersHorizontal,
  ShieldAlert,
  Search,
  X,
} from 'lucide-react-native';
import GACard from '../../components/GACard';
import { useTheme } from '../../context/ThemeContext';
import { admin } from '../../services/api';

const formatNaira = (n) => `${Math.floor(Number(n || 0) / 50).toLocaleString()} VP`;
const statusColor = (theme, status) => {
  switch (status) {
    case 'active': return theme.success;
    case 'suspended': return theme.accent;
    case 'banned':
    case 'deleted': return theme.danger || '#FF6B6B';
    default: return theme.textSecondary;
  }
};

const TABS = [
  { key: 'overview', label: 'Overview', icon: Activity },
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
    const [s, v] = await Promise.allSettled([admin.stats(), admin.verifiedUsers()]);
    if (s.status === 'fulfilled') setStats(s.value);
    if (v.status === 'fulfilled') setVerifiedUsers(v.value);
  }, []);

  const loadTab = useCallback(async (tab) => {
    setTabLoading(true);
    try {
      if (tab === 'overview') await loadOverview();
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
  }, [loadOverview, userQuery, logFile, logLevel, logQuery]);

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

  const suspend = (days) =>
    confirm('Suspend user', `Suspend this account for ${days} day(s)?`, () =>
      runAction('Suspend', () => admin.suspendUser(selected, { days, reason: `Suspended by admin for ${days}d` })),
    );

  const renderOverview = () => {
    const metrics = [
      { key: 'users', icon: <Users size={24} color={theme.primary} />, value: stats?.users?.total_users != null ? Number(stats.users.total_users).toLocaleString() : '—', label: 'Total Users' },
      { key: 'live', icon: <Activity size={24} color={theme.success} />, value: stats?.liveMatches?.count != null ? Number(stats.liveMatches.count).toLocaleString() : '—', label: 'Live Matches' },
      { key: 'revenue', icon: <DollarSign size={24} color={theme.accent} />, value: stats?.revenue?.totalNaira != null ? formatNaira(stats.revenue.totalNaira) : '—', label: 'Platform Revenue' },
      { key: 'tournaments', icon: <Trophy size={24} color={theme.secondary} />, value: stats?.tournaments?.total != null ? Number(stats.tournaments.total).toLocaleString() : '—', label: 'Tournaments' },
    ];
    const vData = verifiedUsers?.users ? verifiedUsers : verifiedUsers?.data || {};
    const vList = vData.users || [];
    return (
      <>
        <View style={styles.metricsGrid}>
          {metrics.map((m) => (
            <GACard key={m.key} style={styles.metricCard}>
              {m.icon}
              <Text style={[styles.metricVal, { color: theme.textPrimary }]}>{m.value}</Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{m.label}</Text>
            </GACard>
          ))}
        </View>
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
    const rows = settings || [];
    return (
      <>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Feature Flags</Text>
        {settings == null && <ActivityIndicator color={theme.primary} />}
        {Array.isArray(settings) && settings.map((s) => {
          const isBool = typeof s.value === 'boolean';
          return (
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
          );
        })}
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
  sectionTitle: { fontSize: 15, fontWeight: '800', marginTop: 12, marginBottom: 8 },
  userRow: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 8, gap: 10 },
  userName: { fontSize: 15, fontWeight: '700' },
  userMeta: { fontSize: 12, marginTop: 2 },
  userBalance: { fontSize: 14, fontWeight: '800' },
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
