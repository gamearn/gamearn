import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ArrowLeft, Users, Trophy, DollarSign, Activity, RefreshCw } from 'lucide-react-native';
import GACard from '../../components/GACard';
import { useTheme } from '../../context/ThemeContext';
import { admin } from '../../services/api';

const formatNaira = (n) => {
  const value = Number(n || 0);
  return `₦${value.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
};

export default function AdminDashboardScreen({ navigation }) {
  const { theme } = useTheme();
  const [stats, setStats] = useState(null);
  const [verifiedUsers, setVerifiedUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [statsRes, verifiedRes] = await Promise.allSettled([
        admin.stats(),
        admin.verifiedUsers(),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (verifiedRes.status === 'fulfilled') setVerifiedUsers(verifiedRes.value);
    } catch (err) {
      // Leave previous values intact on failure.
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

  const statsData = stats?.data ?? stats;
  const verifiedData = verifiedUsers?.data ?? verifiedUsers;
  const verifiedList = Array.isArray(verifiedData)
    ? verifiedData
    : (verifiedData?.users || []);
  const verifiedTotal = verifiedData?.pagination?.total ?? verifiedList.length;

  const metrics = [
    {
      key: 'users',
      icon: <Users size={24} color={theme.primary} />,
      value: statsData?.users?.total_users != null
        ? Number(statsData.users.total_users).toLocaleString()
        : '—',
      label: 'Total Registered Users',
    },
    {
      key: 'live',
      icon: <Activity size={24} color={theme.success} />,
      value: statsData?.liveMatches?.count != null
        ? Number(statsData.liveMatches.count).toLocaleString()
        : '—',
      label: 'Live Matches Playing',
    },
    {
      key: 'revenue',
      icon: <DollarSign size={24} color={theme.accent} />,
      value: statsData?.revenue?.totalNaira != null
        ? formatNaira(statsData.revenue.totalNaira)
        : '—',
      label: 'Platform Revenue (All Time)',
    },
    {
      key: 'tournaments',
      icon: <Trophy size={24} color={theme.secondary} />,
      value: statsData?.tournaments?.total != null
        ? Number(statsData.tournaments.total).toLocaleString()
        : '—',
      label: 'Tournaments Created',
    },
  ];

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.bg }]}>
      <TouchableOpacity
        onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
        style={styles.backBtn}
      >
        <ArrowLeft size={24} color={theme.textPrimary} />
      </TouchableOpacity>

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Admin Control Center</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Gamearn Platform Overview & Metrics
          </Text>
        </View>
        <TouchableOpacity
          onPress={onRefresh}
          style={[styles.refreshBtn, { backgroundColor: theme.surface || 'rgba(255,255,255,0.08)' }]}
          accessibilityLabel="Refresh dashboard"
        >
          <RefreshCw size={18} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading platform metrics…</Text>
        </View>
      ) : (
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

          <View style={styles.sectionHeader}>
            <Users size={16} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Verified Users ({verifiedTotal.toLocaleString()})
            </Text>
          </View>

          {verifiedList.length === 0 ? (
            <Text style={[styles.empty, { color: theme.textSecondary }]}>
              No verified users found.
            </Text>
          ) : (
            verifiedList.slice(0, 10).map((u) => (
              <GACard key={u.uid} style={styles.userRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userName, { color: theme.textPrimary }]}>
                    {u.displayName || u.phoneNumber}
                  </Text>
                  <Text style={[styles.userMeta, { color: theme.textSecondary }]}>
                    {u.email || u.phoneNumber}
                  </Text>
                </View>
                <Text style={[styles.userBalance, { color: theme.success }]}>
                  {formatNaira(u.balanceNaira ?? u.balanceKobo / 100)}
                </Text>
              </GACard>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 50,
  },
  backBtn: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 24,
  },
  loading: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    padding: 18,
    gap: 8,
  },
  metricVal: {
    fontSize: 22,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  empty: {
    textAlign: 'center',
    padding: 24,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
  },
  userMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  userBalance: {
    fontSize: 15,
    fontWeight: '800',
  },
});