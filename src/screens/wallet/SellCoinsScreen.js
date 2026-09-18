import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Coins,
  Wallet,
  Building2,
  CreditCard,
  CheckCircle2,
  Circle,
} from 'lucide-react-native';
import GAButton from '../../components/GAButton';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function SellCoinsScreen({ navigation }) {
  const { userProfile, updateProfileData } = useAuth();
  const { theme, isDark } = useTheme();
  const coinBalance = userProfile?.coins ?? 25400;
  const usdValue = (coinBalance / 100).toFixed(2);
  const cashableBalance = (coinBalance / 100).toFixed(2);

  const [coinInput, setCoinInput] = useState('5000');
  const [destination, setDestination] = useState('bank'); // 'bank', 'paypal'
  const [loading, setLoading] = useState(false);

  const parsedCoins = parseInt(coinInput, 10) || 0;
  const receivedUsd = (parsedCoins / 100).toFixed(2);

  const handleSellCoins = () => {
    if (parsedCoins < 100) {
      Alert.alert('Minimum Amount', 'Minimum amount to convert is 100 coins ($1.00 USD).');
      return;
    }
    if (parsedCoins > coinBalance) {
      Alert.alert('Insufficient Coins', 'You do not have enough coins in your balance.');
      return;
    }

    setLoading(true);
    setTimeout(async () => {
      const remainingCoins = Math.max(0, coinBalance - parsedCoins);
      if (updateProfileData) {
        await updateProfileData({ coins: remainingCoins });
      }
      setLoading(false);
      Alert.alert(
        'Conversion Successful 💰',
        `You converted ${parsedCoins.toLocaleString()} Coins for $${receivedUsd} USD!\n\nPayout Destination: ${
          destination === 'bank' ? 'Bank Transfer' : 'PayPal'
        }`,
        [
          {
            text: 'View Wallet',
            onPress: () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs')),
          },
        ]
      );
    }, 1000);
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
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Sell Coins</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top 2 Balance Cards Side-By-Side */}
        <View style={styles.topCardsRow}>
          {/* Card 1: Coin Balance */}
          <View style={[styles.balanceCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }, styles.balanceCardCyan]}>
            <View style={styles.cardHeaderRow}>
              <Coins size={16} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.cardHeaderTitle, { color: theme.textSecondary }]}>Coin Balance</Text>
            </View>
            <Text style={[styles.bigNumTextCyan, { color: theme.primary }]}>{coinBalance.toLocaleString()}</Text>
            <Text style={[styles.subValText, { color: theme.textMuted }]}>Value: ${usdValue}</Text>
          </View>

          {/* Card 2: Cashable */}
          <View style={[styles.balanceCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }]}>
            <View style={styles.cardHeaderRow}>
              <Wallet size={16} color={theme.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.cardHeaderTitle, { color: theme.textSecondary }]}>Cashable</Text>
            </View>
            <Text style={[styles.bigNumTextWhite, { color: theme.textPrimary }]}>${cashableBalance}</Text>
            <Text style={[styles.subValText, { color: theme.textMuted }]}>Ready to withdraw</Text>
          </View>
        </View>

        {/* Section: Amount to Convert */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Amount to Convert</Text>
          <Text style={[styles.inputSubLabel, { color: theme.textSecondary }]}>Enter amount of coins</Text>

          <View style={[styles.inputBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
            <TextInput
              style={[styles.textInput, { color: theme.textPrimary }]}
              value={coinInput}
              onChangeText={setCoinInput}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={theme.textMuted}
            />
            <View style={[styles.coinsPill, { backgroundColor: isDark ? 'rgba(0, 229, 255, 0.1)' : 'rgba(0, 180, 216, 0.12)' }]}>
              <Text style={[styles.coinsPillText, { color: theme.primary }]}>COINS</Text>
              <Coins size={16} color={theme.primary} style={{ marginLeft: 4 }} />
            </View>
          </View>
        </View>

        {/* You Will Receive Box */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.inputSubLabel, { color: theme.textSecondary }]}>You will receive</Text>
          <View style={[styles.inputBox, styles.receiveBox, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
            <Text style={[styles.receiveAmountText, { color: theme.primary }]}>${receivedUsd}</Text>
            <View style={[styles.usdPill, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
              <Text style={[styles.usdPillText, { color: theme.textPrimary }]}>USD</Text>
              <Wallet size={16} color={theme.textPrimary} style={{ marginLeft: 4 }} />
            </View>
          </View>
          <Text style={[styles.exchangeRateText, { color: theme.textMuted }]}>EXCHANGE RATE: 100 COINS = $1.00 USD</Text>
        </View>

        {/* Section: Withdrawal Destination */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Withdrawal Destination</Text>

          {/* Bank Transfer Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setDestination('bank')}
            style={[styles.destinationCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }, destination === 'bank' && { borderColor: theme.primary, backgroundColor: isDark ? 'rgba(0, 229, 255, 0.05)' : 'rgba(0, 180, 216, 0.08)' }]}
          >
            <View style={[styles.iconSquare, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
              <Building2 size={22} color={theme.textPrimary} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.destTitle, { color: theme.textPrimary }]}>Bank Transfer</Text>
              <Text style={[styles.destSub, { color: theme.textSecondary }]}>Processing: 2-3 business days</Text>
            </View>
            {destination === 'bank' ? (
              <CheckCircle2 size={22} color={theme.primary} />
            ) : (
              <Circle size={22} color={theme.textMuted} />
            )}
          </TouchableOpacity>

          {/* PayPal Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setDestination('paypal')}
            style={[styles.destinationCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }, destination === 'paypal' && { borderColor: theme.primary, backgroundColor: isDark ? 'rgba(0, 229, 255, 0.05)' : 'rgba(0, 180, 216, 0.08)' }]}
          >
            <View style={[styles.iconSquare, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
              <CreditCard size={22} color={theme.textPrimary} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.destTitle, { color: theme.textPrimary }]}>PayPal</Text>
              <Text style={[styles.destSub, { color: theme.textSecondary }]}>Instant transfer</Text>
            </View>
            {destination === 'paypal' ? (
              <CheckCircle2 size={22} color={theme.primary} />
            ) : (
              <Circle size={22} color={theme.textMuted} />
            )}
          </TouchableOpacity>
        </View>

        {/* Sell CTA */}
        <GAButton
          title="Sell Coins & Cash Out 🚀"
          onPress={handleSellCoins}
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
    paddingBottom: 100,
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
