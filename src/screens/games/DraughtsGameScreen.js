import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { CheckersScreen } from '../../games/checkers/CheckersScreen';
import {
  applyMove,
  checkGameEnd,
  getBestAIMove,
  getLegalMovesForSquare,
  initialBoardState,
} from '../../games/checkers/CheckersEngine';
import { useOnlineMatch } from '../../games/useOnlineMatch';
import { useAuth } from '../../context/AuthContext';

export default function DraughtsGameScreen({ route, navigation }) {
  const { mode = 'local', roomId } = route.params || {};
  const stake = route.params?.stake || 250;
  const timer = route.params?.timer || '2m';

  const isMultiplayer = mode === 'multiplayer' && !!roomId;
  const isPractice = mode === 'practice';

  const m = useOnlineMatch({
    roomId: isMultiplayer ? roomId : undefined,
    gameType: 'draughts',
    onExit: () => navigation.goBack(),
  });

  const boardMirror = useRef(initialBoardState());
  const selectedRef = useRef(null);
  const turnRef = useRef('white');
  const [localResult, setLocalResult] = useState('');

  useEffect(() => {
    if (isPractice) {
      Alert.alert('Practice', 'Practice for Dráfù rolls out with Whot first');
    }
  }, [isPractice]);

  const relayIfMove = (index) => {
    const from = selectedRef.current;
    if (from === null) {
      const piece = boardMirror.current[index];
      selectedRef.current = piece && piece.side === turnRef.current ? index : null;
      return;
    }
    const legal = getLegalMovesForSquare(boardMirror.current, turnRef.current, from);
    const move = legal.find((mm) => mm.to === index);
    if (move) {
      const captures =
        move.captures && move.captures.length
          ? move.captures.map((c) => ({ row: Math.floor(c / 8), col: c % 8 }))
          : undefined;
      if (m.status === 'playing') {
        m.sendMove({
          fromRow: Math.floor(move.from / 8),
          fromCol: move.from % 8,
          toRow: Math.floor(move.to / 8),
          toCol: move.to % 8,
          captures,
        });
      }
      const nextBoard = applyMove(boardMirror.current, move);
      const over = checkGameEnd(nextBoard, turnRef.current === 'white' ? 'black' : 'white');
      if (over.isOver) {
        boardMirror.current = nextBoard;
      } else {
        const aiMove = getBestAIMove(nextBoard, 'black');
        boardMirror.current = aiMove ? applyMove(nextBoard, aiMove) : nextBoard;
      }
      turnRef.current = 'white';
      selectedRef.current = null;
      return;
    }
    if (index === from) return;
    const piece = boardMirror.current[index];
    selectedRef.current = piece && piece.side === turnRef.current ? index : null;
  };

  const handleLocalWin = () => {
    if (!isMultiplayer) setLocalResult('You win!');
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  };

  const liveStatus =
    m.status === 'joining'
      ? 'Connecting…'
      : m.status === 'waiting'
      ? 'Waiting for opponent…'
      : m.status === 'playing'
      ? 'Live match'
      : m.status === 'game_over'
      ? m.result?.winner === m.myUid
        ? 'You won'
        : 'Match over'
      : m.status === 'aborted'
      ? 'Ended'
      : m.status === 'error'
      ? 'Connection failed'
      : 'Connecting…';

  const liveName = m.opponent?.displayName || 'Live opponent';

  return (
    <View style={styles.container}>
      <CheckersScreen
        stake={stake}
        timer={timer}
        onWin={handleLocalWin}
        onSquarePress={isMultiplayer ? relayIfMove : undefined}
        onBack={handleBack}
      />

      {isMultiplayer && (
        <View style={styles.liveBar} pointerEvents="none">
          <Text style={styles.liveTitle}>Dráfù — Live</Text>
          <Text style={styles.liveName}>{liveName}</Text>
          <Text style={styles.liveStatus}>{liveStatus}</Text>
        </View>
      )}

      {isMultiplayer && m.banner !== '' && (
        <View style={styles.banner} pointerEvents="none">
          <Text style={styles.bannerText}>{m.banner}</Text>
        </View>
      )}

      {(isPractice || localResult !== '') && (
        <View style={styles.noticeBanner} pointerEvents="none">
          <Text style={styles.noticeText}>
            {isPractice ? 'Practice for Dráfù rolls out with Whot first' : localResult}
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
});