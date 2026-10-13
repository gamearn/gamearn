import React, { useEffect, useMemo, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { WhotScreen } from '../../games/whot/WhotScreen';
import { useServerGame } from '../../games/useServerGame';
import { useAuth } from '../../context/AuthContext';
import { practiceSnapshotToEngine, socketStateToEngine } from '../../games/whot/serverAdapter';

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
  const isVsOba = !!params.vsOba || practice;
  const stake = params.stake || 250;
  const timer = params.timer || '2m';
  const uid = user?.uid;
  const selfName = userProfile?.username || userProfile?.displayName || 'You';
  const entryFee = params.entryFee || 0;
  const effectiveSeats = isVsOba ? 2 : Math.max(2, Math.min(4, params.playerCount || params.players || 2));
  const effectiveCards = params.cardCount || params.cards || 6;

  const options = useMemo(() => ({
    playerRating: params.playerRating || 1200,
    startCards: effectiveCards,
    seats: effectiveSeats,
    timer,
  }), [params.playerRating, effectiveCards, effectiveSeats, timer]);

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
      ? socketStateToEngine(snapshot, uid, { selfName, vsOba: isVsOba })
      : practiceSnapshotToEngine(snapshot, { selfUid: uid, selfName });
  }, [snapshot, multiplayer, uid, selfName, isVsOba]);

  const navigated = useRef(false);
  useEffect(() => {
    if (snapshot?.status !== 'completed' || navigated.current || session.pending) return;
    const timerId = setTimeout(() => {
      if (navigated.current) return;
      navigated.current = true;
      const opponent = snapshot.players?.find(player => player.uid !== uid);
      navigation.replace('GameResult', {
        serverConfirmed: true,
        isWinner: snapshot.winner === uid,
        isDraw: snapshot.winner == null,
        completionReason: snapshot.completionReason || 'normal',
        myScore: null, opponentScore: null,
        opponentName: opponent?.uid?.startsWith('bot_') ? 'Oba 👑' : opponent?.username || opponent?.displayName || 'Opponent',
        gameId: 'whot', gameName: 'Whot', targetScreen: 'WhotGame',
        stake: multiplayer ? stake : 0,
        matchSettings: { ...params, mode, cardCount: effectiveCards, playerCount: effectiveSeats, vsOba: isVsOba, timer },
      });
    }, 800);
    return () => clearTimeout(timerId);
  }, [snapshot, session.pending, uid, navigation, multiplayer, stake, mode, effectiveCards, effectiveSeats, isVsOba, timer]);

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
          aiDifficulty={params.aiDifficulty}
          isRemote={remoteMode && !!remote}
          remote={remote}
          onRemoteMove={(move) => session.move(move)}
          onBack={handleBack}
          onRemoteGameOver={() => {}}
          onWin={() => {}}
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
            <Text style={styles.stakeText}>{`Stake \u20A6${((entryFee || 0) / 100).toLocaleString()}`}</Text>
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
