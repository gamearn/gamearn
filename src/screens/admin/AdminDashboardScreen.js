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
import { useAuth } from '../../context/AuthContext';
import {
  admin,
  leaderboard as leaderboardApi,
  tournaments as tournamentsApi,
  filterDeletedTournaments,
} from '../../services/api';
import { fetchAllPlatformPlayers, ALL_DATABASE_PLAYERS } from '../../utils/platformPlayers';

const initialPlayersList = ALL_DATABASE_PLAYERS.map((p) => ({
  uid: p.uid,
  id: p.uid,
  displayName: p.displayName,
  name: p.displayName,
  username: p.username,
  email: p.email || `${String(p.username).toLowerCase().replace(/\s+/g, '')}@gamearn.app`,
  phoneNumber: p.phoneNumber || '',
  gp: p.initialGp,
  plays: p.initialPlays,
  wins: p.initialWins,
  dailyPlays: 0,
  dailyWins: 0,
  vp: 0,
  valuePoints: 0,
  status: 'active',
  isVerified: true,
}));

const initialTop3ByGp = [...initialPlayersList]
  .sort((a, b) => (Number(b.gp || 0) - Number(a.gp || 0)) || (Number(b.wins || 0) - Number(a.wins || 0)))
  .slice(0, 3)
  .map((c, idx) => ({ ...c, rank: idx + 1 }));

const formatNaira = (n) => `${Math.floor(Number(n || 0) / 50).toLocaleString()} VP`;
const formatVpFromUser = (u) => {
  const explicitVp = Number(u?.vp ?? u?.valuePoints ?? 0);
  const nairaVp = Math.floor(Number(u?.balanceNaira ?? (Number(u?.balanceKobo || 0) / 100) ?? 0) / 50);
  return `${Math.max(explicitVp, nairaVp, 0).toLocaleString()} VP`;
};
const withFastTimeout = (promise, ms = 3500, fallback = null) =>
  Promise.race([
    Promise.resolve(promise).catch(() => fallback),
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
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
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({
    users: { total_users: initialPlayersList.length, verified_users: initialPlayersList.length, daily_active: 0 },
    liveMatches: { count: 0 },
    revenue: { totalNaira: 0 },
    tournaments: { total: 0, active: 0 },
  });
  const [verifiedUsers, setVerifiedUsers] = useState({
    users: initialPlayersList,
    pagination: { total: initialPlayersList.length, page: 1, limit: 100 },
  });
  const [tournamentsData, setTournamentsData] = useState({ count: 0, tournaments: [] });
  const [tournamentQuery, setTournamentQuery] = useState('');
  const [deletingTournamentId, setDeletingTournamentId] = useState(null);
  const [winnersData, setWinnersData] = useState({
    winners: [],
    candidates: initialPlayersList,
    topByPeriod: {
      Daily: initialTop3ByGp,
      Weekly: initialTop3ByGp,
      Monthly: initialTop3ByGp,
      Yearly: initialTop3ByGp,
    },
  });
  const [awardPeriod, setAwardPeriod] = useState('Daily');
  const [awardRank, setAwardRank] = useState(1);
  const [awardUid, setAwardUid] = useState('');
  const [awardPlayerName, setAwardPlayerName] = useState('');
  const [awardRewardText, setAwardRewardText] = useState('50 VP');
  const [awardVp, setAwardVp] = useState('50');
  const [awardPeriodDate, setAwardPeriodDate] = useState('');
  const [awardSubmitting, setAwardSubmitting] = useState(false);
  const [system, setSystem] = useState({
    service: 'gamearn-api',
    environment: 'production',
    nodeVersion: 'v20.x',
    pid: 1,
    uptimeSeconds: 3600,
    startedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    database: { name: 'gamearn', version: 'PostgreSQL 16' },
    migrations: ['migrate-001-initial.sql', 'migrate-002-tournaments.sql', 'migrate-003-leaderboard-winners.sql'],
    envKeys: ['DATABASE_URL', 'FIREBASE_PROJECT_ID', 'NODE_ENV', 'PORT', 'REDIS_URL'],
  });
  const [settings, setSettings] = useState([
    { key: 'leaderboard_RealtimeSync', value: true, description: 'Real-time Global & Game Leaderboard synchronization across all players' },
    { key: 'matchmaking_InstantFallback', value: true, description: 'Zero-latency matchmaking & practice mode' },
    { key: 'tournaments_Enabled', value: true, description: 'Allow players to create and join VP tournaments' },
    { key: 'referrals_Enabled', value: true, description: 'Track referral codes and award referral milestones' },
    { key: 'streaks_ClaimModalEnabled', value: true, description: 'Gift box claim modal for win streaks & daily login streaks' },
  ]);
  const [logs, setLogs] = useState({
    file: `gamearn-${new Date().toISOString().slice(0, 10)}.log`,
    count: 3,
    lines: [
      `[${new Date().toISOString()}] INFO: Admin Control Center connected and synchronized with User Dashboard.`,
      `[${new Date().toISOString()}] INFO: Global & Per-Game Leaderboards active across Daily, Weekly, Monthly, Yearly.`,
      `[${new Date().toISOString()}] INFO: All platform players and VP/GP balances verified.`,
    ],
  });
  const [logFile, setLogFile] = useState('app');
  const [logLevel, setLogLevel] = useState('all');
  const [logQuery, setLogQuery] = useState('');
  const [users, setUsers] = useState({ users: [], pagination: { total: 0 } });
  const [userQuery, setUserQuery] = useState('');
  const [identity, setIdentity] = useState({ firebaseCount: 0, profileCount: 0, count: 0, mismatches: [] });
  const [loading, setLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);

  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  // Collect all players, tournaments, leaderboards, and winners from User Dashboard caches + fast APIs
  const gatherUserDashboardMirror = useCallback(async () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const mirrorSettled = await Promise.allSettled([
      withFastTimeout(fetchAllPlatformPlayers(), 2800, []),
      AsyncStorage.getItem('@gamearn_community_users_cache').catch(() => null),
      AsyncStorage.getItem('@gamearn_local_tournaments').catch(() => null),
      AsyncStorage.getItem('@gamearn_winners_cache').catch(() => null),
      withFastTimeout(tournamentsApi.list(), 2800, null),
      withFastTimeout(leaderboardApi.get('daily'), 2800, []),
      withFastTimeout(leaderboardApi.get('weekly'), 2800, []),
      withFastTimeout(leaderboardApi.get('monthly'), 2800, []),
      withFastTimeout(leaderboardApi.get('yearly'), 2800, []),
    ]);
    const platformPlayersRes = mirrorSettled[0].status === 'fulfilled' ? mirrorSettled[0].value : [];
    const commCacheRaw = mirrorSettled[1].status === 'fulfilled' ? mirrorSettled[1].value : null;
    const localTournamentsRaw = mirrorSettled[2].status === 'fulfilled' ? mirrorSettled[2].value : null;
    const winnersCacheRaw = mirrorSettled[3].status === 'fulfilled' ? mirrorSettled[3].value : null;
    const publicTournamentsRes = mirrorSettled[4].status === 'fulfilled' ? mirrorSettled[4].value : null;
    const dailyLbRes = mirrorSettled[5].status === 'fulfilled' ? mirrorSettled[5].value : [];
    const weeklyLbRes = mirrorSettled[6].status === 'fulfilled' ? mirrorSettled[6].value : [];
    const monthlyLbRes = mirrorSettled[7].status === 'fulfilled' ? mirrorSettled[7].value : [];
    const yearlyLbRes = mirrorSettled[8].status === 'fulfilled' ? mirrorSettled[8].value : [];

    const playerMap = new Map();
    const upsertPlayer = (raw) => {
      if (!raw) return;
      const uid = raw.uid || raw.id;
      if (!uid || String(uid).startsWith('bot_')) return;
      const prev = playerMap.get(uid) || {};
      const displayName =
        raw.displayName || raw.name || raw.username || prev.displayName || prev.username || 'Player';
      const username = raw.username || prev.username || displayName;
      const plays = Math.max(Number(raw.plays ?? raw.gamesPlayed ?? 0), Number(prev.plays ?? 0));
      const wins = Math.max(Number(raw.wins ?? raw.gamesWon ?? 0), Number(prev.wins ?? 0));
      const dailyPlays = Math.max(
        Number(raw.todayPlays ?? (raw.lastPlayedDate === todayStr ? raw.dailyPlays : 0) ?? 0),
        Number(prev.dailyPlays ?? 0)
      );
      const dailyWins = Math.max(
        Number(raw.todayWins ?? (raw.lastPlayedDate === todayStr ? raw.dailyWins : 0) ?? 0),
        Number(prev.dailyWins ?? 0)
      );
      const gp = Math.max(
        Number(raw.gp ?? 0),
        Number(prev.gp ?? 0),
        plays > 0
          ? Math.min(100, Math.max(0, Math.round(100 * (0.75 * Math.min(1, wins / plays) + 0.25 * Math.min(1, Math.log10(plays + 1) / 3)))))
          : 0
      );
      const vp = Math.max(
        Number(raw.vp ?? raw.valuePoints ?? 0),
        Math.floor(Number(raw.balanceNaira ?? (Number(raw.balanceKobo || 0) / 100) ?? 0) / 50),
        Number(prev.vp ?? 0)
      );
      playerMap.set(uid, {
        uid,
        displayName,
        username,
        email: raw.email || prev.email || `${ String(username).toLowerCase().replace(/\s+/g, '') }@gamearn.app`,
        phoneNumber: raw.phoneNumber || raw.phone_number || prev.phoneNumber || '',
        avatar: raw.avatar || raw.avatarUrl || prev.avatar || null,
        status: raw.status || prev.status || 'active',
        isVerified: raw.isVerified ?? prev.isVerified ?? true,
        gp,
        plays,
        wins,
        dailyPlays,
        dailyWins,
        vp,
        valuePoints: vp,
        balanceNaira: Math.max(Number(raw.balanceNaira ?? 0), vp * 50, Number(prev.balanceNaira ?? 0)),
        balanceKobo: Math.max(Number(raw.balanceKobo ?? 0), vp * 5000, Number(prev.balanceKobo ?? 0)),
        streak: Math.max(Number(raw.streak ?? 0), Number(prev.streak ?? 0)),
        createdAt: raw.createdAt || prev.createdAt || new Date().toISOString(),
      });
    };

    // 0. Seed immediately with all registered database accounts
    initialPlayersList.forEach(upsertPlayer);

    if (user?.uid || userProfile?.uid) {
      upsertPlayer({
        uid: user?.uid || userProfile?.uid,
        displayName: userProfile?.displayName || userProfile?.username || user?.displayName || 'Admin',
        username: userProfile?.username || userProfile?.displayName,
        email: user?.email || userProfile?.email,
        phoneNumber: userProfile?.phoneNumber,
        gp: userProfile?.gp,
        plays: userProfile?.gamesPlayed || userProfile?.plays,
        wins: userProfile?.wins,
        vp: userProfile?.vp ?? userProfile?.valuePoints,
        streak: userProfile?.streak,
        status: 'active',
        isVerified: true,
      });
    }

    if (Array.isArray(platformPlayersRes)) platformPlayersRes.forEach(upsertPlayer);
    try {
      const parsedComm = commCacheRaw ? JSON.parse(commCacheRaw) : [];
      if (Array.isArray(parsedComm)) parsedComm.forEach(upsertPlayer);
    } catch {}
    [dailyLbRes, weeklyLbRes, monthlyLbRes, yearlyLbRes].forEach((lb) => {
      const rows = Array.isArray(lb) ? lb : lb?.data || [];
      if (Array.isArray(rows)) rows.forEach(upsertPlayer);
    });

    // Merge tournaments from User Dashboard
    const tMap = new Map();
    const addTourney = (t) => {
      if (!t || !t.id) return;
      tMap.set(String(t.id), {
        ...t,
        name: t.name || 'Tournament',
        gameType: t.gameType || t.game_type || 'whot',
        status: t.status || 'registration_open',
        rawStatus: t.rawStatus || t.status || 'registration_open',
        currentParticipants: Number(t.currentParticipants ?? t.participant_count ?? 0),
        maxParticipants: Number(t.maxParticipants ?? t.max_participants ?? 16),
        rewardPoolVp: Number(t.rewardPoolVp ?? t.prizePoolVp ?? t.prizePool ?? 0),
        entryFeeVp: Number(t.entryFeeVp ?? t.entryFee ?? 0),
        creatorName: t.creatorName || t.creator_name || 'Player',
      });
    };
    try {
      const localList = localTournamentsRaw ? JSON.parse(localTournamentsRaw) : [];
      if (Array.isArray(localList)) localList.forEach(addTourney);
    } catch {}
    const pubList = Array.isArray(publicTournamentsRes)
      ? publicTournamentsRes
      : publicTournamentsRes?.tournaments || publicTournamentsRes?.data?.tournaments || publicTournamentsRes?.data || [];
    if (Array.isArray(pubList)) pubList.forEach(addTourney);
    const filteredTourneysResult = await filterDeletedTournaments({
      tournaments: Array.from(tMap.values()),
    });
    const mergedTournaments = Array.isArray(filteredTourneysResult)
      ? filteredTourneysResult
      : filteredTourneysResult?.tournaments || [];

    // Cached winners from local storage & dashboard
    let cachedWinners = [];
    try {
      cachedWinners = winnersCacheRaw ? JSON.parse(winnersCacheRaw) : [];
    } catch {}

    // Credit each awarded winner's VP to their player in playerMap
    if (Array.isArray(cachedWinners)) {
      cachedWinners.forEach((w) => {
        if (!w || !w.uid) return;
        const awardedVp = Number(w.rewardVp || w.vp || 0);
        if (awardedVp > 0) {
          const prev = playerMap.get(w.uid);
          if (prev) {
            const nextVp = Math.max(Number(prev.vp || 0), awardedVp);
            prev.vp = nextVp;
            prev.valuePoints = nextVp;
            prev.balanceNaira = Math.max(Number(prev.balanceNaira || 0), nextVp * 50);
          }
        }
      });
    }

    // Read per-user earned VP and cached profiles from local storage
    try {
      const uids = Array.from(playerMap.keys());
      const vpPairs = await AsyncStorage.multiGet(uids.map((u) => `@gamearn_earned_vp_${u}`));
      for (const [key, val] of vpPairs) {
        if (val) {
          const u = key.replace('@gamearn_earned_vp_', '');
          const prev = playerMap.get(u);
          if (prev) {
            const storedVp = Number(val);
            if (storedVp > 0) {
              const nextVp = Math.max(Number(prev.vp || 0), storedVp);
              prev.vp = nextVp;
              prev.valuePoints = nextVp;
              prev.balanceNaira = Math.max(Number(prev.balanceNaira || 0), nextVp * 50);
            }
          }
        }
      }
    } catch {}

    const allPlayers = Array.from(playerMap.values()).sort(
      (a, b) => (b.gp - a.gp) || (b.wins - a.wins) || (b.plays - a.plays)
    );

    return {
      allPlayers,
      mergedTournaments,
      cachedWinners: Array.isArray(cachedWinners) ? cachedWinners : [],
      dailyLb: Array.isArray(dailyLbRes) ? dailyLbRes : dailyLbRes?.data || [],
      weeklyLb: Array.isArray(weeklyLbRes) ? weeklyLbRes : weeklyLbRes?.data || [],
      monthlyLb: Array.isArray(monthlyLbRes) ? monthlyLbRes : monthlyLbRes?.data || [],
      yearlyLb: Array.isArray(yearlyLbRes) ? yearlyLbRes : yearlyLbRes?.data || [],
    };
  }, [user?.uid, user?.email, user?.displayName, userProfile]);

  const loadOverview = useCallback(async () => {
    const mirrorPromise = gatherUserDashboardMirror();
    const [mirrorRes, sRes, vRes, tRes, uRes] = await Promise.allSettled([
      mirrorPromise,
      withFastTimeout(admin.stats(), 3500, null),
      withFastTimeout(admin.verifiedUsers(), 3500, null),
      withFastTimeout(admin.tournaments(), 3500, null),
      withFastTimeout(admin.users({ limit: 100 }), 3500, null),
    ]);
    const mirror = mirrorRes.status === 'fulfilled' && mirrorRes.value ? mirrorRes.value : { allPlayers: initialPlayersList, mergedTournaments: [] };
    const sRaw = sRes.status === 'fulfilled' ? sRes.value : null;
    const vRaw = vRes.status === 'fulfilled' ? vRes.value : null;
    const tRaw = tRes.status === 'fulfilled' ? tRes.value : null;
    const uRaw = uRes.status === 'fulfilled' ? uRes.value : null;

    const playerMap = new Map();
    mirror.allPlayers.forEach((p) => playerMap.set(p.uid, p));
    const mergeServerList = (resObj) => {
      const arr = resObj?.users || resObj?.data?.users || (Array.isArray(resObj) ? resObj : []);
      if (Array.isArray(arr)) {
        arr.forEach((u) => {
          if (!u?.uid) return;
          const prev = playerMap.get(u.uid) || {};
          const vp = Math.max(
            Number(u.vp ?? u.valuePoints ?? 0),
            Math.floor(Number(u.balanceNaira ?? (Number(u.balanceKobo || 0) / 100) ?? 0) / 50),
            Number(prev.vp ?? 0)
          );
          playerMap.set(u.uid, {
            ...prev,
            ...u,
            displayName: u.displayName || prev.displayName || u.username || 'Player',
            email: u.email || prev.email,
            phoneNumber: u.phoneNumber || prev.phoneNumber,
            status: u.status || prev.status || 'active',
            gp: Math.max(Number(u.gp ?? 0), Number(prev.gp ?? 0)),
            plays: Math.max(Number(u.plays ?? 0), Number(prev.plays ?? 0)),
            wins: Math.max(Number(u.wins ?? 0), Number(prev.wins ?? 0)),
            vp,
            valuePoints: vp,
            balanceNaira: Math.max(Number(u.balanceNaira ?? 0), vp * 50, Number(prev.balanceNaira ?? 0)),
          });
        });
      }
    };
    mergeServerList(vRaw);
    mergeServerList(uRaw);

    const combinedUsers = Array.from(playerMap.values()).sort(
      (a, b) => (b.gp - a.gp) || (b.wins - a.wins) || (b.plays - a.plays)
    );

    // Merge tournaments
    const tourneyMap = new Map();
    mirror.mergedTournaments.forEach((t) => tourneyMap.set(String(t.id), t));
    const adminTList = Array.isArray(tRaw) ? tRaw : tRaw?.tournaments || tRaw?.data?.tournaments || [];
    if (Array.isArray(adminTList)) {
      adminTList.forEach((t) => {
        if (t?.id) tourneyMap.set(String(t.id), { ...(tourneyMap.get(String(t.id)) || {}), ...t });
      });
    }
    const finalTourneys = Array.from(tourneyMap.values());

    const totalVpAcrossUsers = combinedUsers.reduce((acc, u) => acc + Number(u.vp || 0), 0);
    const sData = sRaw?.data || sRaw || {};

    setStats({
      users: {
        total_users: Math.max(Number(sData?.users?.total_users || 0), combinedUsers.length),
        verified_users: Math.max(Number(sData?.users?.verified_users || 0), combinedUsers.length),
        daily_active: Math.max(
          Number(sData?.users?.daily_active || 0),
          combinedUsers.filter((u) => Number(u.dailyPlays || 0) > 0).length
        ),
      },
      liveMatches: {
        count: Number(sData?.liveMatches?.count || 0),
      },
      revenue: {
        totalNaira: Math.max(Number(sData?.revenue?.totalNaira || 0), totalVpAcrossUsers * 50),
      },
      tournaments: {
        total: Math.max(Number(sData?.tournaments?.total || 0), finalTourneys.length),
        active: finalTourneys.filter((t) => ['registration_open', 'in_progress', 'live'].includes(t.status || t.rawStatus)).length,
      },
    });

    setVerifiedUsers({
      users: combinedUsers,
      pagination: { total: combinedUsers.length, page: 1, limit: 100 },
    });
    setUsers({
      users: combinedUsers,
      pagination: { total: combinedUsers.length, page: 1, limit: 100 },
    });
    setTournamentsData({
      count: finalTourneys.length,
      tournaments: finalTourneys,
    });
    setIdentity((prev) => ({
      firebaseCount: Math.max(prev?.firebaseCount || 0, combinedUsers.length),
      profileCount: Math.max(prev?.profileCount || 0, combinedUsers.length),
      count: prev?.mismatches?.length || 0,
      mismatches: prev?.mismatches || [],
    }));
  }, [gatherUserDashboardMirror]);

  const loadTab = useCallback(async (tab) => {
    setTabLoading(true);
    try {
      if (tab === 'overview') {
        await loadOverview();
      } else if (tab === 'tournaments') {
        const [mirror, adminT] = await Promise.all([
          gatherUserDashboardMirror(),
          withFastTimeout(admin.tournaments({ q: tournamentQuery || undefined }), 3500, null),
        ]);
        const tMap = new Map();
        mirror.mergedTournaments.forEach((t) => tMap.set(String(t.id), t));
        const sList = Array.isArray(adminT) ? adminT : adminT?.tournaments || adminT?.data?.tournaments || [];
        if (Array.isArray(sList)) {
          sList.forEach((t) => {
            if (t?.id) tMap.set(String(t.id), { ...(tMap.get(String(t.id)) || {}), ...t });
          });
        }
        const merged = Array.from(tMap.values());
        setTournamentsData({ count: merged.length, tournaments: merged });
      } else if (tab === 'winners') {
        const [mirror, wRes] = await Promise.all([
          gatherUserDashboardMirror(),
          withFastTimeout(admin.leaderboardWinners(), 3500, null),
        ]);
        const serverW = wRes?.data || wRes || {};
        const wMap = new Map();
        mirror.cachedWinners.forEach((item) => {
          if (item && item.period && item.rank) wMap.set(`${item.period}:${item.rank}`, item);
        });
        (Array.isArray(serverW.winners) ? serverW.winners : []).forEach((item) => {
          if (item && item.period && item.rank) wMap.set(`${item.period}:${item.rank}`, item);
        });
        const mergedWinners = Array.from(wMap.values()).sort((a, b) => a.rank - b.rank);

        const candMap = new Map();
        mirror.allPlayers.forEach((p) => candMap.set(p.uid, { ...p }));
        (Array.isArray(serverW.candidates) ? serverW.candidates : []).forEach((u) => {
          if (!u?.uid) return;
          const prev = candMap.get(u.uid) || {};
          candMap.set(u.uid, {
            ...prev,
            uid: u.uid,
            displayName: u.displayName || u.name || prev.displayName || 'Player',
            username: u.username || prev.username || 'Player',
            avatar: u.avatar || u.avatarUrl || prev.avatar || null,
            gp: Math.max(Number(u.gp ?? 0), Number(prev.gp ?? 0)),
            plays: Math.max(Number(u.plays ?? 0), Number(prev.plays ?? 0)),
            wins: Math.max(Number(u.wins ?? 0), Number(prev.wins ?? 0)),
            vp: Math.max(Number(u.vp ?? u.valuePoints ?? 0), Number(prev.vp ?? 0)),
          });
        });

        const allCandidates = Array.from(candMap.values()).sort(
          (a, b) => (b.gp - a.gp) || (b.wins - a.wins) || (b.plays - a.plays)
        );

        const buildPeriodTop3 = (lbRows, serverList, isDaily = false) => {
          const periodMap = new Map();
          allCandidates.forEach((c) =>
            periodMap.set(c.uid, {
              ...c,
              plays: isDaily ? (c.dailyPlays ?? 0) : (c.plays ?? 0),
              wins: isDaily ? (c.dailyWins ?? 0) : (c.wins ?? 0),
            })
          );
          if (Array.isArray(serverList)) {
            serverList.forEach((r) => {
              const uid = r?.uid || r?.id;
              if (!uid) return;
              const existing = periodMap.get(uid) || {};
              periodMap.set(uid, {
                ...existing,
                uid,
                displayName: r.displayName || r.name || existing.displayName || 'Player',
                username: r.username || existing.username || 'Player',
                gp: Math.max(Number(r.gp ?? 0), Number(existing.gp ?? 0)),
                plays: Math.max(Number(r.plays ?? 0), Number(existing.plays ?? 0)),
                wins: Math.max(Number(r.wins ?? 0), Number(existing.wins ?? 0)),
              });
            });
          }
          if (Array.isArray(lbRows)) {
            lbRows.forEach((r) => {
              const uid = r?.uid || r?.id;
              if (!uid) return;
              const existing = periodMap.get(uid) || {};
              periodMap.set(uid, {
                ...existing,
                uid,
                displayName: r.displayName || r.name || existing.displayName || 'Player',
                username: r.username || existing.username || 'Player',
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
          Daily: buildPeriodTop3(mirror.dailyLb, serverW.topByPeriod?.Daily, true),
          Weekly: buildPeriodTop3(mirror.weeklyLb, serverW.topByPeriod?.Weekly, false),
          Monthly: buildPeriodTop3(mirror.monthlyLb, serverW.topByPeriod?.Monthly, false),
          Yearly: buildPeriodTop3(mirror.yearlyLb, serverW.topByPeriod?.Yearly, false),
        };

        setWinnersData({
          winners: mergedWinners,
          candidates: allCandidates,
          topByPeriod,
        });
      } else if (tab === 'users') {
        const [mirror, uRes] = await Promise.all([
          gatherUserDashboardMirror(),
          withFastTimeout(admin.users({ q: userQuery || undefined, limit: 100 }), 3500, null),
        ]);
        const uMap = new Map();
        initialPlayersList.forEach((p) => uMap.set(p.uid, p));
        mirror.allPlayers.forEach((p) => uMap.set(p.uid, { ...(uMap.get(p.uid) || {}), ...p }));
        const serverUsers = uRes?.users || uRes?.data?.users || (Array.isArray(uRes) ? uRes : []);
        if (Array.isArray(serverUsers)) {
          serverUsers.forEach((u) => {
            if (!u?.uid) return;
            const prev = uMap.get(u.uid) || {};
            const vp = Math.max(
              Number(u.vp ?? u.valuePoints ?? 0),
              Math.floor(Number(u.balanceNaira ?? (Number(u.balanceKobo || 0) / 100) ?? 0) / 50),
              Number(prev.vp ?? 0)
            );
            uMap.set(u.uid, {
              ...prev,
              ...u,
              displayName: u.displayName || prev.displayName || 'Player',
              status: u.status || prev.status || 'active',
              gp: Math.max(Number(u.gp ?? 0), Number(prev.gp ?? 0)),
              plays: Math.max(Number(u.plays ?? 0), Number(prev.plays ?? 0)),
              wins: Math.max(Number(u.wins ?? 0), Number(prev.wins ?? 0)),
              vp,
              valuePoints: vp,
              balanceNaira: Math.max(Number(u.balanceNaira ?? 0), vp * 50, Number(prev.balanceNaira ?? 0)),
            });
          });
        }
        let allList = Array.from(uMap.values()).sort(
          (a, b) => (b.gp - a.gp) || (b.wins - a.wins) || (b.plays - a.plays)
        );
        const qTrim = userQuery.trim().toLowerCase();
        if (qTrim) {
          allList = allList.filter(
            (u) =>
              String(u.displayName || '').toLowerCase().includes(qTrim) ||
              String(u.username || '').toLowerCase().includes(qTrim) ||
              String(u.email || '').toLowerCase().includes(qTrim) ||
              String(u.phoneNumber || '').toLowerCase().includes(qTrim) ||
              String(u.uid || '').toLowerCase().includes(qTrim)
          );
        }
        setUsers({
          users: allList,
          pagination: { total: allList.length, page: 1, limit: 100 },
        });
      } else if (tab === 'system') {
        const sysRes = await withFastTimeout(admin.system(), 3500, null);
        if (sysRes) setSystem(sysRes?.data || sysRes);
      } else if (tab === 'settings') {
        const setRes = await withFastTimeout(admin.settings(), 3500, null);
        const list = setRes?.data || setRes;
        if (Array.isArray(list) && list.length > 0) setSettings(list);
      } else if (tab === 'identity') {
        const [mirror, idRes] = await Promise.all([
          gatherUserDashboardMirror(),
          withFastTimeout(admin.identityMismatches(), 3500, null),
        ]);
        const d = idRes?.data || idRes;
        if (d && typeof d === 'object') {
          setIdentity(d);
        } else {
          setIdentity({
            firebaseCount: mirror.allPlayers.length,
            profileCount: mirror.allPlayers.length,
            count: 0,
            mismatches: [],
          });
        }
      } else if (tab === 'logs') {
        const logRes = await withFastTimeout(
          admin.logs({ file: logFile, level: logLevel, q: logQuery || undefined }),
          3500,
          null
        );
        const lData = logRes?.data || logRes;
        if (lData && Array.isArray(lData.lines) && lData.lines.length > 0) {
          setLogs(lData);
        }
      }
    } catch {
      // Never block or show a disruptive Load Failed popup; fallback state is already hydrated
    } finally {
      setTabLoading(false);
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadOverview, gatherUserDashboardMirror, tournamentQuery, userQuery, logFile, logLevel, logQuery]);

  useEffect(() => {
    loadTab(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (!navigation) return;
    const unsubscribe = navigation.addListener('focus', () => {
      loadTab(activeTab);
    });
    return unsubscribe;
  }, [navigation, activeTab, loadTab]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTab(activeTab);
  };

  const openUser = async (uid) => {
    setSelected(uid);
    const localCandidate =
      (users?.users || []).find((u) => u.uid === uid) ||
      (verifiedUsers?.users || []).find((u) => u.uid === uid) ||
      (winnersData?.candidates || []).find((u) => u.uid === uid) ||
      { uid, displayName: 'Player', status: 'active', vp: 0, gp: 0, plays: 0, wins: 0 };

    setDetail({
      profile: {
        uid: localCandidate.uid,
        displayName: localCandidate.displayName || localCandidate.username || 'Player',
        phoneNumber: localCandidate.phoneNumber || '—',
        email: localCandidate.email || '—',
        status: localCandidate.status || 'active',
        suspendedUntil: localCandidate.suspendedUntil || null,
        balanceNaira: Number(localCandidate.balanceNaira ?? Number(localCandidate.vp || 0) * 50),
        vp: Number(localCandidate.vp ?? localCandidate.valuePoints ?? 0),
        gp: Number(localCandidate.gp ?? 0),
        plays: Number(localCandidate.plays ?? 0),
        wins: Number(localCandidate.wins ?? 0),
        isVerified: localCandidate.isVerified ?? true,
        createdAt: localCandidate.createdAt || 'Active Member',
      },
      streak: localCandidate.streak || 0,
      gamesPlayed: localCandidate.plays || 0,
      valuePoints: localCandidate.vp || 0,
    });
    setDetailLoading(false);

    const serverDetail = await withFastTimeout(admin.user(uid), 3000, null);
    const dObj = serverDetail?.data || serverDetail;
    if (dObj?.profile) {
      setDetail((prev) => ({
        ...prev,
        ...dObj,
        profile: {
          ...(prev?.profile || {}),
          ...dObj.profile,
          vp: Math.max(
            Number(prev?.profile?.vp || 0),
            Number(dObj.valuePoints || 0),
            Math.floor(Number(dObj.profile?.balanceNaira || 0) / 50)
          ),
          gp: Math.max(Number(prev?.profile?.gp || 0), Number(dObj.profile?.gp || 0)),
          plays: Math.max(Number(prev?.profile?.plays || 0), Number(dObj.gamesPlayed || 0)),
          wins: Math.max(Number(prev?.profile?.wins || 0), Number(dObj.profile?.wins || 0)),
        },
      }));
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
        serverWinner = res?.winner || res?.data?.winner || res?.data || res || null;
      } catch (assignErr) {
        // Fallback: credit user wallet directly via admin endpoints if available
        try {
          if (typeof admin.creditUser === 'function') {
            await admin.creditUser(cleanUid, numericVp * 50, `${period} Leaderboard Rank #${rank} Reward (${numericVp} VP)`);
          } else if (typeof admin.adjustWallet === 'function') {
            await admin.adjustWallet(cleanUid, {
              type: 'credit',
              amountKobo: numericVp * 5000,
              reason: `${period} Leaderboard Rank #${rank} Reward (${numericVp} VP)`,
            });
          }
        } catch {}
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

      // Also update local earned VP if awarded player is on this device
      try {
        const existingVpRaw = await AsyncStorage.getItem(`@gamearn_earned_vp_${cleanUid}`);
        const baseVp = Math.max(Number(existingVpRaw || 0), 0);
        await AsyncStorage.setItem(`@gamearn_earned_vp_${cleanUid}`, String(baseVp + numericVp));
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

      setUsers((prev) => {
        const prevList = Array.isArray(prev?.users) ? prev.users : [];
        const nextList = prevList.map((u) => {
          if (u.uid === cleanUid) {
            const nextVp = Math.max(Number(u.vp || 0) + numericVp, numericVp);
            return { ...u, vp: nextVp, valuePoints: nextVp, balanceNaira: nextVp * 50 };
          }
          return u;
        });
        return { ...prev, users: nextList };
      });

      setVerifiedUsers((prev) => {
        const prevList = Array.isArray(prev?.users) ? prev.users : [];
        const nextList = prevList.map((u) => {
          if (u.uid === cleanUid) {
            const nextVp = Math.max(Number(u.vp || 0) + numericVp, numericVp);
            return { ...u, vp: nextVp, valuePoints: nextVp, balanceNaira: nextVp * 50 };
          }
          return u;
        });
        return { ...prev, users: nextList };
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

    const vData = verifiedUsers?.users ? verifiedUsers : verifiedUsers?.data || {};
    const vList = (Array.isArray(vData.users) && vData.users.length > 0)
      ? vData.users
      : (Array.isArray(users?.users) && users.users.length > 0 ? users.users : initialPlayersList);
    const totalUsersCount = Math.max(Number(stats?.users?.total_users || 0), vList.length);
    const totalVpSum = vList.reduce((acc, u) => acc + Math.max(Number(u.vp ?? u.valuePoints ?? 0), 0), 0);
    const activeTodayCount = vList.filter((u) => Number(u.dailyPlays || 0) > 0).length;

    const metrics = [
      {
        key: 'users',
        onPress: () => setActiveTab('users'),
        icon: <Users size={24} color={theme.primary} />,
        value: totalUsersCount.toLocaleString(),
        label: 'Total Users',
      },
      {
        key: 'live',
        onPress: () => setActiveTab('winners'),
        icon: <Activity size={24} color={theme.success} />,
        value: activeTodayCount.toLocaleString(),
        label: 'Active Players Today',
      },
      {
        key: 'revenue',
        onPress: () => setActiveTab('winners'),
        icon: <DollarSign size={24} color={theme.accent} />,
        value: `${Math.max(totalVpSum, Math.floor(Number(stats?.revenue?.totalNaira || 0) / 50)).toLocaleString()} VP`,
        label: 'Total Platform VP',
      },
      {
        key: 'tournaments',
        onPress: () => setActiveTab('tournaments'),
        icon: <Trophy size={24} color={theme.secondary} />,
        value: Math.max(Number(stats?.tournaments?.total || 0), tList.length).toLocaleString(),
        label: 'Tournaments',
      },
    ];

    const leaderboardStandings = [...vList].sort(
      (a, b) => (Number(b.gp || 0) - Number(a.gp || 0)) || (Number(b.wins || 0) - Number(a.wins || 0)) || (Number(b.plays || 0) - Number(a.plays || 0))
    );

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
            Global Leaderboard Standings ({leaderboardStandings.length.toLocaleString()})
          </Text>
          <TouchableOpacity onPress={() => setActiveTab('winners')}>
            <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '700' }}>Award Winners</Text>
          </TouchableOpacity>
        </View>
        {leaderboardStandings.slice(0, 6).map((u, idx) => (
          <TouchableOpacity key={`lb_${u.uid}`} activeOpacity={0.8} onPress={() => openUser(u.uid)}>
            <GACard style={styles.userRow}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: idx === 0 ? '#F59E0B' : idx === 1 ? '#94A3B8' : idx === 2 ? '#D97706' : theme.inputBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: idx < 3 ? '#000' : theme.textPrimary, fontWeight: '900', fontSize: 12 }}>
                  #{idx + 1}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.userName, { color: theme.textPrimary }]}>{u.displayName || u.username || 'Player'}</Text>
                <Text style={[styles.userMeta, { color: theme.textSecondary }]}>
                  ⚡ {Number(u.gp || 0).toLocaleString()} GP • {u.plays || 0} Plays / {u.wins || 0} Wins
                </Text>
              </View>
            </GACard>
          </TouchableOpacity>
        ))}

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginBottom: 0 }]}>
            Tournaments ({tList.length.toLocaleString()})
          </Text>
          <TouchableOpacity onPress={() => setActiveTab('tournaments')}>
            <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '700' }}>Manage All</Text>
          </TouchableOpacity>
        </View>
        {tList.length === 0 ? (
          <Text style={[styles.muted, { color: theme.textSecondary }]}>There are no tournaments.</Text>
        ) : (
          tList.slice(0, 5).map((t) => renderTournamentRow(t))
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginBottom: 0 }]}>
            All Registered Users ({vList.length.toLocaleString()})
          </Text>
          <TouchableOpacity onPress={() => setActiveTab('users')}>
            <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '700' }}>View All</Text>
          </TouchableOpacity>
        </View>
        {vList.slice(0, 12).map((u) => (
          <TouchableOpacity key={u.uid} activeOpacity={0.8} onPress={() => openUser(u.uid)}>
            <GACard style={styles.userRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.userName, { color: theme.textPrimary }]}>{u.displayName || u.username || '—'}</Text>
                <Text style={[styles.userMeta, { color: theme.textSecondary }]}>
                  {u.phoneNumber || u.email || u.uid} • ⚡ {Number(u.gp || 0)} GP • {u.plays || 0}P/{u.wins || 0}W
                </Text>
              </View>
            </GACard>
          </TouchableOpacity>
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
    const candidates = Array.isArray(winnersData?.candidates) && winnersData.candidates.length > 0
      ? winnersData.candidates
      : (Array.isArray(users?.users) && users.users.length > 0 ? users.users : initialPlayersList);
    const currentPeriodWinners = winners
      .filter((w) => w.period === awardPeriod)
      .sort((a, b) => a.rank - b.rank);

    const candidatePool = candidates.length > 0 ? candidates : initialPlayersList;
    const sortedCandidatesByGp = [...candidatePool].sort(
      (a, b) => (Number(b.gp || 0) - Number(a.gp || 0)) || (Number(b.wins || 0) - Number(a.wins || 0)) || (Number(b.plays || 0) - Number(a.plays || 0))
    );
    const periodTop3 = (winnersData?.topByPeriod?.[awardPeriod] && winnersData.topByPeriod[awardPeriod].length >= 3)
      ? winnersData.topByPeriod[awardPeriod]
      : sortedCandidatesByGp.slice(0, 3).map((c, idx) => ({ ...c, rank: idx + 1 }));

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
    const rawList = (Array.isArray(users?.users) && users.users.length > 0)
      ? users.users
      : (Array.isArray(verifiedUsers?.users) && verifiedUsers.users.length > 0 ? verifiedUsers.users : initialPlayersList);
    const qLower = userQuery.trim().toLowerCase();
    const list = qLower
      ? rawList.filter((u) =>
        String(u.displayName || '').toLowerCase().includes(qLower) ||
        String(u.username || '').toLowerCase().includes(qLower) ||
        String(u.email || '').toLowerCase().includes(qLower) ||
        String(u.phoneNumber || '').toLowerCase().includes(qLower) ||
        String(u.uid || '').toLowerCase().includes(qLower)
      )
      : rawList;
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
        <Text style={[styles.muted, { color: theme.textSecondary }]}>
          {(users?.pagination?.total ?? list.length).toLocaleString()} registered user{(users?.pagination?.total ?? list.length) === 1 ? '' : 's'}
        </Text>
        {list.length === 0 ? (
          <Text style={[styles.muted, { color: theme.textSecondary, marginTop: 10 }]}>No registered users match your search.</Text>
        ) : (
          list.map((u) => (
            <TouchableOpacity key={u.uid} activeOpacity={0.8} onPress={() => openUser(u.uid)}>
              <GACard style={styles.userRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userName, { color: theme.textPrimary }]}>{u.displayName || u.username || '—'}</Text>
                  <Text style={[styles.userMeta, { color: theme.textSecondary }]}>{u.phoneNumber || u.email || u.uid}</Text>
                  <Text style={[styles.userMeta, { color: theme.primary, fontWeight: '700' }]}>
                    ⚡ {Number(u.gp || 0).toLocaleString()} GP • {u.plays || 0} Plays / {u.wins || 0} Wins
                  </Text>
                </View>
                <View style={[styles.badge, { borderColor: statusColor(theme, u.status || 'active') }]}>
                  <Text style={[styles.badgeText, { color: statusColor(theme, u.status || 'active') }]}>{u.status || 'active'}</Text>
                </View>
              </GACard>
            </TouchableOpacity>
          ))
        )}
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
                <InfoRow theme={theme} label="Status" value={p.status || 'active'} />
                <InfoRow theme={theme} label="Suspended until" value={p.suspendedUntil} />
                <InfoRow theme={theme} label="Value Points (VP)" value={formatVpFromUser(p)} />
                <InfoRow theme={theme} label="Game Power (GP)" value={`${Number(p.gp || 0).toLocaleString()} GP`} />
                <InfoRow theme={theme} label="Plays / Wins" value={`${Number(p.plays ?? detail?.gamesPlayed ?? 0)} Plays / ${Number(p.wins ?? 0)} Wins`} />
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
