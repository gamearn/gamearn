import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { WhotScreen } from '../../games/whot/WhotScreen';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { GamearnSocket } from '../../services/gamearnSocket';
import { practice } from '../../services/api';
import { ApiError } from '../../services/apiClient';
import {
  practiceSnapshotToEngine,
  socketStateToEngine,
} from '../../games/whot/serverAdapter';

export default function WhotGameScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { userProfile, refreshWallet } = useAuth();

  const { roomId, entryFee = 0, prizePool = 0, opponent } = route.params || {};
  const mode = route.params?.mode || 'local';
  const stake = route.params?.stake || 250;
  const timer = route.params?.timer || '2m';

  const myUid = userProfile?.uid || 'practice_anon';
  const selfName = userProfile?.displayName || userProfile?.username || 'You';

const socketRef = useRef(null);
  const activePracticeId = useRef(route.params?.practiceSessionId || null);
  const [remote, setRemote] = useState(null);
  const [phase, setPhase] = useState('local'); // joining | waiting | playing | game_over | local
  const [pendingMove, setPendingMove] = useState(false);
  const [result, setResult] = useState(null);
  const [banner, setBanner] = useState('');
  const [incomingChats, setIncomingChats] = useState([]);

  const isRemote = mode === 'multiplayer' || mode === 'practice';
  const isPlaying = phase === 'playing';
  const opponentName = opponent?.displayName || 'Opponent';

const handleServerResult = (p) => {
    const won = !!p?.winner && p.winner === myUid;
    const opp = (Array.isArray(p?.players) ? p.players : []).filter((x) => x.uid !== myUid)[0];
    setResult(p);
    setPhase('game_over');
    setBanner(won ? 'You won this match!' : p?.winnerDisplayName ? `${p.winnerDisplayName} won.` : 'Match over.');
    if (won && p?.prize > 0) {
      refreshWallet().catch(() => {});
    }
    setTimeout(() => {
      navigation.navigate('GameResult', {
        isWinner: won,
        myScore: p?.myScore || (won ? 72 : 52),
        opponentScore: p?.opponentScore || (won ? 48 : 66),
        opponentName: opp?.displayName || p?.winnerDisplayName || opponentName || 'Opponent',
        opponentAvatar: opp?.avatar || p?.opponentAvatar || null,
        gameId: 'whot',
        gameName: 'Wọńt Game',
        targetScreen: 'WhotGame',
        stake: stake,
      });
    }, 1000);
  };

  // â”€â”€ Multiplayer room session â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (mode !== 'multiplayer' || !roomId) return;

    const sock = new GamearnSocket({
      onConnected: () => {
        sock.joinRoom(roomId, (data) => {
          if (!data) return;
          setPhase(data.status === 'playing' ? 'playing' : 'waiting');
          if (data.gameState) {
            setRemote(socketStateToEngine(data.gameState, myUid, { selfName }));
          }
        });
      },
      onMatchStarted: (p) => {
        setPhase('playing');
        if (p?.gameState) setRemote(socketStateToEngine(p.gameState, myUid, { selfName }));
      },
      onMoveMade: (p) => {
        if (p?.gameState) setRemote(socketStateToEngine(p.gameState, myUid, { selfName }));
      },
      onGameStateSync: (p) => {
        if (p?.gameState) setRemote(socketStateToEngine(p.gameState, myUid, { selfName }));
      },
      onGameOver: handleServerResult,
      onMatchAborted: (p) => {
        Alert.alert('Match cancelled', p?.message || 'The match could not start.');
        navigation.goBack();
      },
      onOpponentDisconnected: (p) =>
        setBanner(`Opponent disconnected â€” ${p?.graceSeconds || 30}s to reconnect.`),
      onOpponentReconnected: () => setBanner(''),
onOpponentForfeited: (p) => {
        setBanner(p?.reason === 'disconnect_timeout' ? 'Opponent forfeited. You win!' : 'Opponent left the match.');
      },
      onChatMessage: (msg) => {
        setIncomingChats((prev) => [...prev, msg]);
      },
      onError: (msg) => {
        if (msg) Alert.alert('Game service', msg);
      },
    });

    socketRef.current = sock;
    setPhase('joining');
    sock.connect();

    return () => {
      sock.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, roomId]);

  // â”€â”€ Practice session â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (mode !== 'practice') return;
    let cancelled = false;
    setPhase('joining');
    practice.whot
      .start({ startCards: 6, playerRating: 1200, seats: 4 })
      .then((res) => {
        if (cancelled) return;
        activePracticeId.current = res?.sessionId || null;
        setRemote(practiceSnapshotToEngine(res, { selfUid: myUid, selfName }));
        setPhase('playing');
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
  }, [mode]);

  // â”€â”€ Human move â†’ server â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleRemoteMove = async (move) => {
    if (pendingMove) return;

    if (mode === 'multiplayer') {
      setPendingMove(true);
      socketRef.current?.makeMove(move, () => setPendingMove(false));
      return;
    }

    if (mode === 'practice' && activePracticeId.current) {
      setPendingMove(true);
      try {
        const res = await practice.whot.move(activePracticeId.current, move);
        setRemote(practiceSnapshotToEngine(res, { selfUid: myUid, selfName }));
        if (res?.gameOver) {
          const won = res.winner === myUid;
          setPhase('game_over');
          setBanner(won ? 'Practice complete — you emptied your hand first!' : 'Practice complete — an Oba bot emptied its hand first.');
          setTimeout(() => {
            navigation.navigate('GameResult', {
              isWinner: won,
              myScore: won ? 72 : 46,
              opponentScore: won ? 46 : 66,
              opponentName: 'Oba Bots 🤖',
              gameId: 'whot',
              gameName: 'Wọ́t Game',
              targetScreen: 'WhotGame',
              stake: 0,
            });
          }, 800);
        }
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Could not send your move.';
        Alert.alert('Move rejected', msg);
        practice.whot
          .state(activePracticeId.current)
          .then((s) => s && setRemote(practiceSnapshotToEngine(s, { selfUid: myUid, selfName })))
          .catch(() => {});
      } finally {
        setPendingMove(false);
      }
    }
  };

  const handleWin = (won = true) => {
    navigation.navigate('GameResult', {
      isWinner: won,
      myScore: won ? 72 : 48,
      opponentScore: won ? 50 : 68,
      opponentName: opponentName || 'Gamearn Bot 🤖',
      gameId: 'whot',
      gameName: 'Wọ́t Game',
      targetScreen: 'WhotGame',
      stake: stake,
    });
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  };

  const statusPill = {
    local: 'Offline',
    joining: 'Connecting…',
    waiting: 'Waiting for opponent…',
    playing: mode === 'practice' ? 'Practice · vs CPU' : 'Live match',
    game_over: result?.winner === myUid ? 'You won' : 'Match over',
  }[phase];

  return (
    <View style={styles.container}>
      <View style={styles.gameArea}>
<WhotScreen
          timer={timer}
          aiDifficulty={route.params?.aiDifficulty}
          isRemote={isRemote && phase !== 'local'}
          remote={remote}
          onRemoteMove={handleRemoteMove}
          onBack={handleBack}
          onRemoteGameOver={(winnerUid) => handleWin(winnerUid === myUid)}
          onWin={() => handleWin(true)}
          onMessage={mode === 'multiplayer' && roomId ? (text) => socketRef.current?.sendChat(roomId, text) : null}
          incomingChats={mode === 'multiplayer' ? incomingChats : []}
        />
      </View>

      <View style={[styles.topBar, { backgroundColor: 'rgba(16, 7, 93, 0.85)' }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <ArrowLeft size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Whot Championship</Text>
          <Text style={styles.statusLine}>{statusPill}</Text>
        </View>
        {mode === 'multiplayer' && entryFee > 0 ? (
          <View style={styles.stakeTag}>
            <Text style={styles.stakeText}>{`Stake \u20A6${((entryFee || 0) / 100).toLocaleString()}`}</Text>
          </View>
        ) : (
          <View style={styles.stakeTag}>
            <Text style={styles.stakeText}>{mode === 'practice' ? 'FREE' : `${stake} Coins`}</Text>
          </View>
        )}
      </View>

      {(phase === 'joining' || phase === 'waiting') && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#00E5FF" />
          <Text style={styles.overlayText}>
            {phase === 'joining'
              ? mode === 'practice'
                ? 'Starting practice gameâ€¦'
                : 'Joining live roomâ€¦'
              : 'Waiting for the match to startâ€¦'}
          </Text>
        </View>
      )}

      {banner !== '' && phase === 'playing' && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{banner}</Text>
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
