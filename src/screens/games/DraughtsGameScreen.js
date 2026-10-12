import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { CheckersScreen } from '../../games/checkers/CheckersScreen';
import { useServerGame } from '../../games/useServerGame';
import { draughtsSnapshotToRemote, engineMoveToServer } from '../../games/checkers/draughtsAdapter';
import { useAuth } from '../../context/AuthContext';
import { setActiveMatch } from '../../utils/activeMatch';
import CoinTossModal from '../../components/CoinTossModal';

export default function DraughtsGameScreen({ route, navigation }) {
  const { roomId, aiDifficulty = 'auto', playerColor = 'white' } = route.params || {};
  const mode = route.params?.mode === 'multiplayer' ? 'multiplayer' : 'practice';
  const stake = route.params?.stake || 250;
  const timer = route.params?.timer || '2m';

  const { user } = useAuth();
  const uid = user?.uid;

  const isMultiplayer = mode === 'multiplayer' && !!roomId;
  const isPractice = mode === 'practice';
  const remoteMode = isMultiplayer || isPractice;

  useEffect(() => {
    setActiveMatch({
      gameId: 'draft',
      gameName: 'Dráfù Game',
      targetScreen: 'DraughtsGame',
      params: route.params,
    });
  }, []);

  const options = useMemo(
    () => ({ playerRating: route.params?.playerRating || 1200 }),
    [route.params?.playerRating],
  );

  // Shared server session controller: practice (REST) and live rooms (socket),
  // owning the authoritative board, turn clock and every accepted move.
  const session = useServerGame({
    gameType: 'draughts',
    roomId: isMultiplayer ? roomId : null,
    uid: remoteMode ? uid : null,
    options,
  });

  const snapshot = session.snapshot;
  const remote = useMemo(
    () => (remoteMode ? draughtsSnapshotToRemote(snapshot, uid) : null),
    [remoteMode, snapshot, uid],
  );

  const navigateResult = (won) => {
    const opponent = (snapshot?.players || []).find((p) => p.uid !== uid);
    const vsBot = isPractice || !!opponent?.uid?.startsWith('bot_');
    navigation.navigate('GameResult', {
      isWinner: won,
      opponentName: vsBot ? 'Oba 👑' : opponent?.displayName || 'Opponent',
      gameId: 'draft',
      gameName: 'Dráfù Game',
      targetScreen: 'DraughtsGame',
      stake: isMultiplayer ? stake : 0,
      matchSettings: route.params || {},
    });
  };

  const handleLocalWin = (won = true) => {
    setTimeout(() => navigateResult(won), 800);
  };

  const navigated = useRef(false);
  useEffect(() => {
    if (!remoteMode || snapshot?.status !== 'completed' || navigated.current) return;
    navigated.current = true;
    const timerId = setTimeout(() => navigateResult(snapshot.winner === uid), 800);
    return () => clearTimeout(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteMode, snapshot?.status, snapshot?.winner, uid]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  };

  const liveStatus =
    session.status === 'connecting'
      ? 'Connecting…'
      : session.status === 'playing'
        ? isPractice
          ? 'Practice · vs CPU'
          : 'Live match'
        : session.status === 'completed'
          ? snapshot?.winner === uid
            ? 'You won'
            : 'Match over'
          : session.status === 'aborted'
            ? 'Ended'
            : session.status === 'error'
              ? 'Connection failed'
              : 'Connecting…';

  const opponentEntry = (snapshot?.players || []).find((p) => p.uid !== uid);
  const opponentIsBot = isPractice || !!opponentEntry?.uid?.startsWith('bot_');
  const liveName = opponentIsBot
    ? 'Oba 👑'
    : opponentEntry?.displayName || 'Live opponent';

  const [showCoinToss, setShowCoinToss] = useState(true);

  const draftPlayers = useMemo(
    () => [
      { id: 0, name: 'You', isUser: true },
      { id: 1, name: liveName, isAi: true },
    ],
    [liveName],
  );

  return (
    <View style={styles.container}>
      <CheckersScreen
        stake={stake}
        timer={timer}
        playerColor={playerColor}
        humanColor={isPractice ? playerColor : null}
        aiDifficulty={aiDifficulty}
        secondsRemaining={remoteMode ? session.secondsRemaining : undefined}
        isRemote={remoteMode && !!remote}
        remote={remote}
        onRemoteMove={(move) => session.move(engineMoveToServer(move))}
        onControl={isPractice ? session.control : undefined}
        onWin={remoteMode ? undefined : handleLocalWin}
        onBack={handleBack}
      />
      <CoinTossModal
        visible={showCoinToss}
        players={draftPlayers}
        gameName="Dráfù Game"
        onComplete={() => setShowCoinToss(false)}
      />

      {isMultiplayer && (
        <View style={styles.liveBar} pointerEvents="none">
          <Text style={styles.liveTitle}>Dráfù — Live</Text>
          <Text style={styles.liveName}>{liveName}</Text>
          <Text style={styles.liveStatus}>{liveStatus}</Text>
        </View>
      )}

      {remoteMode && remote && (session.status === 'connecting' || !!session.error) && (
        <View style={styles.banner} pointerEvents="none">
          <Text style={styles.bannerText}>
            {session.status === 'connecting' ? 'Syncing turn…' : session.error}
          </Text>
        </View>
      )}

      {isPractice && (
        <View style={styles.noticeBanner} pointerEvents="none">
          <Text style={styles.noticeText}>
            {remote ? 'Practice vs Oba 👑' : 'Starting practice…'}
          </Text>
        </View>
      )}

      {remoteMode && !remote && (
        <View style={styles.overlay}>
          {!session.error && <ActivityIndicator size="large" color="#00E5FF" />}
          <Text style={styles.overlayText}>
            {session.error || (isPractice ? 'Starting practice game…' : 'Joining live room…')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#061019',
  },
  liveBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: '#10075d',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 229, 255, 0.3)',
    zIndex: 20,
  },
  liveTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  liveName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00E5FF',
    marginTop: 2,
  },
  liveStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00E5FF',
    marginTop: 2,
  },
  banner: {
    position: 'absolute',
    top: 140,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 25,
  },
  bannerText: {
    color: '#ffd224',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  noticeBanner: {
    position: 'absolute',
    bottom: 48,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 25,
  },
  noticeText: {
    color: '#00E5FF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
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
    backgroundColor: 'rgba(6, 16, 25, 0.9)',
  },
  overlayText: {
    marginTop: 14,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
