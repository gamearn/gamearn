import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Trophy, Play, Square } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getAiDifficulty } from '../../utils/aiDifficulty';
import { getActiveMatch, clearActiveMatch } from '../../utils/activeMatch';

export default function GameSetupScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { userProfile } = useAuth();
  const gameName = route.params?.gameName || 'Dráfù Game';
  const targetScreen = route.params?.targetScreen || 'DraughtsGame';
  const leaderboardRank = route.params?.rank || '2,625';
  const entryFee = route.params?.entryFee || 'Free';

  const [selectedTimer, setSelectedTimer] = useState('2m');
  const TIMERS = ['30s', '1m', '2m', '3m'];

  // Game-specific custom setup state
  const [tokenCount, setTokenCount] = useState(4); // For Ludo: 1, 2, 3, 4
  const [playerColor, setPlayerColor] = useState('white'); // For Checkers/Draft: 'white' or 'black'
  const [cardCount, setCardCount] = useState(6); // For WHOT: 3 to 8
  const [specialCards, setSpecialCards] = useState({
    1: true,
    2: true,
    5: true,
    8: true,
    14: true,
    20: true,
  });

  const toggleSpecialCard = (num) => {
    setSpecialCards((prev) => ({
      ...prev,
      [num]: !prev[num],
    }));
  };
  const [activeMatch, setActiveMatch] = useState(null);

  useEffect(() => {
    let alive = true;
    const checkMatch = async () => {
      const match = await getActiveMatch();
      if (alive) setActiveMatch(match || null);
    };
    checkMatch();
    const unsubscribe = navigation.addListener('focus', checkMatch);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [navigation]);

  const handleEndGame = async () => {
    const match = await getActiveMatch();
    if (!match) {
      Alert.alert('No Active Match', 'There is no active game session in progress to end.');
      return;
    }
    Alert.alert(
      'End Game',
      `Are you sure you want to end your active ${match.gameName || 'game'} session? This will reset the match.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Game',
          style: 'destructive',
          onPress: async () => {
            await clearActiveMatch();
            setActiveMatch(null);
            Alert.alert('Game Ended ⏹️', 'Your active game session has been ended.');
          },
        },
      ]
    );
  };

  const currentGp = Number(userProfile?.gamePower ?? userProfile?.gp ?? 0);
  const calculatedDifficulty = getAiDifficulty(userProfile, 'auto');
  const difficultyBadgeLabel =
    calculatedDifficulty === 'easy'
      ? '🟢 Easy'
      : calculatedDifficulty === 'medium'
        ? '🟡 Medium'
        : '🔴 Hard';

  const handleStartGame = () => {
    const nulled = [1, 2, 5, 8, 14]
      .filter((num) => specialCards[num] === false)
      .map(String);
    const removed = specialCards[20] === false ? ['20'] : [];

    navigation.navigate(targetScreen, {
      timer: selectedTimer,
      tokenCount,
      playerColor,
      cardCount,
      cards: cardCount,
      startCards: cardCount,
      startingCards: cardCount,
      specialCards,
      nulled,
      removed,
      aiDifficulty: 'auto',
      gameName,
      targetScreen,
      entryFee,
      resetKey: Date.now(),
    });
  };

  const isLudo = targetScreen === 'LudoGame' || gameName.toLowerCase().includes('ludo');
  const isDraft = targetScreen === 'DraughtsGame' || gameName.toLowerCase().includes('dráfù') || gameName.toLowerCase().includes('draft') || gameName.toLowerCase().includes('checkers');
  const isWhot = targetScreen === 'WhotGame' || gameName.toLowerCase().includes('whot');

  return (
    <View style={[styles.screenRoot, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />
      <LinearGradient colors={theme.gradientBg} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
          style={[styles.backCircleBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}
        >
          <ArrowLeft size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{gameName} Set-up</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title & Subtitle */}
        <View style={styles.titleSection}>
          <Text style={[styles.mainTitle, { color: theme.textPrimary }]}>Game Setup</Text>
          <Text style={[styles.subTitle, { color: theme.textSecondary }]}>Configure your match settings</Text>
        </View>

        {/* Turn Timer Setting */}
        <View style={styles.settingBlock}>
          <View style={styles.settingHeaderRow}>
            <Text style={styles.settingLabel}>Turn Timer</Text>
            <Text style={styles.selectedTimerValue}>{selectedTimer === '2m' ? '2 min' : selectedTimer}</Text>
          </View>

          {/* Slider Line & Nodes */}
          <View style={styles.sliderTrackContainer}>
            <View style={styles.sliderTrackBackground} />
            <LinearGradient
              colors={['#00E5FF', '#0284C7']}
              style={[
                styles.sliderTrackActive,
                {
                  width:
                    selectedTimer === '30s'
                      ? '0%'
                      : selectedTimer === '1m'
                        ? '33%'
                        : selectedTimer === '2m'
                          ? '66%'
                          : '100%',
                },
              ]}
            />
            <View style={styles.nodesRow}>
              {TIMERS.map((t) => {
                const isSelected = selectedTimer === t;
                return (
                  <TouchableOpacity
                    key={t}
                    activeOpacity={0.8}
                    onPress={() => setSelectedTimer(t)}
                    style={styles.nodeTouchable}
                  >
                    <View style={[styles.nodeCircle, isSelected && styles.nodeCircleSelected]} />
                    <Text style={[styles.nodeText, isSelected && { color: '#00E5FF', fontWeight: '900' }]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>



        {/* LUDO Custom Tokens Setting */}
        {isLudo && (
          <View style={styles.settingBlock}>
            <View style={styles.settingHeaderRow}>
              <Text style={styles.settingLabel}>Tokens per Player</Text>
              <Text style={styles.selectedTimerValue}>{tokenCount} Token{tokenCount > 1 ? 's' : ''}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              {[1, 2, 3, 4].map((num) => (
                <TouchableOpacity
                  key={num}
                  onPress={() => setTokenCount(num)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: tokenCount === num ? '#00E5FF' : 'rgba(255,255,255,0.06)',
                    borderWidth: 1.5,
                    borderColor: tokenCount === num ? '#00E5FF' : 'rgba(255,255,255,0.15)',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: tokenCount === num ? '#070C1B' : '#FFF', fontWeight: '900', fontSize: 15 }}>
                    {num} {num === 4 ? '(Default)' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* DRAFT Custom Piece Color Setting removed - coin toss decides */}
        {isDraft && (
          <View style={styles.settingBlock}>
            <View style={styles.settingHeaderRow}>
              <Text style={styles.settingLabel}>Board Side & 1st Turn</Text>
              <Text style={styles.selectedTimerValue}>🪙 Coin Toss</Text>
            </View>
            <View style={{ marginTop: 10, padding: 14, borderRadius: 12, backgroundColor: 'rgba(245, 158, 11, 0.1)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <Text style={{ color: '#F59E0B', fontWeight: '800', fontSize: 14, textAlign: 'center' }}>
                🪙 The coin toss decides who takes which side and who moves first!
              </Text>
            </View>
          </View>
        )}

        {/* WHOT Custom Cards Setting */}
        {isWhot && (
          <View style={styles.settingBlock}>
            <View style={styles.settingHeaderRow}>
              <Text style={styles.settingLabel}>Starting Cards Count</Text>
              <Text style={styles.selectedTimerValue}>{cardCount} Cards</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {[3, 4, 5, 6, 7, 8].map((num) => (
                <TouchableOpacity
                  key={num}
                  onPress={() => setCardCount(num)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: cardCount === num ? '#00E5FF' : 'rgba(255,255,255,0.06)',
                    borderWidth: 1.5,
                    borderColor: cardCount === num ? '#00E5FF' : 'rgba(255,255,255,0.15)',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: cardCount === num ? '#070C1B' : '#FFF', fontWeight: '900', fontSize: 14 }}>
                    {num} Cards {num === 6 ? '(Standard)' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ marginTop: 18 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ color: '#00E5FF', fontWeight: '800', fontSize: 14 }}>Special Cards Rules</Text>
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

              <Text style={{ color: '#94A3B8', fontSize: 12, lineHeight: 17, marginBottom: 10 }}>
                Turning off a card turns it into a normal card (e.g. 2 has no pick 2). Turning off Whot 20 removes it completely from the deck for both players and Oba.
              </Text>

              <View style={styles.tableWrap}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableColHeader, { width: 68 }]}>CARD #</Text>
                  <Text style={[styles.tableColHeader, { flex: 1, paddingHorizontal: 6 }]}>SPECIAL RULE</Text>
                  <Text style={[styles.tableColHeader, { width: 104, textAlign: 'center' }]}>CONTROL</Text>
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
                      <View style={{ width: 68, flexDirection: 'row', alignItems: 'center' }}>
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

                      <View style={{ width: 104, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
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

        {/* Spacer */}
        <View style={{ minHeight: 40 }} />

        {/* Leaderboard Position & Entry Fee Card */}
        <View style={styles.metaCard}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>LEADERBOARD POSITION</Text>
            <View style={styles.metaValueRow}>
              <Trophy size={16} color="#00E5FF" style={{ marginRight: 6 }} />
              <Text style={styles.metaValueCyan}>{leaderboardRank}</Text>
            </View>
          </View>

          <View style={styles.metaItemRight}>
            <Text style={styles.metaLabel}>ENTRY FEE</Text>
            <Text style={styles.metaValueWhite}>{entryFee}</Text>
          </View>
        </View>

        {/* Start Game Orange CTA */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleStartGame}
          style={styles.primaryOrangeBtn}
        >
          <Text style={styles.primaryOrangeBtnText}>START GAME ▷</Text>
        </TouchableOpacity>

        {/* End Game Button (relocated from leave modal directly into each game setup page) */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleEndGame}
          style={[styles.endGameBtn, activeMatch && styles.endGameBtnActive]}
        >
          <Square
            size={16}
            color={activeMatch ? '#EF4444' : '#94A3B8'}
            fill={activeMatch ? '#EF4444' : 'transparent'}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.endGameBtnText, activeMatch && { color: '#EF4444' }]}>
            {activeMatch ? 'END GAME (SESSION IN PROGRESS)' : 'END GAME'}
          </Text>
        </TouchableOpacity>

        {/* Terms Disclaimer */}
        <Text style={styles.disclaimerText}>
          By starting, you agree to the Game Rules and Terms of Service.
        </Text>

        {/* Footer Brand Logo */}
        <View style={styles.footerBrandWrap}>
          <Text style={styles.brandTitle}>GAMEARN</Text>
          <Text style={styles.brandSub}>WHERE SKILL BECOMES REWARD</Text>
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
    paddingBottom: 40,
    flexGrow: 1,
  },
  titleSection: {
    marginTop: 10,
    marginBottom: 30,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  subTitle: {
    color: '#94A3B8',
    fontSize: 13,
  },
  settingBlock: {
    marginBottom: 30,
  },
  settingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  selectedTimerValue: {
    color: '#00E5FF',
    fontSize: 16,
    fontWeight: '900',
  },
  sliderTrackContainer: {
    height: 50,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrackBackground: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
  },
  sliderTrackActive: {
    position: 'absolute',
    left: 10,
    height: 6,
    borderRadius: 3,
  },
  nodesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nodeTouchable: {
    alignItems: 'center',
    width: 40,
  },
  nodeCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#334155',
    marginBottom: 8,
  },
  nodeCircleSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00E5FF',
    borderWidth: 3,
    borderColor: '#070C1B',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  nodeText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  metaCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 25, 45, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },
  metaItem: {},
  metaItemRight: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaValueCyan: {
    color: '#00E5FF',
    fontSize: 22,
    fontWeight: '900',
  },
  metaValueWhite: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  primaryOrangeBtn: {
    backgroundColor: '#FF5500',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF5500',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    marginBottom: 16,
  },
  primaryOrangeBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  endGameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  endGameBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderColor: '#EF4444',
  },
  endGameBtnText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  disclaimerText: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 30,
  },
  footerBrandWrap: {
    alignItems: 'center',
  },
  brandTitle: {
    color: '#FF5500',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandSub: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  tableWrap: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    marginBottom: 10,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(0, 229, 255, 0.2)',
  },
  tableColHeader: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  tableCardBadge: {
    width: 36,
    height: 36,
    borderRadius: 9,
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
    fontSize: 16,
    fontWeight: '900',
  },
  tableCardName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  tableCardDesc: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  toggleSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toggleSegmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  toggleSegmentBtnOn: {
    backgroundColor: '#10B981',
  },
  toggleSegmentBtnOff: {
    backgroundColor: '#EF4444',
  },
  toggleSegmentText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
  },
  toggleSegmentTextActive: {
    color: '#FFFFFF',
  },
});
