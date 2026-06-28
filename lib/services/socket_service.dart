import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../config/api_config.dart';
import '../screens/games/whot_game_screen.dart';

// ════════════════════════════════════════════════════════════════
//  GAMEARN SOCKET SERVICE
//  Implements WhotSocketService over socket_io_client 2.x
//
//  Server: https://backend-manager-vftt.onrender.com  (staging)
//  Transport: websocket (with polling fallback)
//
//  Emits:
//    join_room       {roomId, playerId}
//    play_card       {roomId, playerId, card, chosenShape?}
//    draw_card       {roomId, playerId}
//    call_card       {roomId, playerId}
//
//  Listens:
//    game_state      → onGameState(state)
//    card_played     → onCardPlayed(data)
//    card_drawn      → onCardDrawn(data)
//    your_turn       → onYourTurn()
//    opponent_turn   → onOpponentTurn()
//    market          → onMarket(count)
//    suspension      → onSuspension()
//    general_market  → onGeneralMarket()
//    choose_shape    → onChooseShape()
//    call_card_event → onCallCard(playerId)
//    game_over       → onGameOver(data)
//    timer_tick      → onTimerTick(seconds)
//    error           → onError(message)
//    connect_error   → onError(message)
// ════════════════════════════════════════════════════════════════

class GamearnSocketService extends WhotSocketService {
  IO.Socket? _socket;
  bool _connected = false;

  // ── Connect ────────────────────────────────────────────────────

  @override
  void connect({
    required String roomId,
    required String playerId,
    required WhotGameEventHandler handler,
  }) {
    if (_connected) disconnect();

    debugPrint('[Socket] connecting to ${ApiConfig.nodeBaseUrl}');

    _socket = IO.io(
      ApiConfig.nodeBaseUrl,
      IO.OptionBuilder()
          .setTransports(['websocket', 'polling']) // websocket first, polling fallback
          .setReconnectionAttempts(5)
          .setReconnectionDelay(2000)
          .enableReconnection()
          .disableAutoConnect()
          .setAuth({'playerId': playerId})         // auth header for JWT future
          .build(),
    );

    // ── Connection lifecycle ─────────────────────────────────────

    _socket!.onConnect((_) {
      _connected = true;
      debugPrint('[Socket] connected — joining room $roomId');
      _socket!.emit('join_room', {'roomId': roomId, 'playerId': playerId});
    });

    _socket!.onDisconnect((reason) {
      _connected = false;
      debugPrint('[Socket] disconnected: $reason');
      handler.onError('Disconnected: $reason');
    });

    _socket!.onConnectError((err) {
      debugPrint('[Socket] connect error: $err');
      handler.onError('Connection failed: $err');
    });

    _socket!.onReconnect((_) {
      debugPrint('[Socket] reconnected — rejoining room $roomId');
      _socket!.emit('join_room', {'roomId': roomId, 'playerId': playerId});
    });

    // ── Game events ───────────────────────────────────────────────

    _socket!.on('game_state', (data) {
      debugPrint('[Socket] game_state received');
      handler.onGameState(_asMap(data));
    });

    _socket!.on('card_played', (data) {
      debugPrint('[Socket] card_played: $data');
      handler.onCardPlayed(_asMap(data));
    });

    _socket!.on('card_drawn', (data) {
      debugPrint('[Socket] card_drawn: $data');
      handler.onCardDrawn(_asMap(data));
    });

    _socket!.on('your_turn', (_) {
      debugPrint('[Socket] your_turn');
      handler.onYourTurn();
    });

    _socket!.on('opponent_turn', (_) {
      debugPrint('[Socket] opponent_turn');
      handler.onOpponentTurn();
    });

    _socket!.on('market', (data) {
      final count = _asMap(data)['count'] as int? ?? 1;
      debugPrint('[Socket] market: $count');
      handler.onMarket(count);
    });

    _socket!.on('suspension', (_) {
      debugPrint('[Socket] suspension');
      handler.onSuspension();
    });

    _socket!.on('general_market', (_) {
      debugPrint('[Socket] general_market');
      handler.onGeneralMarket();
    });

    _socket!.on('choose_shape', (_) {
      debugPrint('[Socket] choose_shape');
      handler.onChooseShape();
    });

    _socket!.on('call_card_event', (data) {
      final pid = _asMap(data)['playerId'] as String? ?? '';
      debugPrint('[Socket] call_card_event: $pid');
      handler.onCallCard(pid);
    });

    _socket!.on('game_over', (data) {
      debugPrint('[Socket] game_over: $data');
      handler.onGameOver(_asMap(data));
    });

    _socket!.on('timer_tick', (data) {
      final secs = _asMap(data)['seconds'] as int? ?? 0;
      handler.onTimerTick(secs);
    });

    _socket!.on('error', (data) {
      final msg = _asMap(data)['message'] as String? ?? 'Unknown error';
      debugPrint('[Socket] error: $msg');
      handler.onError(msg);
    });

    _socket!.connect();
  }

  // ── Emit actions ──────────────────────────────────────────────

  @override
  void emitPlayCard(
    String roomId,
    String playerId,
    dynamic card, {
    dynamic chosenShape,
  }) {
    if (!_connected) return;
    final payload = <String, dynamic>{
      'roomId':   roomId,
      'playerId': playerId,
      'card':     _cardToMap(card),
    };
    if (chosenShape != null) payload['chosenShape'] = chosenShape.toString();
    debugPrint('[Socket] emit play_card: $payload');
    _socket!.emit('play_card', payload);
  }

  @override
  void emitDrawCard(String roomId, String playerId) {
    if (!_connected) return;
    debugPrint('[Socket] emit draw_card');
    _socket!.emit('draw_card', {'roomId': roomId, 'playerId': playerId});
  }

  @override
  void emitCallCard(String roomId, String playerId) {
    if (!_connected) return;
    debugPrint('[Socket] emit call_card');
    _socket!.emit('call_card', {'roomId': roomId, 'playerId': playerId});
  }

  // ── Disconnect ────────────────────────────────────────────────

  @override
  void disconnect() {
    debugPrint('[Socket] disconnecting');
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _connected = false;
  }

  // ── Helpers ───────────────────────────────────────────────────

  Map<String, dynamic> _asMap(dynamic data) {
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return {};
  }

  /// Converts a WhotCard (or any card object) to a JSON-safe map.
  /// Adjust field names to match your Node.js backend's expected shape.
  Map<String, dynamic> _cardToMap(dynamic card) {
    try {
      // If card already has a toJson / toMap method
      if (card is Map) return Map<String, dynamic>.from(card);
      // Reflect common fields — matches Gamearn backend card schema
      return {
        'number': card.number,
        'shape':  card.shape?.toString().split('.').last,
      };
    } catch (_) {
      return {'raw': card.toString()};
    }
  }
}

// ════════════════════════════════════════════════════════════════
//  MATCHMAKING SERVICE
//  REST calls to Node.js backend for:
//    POST /api/match/queue   — join matchmaking queue
//    DELETE /api/match/queue — leave queue
//    GET  /api/match/status  — poll for match found
// ════════════════════════════════════════════════════════════════

import 'dart:convert';
import 'package:http/http.dart' as http;

class MatchmakingService {
  static String get _base => ApiConfig.nodeBaseUrl;

  /// Join the matchmaking queue for a given game type.
  /// Returns {roomId, opponentId, opponentName} when matched,
  /// or null if still waiting / error.
  static Future<Map<String, dynamic>?> joinQueue({
    required String playerId,
    required String gameType,   // 'whot' | 'ludo' | 'ayo' | 'draughts'
    required int    stakeAmount,
    String? idToken,            // Firebase ID token for auth
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$_base/api/match/queue'),
        headers: {
          'Content-Type': 'application/json',
          if (idToken != null) 'Authorization': 'Bearer $idToken',
        },
        body: jsonEncode({
          'playerId':    playerId,
          'gameType':    gameType,
          'stakeAmount': stakeAmount,
        }),
      ).timeout(const Duration(seconds: 15));

      if (res.statusCode == 200 || res.statusCode == 201) {
        final body = jsonDecode(res.body) as Map<String, dynamic>;
        debugPrint('[Matchmaking] joined queue: $body');
        return body['data'] as Map<String, dynamic>?;
      }
      debugPrint('[Matchmaking] joinQueue HTTP ${res.statusCode}: ${res.body}');
    } catch (e) {
      debugPrint('[Matchmaking] joinQueue error: $e');
    }
    return null;
  }

  /// Poll for match status — call every 2-3 seconds until matched.
  /// Returns {roomId, opponentId, opponentName} or null if still waiting.
  static Future<Map<String, dynamic>?> pollStatus({
    required String playerId,
    required String gameType,
  }) async {
    try {
      final res = await http.get(
        Uri.parse('$_base/api/match/status?playerId=$playerId&gameType=$gameType'),
      ).timeout(const Duration(seconds: 10));

      if (res.statusCode == 200) {
        final body = jsonDecode(res.body) as Map<String, dynamic>;
        final data = body['data'] as Map<String, dynamic>?;
        if (data?['status'] == 'matched') return data;
      }
    } catch (e) {
      debugPrint('[Matchmaking] pollStatus error: $e');
    }
    return null;
  }

  /// Leave the queue (called on back button).
  static Future<void> leaveQueue({
    required String playerId,
    required String gameType,
  }) async {
    try {
      await http.delete(
        Uri.parse('$_base/api/match/queue'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'playerId': playerId, 'gameType': gameType}),
      ).timeout(const Duration(seconds: 8));
    } catch (e) {
      debugPrint('[Matchmaking] leaveQueue error: $e');
    }
  }
}
