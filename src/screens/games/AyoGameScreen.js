import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { AyoScreen } from '../../games/ayo/AyoScreen';
import { useAuth } from '../../context/AuthContext';
import { useOnlineMatch } from '../../games/useOnlineMatch';
import { setActiveMatch } from '../../utils/activeMatch';
import CoinTossModal from '../../components/CoinTossModal';

const STATUS_TEXT = {
  idle: '',
  joining: 'Joining room…',
  waiting: 'Waiting for opponent…',
  playing: 'Live match',
  game_over: 'Match over',
  aborted: 'Match cancelled',
  error: 'Connection error',
};

export default function AyoGameScreen({ route, navigation }) {
  const { userProfile } = useAuth();
  const params = route.params || {};
  const isMultiplayer = params.mode === 'multiplayer' && !!params.roomId;
  const isPractice = params.mode === 'practice' || !isMultiplayer;
  const timer = params.timer || '2m';

  useEffect(() => {
    setActiveMatch({
      gameId: 'ayo',
      gameName: 'Ayò Ọ̀pọ́n',
      targetScreen: 'AyoGame',
      params: route.params,
    });
  }, []);

  const m = useOnlineMatch({
    roomId: isMultiplayer ? params.roomId : null,
    gameType: 'ayo',
    onExit: () => navigation.goBack(),
  });

  const [winBanner, setWinBanner] = useState(false);
  const [showCoinToss, setShowCoinToss] = useState(true);

  const myName = userProfile?.username || userProfile?.displayName || 'You';
  const opponentDisplayName = isMultiplayer
    ? (m.opponent?.username || m.opponent?.displayName || 'Live opponent')
    : 'Oba 👑';

  const ayoPlayers = useMemo(
    () => [
      { id: 0, name: myName, isUser: true },
      { id: 1, name: opponentDisplayName, isAi: !isMultiplayer },
    ],
    [myName, opponentDisplayName, isMultiplayer],
  );

  const handleHumanMove = (pitIndex) => {
    if (isMultiplayer && typeof pitIndex === 'number') {
      m.sendMove({ pitIndex });
    }
  };

  const handleWin = (won = true, finalScores = null) => {
    setWinBanner(true);
    setTimeout(() => {
      navigation.replace('GameResult', {
        serverConfirmed: isMultiplayer,
        isWinner: won,
        isDraw: false,
        completionReason: 'normal',
        myScore: finalScores ? finalScores[0] : (won ? 28 : 20),
        opponentScore: finalScores ? finalScores[1] : (won ? 20 : 28),
        opponentName: opponentDisplayName,
        gameId: 'ayo',
        gameName: 'Ayò Ọ̀pọ́n',
        targetScreen: 'AyoGame',
        stake: isMultiplayer ? (params.stake || 250) : 0,
        matchSettings: {
          ...route.params,
          mode: isMultiplayer ? 'multiplayer' : 'practice',
          timer,
        },
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
      <AyoScreen
        timer={timer}
        seedCount={params.seedCount || 4}
        aiDifficulty={params.aiDifficulty || 'auto'}
        opponentName={opponentDisplayName}
        onWin={handleWin}
        onBack={handleBack}
        onHumanMove={handleHumanMove}
      />

      <CoinTossModal
        visible={showCoinToss}
        players={ayoPlayers}
        gameName="Ayò Ọ̀pọ́n"
        onComplete={() => setShowCoinToss(false)}
      />

      {isPractice && (
        <View style={styles.practiceBar} pointerEvents="none">
          <Text style={styles.practiceTitle}>Ayò Ọ̀pọ́n — Practice</Text>
          <Text style={styles.practiceSub}>vs Oba 👑 · FREE</Text>
        </View>
      )}

      {isMultiplayer && (
        <View style={styles.liveBar} pointerEvents="none">
          <Text style={styles.liveTitle}>Ayò Ọ̀pọ́n — Live</Text>
          <Text style={styles.liveOpp}>{opponentDisplayName}</Text>
          <Text style={styles.liveStatus}>{STATUS_TEXT[m.status] || m.status}</Text>
          {m.banner ? <Text style={styles.liveBanner}>{m.banner}</Text> : null}
        </View>
      )}

      {winBanner && !isMultiplayer && (
        <View style={styles.winBanner} pointerEvents="none">
          <Text style={styles.winBannerText}>You win!</Text>
        </View>
      )}

      {isMultiplayer && m.status === 'joining' && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.overlayText}>Joining live room…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#03271d',
  },
  practiceBar: {
    position: 'absolute',
    top: 4,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(4, 48, 31, 0.9)',
    zIndex: 20,
  },
  practiceTitle: {
    color: '#34D399',
    fontSize: 12,
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
    fontSize: 15,
    fontWeight: '700',
  },
  liveBar: {
    position: 'absolute',
    top: 4,
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(16, 7, 93, 0.9)',
    zIndex: 20,
  },
  liveTitle: {
    color: '#00E5FF',
    fontSize: 12,
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
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    zIndex: 25,
  },
  winBannerText: {
    color: '#6EE7B7',
    fontSize: 13,
    fontWeight: '900',
  },
});
