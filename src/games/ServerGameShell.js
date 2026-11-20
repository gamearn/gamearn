import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useServerGame } from './useServerGame';

export function ServerGameShell({ gameType, title, route, navigation, children, options }) {
  const { user, userProfile, refreshWallet, refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const params = route.params || {};
  const multiplayer = params.mode === 'multiplayer';
  const invalidRoom = multiplayer && !params.roomId;
  const uid = user?.uid;
  const gameOptions = { ...options, timer: params.timer || options?.timer || '2m' };
  const session = useServerGame({ gameType, roomId: multiplayer ? params.roomId : null, uid: invalidRoom ? null : uid, options: gameOptions });
  const completed = session.status === 'completed' || session.snapshot?.status === 'completed';
  const refreshedResult = useRef(false);
  useEffect(() => {
    if (!completed) { refreshedResult.current = false; return; }
    if (refreshedResult.current) return;
    refreshedResult.current = true;
    refreshWallet().catch(() => {});
    refreshProfile().catch(() => {});
  }, [completed, refreshWallet, refreshProfile]);
  const back = () => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs');
  const winner = session.result ? session.result.winner : session.snapshot?.winner;
  const resultShown = useRef(false);
  useEffect(() => {
    if (!completed) { resultShown.current = false; return; }
    if (resultShown.current || session.queue.length || !session.snapshot || gameType !== 'ayo') return;
    resultShown.current = true;
    const state = session.snapshot;
    const seat = state.players.findIndex(player => player.uid === uid);
    const opponent = state.players[1 - seat];
    const scores = state.finalScores ? [state.finalScores.player0, state.finalScores.player1] : state.stores;
    navigation.replace('GameResult', {
      completionReason: state.completionReason || 'normal',
      serverConfirmed: true, isWinner: winner === uid, isDraw: winner == null,
      myScore: scores?.[seat] ?? 0, opponentScore: scores?.[1 - seat] ?? 0,
      opponentName: opponent?.uid?.startsWith('bot_') ? 'Oba' : opponent?.displayName || 'Opponent',
      gameId: gameType, gameName: title, targetScreen: 'AyoGame',
      stake: multiplayer ? params.stake || 0 : 0,
      matchSettings: { ...params, timer: gameOptions.timer },
    });
  }, [completed, session.queue.length, session.snapshot, winner, uid, navigation, gameType]);
  const practiceAction = async (action) => {
    if (action === 'surrender') {
      Alert.alert('Surrender to Oba?', 'This ends the game as a loss.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Surrender', style: 'destructive', onPress: () => session.control('surrender') },
      ]);
      return;
    }
    const reply = await session.control(action);
    if (action === 'hint' && reply) {
      const move = reply.move;
      const message = !move ? 'No move is available.'
        : move.action === 'roll_dice' ? 'Roll the dice first.'
        : move.pickFromMarket ? 'Pick a card from the market.'
        : move.card ? `Play ${move.card.shape} ${move.card.number}${move.declaredShape ? ` and call ${move.declaredShape}` : ''}.`
        : gameType === 'draughts' ? (() => {
          const black = session.snapshot.players.findIndex(p => p.uid === uid) === 0;
          const pos = (r, c) => black ? `${8 - r}, ${8 - c}` : `${r + 1}, ${c + 1}`;
          return `Move from row, column ${pos(move.fromRow, move.fromCol)} to ${pos(move.toRow, move.toCol)}.`;
        })()
        : gameType === 'ayo' ? `Sow pit ${session.snapshot.players.findIndex(p => p.uid === uid) === 0 ? move.pitIndex + 1 : 12 - move.pitIndex} on your side.`
        : `Move piece ${move.pieceId + 1} using ${move.diceValue}.`;
      Alert.alert('Hint', message);
    }
  };
  return <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
    <View style={styles.header}>
      <Pressable onPress={back}><Text style={styles.link}>Back</Text></Pressable>
      <Text style={styles.text}>{title} · {multiplayer ? 'Live match' : 'Online practice'}</Text>
      {!completed && session.secondsRemaining != null && <Text accessibilityLabel="Time remaining" style={styles.text}>
        {Math.floor(session.secondsRemaining / 60)}:{String(session.secondsRemaining % 60).padStart(2, '0')}
      </Text>}
      {!multiplayer && <Pressable disabled={session.pending || !!session.queue.length} onPress={session.restart}><Text style={styles.link}>New game</Text></Pressable>}
    </View>
    {!!session.error && <View style={styles.notice}>
      <Text style={styles.text}>{session.error}</Text>
      {session.snapshot && <Pressable onPress={session.retry}><Text style={styles.link}>Reconnect</Text></Pressable>}
    </View>}
    {!session.snapshot ? <View style={styles.loading}>
      {session.status === 'connecting' && <ActivityIndicator color="#F59E0B" />}
      <Text style={styles.text}>{invalidRoom ? 'No multiplayer room was supplied.' : session.error || 'Connecting to the game...'}</Text>
      {!multiplayer && session.status === 'error' && <Pressable onPress={session.restart}><Text style={styles.link}>Try again</Text></Pressable>}
    </View> : <>
      {!multiplayer && !completed && <View style={styles.header}>
        {(gameType === 'ludo' ? ['surrender'] : ['undo', 'hint', 'surrender']).map(action => <Pressable key={action}
          accessibilityRole="button" disabled={session.pending || !!session.queue.length || (action !== 'surrender' && !session.canMove)}
          onPress={() => practiceAction(action)}>
          <Text style={styles.link}>{action[0].toUpperCase() + action.slice(1)}</Text>
        </Pressable>)}
      </View>}
      {children({ session, uid, back, multiplayer, practiceAction, selfName: userProfile?.displayName || 'You' })}
      <Text style={styles.status}>{completed && !session.queue.length
        ? winner == null ? 'Match drawn' : winner === uid ? 'You win!' : 'Opponent wins'
        : session.pending ? 'Waiting for server confirmation...'
          : session.status !== 'playing' ? session.status
            : session.canMove ? 'Your turn' : "Opponent's turn"}</Text>
    </>}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#03271d' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', paddingHorizontal: 8 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  notice: { padding: 8, alignItems: 'center' },
  text: { color: '#FFFFFF', textAlign: 'center' },
  status: { color: '#FDE68A', textAlign: 'center', padding: 10, fontWeight: '700' },
  link: { color: '#F59E0B', padding: 12, fontWeight: '700' },
});
