import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { WhotScreen } from '../../games/whot/WhotScreen';
import { useServerGame } from '../../games/useServerGame';
import { useAuth } from '../../context/AuthContext';
import { practiceSnapshotToEngine, socketStateToEngine } from '../../games/whot/serverAdapter';
import { clearActiveMatch } from '../../utils/activeMatch';

const STATUS_LABEL = {
  connecting: 'Connecting…',
  playing: 'Live match',
  completed: 'Match over',
  aborted: 'Match cancelled',
  error: 'Connection error',
};

export default function WhotGameScreen({ route, navigation }) {
  const { user, userProfile } = useAuth();
  const params = route.params || {};
  const mode = params.mode === 'multiplayer' ? 'multiplayer' : 'practice';
  const multiplayer = mode === 'multiplayer';
  const practice = mode === 'practice';
  const remoteMode = multiplayer || practice;
  const requestedSeats = Number(params.playerCount || params.players);
  const isVsOba = params.vsOba != null ? !!params.vsOba : (requestedSeats === 2 || (!requestedSeats && practice));
  const effectiveSeats = requestedSeats >= 2 ? Math.min(4, Math.max(2, requestedSeats)) : (isVsOba ? 2 : 4);
  const effectiveCards = Math.min(8, Math.max(3, Number(params.cardCount || params.cards || params.startCards || params.startingCards || 6)));

  const isRejoin = !!params.isRejoin;

  useEffect(() => {
    if (!isRejoin) {
      clearActiveMatch();
    }
  }, [params.resetKey, effectiveCards, isRejoin]);
  const stake = params.stake || 250;
  const timer = params.timer || '2m';
  const uid = user?.uid;
  const selfName = userProfile?.displayName || userProfile?.username || userProfile?.name || 'You';
  const entryFee = params.entryFee || 0;

  const specialCardsParam = params.specialCards || {};
  const nulled = Array.isArray(params.nulled)
    ? params.nulled
    : [1, 2, 5, 8, 14].filter((num) => specialCardsParam[num] === false).map(String);
  const removed = Array.isArray(params.removed)
    ? params.removed
    : (specialCardsParam[20] === false ? ['20'] : []);

  const options = useMemo(() => ({
    playerRating: params.playerRating || 1200,
    startCards: effectiveCards,
    cardCount: effectiveCards,
    cards: effectiveCards,
    seats: effectiveSeats,
    playerCount: effectiveSeats,
    timer,
    nulled,
    removed,
    specialCards: specialCardsParam,
  }), [params.playerRating, effectiveCards, effectiveSeats, timer, nulled, removed, specialCardsParam]);

  // Shared server session controller: owns transport (practice REST or
  // multiplayer socket), the turn clock, and every authoritative move.
  const session = useServerGame({
    gameType: 'whot',
    roomId: multiplayer ? params.roomId : null,
    uid: multiplayer && !params.roomId ? null : uid,
    options,
  });

  const snapshot = session.snapshot;
  const remote = useMemo(() => {
    if (!snapshot) return null;
    return multiplayer
      ? socketStateToEngine(snapshot, uid, {
          selfName,
          vsOba: isVsOba,
          timer,
          secondsRemaining: session.secondsRemaining,
          startCards: effectiveCards,
        })
      : practiceSnapshotToEngine(snapshot, {
          selfUid: uid,
          selfName,
          timer,
          secondsRemaining: session.secondsRemaining,
          startCards: effectiveCards,
        });
  }, [snapshot, multiplayer, uid, selfName, isVsOba, timer, session.secondsRemaining, effectiveCards]);

  const navigated = useRef(false);

  const navigateResult = useCallback((winnerParam) => {
    if (navigated.current) return;
    navigated.current = true;
    const opponent = snapshot?.players?.find((player) => player.uid !== uid);
    const opponentName = opponent?.uid?.startsWith('bot_')
      ? 'Oba 👑'
      : opponent?.username || opponent?.displayName || (isVsOba ? 'Oba 👑' : 'Opponent');

    let isWinner = false;
    if (snapshot?.winner != null) {
      isWinner = snapshot.winner === uid;
    } else if (remote?.winner != null) {
      isWinner = remote.winner === uid;
    } else if (winnerParam !== undefined) {
      if (typeof winnerParam === 'boolean') {
        isWinner = winnerParam;
      } else if (winnerParam && typeof winnerParam === 'object') {
        isWinner = (winnerParam.id === 0 || winnerParam.uid === uid);
      } else if (typeof winnerParam === 'string') {
        isWinner = winnerParam === uid;
      }
    }

    const isDraw = snapshot ? snapshot.winner == null && snapshot.status === 'completed' : false;

    navigation.replace('GameResult', {
      serverConfirmed: true,
      isWinner,
      isDraw,
      completionReason: snapshot?.completionReason || 'normal',
      myScore: null,
      opponentScore: null,
      opponentName,
      gameId: 'whot',
      gameName: 'Whot',
      targetScreen: 'WhotGame',
      stake: multiplayer ? stake : 0,
      matchSettings: { ...params, mode, cardCount: effectiveCards, playerCount: effectiveSeats, vsOba: isVsOba, timer },
    });
  }, [snapshot, remote, uid, isVsOba, navigation, multiplayer, stake, params, mode, effectiveCards, effectiveSeats, timer]);

  useEffect(() => {
    const isFinished = snapshot?.status === 'completed' || snapshot?.gameOver || remote?.status === 'completed' || remote?.gameOver;
    if (!isFinished || navigated.current) return;
    const timerId = setTimeout(() => {
      navigateResult();
    }, 800);
    return () => clearTimeout(timerId);
  }, [snapshot?.status, snapshot?.gameOver, snapshot?.winner, remote?.status, remote?.gameOver, remote?.winner, navigateResult]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  };

  const phase = remoteMode ? session.status : 'local';
  const statusPill =
    phase === 'local' ? 'Offline'
      : phase === 'connecting' ? 'Connecting…'
        : phase === 'playing' ? (practice ? 'Practice · vs Oba' : 'Live match')
          : STATUS_LABEL[phase] || 'Live match';

  return (
    <View style={styles.container}>
      <View style={styles.gameArea}>
        {remote && <WhotScreen
          key={String(params.resetKey || JSON.stringify(params || {}))}
          timer={timer}
          cardCount={effectiveCards}
          playerCount={effectiveSeats}
          vsOba={isVsOba}
          nulled={nulled}
          removed={removed}
          aiDifficulty={params.aiDifficulty}
          isRejoin={isRejoin}
          isRemote={remoteMode && !!remote}
          remote={remote}
          secondsRemaining={session.secondsRemaining}
          onRemoteMove={(move) => session.move(move)}
          onBack={handleBack}
          onRemoteGameOver={(winner) => {
            setTimeout(() => navigateResult(winner), 800);
          }}
          onWin={(won) => {
            setTimeout(() => navigateResult(won), 800);
          }}
          onMessage={multiplayer && params.roomId ? (text) => session.sendChat(text) : null}
          incomingChats={multiplayer ? session.chats : []}
        />}
      </View>

      <View style={[styles.topBar, { backgroundColor: 'rgba(16, 7, 93, 0.85)' }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <ArrowLeft size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Whot Championship</Text>
          {statusPill && statusPill !== 'Offline' && (
            <Text style={styles.statusLine}>{statusPill}</Text>
          )}
        </View>
        {multiplayer && entryFee > 0 && (
          <View style={styles.stakeTag}>
            <Text style={styles.stakeText}>{`Stake ${Math.max(1, Math.floor((entryFee || 0) / 5000)).toLocaleString()} VP`}</Text>
          </View>
        )}
      </View>

      {remoteMode && (!remote || phase === 'connecting') && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#00E5FF" />
          <Text style={styles.overlayText}>
            {phase === 'connecting'
              ? practice ? 'Starting practice game…' : 'Joining live room…'
              : 'Waiting for the match to start…'}
          </Text>
        </View>
      )}

      {!!session.error && remoteMode && !!remote && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{session.error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#10075d',
    position: 'relative',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    zIndex: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 229, 255, 0.2)',
  },
  titleBlock: {
    alignItems: 'center',
  },
  backBtn: {
    padding: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  statusLine: {
    fontSize: 12,
    color: '#00E5FF',
    fontWeight: '700',
    marginTop: 2,
  },
  stakeTag: {
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.4)',
  },
  stakeText: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '800',
  },
  gameArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    backgroundColor: 'rgba(16, 7, 93, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  banner: {
    position: 'absolute',
    bottom: 60,
    left: 24,
    right: 24,
    zIndex: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  bannerText: {
    color: '#ffd224',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
});
