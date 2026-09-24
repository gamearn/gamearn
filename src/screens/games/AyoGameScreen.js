import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, Alert, ActivityIndicator } from 'react-native';
import { AyoScreen } from '../../games/ayo/AyoScreen';
import { useAuth } from '../../context/AuthContext';
import { useOnlineMatch } from '../../games/useOnlineMatch';
import { practice } from '../../services/api';
import { ApiError } from '../../services/apiClient';

const STATUS_TEXT = {
  idle: '',
  joining: 'Joining roomâ€¦',
  waiting: 'Waiting for opponentâ€¦',
  playing: 'Live match',
  game_over: 'Match over',
  aborted: 'Match cancelled',
  error: 'Connection error',
};

export default function AyoGameScreen({ route, navigation }) {
  const { userProfile } = useAuth();
  const params = route.params || {};
  const isMultiplayer = params.mode === 'multiplayer' && !!params.roomId;
  const isPractice = params.mode === 'practice';
  const timer = params.timer || '2m';
  const practiceSessionId = useRef(null);
  const [practiceReady, setPracticeReady] = useState(isPractice);

  const m = useOnlineMatch({
    roomId: isMultiplayer ? params.roomId : null,
    gameType: 'ayo',
    onExit: () => navigation.goBack(),
  });

  useEffect(() => {
    if (!isPractice) return;
    let cancelled = false;
    setPracticeReady(false);
    practice.ayo
      .start({ playerRating: 1200 })
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
        navigation.goBack();
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPractice]);

  const [winBanner, setWinBanner] = useState(false);

  const handleHumanMove = (pitIndex) => {
    if (isMultiplayer && typeof pitIndex === 'number') {
      m.sendMove({ pitIndex });
    }
  };

  const handleWin = (won = true) => {
    setWinBanner(true);
    setTimeout(() => {
      navigation.navigate('GameResult', {
        isWinner: won,
        myScore: won ? 28 : 20,
        opponentScore: won ? 20 : 28,
        opponentName: m.opponent?.displayName || 'Ayò Master 🤖',
        gameId: 'ayo',
        gameName: 'Ayò Ọ̀pọ́n',
        targetScreen: 'AyoGame',
        stake: params.stake || 250,
      });
    }, 800);
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  };

  return (
    <View style={styles.container}>
      {isPractice ? (
        <View style={styles.practiceBar}>
          <Text style={styles.practiceTitle}>AyÃ² á»ŒÌ€pá»Ìn â€” Practice</Text>
          <Text style={styles.practiceSub}>vs Gamearn Bot Â· FREE</Text>
        </View>
      ) : null}
      {isMultiplayer ? (
        <View style={styles.liveBar}>
          <Text style={styles.liveTitle}>AyÃ² á»ŒÌ€pá»Ìn â€” Live</Text>
          <Text style={styles.liveOpp}>{m.opponent?.displayName || 'Live opponent'}</Text>
          <Text style={styles.liveStatus}>{STATUS_TEXT[m.status] || m.status}</Text>
          {m.banner ? <Text style={styles.liveBanner}>{m.banner}</Text> : null}
        </View>
      ) : null}
      {winBanner && !isMultiplayer ? (
        <View style={styles.winBanner}>
          <Text style={styles.winBannerText}>You win!</Text>
        </View>
      ) : null}
      {isPractice && !practiceReady ? (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.overlayText}>Starting practice gameâ€¦</Text>
        </View>
      ) : null}
      <AyoScreen
        timer={timer}
        aiDifficulty={params.aiDifficulty}
        onWin={handleWin}
        onBack={handleBack}
        onHumanMove={handleHumanMove}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#03271d',
  },
  practiceBar: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    marginHorizontal: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
    backgroundColor: '#04301f',
  },
  practiceTitle: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '900',
  },
  practiceSub: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '700',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    backgroundColor: 'rgba(3, 39, 29, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  liveBar: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    marginHorizontal: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00E5FF',
    backgroundColor: '#10075d',
  },
  liveTitle: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '900',
  },
  liveOpp: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  liveStatus: {
    color: '#7DD3FC',
    fontSize: 11,
    fontWeight: '600',
  },
  liveBanner: {
    color: '#FDE047',
    fontSize: 11,
    fontWeight: '700',
    width: '100%',
  },
  winBanner: {
    alignSelf: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
  },
  winBannerText: {
    color: '#6EE7B7',
    fontSize: 13,
    fontWeight: '900',
  },
});
