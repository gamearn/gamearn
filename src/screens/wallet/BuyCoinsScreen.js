import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Coins, Sprout, Trees, Mountain, Medal } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { wallet } from '../../services/api';
import { coinsFromNaira } from '../../config/appConfig';
import { ApiError } from '../../services/apiClient';

// Quick-pick presets that load the amount field (₦ amounts).
const PACKAGES = [
  { id: 'starter', name: 'Starter', price: 50, icon: Sprout },
  { id: 'pro', name: 'Pro', price: 500, icon: Trees, popular: true, badgeText: 'BEST VALUE' },
  { id: 'elite', name: 'Elite', price: 1500, icon: Mountain },
  { id: 'champion', name: 'Champion', price: 5000, icon: Medal },
];

const MIN_AMOUNT = 50;
const MAX_AMOUNT = 1000000;

function parseAmount(raw) {
  const n = Number(String(raw || '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export default function BuyCoinsScreen({ navigation }) {
  const { userProfile } = useAuth();
  const { theme, isDark } = useTheme();
  const currentCoins = userProfile?.coins ?? 0;
  const [amountText, setAmountText] = useState('');
  const [loading, setLoading] = useState(false);

  const amount = parseAmount(amountText);
  const coins = coinsFromNaira(amount);
  const amountValid = amount >= MIN_AMOUNT && amount <= MAX_AMOUNT;

  const preview = useMemo(() => {
    if (!amountText || amount === 0) return null;
    return {
      naira: amount,
      coins,
      valid: amountValid,
    };
  }, [amountText, amount, coins, amountValid]);

  const handleStartPayment = async () => {
    if (!amountValid) return;
    setLoading(true);
    try {
      const res = await wallet.topup({ amount, paymentMethod: 'card' });
      if (!res.paymentLink) {
        throw new ApiError({ code: 'PAY_LINK_MISSING', message: 'Payment link unavailable.' });
      }
      navigation.navigate('Payment', {
        txRef: res.txRef,
        paymentLink: res.paymentLink,
        amount: res.amount ?? amount,
        coins,
      });
    } catch (e) {
      Alert.alert('Payment Failed', e?.message || 'Could not start the payment. Please try again.');
    } finally {
      setLoading(false);
    }
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
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Buy Coins</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Current Balance Top Card */}
        <LinearGradient
          colors={isDark ? ['#0F203C', '#0B162B'] : ['#E0F2FE', '#BAE6FD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <Text style={[styles.balanceCardLabel, { color: theme.primary }]}>CURRENT BALANCE</Text>
          <View style={styles.balanceValueRow}>
            <View style={styles.coinIconCircle}>
              <Coins size={22} color={theme.primary} />
            </View>
            <Text style={[styles.balanceNumText, { color: theme.textPrimary }]}>{currentCoins.toLocaleString()}</Text>
            <Text style={[styles.unitsTag, { color: theme.textSecondary }]}>/Units</Text>
          </View>
        </LinearGradient>

        {/* Custom Amount Input */}
        <View style={[styles.amountCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>ENTER AMOUNT IN NAIRA</Text>
          <View style={[styles.amountInputRow, { borderColor: amountValid || !amountText ? theme.cardBorderSubtle : '#EF4444' }]}>
            <Text style={[styles.amountPrefix, { color: theme.textSecondary }]}>₦</Text>
            <TextInput
              value={amountText}
              onChangeText={setAmountText}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              style={[styles.amountInput, { color: theme.textPrimary }]}
            />
          </View>

          {preview ? (
            <View style={styles.liveWorthRow}>
              <Coins size={18} color="#FF5500" />
              <Text style={[styles.liveWorthText, { color: preview.valid ? theme.textPrimary : '#EF4444' }]}>
                {preview.valid ? `You get ${preview.coins.toLocaleString()} coins` : 'Minimum ₦50, maximum ₦1,000,000'}
              </Text>
            </View>
          ) : (
            <Text style={[styles.liveWorthHint, { color: theme.textSecondary }]}>
              1 coin = ₦50. Live worth shows as you type.
            </Text>
          )}
        </View>

        {/* Quick-pick presets */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Quick Picks</Text>
        <View style={styles.chipRow}>
          {PACKAGES.map((pkg) => {
            const IconComponent = pkg.icon;
            const active = amount === pkg.price;
            return (
              <TouchableOpacity
                key={pkg.id}
                activeOpacity={0.85}
                onPress={() => setAmountText(String(pkg.price))}
                style={[
                  styles.chip,
                  { backgroundColor: theme.cardBg, borderColor: active ? '#FF5500' : theme.cardBorderSubtle },
                ]}
              >
                <IconComponent size={16} color="#FF5500" />
                <Text style={[styles.chipName, { color: theme.textPrimary }]}>{pkg.name}</Text>
                <Text style={[styles.chipPrice, { color: active ? '#FF5500' : theme.primary }]}>₦{pkg.price.toLocaleString()}</Text>
                {pkg.popular && <Text style={styles.chipBadge}>{pkg.badgeText}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue CTA */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleStartPayment}
          disabled={!amountValid || loading}
          style={[styles.continueBtn, { opacity: amountValid && !loading ? 1 : 0.5, backgroundColor: '#FF5500' }]}
        >
          <Coins size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.continueBtnText}>
            {loading ? 'Processing...' : preview && preview.valid ? `Buy ${preview.coins.toLocaleString()} Coins for ₦${preview.naira.toLocaleString()}` : 'Enter an amount to continue'}
          </Text>
        </TouchableOpacity>
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
  balanceCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    paddingVertical: 22,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  balanceCardLabel: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  balanceValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIconCircle: {
    marginRight: 10,
  },
  balanceNumText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    marginRight: 6,
  },
  unitsTag: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '700',
  },
  amountCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 10,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  amountPrefix: {
    fontSize: 24,
    fontWeight: '900',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: '900',
    paddingVertical: 12,
  },
  liveWorthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  liveWorthText: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  liveWorthHint: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  chipName: {
    fontSize: 13,
    fontWeight: '800',
  },
  chipPrice: {
    fontSize: 13,
    fontWeight: '900',
  },
  chipBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: '#FF5500',
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#FF5500',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});