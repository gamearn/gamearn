import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import LudoScreen from '../../games/ludo/LudoScreen';
import { useServerGame } from '../../games/useServerGame';
import { useAuth } from '../../context/AuthContext';
import { ludoViewModel, diceValueForMove } from '../../games/ludo/serverAdapter';
import { setActiveMatch, clearActiveMatch } from '../../utils/activeMatch';
import CoinTossModal from '../../components/CoinTossModal';

export default function LudoGameScreen({ route, navigation }) {
  const { user, userProfile } = useAuth();
  const params = route.params || {};
  const isRejoin = !!params.isRejoin;
  const mode = params.mode === 'multiplayer' ? 'multiplayer' : 'practice';
  const multiplayer = mode === 'multiplayer';
  const roomId = multiplayer ? params.roomId || null : null;
  const uid = user?.uid;
  const stake = params.stake || 0;
  const playerCount = Math.max(2, Math.min(4, params.players || params.playerCount || 2));
  const tokenCount = Math.max(1, Math.min(4, params.tokens || params.tokenCount || 4));
  const diceCount = params.diceCount || 2;
  const timer = params.timer || '2m';

  const [showCoinToss, setShowCoinToss] = useState(!isRejoin);

  useEffect(() => {
    if (!isRejoin) {
      clearActiveMatch();
    }
    setActiveMatch({
      gameId: 'ludo',
      gameName: 'Ludo',
      targetScreen: 'LudoGame',
      params: route.params,
    });
  }, [isRejoin]);

  const options = useMemo(
    () => ({ playerCount, diceCount, tokenCount, timer }),
    [playerCount, diceCount, tokenCount, timer],
  );

  const session = useServerGame({ gameType: 'ludo', roomId, uid, options });
  const snapshot = session.snapshot;

  const viewModel = useMemo(() => ludoViewModel(snapshot, uid), [snapshot, uid]);

  const myName = userProfile?.username || userProfile?.displayName || 'You';
  const ludoPlayers = useMemo(() => {
    if (snapshot?.players && snapshot.players.length > 0) {
      return snapshot.players.map((p, idx) => ({
        id: idx,
        name: p.uid === uid ? `${myName} (You)` : (p.displayName || p.name || (idx === 1 ? 'Oba 👑' : `Player ${idx + 1}`)),
        isUser: p.uid === uid,
        isAi: p.uid !== uid,
      }));
    }
    const players = [{ id: 0, name: `${myName} (You)`, isUser: true }];
    for (let i = 1; i < playerCount; i++) {
      players.push({ id: i, name: i === 1 ? 'Oba 👑' : `Player ${i + 1}`, isAi: true });
    }
    return players;
  }, [snapshot?.players, uid, myName, playerCount]);

  const navigated = useRef(false);
  useEffect(() => {
    if (snapshot?.status !== 'completed' || navigated.current || session.pending) return;
    const timerId = setTimeout(() => {
      if (navigated.current) return;
      navigated.current = true;
      const opponent = snapshot.players?.find((p) => p.uid !== uid);
      navigation.replace('GameResult', {
        serverConfirmed: true,
        isWinner: snapshot.winner === uid,
        isDraw: snapshot.winner == null,
        completionReason: snapshot.completionReason || 'normal',
        myScore: null,
        opponentScore: null,
        opponentName:
          typeof opponent?.uid === 'string' && opponent.uid.indexOf('bot') === 0
            ? 'OBA'
            : opponent?.username || opponent?.displayName || 'Opponent',
        gameId: 'ludo',
        gameName: 'Ludo',
        targetScreen: 'LudoGame',
        stake: multiplayer ? stake : 0,
        matchSettings: { ...params, mode, playerCount, tokenCount, diceCount, timer },
      });
    }, 900);
    return () => clearTimeout(timerId);
  }, [snapshot, session.pending, uid, navigation, multiplayer, stake, mode, params, playerCount, tokenCount, diceCount, timer]);

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('MainTabs');
  };

  const handleRoll = () => session.move({ action: 'roll_dice' });
  const handleMove = (pieceId, value) => {
    const diceValue = value ?? diceValueForMove(viewModel, pieceId);
    if (diceValue == null) return;
    session.move({ pieceId, diceValue });
  };

  const statusText =
    session.status === 'connecting'
      ? 'Connecting…'
      : multiplayer
        ? 'Live match'
        : 'Practice · vs OBA';

  return (
    <View style={styles.container}>
      {viewModel ? (
        <LudoScreen
          viewModel={viewModel}
          isRemote
          userProfile={userProfile}
          status={session.status}
          secondsRemaining={session.secondsRemaining}
          error={session.error}
          canMove={session.canMove && !showCoinToss}
          pending={session.pending}
          paused={showCoinToss}
          onRoll={handleRoll}
          onMove={handleMove}
          onBack={handleBack}
        />
      ) : null}

      <CoinTossModal
        visible={showCoinToss}
        players={ludoPlayers}
        gameName="Lúùdò Game"
        initialWinnerIndex={snapshot?.coinToss?.winnerIndex}
        onComplete={() => setShowCoinToss(false)}
      />

      {!viewModel && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#00E5FF" />
          <Text style={styles.overlayText}>
            {session.error || (multiplayer ? 'Joining match…' : 'Starting practice game…')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B113A' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 17, 58, 0.94)',
  },
  overlayText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  practiceHud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    alignItems: 'center',
    paddingTop: 8,
  },
  practiceTitle: { color: '#00E5FF', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  practiceSub: { color: '#8ea2c9', fontSize: 11, fontWeight: '700', marginTop: 2 },
});
