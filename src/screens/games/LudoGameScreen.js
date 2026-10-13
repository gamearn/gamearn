import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import LudoScreen from '../../games/ludo/LudoScreen';
import { useServerGame } from '../../games/useServerGame';
import { useAuth } from '../../context/AuthContext';
import { ludoViewModel, diceValueForMove } from '../../games/ludo/serverAdapter';
export default function LudoGameScreen({ route, navigation }) {
  const { user } = useAuth();
  const params = route.params || {};
  const mode = params.mode === 'multiplayer' ? 'multiplayer' : 'practice';
  const multiplayer = mode === 'multiplayer';
  const roomId = multiplayer ? params.roomId || null : null;
  const uid = user?.uid;
  const stake = params.stake || 0;
  const playerCount = Math.max(2, Math.min(4, params.players || params.playerCount || 2));
  const tokenCount = Math.max(1, Math.min(4, params.tokens || params.tokenCount || 4));
  const diceCount = 2;

  const options = useMemo(
    () => ({ playerCount, diceCount, tokenCount }),
    [playerCount, diceCount, tokenCount],
  );

  const session = useServerGame({ gameType: 'ludo', roomId, uid, options });
  const snapshot = session.snapshot;

  const viewModel = useMemo(() => ludoViewModel(snapshot, uid), [snapshot, uid]);

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
            : opponent?.displayName || 'Opponent',
        gameId: 'ludo',
        gameName: 'Ludo',
        targetScreen: 'LudoGame',
        stake: multiplayer ? stake : 0,
        matchSettings: { ...params, mode },
      });
    }, 900);
    return () => clearTimeout(timerId);
  }, [snapshot, session.pending, uid, navigation, multiplayer, stake, mode, params]);

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
          status={session.status}
          secondsRemaining={session.secondsRemaining}
          error={session.error}
          canMove={session.canMove}
          pending={session.pending}
          onRoll={handleRoll}
          onMove={handleMove}
          onBack={handleBack}
        />
      ) : null}

      {!viewModel && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#00E5FF" />
          <Text style={styles.overlayText}>
            {session.error || (multiplayer ? 'Joining match…' : 'Starting practice game…')}
          </Text>
        </View>
      )}

      {!multiplayer && viewModel && (
        <View style={styles.practiceHud} pointerEvents="none">
          <Text style={styles.practiceTitle}>Ludo — Practice</Text>
          <Text style={styles.practiceSub}>{statusText}</Text>
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
