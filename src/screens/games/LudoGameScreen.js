import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { LudoScreen } from '../../games/ludo/LudoScreen';
import { useAuth } from '../../context/AuthContext';
import { useOnlineMatch } from '../../games/useOnlineMatch';

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

  const practice = mode === 'practice';

  useEffect(() => {
    if (practice) {
      Alert.alert('Practice mode', 'Bot practice is free to play.');
    }
  }, [practice]);

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B113A',
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

