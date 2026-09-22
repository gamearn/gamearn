// Shared multiplayer bridge for the Ludo/Ayo/Draughts game screens.
// Joins a real Gamearn room over socket.io, holds the authoritative server
// gameState snapshot, relays the human's moves, and surfaces the server
// verdict (prizes are awarded server-side — the client never mutates coins).
//
// Contracts: Backend_manager/src/socket/handlers/game.js + gameStateView.js.
//
// Usage:
//   const m = useOnlineMatch({ roomId, gameType, onExit: () => navigation.goBack() });
//   ... m.gameState, m.status ('joining'|'waiting'|'playing'|'game_over'|'aborted'|'error'),
//   m.opponent, m.banner, m.result; m.sendMove({...}); m.leave();

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { GamearnSocket } from '../services/gamearnSocket';
import { useAuth } from '../context/AuthContext';

export function useOnlineMatch({ roomId, gameType, onExit }) {
  const { userProfile, refreshWallet } = useAuth();
  const myUid = userProfile?.uid;

  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [status, setStatus] = useState(roomId ? 'joining' : 'idle');
  const [banner, setBanner] = useState('');
  const [opponent, setOpponent] = useState(null);
  const [result, setResult] = useState(null);

  const socketRef = useRef(null);
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  const finish = useCallback(
    (p) => {
      const won = !!p?.winner && p.winner === myUid;
      setResult(p);
      setStatus('game_over');
      if (won && p?.prize > 0) {
        refreshWallet().catch(() => {});
      }
      const prize = (p?.prize || 0) / 100;
      Alert.alert(
        won ? 'Victory!' : 'Match over',
        won
          ? prize > 0
            ? `You won the match and \u20A6${prize.toLocaleString()} was paid into your wallet.`
            : 'You won the match.'
          : p?.winnerDisplayName
            ? `${p.winnerDisplayName} won the match.`
            : 'The match ended.',
      );
      setTimeout(() => onExitRef.current?.(), 2500);
    },
    [myUid, refreshWallet],
  );

  useEffect(() => {
    if (!roomId) return;

    const sock = new GamearnSocket({
      onConnected: () => {
        setConnected(true);
        sock.joinRoom(roomId, (data) => {
          if (!data) return;
          setRoom(data);
          const opp = (data.players || []).find((p) => p.uid !== myUid);
          setOpponent(opp ? { uid: opp.uid, displayName: opp.displayName, rating: opp.rating } : null);
          if (data.gameState) setGameState(data.gameState);
          setStatus(data.status === 'waiting' ? 'waiting' : 'playing');
        });
      },
      onMatchStarted: (p) => {
        if (p?.gameState) setGameState(p.gameState);
        setStatus('playing');
      },
      onMoveMade: (p) => {
        if (p?.gameState) setGameState(p.gameState);
      },
      onGameStateSync: (p) => {
        if (p?.gameState) setGameState(p.gameState);
        if (p?.status === 'playing') setStatus('playing');
      },
      onGameOver: finish,
      onMatchAborted: (p) => {
        setStatus('aborted');
        Alert.alert('Match cancelled', p?.message || 'The match could not start.');
        setTimeout(() => onExitRef.current?.(), 2500);
      },
      onOpponentDisconnected: (p) =>
        setBanner(`Opponent disconnected — ${p?.graceSeconds || 30}s to reconnect.`),
      onOpponentReconnected: () => setBanner(''),
      onOpponentForfeited: (p) =>
        setBanner(p?.reason === 'disconnect_timeout' ? 'Opponent forfeited. You win!' : 'Opponent left the match.'),
      onDisconnectedByServer: (p) => Alert.alert('Disconnected', p?.reason || 'Disconnected by server.'),
      onError: (msg) => {
        setStatus((s) => (s === 'joining' ? 'error' : s));
        if (msg && status !== 'game_over') Alert.alert('Game service', msg);
      },
    });

    socketRef.current = sock;
    sock.connect();

    return () => {
      sock.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, gameType, myUid]);

  const sendMove = useCallback((move) => {
    const sock = socketRef.current;
    if (!sock?.isConnected) {
      setBanner('Connection lost — reconnecting…');
      return false;
    }
    sock.makeMove(move);
    return true;
  }, []);

  const leave = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  return {
    connected,
    room,
    gameState,
    status,
    banner,
    opponent,
    result,
    myUid,
    sendMove,
    leave,
  };
}