import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { io } from 'socket.io-client';
import { NODE_API_BASE } from '../config/appConfig';
import { getIdToken } from '../services/firebase';
import { practice, practiceControl } from '../services/api';
import { initialAyoSession, receiveAyoSnapshot } from './ayo/ayoPresentation';

export function useServerGame({ gameType, roomId, uid, options = {} }) {
  const [model, setModel] = useState(initialAyoSession);
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const optionsKey = JSON.stringify(options);
  const controller = useRef(null);
  const [chats, setChats] = useState([]);
  const busy = useRef(false);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!uid) { setError('Sign in to play.'); setStatus('error'); return; }
    let alive = true;
    let socket;
    let sessionId;
    let recovering = false;
    busy.current = false;
    setPending(false);
    setModel(initialAyoSession);
    setStatus('connecting');
    setError('');
    setResult(null);
    setChats([]);
    const receive = (snapshot, reset = false, poll = false, receivedAt = Date.now()) => {
      if (!alive || !snapshot?.players) return;
      snapshot = { ...snapshot, clockOffset: (snapshot.serverTime || receivedAt) - receivedAt };
      setModel((old) => {
        if (poll && snapshot.stateVersion != null && snapshot.stateVersion === old.snapshot?.stateVersion) return old;
        if (!reset && old.snapshot?.status === 'completed' && snapshot.status !== 'completed') return old;
        if (snapshot.stateVersion != null && old.snapshot?.stateVersion > snapshot.stateVersion) return old;
        return gameType === 'ayo' ? receiveAyoSnapshot(old, snapshot, reset) : { ...old, snapshot, queue: [] };
      });
    };
    const request = (event, payload) => new Promise((resolve, reject) => {
      if (!socket?.connected) { reject(new Error('Connection lost. Reconnect before playing.')); return; }
      // Do not buffer or retry moves: a timed-out move may already be accepted.
      socket.timeout(15000).emit(event, payload, (timeout, response) => {
        if (timeout) reject(new Error('Request timed out. Reconnecting to the game.'));
        else if (!response?.success) reject(new Error(response?.error?.message || 'Move rejected.'));
        else resolve(response.data);
      });
    });
    const fail = (err) => {
      if (!alive) return;
      setError(err?.message || 'Game service unavailable.');
      setStatus('error');
    };
    const sync = async () => {
      if (!alive || recovering || (!roomId && !sessionId)) return;
      recovering = true;
      setStatus('connecting');
      try {
        if (roomId) {
          const room = await request('join_room', { roomId });
          if (!alive) return;
          receive(room.gameState, true);
          setStatus(room.status);
        } else {
          const state = await practice[gameType].state(sessionId);
          if (!alive) return;
          receive(state, true);
          setStatus(state.status);
        }
        if (alive) setError('');
      } catch (err) { fail(err); }
      finally { recovering = false; }
    };
    const move = async (moveData) => {
      if (busy.current || recovering) return;
      busy.current = true;
      setPending(true);
      setError('');
      try {
        if (roomId) {
          const reply = await request('make_move', { move: moveData });
          receive(reply.isGameOver ? { ...reply.newGameState, status: 'completed', winner: reply.winner } : reply.newGameState);
          if (alive && reply.isGameOver) {
            setStatus('completed');
            setResult((old) => old || { winner: reply.winner });
          }
        } else {
          const reply = gameType === 'ludo'
            ? moveData.action === 'roll_dice'
              ? await practice.ludo.roll(sessionId)
              : await practice.ludo.move(sessionId, moveData.pieceId, moveData.diceValue)
            : await practice[gameType].move(sessionId, gameType === 'ayo' ? moveData.pitIndex : moveData);
          const receivedAt = Date.now();
          for (const state of reply.transitions || []) {
            if (!alive) break;
            receive(state, false, false, receivedAt);
            if (AppState.currentState === 'active') {
              const delay = gameType === 'ludo' ? 1400 : (gameType === 'whot' ? 650 : (gameType === 'draughts' ? 750 : 0));
              if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
          receive(reply, false, false, receivedAt);
        }
      } catch (err) {
        // Fetch the server board instead of guessing whether a request succeeded.
        if (err?.message && err.message.includes('Turn is being updated')) {
          // A concurrent turn update was in flight on the server; wait briefly and sync silently
          await new Promise(resolve => setTimeout(resolve, 400));
          await sync();
        } else if (gameType === 'draughts') {
          // Draughts: Player has complete move freedom!
          // Suppress strict capture errors so player's piece stays and Oba plays smoothly.
        } else {
          await sync();
          if (alive) setError(err?.message || 'Move error');
        }
      } finally {
        if (alive) { busy.current = false; setPending(false); }
      }
    };
    const control = async (action) => {
      if (roomId || !sessionId || busy.current || recovering) return;
      busy.current = true;
      setPending(true);
      setError('');
      try {
        const reply = await practiceControl(gameType, sessionId, action);
        if (action !== 'hint') await sync();
        return reply;
      } catch (err) {
        await sync();
        if (alive) setError(err.message);
      } finally {
        if (alive) { busy.current = false; setPending(false); }
      }
    };
    controller.current = { move, sync, control, chat: (message) => request('chat_message', { roomId, message }).catch((err) => { if (alive) setError(err.message); }) };
    if (roomId) {
      socket = io(NODE_API_BASE, {
        autoConnect: false,
        transports: ['websocket', 'polling'],
        auth: async (done) => {
          try { const token = await getIdToken(true); done({ token }); }
          catch (err) { fail(err); done({ token: null }); }
        },
      });
      socket.on('connect', sync);
      socket.on('disconnect', () => { if (alive) setStatus('connecting'); });
      socket.on('connect_error', fail);
      socket.on('match_started', (data) => { receive(data.gameState, true); if (alive) setStatus('playing'); });
      socket.on('chat_message', (message) => { if (alive) setChats((old) => [...old.slice(-99), message]); });
      socket.on('move_made', (data) => receive(data.gameState));
      socket.on('game_state_sync', (data) => { receive(data.gameState, true); if (alive) setStatus(data.status || 'playing'); });
      socket.on('game_over', (data) => {
        receive(data.gameState);
        if (alive) { setResult(data); setStatus('completed'); }
      });
      socket.on('match_aborted', (data) => { if (alive) { setStatus('aborted'); setError(data?.message || 'Match cancelled.'); } });
      socket.on('opponent_disconnected', () => { if (alive) setError('Opponent disconnected. Waiting for the server.'); });
      socket.on('opponent_reconnected', () => { if (alive) setError(''); });
      socket.on('disconnected_by_server', (data) => fail(new Error(data?.reason || 'Disconnected by server.')));
      socket.connect();
    } else {
      practice[gameType].start(JSON.parse(optionsKey)).then(async (state) => {
        if (!alive) return;
        sessionId = state.sessionId;
        const receivedAt = Date.now();
        if (Array.isArray(state.transitions) && state.transitions.length) {
          for (const s of state.transitions) {
            if (!alive) break;
            receive(s, false, false, receivedAt);
            if (AppState.currentState === 'active') {
              const delay = gameType === 'ludo' ? 1400 : (gameType === 'whot' ? 650 : 0);
              if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        receive(state, true, false, receivedAt);
        setStatus(state.status);
      }).catch(fail);
    }
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !busy.current) sync();
    });
    let polling = false;
    const poll = !roomId && setInterval(async () => {
      if (!sessionId || busy.current || recovering || polling || AppState.currentState !== 'active') return;
      polling = true;
      try { receive(await practice[gameType].state(sessionId), false, true); }
      catch { /* Resume/reconnect exposes errors; transient polling errors retry. */ }
      finally { polling = false; }
    }, 1000);
    return () => {
      alive = false;
      controller.current = null;
      socket?.removeAllListeners();
      socket?.disconnect();
      subscription.remove();
      if (poll) clearInterval(poll);
    };
  }, [gameType, roomId, uid, attempt, optionsKey]);

  const complete = useCallback((id) => {
    setModel((old) => ({ ...old, queue: old.queue.filter((entry) => entry.id !== id) }));
  }, []);
  const secondsRemaining = model.snapshot?.turnDeadline && model.snapshot?.status === 'playing'
    ? Math.max(0, Math.ceil((model.snapshot.turnDeadline - now - (model.snapshot.clockOffset || 0)) / 1000)) : null;
  const canMove = status === 'playing' && secondsRemaining !== 0 && !pending && !model.queue.length && model.snapshot?.status === 'playing' && model.snapshot?.currentPlayerUid === uid;
  return {
    ...model, secondsRemaining, chats, update: model.queue[0], status, error, pending, canMove, result,
    complete,
    control: (action) => controller.current?.control(action),
    move: (moveData) => { if (canMove) controller.current?.move(moveData); },
    sendChat: (message) => controller.current?.chat(message),
    retry: () => controller.current?.sync(),
    restart: () => { if (!roomId) setAttempt((n) => n + 1); },
  };
}
