import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { Swords, Settings, ArrowLeft, Wallet, Cpu } from 'lucide-react-native';
import BrandLogo from '../../components/BrandLogo';
import GAButton from '../../components/GAButton';
import GACard from '../../components/GACard';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { matchmaking } from '../../services/api';
import { GamearnSocket } from '../../services/gamearnSocket';
import { coinsFromNaira, koboToN, naira, nairaToKobo } from '../../config/appConfig';

// Custom stakes: backend caps entry fees at 500000 kobo.
const MIN_AMOUNT_N = 50;
const MAX_AMOUNT_N = 5000;
const QUICK_AMOUNTS = [100, 500, 2000, 5000];

function parseAmount(raw) {
  const n = Number(String(raw || '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

const GAME_TYPE = { whot: 'whot', ludo: 'ludo', ayo: 'ayo', draft: 'draughts' };

export default function GameLobbyScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { userProfile } = useAuth();

  const { gameId = 'whot', gameName = 'Whot Naija', targetScreen = 'WhotGame', setupTarget = 'GameSetup' } = route.params || {};
  const gameType = GAME_TYPE[gameId] || GAME_TYPE.whot;

  const [amountText, setAmountText] = useState('500');
  const [isSearching, setIsSearching] = useState(false);
  const [queueLen, setQueueLen] = useState(0);
  const sockRef = useRef(null);

  const [selectedTimer, setSelectedTimer] = useState('2m');
  const [tokenCount, setTokenCount] = useState(4);
  const [playerCount, setPlayerCount] = useState(4);
  const [playerColor, setPlayerColor] = useState('white');
  const [cardCount, setCardCount] = useState(6);
  const [enableSpecialCards, setEnableSpecialCards] = useState(true);
  const [seedCount, setSeedCount] = useState(4);

  const isLudo = gameType === 'ludo' || targetScreen === 'LudoGame' || gameName.toLowerCase().includes('ludo');
  const isDraft = gameType === 'draughts' || gameType === 'draft' || targetScreen === 'DraughtsGame' || gameName.toLowerCase().includes('draft') || gameName.toLowerCase().includes('dráfù');
  const isWhot = gameType === 'whot' || targetScreen === 'WhotGame' || gameName.toLowerCase().includes('whot');
  const isAyo = gameType === 'ayo' || targetScreen === 'AyoGame' || gameName.toLowerCase().includes('ayo');

  const amountN = parseAmount(amountText);
  const selectedFee = nairaToKobo(amountN);
  const amountValid = amountN >= MIN_AMOUNT_N && amountN <= MAX_AMOUNT_N;
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
      timer: selectedTimer,
      tokenCount,
      playerCount,
      tokens: tokenCount,
      players: playerCount,
      playerColor,
      cardCount,
      enableSpecialCards,
      seedCount,
    });
  };

  const joinQueue = async (fee) => {
    try {
      const res = await matchmaking.join({
        gameType,
        entryFee: fee,
        rated: true,
        playerCount: 2,
      });
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
    if (!amountValid) {
      Alert.alert('Enter an amount', `Amount must be between ${naira(MIN_AMOUNT_N)} and ${naira(MAX_AMOUNT_N)}.`);
      return;
    }
    navigation.navigate(targetScreen, {
      stake: selectedFee,
      vsOba: true,
      timer: selectedTimer,
      tokenCount,
      playerCount,
      tokens: tokenCount,
      players: playerCount,
      playerColor,
      cardCount,
      enableSpecialCards,
      seedCount,
      gameId,
      gameName,
    });
  };

  const startMatchmaking = () => {
    if (!amountValid) {
      Alert.alert('Enter an amount', `Amount must be between ${naira(MIN_AMOUNT_N)} and ${naira(MAX_AMOUNT_N)}.`);
      return;
    }
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
    matchmaking.leave(gameType).catch(() => { });
    cleanup();
  };

  const startPractice = () => {
    if (!userProfile) {
      Alert.alert('Sign in required', 'Create an account to play practice games.');
      return;
    }
    navigation.navigate(targetScreen, {
      mode: 'practice',
      gameId,
      timer: selectedTimer,
      tokenCount,
      playerCount,
      tokens: tokenCount,
      players: playerCount,
      playerColor,
      cardCount,
      enableSpecialCards,
      seedCount,
    });
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
          Configure match settings below and play vs Oba or create a challenge
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

      {/* INLINE CUSTOM SETUP CARD SECTION */}
      <View style={styles.inlineSetupCard}>
        <View style={styles.inlineSetupHeader}>
          <Settings size={18} color="#00E5FF" />
          <Text style={styles.inlineSetupTitle}>Match Settings</Text>
        </View>

        {/* Turn Timer Selector */}
        <View style={styles.setupFieldBlock}>
          <Text style={styles.setupFieldLabel}>Turn Timer: <Text style={{ color: '#00E5FF', fontWeight: '900' }}>{selectedTimer === '2m' ? '2 min' : selectedTimer}</Text></Text>
          <View style={styles.pillsRow}>
            {['30s', '1m', '2m', '3m'].map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setSelectedTimer(t)}
                style={[styles.pillBtn, selectedTimer === t && styles.pillBtnActiveCyan]}
              >
                <Text style={[styles.pillBtnText, selectedTimer === t && styles.pillBtnTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ludo Specific Inline Setup */}
        {isLudo && (
          <>
            <View style={styles.setupFieldBlock}>
              <Text style={styles.setupFieldLabel}>Players Selection: <Text style={{ color: '#00E5FF', fontWeight: '900' }}>{playerCount} Players</Text></Text>
              <View style={styles.pillsRow}>
                {[2, 4].map((num) => (
                  <TouchableOpacity
                    key={num}
                    onPress={() => setPlayerCount(num)}
                    style={[styles.pillBtn, playerCount === num && styles.pillBtnActiveCyan, { flex: 1 }]}
                  >
                    <Text style={[styles.pillBtnText, playerCount === num && styles.pillBtnTextActive]}>👥 {num} Players</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.setupFieldBlock}>
              <Text style={styles.setupFieldLabel}>Tokens per Player: <Text style={{ color: '#FFB800', fontWeight: '900' }}>{tokenCount} Token{tokenCount > 1 ? 's' : ''}</Text></Text>
              <View style={styles.pillsRow}>
                {[1, 2, 3, 4].map((num) => (
                  <TouchableOpacity
                    key={num}
                    onPress={() => setTokenCount(num)}
                    style={[styles.pillBtn, tokenCount === num && styles.pillBtnActiveYellow]}
                  >
                    <Text style={[styles.pillBtnText, tokenCount === num && styles.pillBtnTextActiveDark]}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Draft Specific Inline Setup */}
        {isDraft && (
          <View style={styles.setupFieldBlock}>
            <Text style={styles.setupFieldLabel}>Your Piece Color: <Text style={{ color: '#00E5FF', fontWeight: '900' }}>{playerColor === 'white' ? '⚪ White (First)' : '⚫ Black (Second)'}</Text></Text>
            <View style={styles.pillsRow}>
              <TouchableOpacity
                onPress={() => setPlayerColor('white')}
                style={[styles.pillBtn, playerColor === 'white' && styles.pillBtnActiveCyan, { flex: 1 }]}
              >
                <Text style={[styles.pillBtnText, playerColor === 'white' && styles.pillBtnTextActive]}>⚪ White (First)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPlayerColor('black')}
                style={[styles.pillBtn, playerColor === 'black' && styles.pillBtnActiveYellow, { flex: 1 }]}
              >
                <Text style={[styles.pillBtnText, playerColor === 'black' && styles.pillBtnTextActiveDark]}>⚫ Black (Second)</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Whot Specific Inline Setup */}
        {isWhot && (
          <View style={styles.setupFieldBlock}>
            <Text style={styles.setupFieldLabel}>Starting Cards: <Text style={{ color: '#00E5FF', fontWeight: '900' }}>{cardCount} Cards</Text></Text>
            <View style={styles.pillsRow}>
              {[3, 4, 5, 6, 7, 8].map((num) => (
                <TouchableOpacity
                  key={num}
                  onPress={() => setCardCount(num)}
                  style={[styles.pillBtn, cardCount === num && styles.pillBtnActiveCyan]}
                >
                  <Text style={[styles.pillBtnText, cardCount === num && styles.pillBtnTextActive]}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => setEnableSpecialCards(!enableSpecialCards)}
              style={styles.toggleRow}
            >
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>Special Cards (1,2,5,8,14,20)</Text>
              <Text style={{ color: enableSpecialCards ? '#10B981' : '#EF4444', fontWeight: '900', fontSize: 13 }}>
                {enableSpecialCards ? 'ON ✓' : 'OFF ✕'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ayo Specific Inline Setup */}
        {isAyo && (
          <View style={styles.setupFieldBlock}>
            <Text style={styles.setupFieldLabel}>Seeds per Pit: <Text style={{ color: '#00E5FF', fontWeight: '900' }}>{seedCount} Seeds</Text></Text>
            <View style={styles.pillsRow}>
              {[3, 4, 5].map((num) => (
                <TouchableOpacity
                  key={num}
                  onPress={() => setSeedCount(num)}
                  style={[styles.pillBtn, seedCount === num && styles.pillBtnActiveCyan, { flex: 1 }]}
                >
                  <Text style={[styles.pillBtnText, seedCount === num && styles.pillBtnTextActive]}>🌰 {num} Seeds</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Challenge Amount</Text>

      <View style={[styles.amountRow, { borderColor: amountValid ? theme.inputBorder : '#EF4444' }]}>
        <Text style={[styles.amountPrefix, { color: theme.textSecondary }]}>₦</Text>
        <TextInput
          value={amountText}
          onChangeText={setAmountText}
          keyboardType="numeric"
          placeholder={`${MIN_AMOUNT_N} - ${MAX_AMOUNT_N}`}
          placeholderTextColor={theme.textSecondary}
          style={[styles.amountInput, { color: theme.textPrimary }]}
        />
      </View>
      <Text style={[styles.amountHint, { color: amountValid ? theme.textSecondary : '#EF4444' }]}>
        {amountValid
          ? `${naira(koboToN(selectedFee))} stake = ${coinsFromNaira(amountN).toLocaleString()} coins (1 coin = ₦50)`
          : `Amount must be between ${naira(MIN_AMOUNT_N)} and ${naira(MAX_AMOUNT_N)}`}
      </Text>
      <View style={styles.quickRow}>
        {QUICK_AMOUNTS.map((amt) => {
          const active = amountN === amt;
          return (
            <TouchableOpacity
              key={amt}
              onPress={() => setAmountText(String(amt))}
              style={[
                styles.quickChip,
                { backgroundColor: active ? theme.cardBg : theme.inputBg, borderColor: active ? theme.primary : theme.inputBorder },
              ]}
            >
              <Text style={[styles.quickChipText, { color: active ? theme.accent : theme.textMuted }]}>
                ₦{amt.toLocaleString()}
              </Text>
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
          <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>{amountValid ? naira(koboToN(selectedFee)) : '—'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={{ color: theme.textSecondary }}>Winner takes (up to):</Text>
          <Text style={{ color: theme.success, fontWeight: '800' }}>{amountValid ? naira(koboToN(Math.floor(selectedFee * 1.9))) : '—'}</Text>
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

      <GAButton
        title="Create Challenge"
        onPress={() => navigation.navigate('ChallengeHub', { gameType, gameName, targetScreen })}
        icon={<Swords size={20} color="#FFF" />}
        style={{ marginTop: 12 }}
      />

      {!isSearching ? (
        <GAButton
          title="Quick Match"
          onPress={startMatchmaking}
          variant="outline"
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
  },
  setupRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  amountPrefix: {
    fontSize: 20,
    fontWeight: '900',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    paddingVertical: 12,
  },
  amountHint: {
    fontSize: 12,
    marginBottom: 10,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  quickChipText: {
    fontWeight: '800',
    fontSize: 13,
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
  inlineSetupCard: {
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    gap: 16,
  },
  inlineSetupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 10,
  },
  inlineSetupTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  setupFieldBlock: {
    gap: 8,
  },
  setupFieldLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBtnActiveCyan: {
    backgroundColor: '#00E5FF',
    borderColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  pillBtnActiveYellow: {
    backgroundColor: '#FFB800',
    borderColor: '#FFB800',
    shadowColor: '#FFB800',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  pillBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  pillBtnTextActive: {
    color: '#070C1B',
    fontWeight: '900',
  },
  pillBtnTextActiveDark: {
    color: '#070C1B',
    fontWeight: '900',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
});
