import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, Alert, ActivityIndicator } from 'react-native';
import { LudoScreen } from '../../games/ludo/LudoScreen';
import { useAuth } from '../../context/AuthContext';
import { useOnlineMatch } from '../../games/useOnlineMatch';
import { practice } from '../../services/api';
import { ApiError } from '../../services/apiClient';

const STATUS_LABEL = {
  joining: 'Connectingâ€¦',
  waiting: 'Waitingâ€¦',
  playing: 'Live match',
  game_over: 'Match over',
  aborted: 'Match cancelled',
  error: 'Connection error',
};

export default function LudoGameScreen({ route, navigation }) {
  const { userProfile } = useAuth();
  const params = route.params || {};
  const mode = params.mode || 'local';
  const roomId = params.roomId || null;
  const stake = params.stake || 250;
  const timer = params.timer || '2m';
  const [localWinBanner, setLocalWinBanner] = useState('');

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  };

  const m = useOnlineMatch({
    roomId: mode === 'multiplayer' && roomId ? roomId : null,
    gameType: 'ludo',
    onExit: handleBack,
  });

  const isPractice = mode === 'practice';
  const practiceSessionId = useRef(null);
  const [practiceReady, setPracticeReady] = useState(isPractice);

  useEffect(() => {
    if (!isPractice) return;
    let cancelled = false;
    setPracticeReady(false);
    practice.ludo
      .start({ playerCount: 2, diceCount: 1 })
      .then((res) => {
        if (cancelled) return;
        practiceSessionId.current = res?.sessionId || null;
        setPracticeReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        Alert.alert(
          'Could not start practice',
          err instanceof ApiError ? err.message : 'Practice is temporarily unavailable.',
        );
        handleBack();
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPractice]);

  useEffect(() => {
    if (!localWinBanner) return;
    const t = setTimeout(() => setLocalWinBanner(''), 3500);
    return () => clearTimeout(t);
  }, [localWinBanner]);

const handleWin = (won = true) => {
    setLocalWinBanner(won ? 'You win!' : 'Match over!');
    setTimeout(() => {
      navigation.navigate('GameResult', {
        isWinner: won,
        myScore: won ? 56 : 32,
        opponentScore: won ? 30 : 56,
        opponentName: m.opponent?.displayName || 'Gamearn Bot 🤖',
        gameId: 'ludo',
        gameName: 'Ludo Classic',
        targetScreen: 'LudoGame',
        stake: stake,
      });
    }, 800);
  };

  return (
    <View style={styles.container}>
      <LudoScreen
        stake={stake}
        timer={timer}
        aiDifficulty={params.aiDifficulty}
        onWin={handleWin}
        onBack={handleBack}
      />
      {isPractice && (
        <View style={styles.practiceHud} pointerEvents="none">
          <Text style={styles.practiceTitle}>Ludo â€” Practice</Text>
          <Text style={styles.practiceSub}>vs Gamearn Bot Â· FREE</Text>
        </View>
      )}
      {mode === 'multiplayer' && roomId && (
        <View style={styles.hud}>
          <View style={styles.hudRow}>
            <Text style={styles.hudOpponent} numberOfLines={1}>
              {m.opponent?.displayName || 'Live opponent'}
            </Text>
            <Text style={styles.hudStatus}>{STATUS_LABEL[m.status] || 'Live match'}</Text>
          </View>
          {!!m.banner && <Text style={styles.hudBanner}>{m.banner}</Text>}
        </View>
      )}
      {!!localWinBanner && (
        <View style={styles.winBanner}>
          <Text style={styles.winBannerText}>{localWinBanner}</Text>
        </View>
      )}
      {isPractice && !practiceReady && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#00E5FF" />
          <Text style={styles.overlayText}>Starting practice gameâ€¦</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B113A',
  },
  practiceHud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 48,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(4, 48, 31, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.25)',
  },
  practiceTitle: {
    color: '#34D399',
    fontSize: 15,
    fontWeight: '900',
  },
  practiceSub: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '700',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 17, 58, 0.92)',
  },
  overlayText: {
    marginTop: 14,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  hud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingTop: 46,
    paddingBottom: 8,
    backgroundColor: 'rgba(16, 7, 93, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 229, 255, 0.25)',
  },
  hudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hudOpponent: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 1,
    paddingRight: 12,
  },
  hudStatus: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '700',
  },
  hudBanner: {
    color: '#ffd224',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  winBanner: {
    position: 'absolute',
    top: '42%',
    alignSelf: 'center',
    zIndex: 25,
    backgroundColor: 'rgba(16, 7, 93, 0.92)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#00E5FF',
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  winBannerText: {
    color: '#00E5FF',
    fontSize: 22,
    fontWeight: '900',
  },
});

