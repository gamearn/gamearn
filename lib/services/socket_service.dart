import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../config/api_config.dart';

// ════════════════════════════════════════════════════════════════
//  GAMEARN SOCKET SERVICE
//  Based on actual Backend_manager source:
//
//  Flow:
//   1. Connect socket with Firebase ID token in handshake.auth.token
//   2. POST /api/v1/matchmaking/join → {status:'queued'}
//   3. Server emits 'match_found' → {roomId, opponent, entryFee, prizePool}
//   4. Emit 'join_room' {roomId} → server verifies user is assigned
//   5. Server emits 'match_started' → {gameState, entryFee, prizePool}
//   6. Moves go via 'make_move' {move:{action,...}} — one event for all moves
//   7. Server broadcasts 'move_made' {playerUid, move, gameState, isGameOver}
//   8. 'game_over' {winner, prize, result}
//
//  Inbound events:
//    match_found          → onMatchFound(roomId, opponent, prize)
//    match_started        → onMatchStarted(gameState)
//    move_made            → onMoveMade(playerUid, move, gameState, isGameOver)
//    game_over            → onGameOver(winner, prize, result)
//    player_joined        → onPlayerJoined(uid, displayName)
//    opponent_disconnected → onOpponentDisconnected(graceSeconds)
//    opponent_reconnected  → onOpponentReconnected()
//    opponent_forfeited    → onOpponentForfeited(winner)
//    game_state_sync       → onGameStateSync(gameState) [reconnect]
//    match_aborted         → onMatchAborted(reason)
//    rematch_requested     → onRematchRequested()
//    rematch_accepted      → onRematchAccepted(newRoomId)
//    disconnected_by_server → onError(reason)
//    connect_error         → onError(message)
// ════════════════════════════════════════════════════════════════

// ── Event handler interface ───────────────────────────────────────
// Implement this in your game screen State class

abstract class GameEventHandler {
  // Matchmaking
  void onMatchFound(String roomId, Map<String, dynamic> opponent, int prizePool);
  void onMatchStarted(Map<String, dynamic> gameState, int entryFee, int prizePool);
  void onMatchAborted(String reason);

  // Gameplay
  void onMoveMade(String playerUid, Map<String, dynamic> move,
      Map<String, dynamic> gameState, bool isGameOver);
  void onGameOver(String? winnerUid, int prize, String result);
  void onGameStateSync(Map<String, dynamic> gameState);

  // Presence
  void onPlayerJoined(String uid, String displayName);
  void onOpponentDisconnected(int graceSeconds);
  void onOpponentReconnected();
  void onOpponentForfeited(String? winnerUid);

  // Rematch
  void onRematchRequested();
  void onRematchAccepted(String newRoomId);

  // Errors
  void onError(String message);
  void onConnected();
  void onDisconnected(String reason);
}

// ── Main service ──────────────────────────────────────────────────

class GamearnSocketService {
  IO.Socket? _socket;
  GameEventHandler? _handler;
  bool _connected = false;

  bool get isConnected => _connected;

  // ── Connect with Firebase token ───────────────────────────────
  // Call this before matchmaking — token goes in handshake.auth.token
  // as required by socketAuth middleware in auth.js

  Future<void> connect(GameEventHandler handler) async {
    if (_connected) await disconnect();
    _handler = handler;

    // Get fresh Firebase ID token
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      handler.onError('Not authenticated. Please sign in.');
      return;
    }
    final token = await user.getIdToken(true); // force refresh
    debugPrint('[Socket] connecting as ${user.uid}');

    _socket = IO.io(
      ApiConfig.nodeBaseUrl,
      IO.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setReconnectionAttempts(5)
          .setReconnectionDelay(2000)
          .enableReconnection()
          .disableAutoConnect()
          // Firebase ID token — required by socketAuth middleware
          .setAuth({'token': token})
          .build(),
    );

    _bindEvents();
    _socket!.connect();
  }

  // ── Bind all socket events ─────────────────────────────────────

  void _bindEvents() {
    final s = _socket!;

    s.onConnect((_) {
      _connected = true;
      debugPrint('[Socket] connected ✓');
      _handler?.onConnected();
    });

    s.onDisconnect((reason) {
      _connected = false;
      debugPrint('[Socket] disconnected: $reason');
      _handler?.onDisconnected(reason.toString());
    });

    s.onConnectError((err) {
      debugPrint('[Socket] connect error: $err');
      _handler?.onError('Connection failed: $err');
    });

    s.onReconnect((_) async {
      debugPrint('[Socket] reconnected — refreshing token');
      // Refresh token on reconnect
      final token = await FirebaseAuth.instance.currentUser?.getIdToken(true);
      if (token != null) s.auth = {'token': token};
      _handler?.onConnected();
    });

    // ── Matchmaking events ──────────────────────────────────────

    s.on('match_found', (data) {
      final d = _map(data);
      debugPrint('[Socket] match_found: $d');
      _handler?.onMatchFound(
        d['roomId'] as String? ?? '',
        _map(d['opponent']),
        d['prizePool'] as int? ?? 0,
      );
    });

    s.on('match_started', (data) {
      final d = _map(data);
      debugPrint('[Socket] match_started');
      _handler?.onMatchStarted(
        _map(d['gameState']),
        d['entryFee'] as int? ?? 0,
        d['prizePool'] as int? ?? 0,
      );
    });

    s.on('match_aborted', (data) {
      final d = _map(data);
      debugPrint('[Socket] match_aborted: ${d['reason']}');
      _handler?.onMatchAborted(d['reason'] as String? ?? 'unknown');
    });

    // ── Gameplay events ─────────────────────────────────────────

    s.on('move_made', (data) {
      final d = _map(data);
      _handler?.onMoveMade(
        d['playerUid'] as String? ?? '',
        _map(d['move']),
        _map(d['gameState']),
        d['isGameOver'] as bool? ?? false,
      );
    });

    s.on('game_over', (data) {
      final d = _map(data);
      debugPrint('[Socket] game_over: $d');
      _handler?.onGameOver(
        d['winner'] as String?,
        d['prize'] as int? ?? 0,
        d['result'] as String? ?? 'unknown',
      );
    });

    s.on('game_state_sync', (data) {
      final d = _map(data);
      _handler?.onGameStateSync(_map(d['gameState']));
    });

    // ── Presence events ─────────────────────────────────────────

    s.on('player_joined', (data) {
      final d = _map(data);
      _handler?.onPlayerJoined(
        d['uid'] as String? ?? '',
        d['displayName'] as String? ?? 'Player',
      );
    });

    s.on('opponent_disconnected', (data) {
      final d = _map(data);
      _handler?.onOpponentDisconnected(d['graceSeconds'] as int? ?? 30);
    });

    s.on('opponent_reconnected', (data) {
      _handler?.onOpponentReconnected();
    });

    s.on('opponent_forfeited', (data) {
      final d = _map(data);
      _handler?.onOpponentForfeited(d['winner'] as String?);
    });

    s.on('disconnected_by_server', (data) {
      final d = _map(data);
      _handler?.onError(d['reason'] as String? ?? 'Disconnected by server');
    });

    // ── Rematch events ──────────────────────────────────────────

    s.on('rematch_requested', (_) => _handler?.onRematchRequested());

    s.on('rematch_accepted', (data) {
      final d = _map(data);
      _handler?.onRematchAccepted(d['newRoomId'] as String? ?? '');
    });
  }

  // ── Emit: join_room ───────────────────────────────────────────
  // Call after receiving match_found — server verifies you're assigned

  void joinRoom(String roomId, {Function(Map<String, dynamic>)? onAck}) {
    if (!_connected) return;
    debugPrint('[Socket] emit join_room: $roomId');
    _socket!.emitWithAck('join_room', {'roomId': roomId}, ack: (response) {
      final d = _map(response);
      debugPrint('[Socket] join_room ack: $d');
      if (d['success'] == true) {
        onAck?.call(_map(d['data']));
      } else {
        _handler?.onError(
          _map(d['error'])['message'] as String? ?? 'Failed to join room',
        );
      }
    });
  }

  // ── Emit: make_move ───────────────────────────────────────────
  // Unified move event — move shape depends on game type:
  //
  //  Whot:     {action:'play_card', card:{number,shape}, chosenShape?}
  //            {action:'pick_market'}
  //            {action:'call_card'}
  //  Ludo:     {action:'move_piece', pieceId, diceValue}
  //            {action:'roll_dice'}
  //  Ayo:      {action:'sow', pit}
  //  Draughts: {action:'move', from:{row,col}, to:{row,col}, captures?:[]}

  void makeMove(Map<String, dynamic> move, {Function(Map<String, dynamic>)? onAck}) {
    if (!_connected) return;
    debugPrint('[Socket] emit make_move: $move');
    _socket!.emitWithAck('make_move', {'move': move}, ack: (response) {
      final d = _map(response);
      if (d['success'] != true) {
        _handler?.onError(
          _map(d['error'])['message'] as String? ?? 'Invalid move',
        );
      }
      onAck?.call(d);
    });
  }

  // ── Whot convenience methods ──────────────────────────────────

  void playCard(int number, String shape, {String? chosenShape}) {
    makeMove({
      'action': 'play_card',
      'card': {'number': number, 'shape': shape},
      if (chosenShape != null) 'chosenShape': chosenShape,
    });
  }

  void pickMarket() => makeMove({'action': 'pick_market'});

  void callCard() => makeMove({'action': 'call_card'});

  // ── Ludo convenience methods ──────────────────────────────────

  void rollDice() => makeMove({'action': 'roll_dice'});

  void movePiece(int pieceId, int diceValue) => makeMove({
    'action': 'move_piece',
    'pieceId': pieceId,
    'diceValue': diceValue,
  });

  // ── Ayo convenience method ────────────────────────────────────

  void sowPit(int pitIndex) =>
      makeMove({'action': 'sow', 'pitIndex': pitIndex});

  // ── Draughts convenience method ───────────────────────────────

  void moveDraughts(int fromRow, int fromCol, int toRow, int toCol,
      {List<Map<String, int>>? captures}) {
    makeMove({
      'action': 'move',
      'fromRow': fromRow,
      'fromCol': fromCol,
      'toRow': toRow,
      'toCol': toCol,
      if (captures != null) 'captures': captures,
    });
  }

  // ── Presence signals ──────────────────────────────────────────

  void signalReady() {
    if (!_connected) return;
    _socket!.emitWithAck('player_ready', {}, ack: (_) {});
  }

  void requestRematch() {
    if (!_connected) return;
    _socket!.emitWithAck('request_rematch', {}, ack: (_) {});
  }

  void acceptRematch() {
    if (!_connected) return;
    _socket!.emitWithAck('accept_rematch', {}, ack: (_) {});
  }

  // ── Disconnect ────────────────────────────────────────────────

  Future<void> disconnect() async {
    debugPrint('[Socket] disconnecting');
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _connected = false;
    _handler = null;
  }

  // ── Helper ────────────────────────────────────────────────────

  Map<String, dynamic> _map(dynamic data) {
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return {};
  }
}

// ════════════════════════════════════════════════════════════════
//  MATCHMAKING SERVICE
//  REST calls — token in Authorization: Bearer header
//
//  Routes (from matchmaking.js):
//    POST /api/v1/matchmaking/join  — join queue
//    POST /api/v1/matchmaking/leave — leave queue
//    GET  /api/v1/matchmaking/status?gameType=whot — queue status
//
//  joinQueue returns immediately with {status:'queued'}
//  The actual match result arrives via Socket.io 'match_found' event
// ════════════════════════════════════════════════════════════════

class MatchmakingService {
  static String get _base => '${ApiConfig.nodeBaseUrl}/api/v1/matchmaking';

  /// Join matchmaking queue.
  /// Match result is delivered via socket 'match_found' event — not this response.
  static Future<Map<String, dynamic>?> joinQueue({
    required String gameType,  // 'whot' | 'ludo' | 'ayo' | 'draughts'
    required int entryFee,     // in kobo e.g. 50000 = ₦500
    bool rated = true,
  }) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) return null;
      final token = await user.getIdToken();

      final res = await http.post(
        Uri.parse('$_base/join'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'gameType':  gameType,
          'entryFee':  entryFee,
          'rated':     rated,
        }),
      ).timeout(const Duration(seconds: 15));

      final body = jsonDecode(res.body) as Map<String, dynamic>;
      debugPrint('[Matchmaking] joinQueue: ${res.statusCode} $body');
      return body['success'] == true ? body['data'] as Map<String, dynamic>? : null;
    } catch (e) {
      debugPrint('[Matchmaking] joinQueue error: $e');
      return null;
    }
  }

  /// Leave matchmaking queue.
  static Future<void> leaveQueue(String gameType) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) return;
      final token = await user.getIdToken();

      await http.post(
        Uri.parse('$_base/leave'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'gameType': gameType}),
      ).timeout(const Duration(seconds: 8));
    } catch (e) {
      debugPrint('[Matchmaking] leaveQueue error: $e');
    }
  }

  /// Get queue status — returns queue lengths per game type.
  static Future<Map<String, dynamic>?> getStatus({String? gameType}) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) return null;
      final token = await user.getIdToken();

      final uri = Uri.parse('$_base/status')
          .replace(queryParameters: gameType != null ? {'gameType': gameType} : null);

      final res = await http.get(uri, headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      }).timeout(const Duration(seconds: 10));

      final body = jsonDecode(res.body) as Map<String, dynamic>;
      return body['success'] == true ? body['data'] as Map<String, dynamic>? : null;
    } catch (e) {
      debugPrint('[Matchmaking] getStatus error: $e');
      return null;
    }
  }
}

// ════════════════════════════════════════════════════════════════
//  ENTRY FEE TIERS (from matchmaking.js ENTRY_FEES)
//  in kobo — divide by 100 for naira display
//
//  Whot/Ludo/Draughts: beginner=₦100  intermediate=₦500  expert=₦2,000
//  Ayo:                beginner=₦50   intermediate=₦250  expert=₦1,000
// ════════════════════════════════════════════════════════════════

class EntryFees {
  static const Map<String, Map<String, int>> tiers = {
    'whot':     {'beginner': 10000, 'intermediate': 50000, 'expert': 200000},
    'ludo':     {'beginner': 10000, 'intermediate': 50000, 'expert': 200000},
    'ayo':      {'beginner': 5000,  'intermediate': 25000, 'expert': 100000},
    'draughts': {'beginner': 10000, 'intermediate': 50000, 'expert': 200000},
  };

  static int get(String gameType, String tier) =>
      tiers[gameType]?[tier] ?? 10000;

  static String naira(int kobo) =>
      '₦${(kobo / 100).toStringAsFixed(0)}';
}
