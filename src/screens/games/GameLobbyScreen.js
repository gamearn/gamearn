import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Swords, Settings, ArrowLeft, Wallet, Cpu } from 'lucide-react-native';
import BrandLogo from '../../components/BrandLogo';
import GAButton from '../../components/GAButton';
import GACard from '../../components/GACard';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { matchmaking } from '../../services/api';
import { GamearnSocket } from '../../services/gamearnSocket';
import { ENTRY_FEES, koboToN, naira } from '../../config/appConfig';

const TIERS = [
  { key: 'beginner', label: 'Beginner' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'expert', label: 'Expert' },
];

const GAME_TYPE = { whot: 'whot', ludo: 'ludo', ayo: 'ayo', draft: 'draughts' };

export default function GameLobbyScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { userProfile } = useAuth();

  const { gameId = 'whot', gameName = 'Whot Naija', targetScreen = 'WhotGame', setupTarget = 'WhotSetup' } = route.params || {};
  const gameType = GAME_TYPE[gameId] || GAME_TYPE.whot;
  const tiers = ENTRY_FEES[gameType] || ENTRY_FEES.whot;

  const [selectedTier, setSelectedTier] = useState('beginner');
  const [isSearching, setIsSearching] = useState(false);
  const [queueLen, setQueueLen] = useState(0);
  const sockRef = useRef(null);

  const selectedFee = tiers[selectedTier] || tiers.beginner;
  const balanceNaira = Number(userProfile?.walletBalance ?? userProfile?.coins ?? 0);
  const balanceKobo = Math.round(balanceNaira * 100);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  };

  const cleanup = () => {
    setIsSearching(false);
    setQueueLen(0);
    sockRef.current?.disconnect();
    sockRef.current = null;
  };

  useEffect(() => () => cleanup(), []);

  const navigateToMatch = (p) => {
    sockRef.current?.disconnect();
    sockRef.current = null;
    setIsSearching(false);
    navigation.navigate(targetScreen, {
      mode: 'multiplayer',
      gameId,
      roomId: p.roomId,
      entryFee: p.entryFee,
      prizePool: p.prizePool,
      opponent: p.opponent,
    });
  };

  const joinQueue = async (fee) => {
    try {
      const res = await matchmaking.join({ gameType, entryFee: fee, rated: true, playerCount: 2, options: {} });
      if (res?.status === 'already_in_room' && res.roomId) {
        navigateToMatch({ roomId: res.roomId, entryFee: fee, prizePool: 0, opponent: null });
        return;
      }
      if (res) setQueueLen(res.position || 0);
    } catch (err) {
      cleanup();
      Alert.alert('Matchmaking failed', err?.message || 'Could not join the queue.');
    }
  };

  const handlePlayVsOba = () => {
    navigation.navigate(targetScreen, { stake: selectedFee, vsOba: true });
  };

  const startMatchmaking = () => {
    if (!userProfile) {
      Alert.alert('Sign in required', 'Create an account to play real matches.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    if (balanceKobo < selectedFee) {
      Alert.alert(
        'Insufficient balance',
        `This entry costs ${naira(koboToN(selectedFee))}. Your balance is ${naira(balanceNaira)}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy Coins', onPress: () => navigation.navigate('BuyCoins') },
        ],
      );
      return;
    }

    setIsSearching(true);
    setQueueLen(0);
    Alert.alert('⚔️ Challenge Created!', `All active players have been notified of your ${gameName} challenge broadcast! Searching for an opponent...`);

    const sock = new GamearnSocket({
      onConnected: () => joinQueue(selectedFee),
      onMatchFound: navigateToMatch,
      onError: (msg) => {
        const m = msg || 'Game service is temporarily unavailable.';
        cleanup();
        Alert.alert('Matchmaking unavailable', m);
      },
    });
    sockRef.current = sock;
    sock.connect();
  };

  const cancelSearch = () => {
    matchmaking.leave(gameType).catch(() => {});
    cleanup();
  };

  const startPractice = () => {
    if (!userProfile) {
      Alert.alert('Sign in required', 'Create an account to play practice games.');
      return;
    }
    navigation.navigate(targetScreen, { mode: 'practice', gameId });
  };

  const openSetup = () => {
    navigation.navigate(setupTarget, { gameType, gameName, targetScreen });
  };

  const openDeposit = () => {
    if (!userProfile) {
      Alert.alert('Sign in required', 'Create an account to top up.');
      return;
    }
    navigation.navigate('BuyCoins');
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.bg }]}>
      <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
        <ArrowLeft size={24} color={theme.textPrimary} />
      </TouchableOpacity>

      <View style={styles.header}>
        <BrandLogo size={48} variant="icon" />
        <Text style={[styles.title, { color: theme.textPrimary }]}>{gameName}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Select your stake and play vs Oba or create a challenge
        </Text>
      </View>

      {/* Wallet balance */}
      <TouchableOpacity onPress={openDeposit} style={styles.walletRow}>
        <Wallet size={18} color={theme.accent} />
        <Text style={[styles.walletText, { color: theme.textPrimary }]}>
          Wallet: {naira(balanceNaira)}
        </Text>
        <Text style={[styles.walletAction, { color: theme.accent }]}>Top up</Text>
      </TouchableOpacity>

      <View style={styles.setupRow}>
        <TouchableOpacity
          onPress={openSetup}
          style={[styles.setupCard, { backgroundColor: 'rgba(0, 229, 255, 0.1)', borderColor: '#00E5FF' }]}
        >
          <Settings size={20} color="#00E5FF" />
          <Text style={{ color: '#00E5FF', fontWeight: '800', fontSize: 14 }}>
            ⚙️ Custom Match Setup ({gameName})
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Entry Tier</Text>

      <View style={styles.tierGrid}>
        {TIERS.map((tier) => {
          const fee = tiers[tier.key];
          const selected = selectedTier === tier.key;
          return (
            <TouchableOpacity
              key={tier.key}
              onPress={() => setSelectedTier(tier.key)}
              style={[
                styles.stakeCard,
                {
                  backgroundColor: selected ? theme.cardBg : theme.inputBg,
                  borderColor: selected ? theme.primary : theme.inputBorder,
                },
              ]}
            >
              <Text style={[styles.tierName, { color: selected ? theme.accent : theme.textMuted }]}>
                {tier.label}
              </Text>
              <Text style={[styles.tierAmount, { color: theme.textPrimary }]}>{naira(koboToN(fee))}</Text>
              <Text style={[styles.tierFee, { color: theme.textSecondary }]}>{fee.toLocaleString()} coins</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <GACard style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={{ color: theme.textSecondary }}>Challenger Strength:</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Text style={{ color: '#F59E0B', fontWeight: '900' }}>⚡ {userProfile?.gpText || '0 GP'}</Text>
            <Text style={{ color: '#60A5FA', fontWeight: '900' }}>🏆 {userProfile?.vpText || '0 VP'}</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <Text style={{ color: theme.textSecondary }}>Entry Fee (escrowed):</Text>
          <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>{naira(koboToN(selectedFee))}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={{ color: theme.textSecondary }}>Winner takes (up to):</Text>
          <Text style={{ color: theme.success, fontWeight: '800' }}>{naira(koboToN(Math.floor(selectedFee * 1.9)))}</Text>
        </View>
        <Text style={[styles.note, { color: theme.textMuted }]}>
          Entry fees are debited only when a match starts. A 10% platform fee applies to prize payouts.
        </Text>
      </GACard>

      {/* Button 1 (Above): Play vs Oba */}
      <GAButton
        title="Play vs Oba 👑"
        onPress={handlePlayVsOba}
        variant="secondary"
        icon={<Cpu size={20} color={theme.primary} />}
        style={{ marginTop: 20 }}
      />

      {!isSearching ? (
        <GAButton
          title="Create Challenge"
          onPress={startMatchmaking}
          icon={<Swords size={20} color="#FFF" />}
          style={{ marginTop: 12 }}
        />
      ) : (
        <View style={styles.searchBox}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.searchText, { color: theme.textPrimary }]}>Searching for an opponent…</Text>
          {queueLen > 0 && (
            <Text style={[styles.searchSub, { color: theme.textSecondary }]}>Queue position: #{queueLen}</Text>
          )}
          <TouchableOpacity onPress={cancelSearch} style={[styles.cancelBtn, { borderColor: theme.danger || '#FF3B30' }]}>
            <Text style={[styles.cancelText, { color: theme.danger || '#FF3B30' }]}>Cancel Search</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 65,
  },
  backBtn: {
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    backgroundColor: 'rgba(0, 229, 255, 0.06)',
    marginBottom: 16,
  },
  walletText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  walletAction: {
    fontSize: 13,
    fontWeight: '800',
  },
  setupRow: {
    marginBottom: 24,
  },
  setupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  tierGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  stakeCard: {
    width: '30%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    gap: 4,
  },
  tierName: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tierAmount: {
    fontSize: 16,
    fontWeight: '900',
  },
  tierFee: {
    fontSize: 11,
  },
  summaryCard: {
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  note: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  searchBox: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  searchText: {
    fontSize: 16,
    fontWeight: '700',
  },
  searchSub: {
    fontSize: 13,
  },
  cancelBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  cancelText: {
    fontWeight: '800',
    fontSize: 14,
  },
  practiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
});
