// Gamearn Socket.IO client — ports the Flutter socket service / backend
// socket protocol. Auth token goes in handshake auth.token, exactly as
// socketAuth middleware expects.

import { io } from 'socket.io-client';
import { NODE_API_BASE } from '../config/appConfig';
import { getIdToken } from './firebase';

export class GamearnSocket {
  constructor(handlers = {}) {
    this.handlers = handlers;
    this.socket = null;
    this.connected = false;
  }

  get isConnected() {
    return this.connected;
  }

  async connect() {
    if (this.connected) await this.disconnect();

    const token = await getIdToken(true);
    if (!token) {
      this._emit('onError', 'Not authenticated. Please sign in.');
      return;
    }

    this.socket = io(NODE_API_BASE, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    const s = this.socket;

    s.on('connect', () => {
      this.connected = true;
      this._emit('onConnected');
    });

    s.on('disconnect', (reason) => {
      this.connected = false;
      this._emit('onDisconnected', reason);
    });

    s.on('connect_error', (err) => {
      this._emit('onError', err?.message || 'Game service is temporarily unavailable.');
    });

    s.on('reconnect', async () => {
      const fresh = await getIdToken(true);
      if (fresh && this.socket) this.socket.auth = { token: fresh };
      this._emit('onConnected');
    });

    this._bind('match_found', 'onMatchFound');
    this._bind('match_started', 'onMatchStarted');
    this._bind('match_aborted', 'onMatchAborted');
    this._bind('move_made', 'onMoveMade');
    this._bind('game_over', 'onGameOver');
    this._bind('game_state_sync', 'onGameStateSync');
    this._bind('player_joined', 'onPlayerJoined');
    this._bind('opponent_disconnected', 'onOpponentDisconnected');
    this._bind('opponent_reconnected', 'onOpponentReconnected');
    this._bind('opponent_forfeited', 'onOpponentForfeited');
    this._bind('disconnected_by_server', 'onDisconnectedByServer');
    this._bind('rematch_requested', 'onRematchRequested');
    this._bind('rematch_accepted', 'onRematchAccepted');
    this._bind('opponent_ready', 'onOpponentReady');
    this._bind('game_error', 'onGameError');
  }

  _bind(serverEvent, handlerKey) {
    this.socket?.on(serverEvent, (data) => this._emit(handlerKey, data));
  }

  _emit(key, data) {
    try {
      this.handlers[key]?.(data);
    } catch (err) {
      console.warn(`[socket] handler ${key} failed`, err);
    }
  }

  _ackError(response) {
    return response && response.success === false && response.error
      ? response.error.message || 'Request failed'
      : null;
  }

  joinRoom(roomId, onSuccess) {
    if (!this.connected) return;
    this.socket.emit('join_room', { roomId }, (response) => {
      const err = this._ackError(response);
      if (err) {
        this._emit('onError', err);
        return;
      }
      onSuccess?.(response?.data);
    });
  }

  makeMove(move, onSuccess) {
    if (!this.connected) return;
    this.socket.emit('make_move', { move }, (response) => {
      const err = this._ackError(response);
      if (err) {
        this._emit('onError', err);
        return;
      }
      onSuccess?.(response?.data);
    });
  }

  signalReady() {
    this.connected && this.socket.emit('player_ready', {});
  }

  requestRematch() {
    this.connected && this.socket.emit('request_rematch', {});
  }

  acceptRematch() {
    this.connected && this.socket.emit('accept_rematch', {});
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket?.close?.();
    this.socket = null;
    this.connected = false;
  }
}

export const socketService = new GamearnSocket();