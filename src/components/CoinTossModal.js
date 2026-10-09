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
}) {
  const { userProfile } = useAuth();
  const [countdown, setCountdown] = useState(5);
  const [tossResult, setTossResult] = useState(null); // { winnerIndex, winnerPlayer }
  const coinSpinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setCountdown(5);
      setTossResult(null);
      return;
    }

    // Determine coin toss winner (backend decision / randomized coin toss)
    const count = Math.max(1, players.length || 2);
    const winnerIdx = Math.floor(Math.random() * count);
    const winnerPlayer = players[winnerIdx] || {
      id: winnerIdx,
      name: winnerIdx === 0 ? (userProfile?.username || 'You') : `Player ${winnerIdx + 1}`,
      isUser: winnerIdx === 0,
    };

    setTossResult({ winnerIndex: winnerIdx, winnerPlayer });

    // Coin spin animation
    coinSpinAnim.setValue(0);
    Animated.loop(
      Animated.timing(coinSpinAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 5-second countdown timer
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete?.(winnerIdx, winnerPlayer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, players]);

  if (!visible || !tossResult) return null;

  const spinInterpolate = coinSpinAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '360deg'],
  });

  const winner = tossResult.winnerPlayer;
  const winnerDisplayName = winner?.isUser
    ? (userProfile?.fullName || userProfile?.username || 'You (You)')
    : (winner?.name || winner?.displayName || 'Opponent');

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
      onRequestClose={() => onComplete?.(tossResult.winnerIndex, tossResult.winnerPlayer)}
    >
      <View style={styles.scrim}>
        <View style={styles.card}>
          {/* Top Header Badge */}
          <View style={styles.badgeRow}>
            <Text style={styles.badgeText}>🪙 BACKEND COIN TOSS</Text>
            <View style={styles.timerChip}>
              <Text style={styles.timerChipText}>⏱️ Starts in {countdown}s</Text>
            </View>
          </View>

          {/* Animated Coin */}
          <View style={styles.coinContainer}>
            <Animated.Text
              style={[
                styles.coinIcon,
                { transform: [{ rotateY: spinInterpolate }] },
              ]}
            >
              🪙
            </Animated.Text>
          </View>

          {/* Winner Prompt Announcement */}
          <Text style={styles.promptTitle}>{gameName} Starting Turn</Text>
          <View style={styles.winnerBox}>
            <Text style={styles.winnerSub}>WINNER OF COIN TOSS</Text>
            <Text style={styles.winnerName} numberOfLines={1}>
              {winnerDisplayName}
            </Text>
            <Text style={styles.winnerAction}>
              🎉 {winner?.isUser ? 'You won the toss and play 1st!' : `${winnerDisplayName} won the toss and plays 1st!`}
            </Text>
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
            onPress={() => onComplete?.(tossResult.winnerIndex, tossResult.winnerPlayer)}
          >
            <Text style={styles.actionBtnText}>
              Start Match Now ({countdown}s)
            </Text>
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
