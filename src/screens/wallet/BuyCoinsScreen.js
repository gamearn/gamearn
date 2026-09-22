import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Coins, Sprout, Trees, Mountain, Medal } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    coins: 500,
    price: '$4.99',
    icon: Sprout,
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    coins: 1500,
    price: '$12.99',
    icon: Trees,
    popular: true,
    badgeText: 'BEST VALUE',
  },
  {
    id: 'elite',
    name: 'Elite Pack',
    coins: 5000,
    price: '$39.99',
    icon: Mountain,
    popular: false,
  },
  {
    id: 'champion',
    name: 'Champion Pack',
    coins: 12000,
    price: '$89.99',
    icon: Medal,
    popular: false,
  },
];

export default function BuyCoinsScreen({ navigation }) {
  const { userProfile, updateProfileData } = useAuth();
  const { theme, isDark } = useTheme();
  const currentCoins = userProfile?.coins ?? 24500;
  const [loadingId, setLoadingId] = useState(null);

  const handleBuyPack = (pkg) => {
    setLoadingId(pkg.id);
    setTimeout(async () => {
      const newTotal = currentCoins + pkg.coins;
      if (updateProfileData) {
        await updateProfileData({ coins: newTotal });
      }
      setLoadingId(null);
      Alert.alert(
        'Purchase Successful 🎉',
        `Successfully added ${pkg.coins.toLocaleString()} Coins to your wallet!\n\nNew Balance: ${newTotal.toLocaleString()} Units`,
        [{ text: 'Awesome', style: 'default' }]
      );
    }, 800);
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

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Select a Coin Pack</Text>
          <Text style={[styles.limitedOffersText, { color: theme.primary }]}>LIMITED OFFERS</Text>
        </View>

        {/* Coin Packs Grid */}
        <View style={styles.grid}>
          {PACKAGES.map((pkg) => {
            const IconComponent = pkg.icon;
            const isLoading = loadingId === pkg.id;

            return (
              <View key={pkg.id} style={styles.cardWrap}>
                {pkg.popular && (
                  <View style={styles.bestValueBadge}>
                    <Text style={styles.bestValueText}>{pkg.badgeText}</Text>
                  </View>
                )}

                <View style={[styles.packCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorderSubtle }, pkg.popular && { borderColor: theme.primary }]}>
                  {/* Square Icon Container */}
                  <View style={[styles.iconSquare, { backgroundColor: isDark ? 'rgba(0, 229, 255, 0.06)' : 'rgba(0, 180, 216, 0.08)', borderColor: theme.cardBorderSubtle }]}>
                    <IconComponent size={38} color="#FF5500" />
                  </View>

                  {/* Pack Title & Coins */}
                  <Text style={[styles.packName, { color: theme.textPrimary }]}>{pkg.name}</Text>
                  <Text style={[styles.coinsAmountText, { color: theme.primary }]}>{pkg.coins.toLocaleString()} Coins</Text>

                  {/* Orange Price CTA */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleBuyPack(pkg)}
                    disabled={isLoading}
                    style={styles.priceBtn}
                  >
                    <Text style={styles.priceBtnText}>
                      {isLoading ? 'Processing...' : pkg.price}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  limitedOffersText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 20,
  },
  cardWrap: {
    width: '48%',
    position: 'relative',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: 12,
    backgroundColor: '#FF5500',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    zIndex: 10,
  },
  bestValueText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  packCard: {
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'stretch',
  },
  packCardPopular: {
    borderColor: '#00E5FF',
  },
  iconSquare: {
    height: 110,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  packName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  coinsAmountText: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 16,
  },
  priceBtn: {
    backgroundColor: '#FF5500',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF5500',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  priceBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
