import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Flame, Lock, Check } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { streak } from '../../services/api';

export default function DailyStreakScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useFocusEffect(useCallback(() => {
    let mounted = true;
    setLoading(true);
    streak.get().then((response) => mounted && setData(response?.data || response || null))
      .catch((err) => mounted && setError(err?.message || 'Unable to load streak'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []));
  const days = Number(data?.currentStreak) || 0;
  const next = data?.nextMilestone;
  const milestones = data?.milestones || [];
  return <View style={[styles.root, { backgroundColor: theme.bg }]}>
    <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
    <LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />
    <View style={styles.header}><TouchableOpacity onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))} style={[styles.back, { backgroundColor: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.05)' }]}><ArrowLeft size={20} color={theme.textPrimary} /></TouchableOpacity><Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Daily Streak</Text><View style={{ width: 40 }} /></View>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}><View style={styles.flame}><Flame size={42} color="#FF5500" fill="#FF5500" /></View><Text style={[styles.days, { color: theme.textPrimary }]}>{loading ? '—' : days}</Text><Text style={styles.label}>DAYS ACTIVE</Text><View style={[styles.status, { borderColor: theme.primary }]}><View style={[styles.dot, { backgroundColor: theme.primary }]} /><Text style={[styles.statusText, { color: theme.primary }]}>{data?.activeToday ? 'STREAK MAINTAINED' : 'PLAY A COMPLETED GAME TODAY'}</Text></View>{error ? <Text style={[styles.muted, { color: theme.textSecondary }]}>{error}</Text> : null}</View>
      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}><Text style={[styles.small, { color: theme.textSecondary }]}>Next milestone</Text><Text style={[styles.title, { color: theme.textPrimary }]}>{next ? `Day ${next}` : 'All listed milestones reached'}</Text><Text style={[styles.muted, { color: theme.textSecondary }]}>{next ? `${Math.max(next - days, 0)} qualifying game day${next - days === 1 ? '' : 's'} remaining` : 'Continue playing completed games to extend your streak.'}</Text></View>
      <Text style={[styles.section, { color: theme.textPrimary }]}>Milestones</Text>
      {milestones.map(({ day, reached }) => <View key={day} style={[styles.row, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>{reached ? <Check size={18} color={theme.primary} /> : <Lock size={18} color={theme.textMuted} />}<Text style={[styles.rowText, { color: theme.textPrimary }]}>Day {day}</Text><Text style={[styles.rowStatus, { color: reached ? theme.primary : theme.textMuted }]}>{reached ? 'Reached' : 'Locked'}</Text></View>)}
      <Text style={[styles.note, { color: theme.textSecondary }]}>Rewards unlock at day 90 and then at every other milestone. Reward amounts and contents have not been configured in the supplied product rules.</Text>
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({ root: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 58 }, back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }, headerTitle: { fontSize: 22, fontWeight: '800' }, content: { padding: 20, paddingBottom: 48 }, hero: { alignItems: 'center', marginBottom: 26 }, flame: { width: 94, height: 94, borderRadius: 47, backgroundColor: 'rgba(255,85,0,.12)', alignItems: 'center', justifyContent: 'center' }, days: { fontSize: 52, fontWeight: '900', marginTop: 8 }, label: { color: '#FF5500', fontSize: 13, fontWeight: '900', letterSpacing: 1.4 }, status: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 7, marginTop: 14 }, dot: { width: 6, height: 6, borderRadius: 3 }, statusText: { fontSize: 10, fontWeight: '900', letterSpacing: .7 }, card: { borderWidth: 1, borderRadius: 16, padding: 18, marginBottom: 24 }, small: { fontSize: 12, fontWeight: '700' }, title: { fontSize: 22, fontWeight: '900', marginVertical: 5 }, muted: { fontSize: 13, lineHeight: 19 }, section: { fontSize: 19, fontWeight: '900', marginBottom: 12 }, row: { minHeight: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 9 }, rowText: { fontSize: 15, fontWeight: '800', marginLeft: 12, flex: 1 }, rowStatus: { fontSize: 12, fontWeight: '800' }, note: { fontSize: 12, lineHeight: 18, marginTop: 12 } });
