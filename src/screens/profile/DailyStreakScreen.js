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
  const rewardPolicy = data?.rewardPolicy || {};
  const schedule = rewardPolicy.schedule || [
    { day: 7, type: 'badge', name: 'Bronze streak badge' },
    { day: 14, type: 'locked_coins', amount: 50 },
    { day: 30, type: 'badge', name: 'Silver streak badge' },
    { day: 50, type: 'locked_coins', amount: 250 },
    { day: 90, type: 'release_and_bonus', amount: 500, name: 'Elite Champion' },
    { day: 120, type: 'badge', name: 'Gold streak badge' },
    { day: 180, type: 'bonus_coins', amount: 1000 },
    { day: 250, type: 'badge', name: 'Platinum streak badge' },
    { day: 300, type: 'bonus_coins', amount: 2000 },
    { day: 365, type: 'release_and_bonus', amount: 5000, name: 'Year Champion' },
  ];
  const rewardLabel = (reward) => reward.type.includes('badge') ? reward.name : `${reward.amount} ${reward.type.includes('locked') ? 'locked' : 'bonus'} coins`;
  return <View style={[styles.root, { backgroundColor: theme.bg }]}>
    <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
    <LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />
    <View style={styles.header}><TouchableOpacity onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))} style={[styles.back, { backgroundColor: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.05)' }]}><ArrowLeft size={20} color={theme.textPrimary} /></TouchableOpacity><Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Daily Streak</Text><View style={{ width: 40 }} /></View>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}><View style={styles.flame}><Flame size={42} color="#FF5500" fill="#FF5500" /></View><Text style={[styles.days, { color: theme.textPrimary }]}>{loading ? '—' : days}</Text><Text style={styles.label}>DAYS ACTIVE</Text><View style={[styles.status, { borderColor: theme.primary }]}><View style={[styles.dot, { backgroundColor: theme.primary }]} /><Text style={[styles.statusText, { color: theme.primary }]}>{data?.activeToday ? 'STREAK MAINTAINED' : 'PLAY A COMPLETED GAME TODAY'}</Text></View>{error ? <Text style={[styles.muted, { color: theme.textSecondary }]}>{error}</Text> : null}</View>
      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}><Text style={[styles.small, { color: theme.textSecondary }]}>Next milestone</Text><Text style={[styles.title, { color: theme.textPrimary }]}>{next ? `Day ${next}` : 'All listed milestones reached'}</Text><Text style={[styles.muted, { color: theme.textSecondary }]}>{next ? `${Math.max(next - days, 0)} qualifying game day${next - days === 1 ? '' : 's'} remaining` : 'Continue playing completed games to extend your streak.'}</Text></View>
      <Text style={[styles.section, { color: theme.textPrimary }]}>Milestones and rewards</Text>
      {schedule.map((reward) => { const reached = days >= reward.day; return <View key={reward.day} style={[styles.row, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>{reached ? <Check size={18} color={theme.primary} /> : <Lock size={18} color={theme.textMuted} />}<View style={{ flex: 1, marginLeft: 12 }}><Text style={[styles.rowText, { color: theme.textPrimary, marginLeft: 0 }]}>Day {reward.day}</Text><Text style={[styles.rewardText, { color: theme.textSecondary }]}>{rewardLabel(reward)}</Text></View><Text style={[styles.rowStatus, { color: reached ? theme.primary : theme.textMuted }]}>{reached ? 'Reached' : 'Locked'}</Text></View>; })}
      <Text style={[styles.note, { color: theme.textSecondary }]}>Each completed game day adds {rewardPolicy.dailyLockedCoins || 10} locked coins. They release at day 90. A one-day miss can be recovered by watching an ad or paying {rewardPolicy.oneDayRecovery?.coinCost || 100} unlocked coins.</Text>
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({ root: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 58 }, back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }, headerTitle: { fontSize: 22, fontWeight: '800' }, content: { padding: 20, paddingBottom: 48 }, hero: { alignItems: 'center', marginBottom: 26 }, flame: { width: 94, height: 94, borderRadius: 47, backgroundColor: 'rgba(255,85,0,.12)', alignItems: 'center', justifyContent: 'center' }, days: { fontSize: 52, fontWeight: '900', marginTop: 8 }, label: { color: '#FF5500', fontSize: 13, fontWeight: '900', letterSpacing: 1.4 }, status: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 7, marginTop: 14 }, dot: { width: 6, height: 6, borderRadius: 3 }, statusText: { fontSize: 10, fontWeight: '900', letterSpacing: .7 }, card: { borderWidth: 1, borderRadius: 16, padding: 18, marginBottom: 24 }, small: { fontSize: 12, fontWeight: '700' }, title: { fontSize: 22, fontWeight: '900', marginVertical: 5 }, muted: { fontSize: 13, lineHeight: 19 }, section: { fontSize: 19, fontWeight: '900', marginBottom: 12 }, row: { minHeight: 60, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 9 }, rowText: { fontSize: 15, fontWeight: '800', marginLeft: 12, flex: 1 }, rewardText: { fontSize: 12, marginTop: 2 }, rowStatus: { fontSize: 12, fontWeight: '800' }, note: { fontSize: 12, lineHeight: 18, marginTop: 12 } });
