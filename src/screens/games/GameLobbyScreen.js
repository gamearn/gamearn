import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { Swords, Settings, ArrowLeft, Wallet, Cpu } from 'lucide-react-native';
import BrandLogo from '../../components/BrandLogo';
import GAButton from '../../components/GAButton';
import GACard from '../../components/GACard';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { matchmaking, challenges } from '../../services/api';
import { GamearnSocket } from '../../services/gamearnSocket';
import { valuePointsFromNaira, koboToN, naira, nairaToKobo } from '../../config/appConfig';

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
  const [specialCards, setSpecialCards] = useState({
    1: true,
    2: true,
    5: true,
    8: true,
    14: true,
    20: true,
  });
  const [seedCount, setSeedCount] = useState(4);

  const nulled = [1, 2, 5, 8, 14]
    .filter((num) => specialCards[num] === false)
    .map(String);
  const removed = specialCards[20] === false ? ['20'] : [];

  const isLudo = gameType === 'ludo' || targetScreen === 'LudoGame' || gameName.toLowerCase().includes('ludo');
  const isDraft = gameType === 'draughts' || gameType === 'draft' || targetScreen === 'DraughtsGame' || gameName.toLowerCase().includes('draft') || gameName.toLowerCase().includes('dráfù');
  const isWhot = gameType === 'whot' || targetScreen === 'WhotGame' || gameName.toLowerCase().includes('whot');
  const isAyo = gameType === 'ayo' || targetScreen === 'AyoGame' || gameName.toLowerCase().includes('ayo');

  const amountN = parseAmount(amountText);
  const selectedFee = nairaToKobo(amountN);
  const amountValid = amountN >= MIN_AMOUNT_N && amountN <= MAX_AMOUNT_N;
  const balanceNaira = Number(userProfile?.walletBalance ?? userProfile?.valuePoints ?? 0);
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
      specialCards,
      nulled,
      removed,
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
    navigation.navigate(targetScreen, {
      stake: 0,
      vsOba: true,
      timer: selectedTimer,
      tokenCount,
      playerCount: isWhot ? 2 : playerCount,
      tokens: tokenCount,
      players: isWhot ? 2 : playerCount,
      playerColor,
      cardCount,
      cards: cardCount,
      enableSpecialCards,
      seedCount,
      gameId,
      gameName,
    });
  };

  const handleQuickMatch = () => {
    if (!userProfile) {
      Alert.alert('Sign in required', 'Create an account to play quick matches.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }

    setIsSearching(true);
    setQueueLen(1);

    let matchHandled = false;

    const launchMatch = (p = null) => {
      if (matchHandled) return;
      matchHandled = true;
      cleanup();
      setIsSearching(false);

      if (p && p.roomId) {
        navigateToMatch(p);
      } else {
        navigation.navigate(targetScreen, {
          stake: 0,
          vsOba: true,
          timer: selectedTimer,
          tokenCount,
          playerCount: isWhot ? 2 : playerCount,
          tokens: tokenCount,
          players: isWhot ? 2 : playerCount,
          playerColor,
          cardCount,
          enableSpecialCards,
          seedCount,
          gameId,
          gameName,
          isQuickMatch: true,
        });
      }
    };

    const fallbackTimer = setTimeout(() => {
      launchMatch();
    }, 2500);

    try {
      const sock = new GamearnSocket({
        onConnected: () => {
          joinQueue(0).catch(() => {
            clearTimeout(fallbackTimer);
            launchMatch();
          });
        },
        onMatchFound: (p) => {
          clearTimeout(fallbackTimer);
          launchMatch(p);
        },
        onError: (_msg) => {
          clearTimeout(fallbackTimer);
          launchMatch();
        },
      });
      sockRef.current = sock;
      sock.connect().catch(() => {
        clearTimeout(fallbackTimer);
        launchMatch();
      });
    } catch (_err) {
      clearTimeout(fallbackTimer);
      launchMatch();
    }
  };

  const handleCreateChallenge = async () => {
    if (!amountValid) {
      Alert.alert('Enter an amount', `Amount must be between ${naira(MIN_AMOUNT_N)} and ${naira(MAX_AMOUNT_N)}.`);
      return;
    }
    if (!userProfile) {
      Alert.alert('Sign in required', 'Create an account to issue challenges.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    if (balanceKobo < selectedFee) {
      Alert.alert(
        'Insufficient balance',
        `This challenge costs ${naira(koboToN(selectedFee))}. Your balance is ${naira(balanceNaira)}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy Value Points', onPress: () => navigation.navigate('BuyValuePoints') },
        ]
      );
      return;
    }

    try {
      await challenges.create({
        gameType,
        entryFeeKobo: selectedFee,
        options: {
          timer: selectedTimer,
          tokenCount,
          playerCount,
          playerColor,
          cardCount,
          enableSpecialCards,
          specialCards,
          nulled,
          removed,
          seedCount,
        },
      });

      Alert.alert(
        '⚔️ Challenge Created!',
        `Your ${valuePointsFromKobo(selectedFee).toLocaleString()} VP ${gameName} match has been published. All online players have been notified to join!`,
        [
          {
            text: 'View My Matches',
            onPress: () => navigation.navigate('MainTabs'),
          },
        ]
      );
    } catch (err) {
      Alert.alert('Create failed', err?.message || 'Could not create the challenge.');
    }
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
      specialCards,
      nulled,
      removed,
      seedCount,
    });
  };

  const openDeposit = () => {
    if (!userProfile) {
      Alert.alert('Sign in required', 'Create an account to top up.');
      return;
    }
    navigation.navigate('BuyValuePoints');
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
          Configure match settings below and play vs Oba or join Quick Match
        </Text>
      </View>

      {/* Acquired points */}
      <View style={styles.walletRow}>
        <Wallet size={18} color={theme.accent} />
        <Text style={[styles.walletText, { color: theme.textPrimary }]}>
          Acquired Value Points: {valuePointsFromNaira(balanceNaira).toLocaleString()} VP
        </Text>
      </View>

      {/* INLINE CUSTOM SETUP CARD SECTION */}
      <View style={styles.inlineSetupCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={styles.inlineSetupHeader}>
            <Settings size={18} color="#00E5FF" />
            <Text style={styles.inlineSetupTitle}>Match Settings</Text>
          </View>
          {isWhot && (
            <TouchableOpacity
              onPress={() => navigation.navigate('WhotSetup', { gameId, gameName, targetScreen })}
              style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(0, 229, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.25)' }}
            >
              <Text style={{ color: '#00E5FF', fontSize: 12, fontWeight: '800' }}>Dedicated Setup ⚙️</Text>
            </TouchableOpacity>
          )}
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

        {/* Draft Specific Inline Setup - coin toss decides */}
        {isDraft && (
          <View style={styles.setupFieldBlock}>
            <Text style={styles.setupFieldLabel}>Board Side & 1st Turn: <Text style={{ color: '#F59E0B', fontWeight: '900' }}>🪙 Coin Toss</Text></Text>
            <View style={{ marginTop: 8, padding: 12, borderRadius: 10, backgroundColor: 'rgba(245, 158, 11, 0.12)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <Text style={{ color: '#F59E0B', fontWeight: '800', fontSize: 13, textAlign: 'center' }}>
                🪙 Pre-match coin toss decides who takes which side and who moves first!
              </Text>
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
            <View style={{ marginTop: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ color: '#00E5FF', fontWeight: '800', fontSize: 13 }}>Special Cards Rules</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    onPress={() => setSpecialCards({ 1: true, 2: true, 5: true, 8: true, 14: true, 20: true })}
                    style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  >
                    <Text style={{ color: '#00E5FF', fontSize: 11, fontWeight: '800' }}>All ON</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setSpecialCards({ 1: false, 2: false, 5: false, 8: false, 14: false, 20: false })}
                    style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  >
                    <Text style={{ color: '#00E5FF', fontSize: 11, fontWeight: '800' }}>All OFF</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={{ color: '#94A3B8', fontSize: 11, lineHeight: 15, marginBottom: 8 }}>
                Turning off a card turns it into a normal card (e.g. 2 has no pick 2). Turning off Whot 20 removes it completely from the deck for both players and Oba.
              </Text>

              {/* Tabulated Special Card Rules */}
              <View style={styles.tableWrap}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableColHeader, { width: 62 }]}>CARD #</Text>
                  <Text style={[styles.tableColHeader, { flex: 1, paddingHorizontal: 6 }]}>SPECIAL RULE</Text>
                  <Text style={[styles.tableColHeader, { width: 96, textAlign: 'center' }]}>CONTROL</Text>
                </View>

                {[
                  { num: 1, name: 'Hold On', desc: 'Plays again immediately' },
                  { num: 2, name: 'Pick Two', desc: 'Next player draws 2 cards' },
                  { num: 5, name: 'Pick Three', desc: 'Next player draws 3 cards' },
                  { num: 8, name: 'Suspension', desc: 'Next player skips turn' },
                  { num: 14, name: 'General Market', desc: 'All opponents draw 1 card' },
                  { num: 20, name: 'Whot 20', desc: 'Wildcard (OFF removes from game)' },
                ].map((item, idx, arr) => {
                  const isEnabled = specialCards[item.num] !== false;
                  const isLast = idx === arr.length - 1;
                  return (
                    <View
                      key={item.num}
                      style={[
                        styles.tableRow,
                        isLast && { borderBottomWidth: 0 },
                        !isEnabled && { backgroundColor: 'rgba(239, 68, 68, 0.04)' },
                      ]}
                    >
                      <View style={{ width: 62, flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.tableCardBadge, !isEnabled && styles.tableCardBadgeDisabled]}>
                          <Text style={[styles.tableCardBadgeText, !isEnabled && { color: '#64748B' }]}>
                            {item.num}
                          </Text>
                        </View>
                      </View>

                      <View style={{ flex: 1, paddingHorizontal: 6 }}>
                        <Text style={[styles.tableCardName, !isEnabled && { color: '#94A3B8' }]}>
                          {item.name}
                        </Text>
                        <Text style={[styles.tableCardDesc, !isEnabled && { color: '#EF4444' }]}>
                          {isEnabled
                            ? item.desc
                            : item.num === 20
                            ? '🚫 Removed from deck'
                            : '⚪ Normal card (No effect)'}
                        </Text>
                      </View>

                      <View style={{ width: 96, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <View style={styles.toggleSegmentContainer}>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setSpecialCards((prev) => ({ ...prev, [item.num]: true }))}
                            style={[
                              styles.toggleSegmentBtn,
                              isEnabled && styles.toggleSegmentBtnOn,
                            ]}
                          >
                            <Text style={[styles.toggleSegmentText, isEnabled && styles.toggleSegmentTextActive]}>
                              ON
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setSpecialCards((prev) => ({ ...prev, [item.num]: false }))}
                            style={[
                              styles.toggleSegmentBtn,
                              !isEnabled && styles.toggleSegmentBtnOff,
                            ]}
                          >
                            <Text style={[styles.toggleSegmentText, !isEnabled && styles.toggleSegmentTextActive]}>
                              OFF
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
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

      {/* Button 1: Play vs Oba */}
      <GAButton
        title="Play vs Oba 👑"
        onPress={handlePlayVsOba}
        variant="secondary"
        icon={<Cpu size={20} color={theme.primary} />}
        style={{ marginTop: 24 }}
      />

      {!isSearching ? (
        <GAButton
          title="Quick Match (Free Broadcast) ⚡"
          onPress={handleQuickMatch}
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
  tableWrap: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(10, 16, 32, 0.85)',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tableColHeader: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  tableCardBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCardBadgeDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tableCardBadgeText: {
    color: '#00E5FF',
    fontSize: 14,
    fontWeight: '900',
  },
  tableCardName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  tableCardDesc: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  toggleSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toggleSegmentBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  toggleSegmentBtnOn: {
    backgroundColor: '#10B981',
  },
  toggleSegmentBtnOff: {
    backgroundColor: '#EF4444',
  },
  toggleSegmentText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '900',
  },
  toggleSegmentTextActive: {
    color: '#FFFFFF',
  },
});
