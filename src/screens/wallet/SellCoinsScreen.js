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
import {
  ArrowLeft,
  Coins,
  Wallet,
  Building2,
  CheckCircle2,
} from 'lucide-react-native';
import GAButton from '../../components/GAButton';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function SellValuePointsScreen({ navigation }) {
  const { userProfile } = useAuth();
  const { theme, isDark } = useTheme();
  const valuePointBalance = userProfile?.valuePoints ?? 0;
  const [loading, setLoading] = useState(false);

  const handleSellValuePoints = () => {
    setLoading(true);
    // Value Points are the in-app currency (1 VP = ₦50) and are cashable, so
    // this screen hands off to the real Withdraw flow to move them to NGN.
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('Withdraw');
    }, 400);
  };

  return (
    <View style={[styles.screenRoot, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
      <LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
          style={[styles.backCircleBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}
        >
          <ArrowLeft size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Sell Value Points</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Value Point Balance Card */}
        <View style={styles.topCardsRow}>
          <View style={[styles.balanceCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }, styles.balanceCardCyan]}>
            <View style={styles.cardHeaderRow}>
              <Coins size={16} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.cardHeaderTitle, { color: theme.textSecondary }]}>Value Points</Text>
            </View>
            <Text style={[styles.bigNumTextCyan, { color: theme.primary }]}>{valuePointBalance.toLocaleString()}</Text>
            <Text style={[styles.subValText, { color: theme.textMuted }]}>1 Value Point = 50 units</Text>
          </View>

          <View style={[styles.balanceCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
            <View style={styles.cardHeaderRow}>
              <Wallet size={16} color={theme.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.cardHeaderTitle, { color: theme.textSecondary }]}>Acquired Points</Text>
            </View>
            <Text style={[styles.bigNumTextWhite, { color: theme.textPrimary }]}>{Math.floor(Number(userProfile?.walletBalance ?? 0) / 50).toLocaleString()} VP</Text>
            <Text style={[styles.subValText, { color: theme.textMuted }]}>Cash out in Withdraw</Text>
          </View>
        </View>

        {/* Note: Value Points are the in-app currency and cashable */}
        <View style={[styles.sectionWrap, styles.noteCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Important</Text>
          <Text style={[styles.destSub, { color: theme.textSecondary }]}>
            Value Points are the in-app currency used for games and bonuses. Your acquired points can be cashed out in Withdraw to your bank account.
          </Text>
        </View>

        {/* Section: Withdrawal Destination */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Withdrawal Destination</Text>

          {/* Bank Transfer Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.destinationCard, { backgroundColor: theme.cardBg, borderColor: theme.primary, borderWidth: 1.5 }]}
          >
            <View style={[styles.iconSquare, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
              <Building2 size={22} color={theme.textPrimary} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.destTitle, { color: theme.textPrimary }]}>Bank Transfer (NGN)</Text>
              <Text style={[styles.destSub, { color: theme.textSecondary }]}>Withdraw straight to a Nigerian bank account · 1-2 business days</Text>
            </View>
            <CheckCircle2 size={22} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* CTA */}
        <GAButton
          title="Continue to Withdraw"
          onPress={handleSellValuePoints}
          loading={loading}
          variant="primary"
          style={styles.cashOutBtn}
        />
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
    paddingTop: 55,
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
    paddingBottom: 320,
  },
  topCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 16,
  },
  balanceCardCyan: {
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderTitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  bigNumTextCyan: {
    color: '#00E5FF',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 4,
  },
  bigNumTextWhite: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 4,
  },
  subValText: {
    color: '#64748B',
    fontSize: 12,
  },
  sectionWrap: {
    marginBottom: 22,
  },
  noteCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  inputSubLabel: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  coinsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  coinsPillText: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '900',
  },
  receiveBox: {
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  receiveAmountText: {
    color: '#00E5FF',
    fontSize: 26,
    fontWeight: '900',
  },
  usdPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  usdPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  exchangeRateText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  destinationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 45, 0.6)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  destinationCardActive: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
  },
  iconSquare: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  destTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  destSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  cashOutBtn: {
    marginTop: 10,
    marginBottom: 30,
  },
});
