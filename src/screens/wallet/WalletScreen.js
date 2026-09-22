import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { PlusCircle, Banknote, Trophy, ShoppingCart, Flame, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function WalletScreen({ navigation }) {
  const { userProfile } = useAuth();
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('Overview');

  const coins = userProfile?.coins ?? 24500;
  const usdValue = (coins * 0.01).toFixed(2);

  const TRANSACTIONS = [
    {
      id: 't1',
      title: 'Valorant Pro-League Win',
      date: 'Oct 24, 2023 · 14:20',
      amountUnits: '+500 Units',
      amountUsd: '+$5.00',
      type: 'win',
    },
    {
      id: 't2',
      title: 'Battle Pass Purchase',
      date: 'Oct 22, 2023 · 09:12',
      amountUnits: '-1,200 Units',
      amountUsd: '-$12.00',
      type: 'purchase',
    },
    {
      id: 't3',
      title: 'Daily Streak Bonus',
      date: 'Oct 20, 2023 · 08:00',
      amountUnits: '+250 Units',
      amountUsd: '+$2.50',
      type: 'win',
    },
  ];

  return (
    <View style={[styles.screenRoot, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
      <LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />

      {/* Screen Title */}
      <View style={styles.topHeader}>
        {navigation.canGoBack() ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backCircleBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}
            activeOpacity={0.8}
          >
            <ArrowLeft size={20} color={theme.textPrimary} />
          </TouchableOpacity>
        ) : <View style={{ width: 40 }} />}
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Wallet & Earnings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Neon Circle Chart & Balance Header */}
        <View style={styles.heroCenterBlock}>
          <View style={styles.circleGraphicContainer}>
            <Svg width={140} height={140}>
              <Circle
                cx={70}
                cy={70}
                r={62}
                stroke="rgba(0, 229, 255, 0.15)"
                strokeWidth={5}
                fill="none"
              />
              <Circle
                cx={70}
                cy={70}
                r={62}
                stroke="#00E5FF"
                strokeWidth={5}
                strokeDasharray={390}
                strokeDashoffset={90}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>

            {/* Neon Abstract Ribbon inner graphic */}
            <View style={styles.innerNeonRibbonWrap}>
              <LinearGradient
                colors={['#FF00E5', '#00E5FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.neonRibbonOval}
              />
            </View>

            {/* LEVEL Badge Pill */}
            <View style={styles.levelBadgePill}>
              <Text style={styles.levelBadgeText}>LEVEL 42</Text>
            </View>
          </View>

          {/* Balance Unit Display */}
          <View style={styles.balanceTextRow}>
            <Text style={[styles.balanceNum, { color: theme.textPrimary }]}>{coins.toLocaleString()}</Text>
            <Text style={[styles.balanceUnitText, { color: theme.primary }]}>/Units</Text>
          </View>

          <Text style={[styles.usdEquivalentText, { color: theme.textSecondary }]}>${usdValue} USD Equivalent</Text>

          {/* Streak Active / Inactive Pill */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('DailyStreak')}
            style={[
              styles.streakPillBtn,
              {
                backgroundColor: (userProfile?.streak ?? 0) > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                borderColor: (userProfile?.streak ?? 0) > 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
              },
            ]}
          >
            <Flame
              size={14}
              color={(userProfile?.streak ?? 0) > 0 ? '#10B981' : '#EF4444'}
              fill={(userProfile?.streak ?? 0) > 0 ? '#10B981' : 'none'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.streakPillText,
                { color: (userProfile?.streak ?? 0) > 0 ? '#10B981' : '#EF4444' },
              ]}
            >
              {(userProfile?.streak ?? 0) > 0 ? `${userProfile?.streak}-Day Streak Active` : 'Streak Inactive'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={[styles.tabNavRow, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]}>
          {['Overview', 'Buy', 'Cash out', 'Withdraw'].map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.8}
                onPress={() => {
                  setActiveTab(tab);
                  if (tab === 'Buy') navigation.navigate('BuyCoins');
                  if (tab === 'Withdraw') navigation.navigate('Withdraw');
                  if (tab.trim() === 'Cash out' || tab === 'Sell') navigation.navigate('SellCoins');
                }}
                style={styles.tabNavItem}
              >
                <Text style={[styles.tabNavText, { color: theme.textSecondary }, isSelected && { color: theme.primary, fontWeight: '900' }]}>
                  {tab}
                </Text>
                {isSelected && <View style={[styles.tabNavActiveIndicator, { backgroundColor: theme.primary }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CTA Buttons (+ Add Funds & Cash Out) */}
        <View style={styles.ctaButtonsGrid}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => navigation.navigate('BuyCoins')}
            style={styles.addFundsBtn}
          >
            <LinearGradient
              colors={theme.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addFundsGradient}
            >
              <PlusCircle size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={[styles.addFundsText, { color: '#FFFFFF' }]}>Add Funds</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('SellCoins')}
            style={[styles.cashOutBtn, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}
          >
            <Banknote size={20} color={theme.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.cashOutText, { color: theme.textPrimary }]}>Cash Out</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History Section */}
        <View style={styles.txHeaderRow}>
          <Text style={[styles.txHeaderTitle, { color: theme.textPrimary }]}>Transaction History</Text>
          <TouchableOpacity onPress={() => navigation.navigate('BuyCoins')}>
            <Text style={[styles.viewAllText, { color: theme.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.txList}>
          {TRANSACTIONS.map((tx) => (
            <View key={tx.id} style={[styles.txCardItem, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
              <View
                style={[
                  styles.txIconBox,
                  {
                    backgroundColor:
                      tx.type === 'win' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 229, 255, 0.15)',
                  },
                ]}
              >
                {tx.type === 'win' ? (
                  <Trophy size={18} color="#10B981" />
                ) : (
                  <ShoppingCart size={18} color={theme.primary} />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.txItemTitle, { color: theme.textPrimary }]}>{tx.title}</Text>
                <Text style={[styles.txItemDate, { color: theme.textSecondary }]}>{tx.date}</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={[
                    styles.txItemUnits,
                    { color: tx.type === 'win' ? '#10B981' : theme.textPrimary },
                  ]}
                >
                  {tx.amountUnits}
                </Text>
                <Text style={[styles.txItemUsd, { color: theme.textSecondary }]}>{tx.amountUsd}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: '#070C1B',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
  },
  backCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  heroCenterBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  circleGraphicContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  innerNeonRibbonWrap: {
    position: 'absolute',
    width: 60,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-35deg' }],
  },
  neonRibbonOval: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
    opacity: 0.6,
  },
  levelBadgePill: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: '#00E5FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  levelBadgeText: {
    color: '#070C1B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  balanceTextRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  balanceNum: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    marginRight: 6,
  },
  balanceUnitText: {
    color: '#00E5FF',
    fontSize: 20,
    fontWeight: '800',
  },
  usdEquivalentText: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 16,
  },
  streakPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 35, 55, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  streakPillText: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '800',
  },
  tabNavRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  tabNavItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabNavText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  tabNavTextSelected: {
    color: '#00E5FF',
    fontWeight: '900',
  },
  tabNavActiveIndicator: {
    position: 'absolute',
    bottom: -1,
    width: '100%',
    height: 2,
    backgroundColor: '#00E5FF',
  },
  ctaButtonsGrid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 28,
  },
  addFundsBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  addFundsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  addFundsText: {
    color: '#070C1B',
    fontSize: 16,
    fontWeight: '900',
  },
  cashOutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 25, 45, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    borderRadius: 16,
    paddingVertical: 16,
  },
  cashOutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  txHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  txHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  viewAllText: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '800',
  },
  txList: {
    gap: 12,
  },
  txCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  txIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txItemTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  txItemDate: {
    color: '#94A3B8',
    fontSize: 12,
  },
  txItemUnits: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 2,
  },
  txItemUsd: {
    color: '#94A3B8',
    fontSize: 12,
  },
});
