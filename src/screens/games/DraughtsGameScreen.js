import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { CheckersScreen } from '../../games/checkers/CheckersScreen';
import { useServerGame } from '../../games/useServerGame';
import { draughtsSnapshotToRemote, engineMoveToServer } from '../../games/checkers/draughtsAdapter';
import { useAuth } from '../../context/AuthContext';
import { setActiveMatch, clearActiveMatch } from '../../utils/activeMatch';
import CoinTossModal from '../../components/CoinTossModal';

export default function DraughtsGameScreen({ route, navigation }) {
  const { roomId, aiDifficulty = 'auto', playerColor = 'white' } = route.params || {};
  const mode = route.params?.mode === 'multiplayer' ? 'multiplayer' : 'practice';
  const stake = route.params?.stake || 250;
  const timer = route.params?.timer || '2m';
  const isRejoin = !!route.params?.isRejoin;

  const { user, userProfile } = useAuth();
  const uid = user?.uid;

  const isMultiplayer = mode === 'multiplayer' && !!roomId;
  const isPractice = mode === 'practice';
  const effectiveUid = uid || (isPractice ? 'practice_anon' : null);
  const remoteMode = isMultiplayer || (isPractice && !!effectiveUid);

  useEffect(() => {
    if (!isRejoin) {
      clearActiveMatch();
    }
    setActiveMatch({
      gameId: 'draft',
      gameName: 'Dráfù Game',
      targetScreen: 'DraughtsGame',
      params: route.params,
    });
  }, [isRejoin]);

  const chosenColor = route.params?.playerColor || playerColor || 'white';
  const [effectiveColor, setEffectiveColor] = useState(chosenColor || 'white');
  const [firstPlayer, setFirstPlayer] = useState('player');

  const options = useMemo(
    () => ({
      playerRating: route.params?.playerRating || 1200,
      playerColor: chosenColor,
      timer,
    }),
    [route.params?.playerRating, chosenColor, timer],
  );

  // Shared server session controller: practice (REST) and live rooms (socket),
  // owning the authoritative board, turn clock and every accepted move.
  const session = useServerGame({
    gameType: 'draughts',
    roomId: isMultiplayer ? roomId : null,
    uid: remoteMode ? effectiveUid : null,
    options,
  });

  const snapshot = session.snapshot;
  const remote = useMemo(
    () => (remoteMode ? draughtsSnapshotToRemote(snapshot, effectiveUid) : null),
    [remoteMode, snapshot, effectiveUid],
  );

  const navigateResult = (won) => {
    const opponent = (snapshot?.players || []).find((p) => p.uid !== effectiveUid);
    const vsBot = isPractice || !isMultiplayer || !!opponent?.uid?.startsWith('bot_');
    const isWinner = won === true;
    const isDraw = won == null;
    navigation.replace('GameResult', {
      serverConfirmed: isMultiplayer,
      isWinner,
      isDraw,
      completionReason: snapshot?.completionReason || 'normal',
      myScore: isWinner ? 12 : 8,
      opponentScore: isWinner ? 0 : 12,
      opponentName: vsBot ? 'Oba 👑' : opponent?.username || opponent?.displayName || 'Opponent',
      gameId: 'draft',
      gameName: 'Dráfù Game',
      targetScreen: 'DraughtsGame',
      stake: isMultiplayer ? stake : 0,
      matchSettings: { ...route.params, mode, playerColor: chosenColor, timer },
    });
  };

  const navigateResultRef = useRef(navigateResult);
  navigateResultRef.current = navigateResult;

  const handleLocalWin = (won = true) => {
    if (navigated.current) return;
    navigated.current = true;
    setTimeout(() => navigateResultRef.current(won), 800);
  };

  const navigated = useRef(false);
  useEffect(() => {
    if (!isMultiplayer || snapshot?.status !== 'completed' || navigated.current) return;
    navigated.current = true;
    const timerId = setTimeout(() => navigateResultRef.current(snapshot.winner === effectiveUid), 800);
    return () => clearTimeout(timerId);
  }, [isMultiplayer, snapshot?.status, snapshot?.winner, effectiveUid]);

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
    : opponentEntry?.username || opponentEntry?.displayName || 'Live opponent';

  const [showCoinToss, setShowCoinToss] = useState(!isRejoin);

  const handleCoinTossComplete = (winnerIdx, winnerPlayer) => {
    setShowCoinToss(false);
    const obaWon = winnerIdx === 1 || !!winnerPlayer?.isAi;
    if (obaWon) {
      setFirstPlayer('oba');
      setEffectiveColor('black');
    } else {
      setFirstPlayer('player');
      setEffectiveColor('white');
    }
  };

  const myName = userProfile?.username || userProfile?.displayName || 'You';
  const draftPlayers = useMemo(
    () => [
      { id: 0, name: myName, isUser: true },
      { id: 1, name: liveName, isAi: true },
    ],
    [myName, liveName],
  );

  return (
    <View style={styles.container}>
      <CheckersScreen
        stake={stake}
        timer={timer}
        playerColor={effectiveColor}
        humanColor={effectiveColor}
        aiDifficulty={aiDifficulty}
        secondsRemaining={isMultiplayer ? session.secondsRemaining : undefined}
        isRemote={isMultiplayer && !!remote && session.status !== 'error'}
        remote={remote}
        paused={showCoinToss}
        firstPlayer={firstPlayer}
        isRejoin={isRejoin}
        onRemoteMove={(move) => session.move(engineMoveToServer(move))}
        onControl={isPractice ? session.control : undefined}
        onWin={handleLocalWin}
        onRemoteGameOver={isMultiplayer ? (winnerSide) => {
          setTimeout(() => navigateResultRef.current(winnerSide === remote?.humanSide), 800);
        } : undefined}
        onBack={handleBack}
      />
      <CoinTossModal
        visible={showCoinToss}
        players={draftPlayers}
        gameName="Dráfù Game"
        onComplete={handleCoinTossComplete}
      />

      {isMultiplayer && (
        <View style={styles.liveBar} pointerEvents="none">
          <Text style={styles.liveTitle}>Dráfù — Live</Text>
          <Text style={styles.liveName}>{liveName}</Text>
          <Text style={styles.liveStatus}>{liveStatus}</Text>
        </View>
      )}

      {isMultiplayer && remote && (session.status === 'connecting' || (!!session.error && !session.error.toLowerCase().includes('path') && !session.error.toLowerCase().includes('capture') && !session.error.toLowerCase().includes('invalid') && !session.error.toLowerCase().includes('move'))) && (
        <View style={styles.banner} pointerEvents="none">
          <Text style={styles.bannerText}>
            {session.status === 'connecting' ? 'Syncing turn…' : session.error}
          </Text>
        </View>
      )}

      {isPractice && (
        <View style={styles.noticeBanner} pointerEvents="none">
          <Text style={styles.noticeText}>Practice · vs Oba 👑</Text>
        </View>
      )}

      {isMultiplayer && !remote && (
        <View style={styles.overlay}>
          {!session.error && <ActivityIndicator size="large" color="#00E5FF" />}
          <Text style={styles.overlayText}>
            {session.error || 'Joining live room…'}
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
