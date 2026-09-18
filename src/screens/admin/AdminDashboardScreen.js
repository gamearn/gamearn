import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, Users, Trophy, DollarSign, Activity } from 'lucide-react-native';
import GACard from '../../components/GACard';
import { useTheme } from '../../context/ThemeContext';

export default function AdminDashboardScreen({ navigation }) {
  const { theme } = useTheme();

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.bg }]}>
      <TouchableOpacity onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))} style={styles.backBtn}>
        <ArrowLeft size={24} color={theme.textPrimary} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: theme.textPrimary }]}>Admin Control Center</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Gamearn Platform Overview & Metrics
      </Text>

      <View style={styles.metricsGrid}>
        <GACard style={styles.metricCard}>
          <Users size={24} color={theme.primary} />
          <Text style={[styles.metricVal, { color: theme.textPrimary }]}>12,450</Text>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total Registered Users</Text>
        </GACard>

        <GACard style={styles.metricCard}>
          <Activity size={24} color={theme.success} />
          <Text style={[styles.metricVal, { color: theme.textPrimary }]}>342</Text>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Live Matches Playing</Text>
        </GACard>

        <GACard style={styles.metricCard}>
          <DollarSign size={24} color={theme.accent} />
          <Text style={[styles.metricVal, { color: theme.textPrimary }]}>₦4.8M</Text>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Platform Revenue</Text>
        </GACard>

        <GACard style={styles.metricCard}>
          <Trophy size={24} color={theme.secondary} />
          <Text style={[styles.metricVal, { color: theme.textPrimary }]}>88</Text>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Tournaments Created</Text>
        </GACard>
      </View>
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
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 24,
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
});
