import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

/**
 * Shared Coin Toss Modal component for all games (Whot, Ludo, Ayo, Draughts).
 * Simulates / receives the backend coin toss decision to select who plays 1st,
 * displays a prompt of the coin toss winner and formation order, and automatically
 * disappears after 5 seconds to start the game.
 */
export default function CoinTossModal({
  visible = false,
  players = [],
  onComplete,
  gameName = 'Match',
  initialWinnerIndex = null,
}) {
  const { userProfile } = useAuth();
  const [countdown, setCountdown] = useState(5);
  const [tossResult, setTossResult] = useState(null); // { winnerIndex, winnerPlayer }
  const coinSpinAnim = useRef(new Animated.Value(0)).current;
  // Callers often pass an inline players array that is a new reference on every
  // render, so the effect must key off the roster's contents (playersKey) rather
  // than the array identity — otherwise it re-runs and resets the countdown forever.
  const playersRef = useRef(players);
  playersRef.current = players;
  const playersKey = (players || [])
    .map((p) => `${p?.id ?? p?.uid ?? ''}:${p?.name || p?.displayName || ''}`)
    .join('|');

  useEffect(() => {
    if (!visible) {
      setCountdown(5);
      setTossResult(null);
      return;
    }

    const roster = playersRef.current || [];
    // Determine coin toss winner (backend decision / randomized coin toss)
    const count = Math.max(1, roster.length || 2);
    let winnerIdx;
    if (initialWinnerIndex != null && initialWinnerIndex >= 0 && initialWinnerIndex < count) {
      winnerIdx = initialWinnerIndex;
    } else {
      winnerIdx = Math.floor(Math.random() * count);
    }
    const winnerPlayer = roster[winnerIdx] || {
      id: winnerIdx,
      name: winnerIdx === 0 ? (userProfile?.username || 'You') : `Player ${winnerIdx + 1}`,
      isUser: winnerIdx === 0,
    };

    setTossResult({ winnerIndex: winnerIdx, winnerPlayer });

    // Coin spin animation (useNativeDriver: false is rock-solid across web/mobile/windows for rotateY)
    coinSpinAnim.setValue(0);
    const spinLoop = Animated.loop(
      Animated.timing(coinSpinAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    spinLoop.start();

    // 5-second countdown timer
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          spinLoop.stop();
          onComplete?.(winnerIdx, winnerPlayer, winnerIdx === 0 ? 'white' : 'black');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      spinLoop.stop();
    };
  }, [visible, playersKey, initialWinnerIndex]);

  if (!visible || !tossResult) return null;

  const spinInterpolate = coinSpinAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '360deg'],
  });

  const winner = tossResult.winnerPlayer;
  const isHumanWinner = winner?.isUser || tossResult.winnerIndex === 0;
  const winnerDisplayName = isHumanWinner
    ? (userProfile?.username || userProfile?.displayName || 'You')
    : (winner?.username || winner?.name || winner?.displayName || 'Oba');

  const isCheckers = /dr[aá]f[uù]|checker/i.test(gameName);

  // Build formation list starting with coin toss winner
  const turnOrderList = [];
  if (players.length > 0) {
    for (let i = 0; i < players.length; i++) {
      const idx = (tossResult.winnerIndex + i) % players.length;
      turnOrderList.push({
        turn: i + 1,
        player: players[idx],
        isWinner: i === 0,
      });
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => onComplete?.(tossResult.winnerIndex, tossResult.winnerPlayer, isHumanWinner ? 'white' : 'black')}
    >
      <View style={styles.scrim}>
        <View style={styles.card}>
          {/* Top Header Badge */}
          <View style={styles.badgeRow}>
            <Text style={styles.badgeText}>🪙 PRE-MATCH COIN TOSS</Text>
            <View style={styles.timerChip}>
              <Text style={styles.timerChipText}>⏱️ Starts in {countdown}s</Text>
            </View>
          </View>

          {/* Animated Coin */}
          <View style={styles.coinContainer}>
            <Animated.View
              style={{
                transform: [{ perspective: 1000 }, { rotateY: spinInterpolate }],
              }}
            >
              <Text style={styles.coinIcon}>🪙</Text>
            </Animated.View>
          </View>

          {/* Winner Prompt Announcement */}
          <Text style={styles.promptTitle}>{gameName} Starting Side & Turn</Text>
          <View style={styles.winnerBox}>
            <Text style={styles.winnerSub}>WINNER OF COIN TOSS</Text>
            <Text style={styles.winnerName} numberOfLines={1}>
              {winnerDisplayName}
            </Text>
            {isCheckers ? (
              <>
                <Text style={styles.winnerAction}>
                  🎉 {isHumanWinner ? 'You won the toss! You are White & play 1st!' : `👑 ${winnerDisplayName} won the toss! ${winnerDisplayName} is White & plays 1st!`}
                </Text>
                <Text style={[styles.winnerAction, { color: '#94a3b8', fontSize: 13, marginTop: 4 }]}>
                  {isHumanWinner ? 'Opponent is Black and plays 2nd.' : 'You are Black and play 2nd.'}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.winnerAction}>
                  🎉 {isHumanWinner ? 'You won the toss! You play 1st!' : `👑 ${winnerDisplayName} won the toss and plays 1st!`}
                </Text>
                <Text style={[styles.winnerAction, { color: '#94a3b8', fontSize: 13, marginTop: 4 }]}>
                  {isHumanWinner ? 'Opponent plays 2nd.' : 'You play 2nd.'}
                </Text>
              </>
            )}
          </View>

          {/* Formation Turn Order */}
          {turnOrderList.length > 0 && (
            <View style={styles.formationBox}>
              <Text style={styles.formationHeader}>MATCH FORMATION ORDER</Text>
              {turnOrderList.map((item) => {
                const p = item.player;
                const pName = p?.isUser
                  ? (userProfile?.username || 'You') + ' (You)'
                  : (p?.name || p?.displayName || 'Opponent');
                const medals = ['🥇 1st Turn', '🥈 2nd Turn', '🥉 3rd Turn', '🎖️ 4th Turn'];
                return (
                  <View key={item.turn} style={styles.formationRow}>
                    <Text style={[styles.turnLabel, item.isWinner && styles.turnLabelWinner]}>
                      {medals[item.turn - 1] || `${item.turn}th Turn`}
                    </Text>
                    <Text style={[styles.playerLabel, item.isWinner && styles.playerLabelWinner]}>
                      {pName}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Countdown Action Button */}
          <Pressable
            style={styles.actionBtn}
            onPress={() => onComplete?.(tossResult.winnerIndex, tossResult.winnerPlayer, isHumanWinner ? 'white' : 'black')}
          >
            <Text style={styles.actionBtnText}>START MATCH ({countdown}s)</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 20, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 22,
    borderWidth: 2,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 1,
  },
  timerChip: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timerChipText: {
    color: '#F59E0B',
    fontWeight: '800',
    fontSize: 12,
  },
  coinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  coinIcon: {
    fontSize: 56,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  winnerBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    marginBottom: 14,
  },
  winnerSub: {
    fontSize: 10,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 1,
    marginBottom: 4,
  },
  winnerName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  winnerAction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FCD34D',
    textAlign: 'center',
  },
  formationBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  formationHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  formationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'space-between',
    paddingVertical: 5,
  },
  turnLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  turnLabelWinner: {
    color: '#F59E0B',
    fontWeight: '900',
  },
  playerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  playerLabelWinner: {
    color: '#00E5FF',
    fontWeight: '900',
  },
  actionBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#0F172A',
    fontWeight: '900',
    fontSize: 15,
  },
});
