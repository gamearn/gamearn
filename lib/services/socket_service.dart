import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../screens/games/whot_game_screen.dart';

// ════════════════════════════════════════════════════════════════
//  GAMEARN SOCKET SERVICE
// ════════════════════════════════════════════════════════════════

class GamearnSocketService extends WhotSocketService {
  IO.Socket? _socket;
  bool _connected = false;

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
          .setTransports(['websocket', 'polling'])
          .setReconnectionAttempts(5)
          .setReconnectionDelay(2000)
          .enableReconnection()
          .disableAutoConnect()
          .setAuth({'playerId': playerId})
          .build(),
    );

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

    _socket!.on('game_state', (data) {
      handler.onGameState(_asMap(data));
    });

    _socket!.on('card_played', (data) {
      handler.onCardPlayed(_asMap(data));
    });

    _socket!.on('card_drawn', (data) {
      handler.onCardDrawn(_asMap(data));
    });

    _socket!.on('your_turn', (_) {
      handler.onYourTurn();
    });

    _socket!.on('opponent_turn', (_) {
      handler.onOpponentTurn();
    });

    _socket!.on('market', (data) {
      final count = _asMap(data)['count'] as int? ?? 1;
      handler.onMarket(count);
    });

    _socket!.on('suspension', (_) {
      handler.onSuspension();
    });

    _socket!.on('general_market', (_) {
      handler.onGeneralMarket();
    });

    _socket!.on('choose_shape', (_) {
      handler.onChooseShape();
    });

    _socket!.on('call_card_event', (data) {
      final pid = _asMap(data)['playerId'] as String? ?? '';
      handler.onCallCard(pid);
    });

    _socket!.on('game_over', (data) {
      handler.onGameOver(_asMap(data));
    });

    _socket!.on('timer_tick', (data) {
      final secs = _asMap(data)['seconds'] as int? ?? 0;
      handler.onTimerTick(secs);
    });

    _socket!.on('error', (data) {
      final msg = _asMap(data)['message'] as String? ?? 'Unknown error';
      handler.onError(msg);
    });

    _socket!.connect();
  }

  @override
  void emitPlayCard(String roomId, String playerId, dynamic card, {dynamic chosenShape}) {
    if (!_connected) return;
    final payload = <String, dynamic>{
      'roomId': roomId,
      'playerId': playerId,
      'card': _cardToMap(card),
    };
    if (chosenShape != null) payload['chosenShape'] = chosenShape.toString();
    _socket!.emit('play_card', payload);
  }

  @override
  void emitDrawCard(String roomId, String playerId) {
    if (!_connected) return;
    _socket!.emit('draw_card', {'roomId': roomId, 'playerId': playerId});
  }

  @override
  void emitCallCard(String roomId, String playerId) {
    if (!_connected) return;
    _socket!.emit('call_card', {'roomId': roomId, 'playerId': playerId});
  }

  @override
  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _connected = false;
  }

  Map<String, dynamic> _asMap(dynamic data) {
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return {};
  }

  Map<String, dynamic> _cardToMap(dynamic card) {
    try {
      if (card is Map) return Map<String, dynamic>.from(card);
      return {
        'number': card.number,
        'shape': card.shape?.toString().split('.').last,
      };
    } catch (_) {
      return {'raw': card.toString()};
    }
  }
}

// ════════════════════════════════════════════════════════════════
//  MATCHMAKING SERVICE
// ════════════════════════════════════════════════════════════════

class MatchmakingService {
  static String get _base => ApiConfig.nodeBaseUrl;

  static Future<Map<String, dynamic>?> joinQueue({
    required String playerId,
    required String gameType,
    required int stakeAmount,
    String? idToken,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$_base/api/match/queue'),
        headers: {
          'Content-Type': 'application/json',
          if (idToken != null) 'Authorization': 'Bearer $idToken',
        },
        body: jsonEncode({
          'playerId': playerId,
          'gameType': gameType,
          'stakeAmount': stakeAmount,
        }),
      ).timeout(const Duration(seconds: 15));

      if (res.statusCode == 200 || res.statusCode == 201) {
        return jsonDecode(res.body)['data'] as Map<String, dynamic>?;
      }
    } catch (e) {
      debugPrint('[Matchmaking] joinQueue error: $e');
    }
    return null;
  }

  static Future<Map<String, dynamic>?> pollStatus({
    required String playerId,
    required String gameType,
  }) async {
    try {
      final res = await http.get(
        Uri.parse('$_base/api/match/status?playerId=$playerId&gameType=$gameType'),
      ).timeout(const Duration(seconds: 10));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body)['data'] as Map<String, dynamic>?;
        if (data?['status'] == 'matched') return data;
      }
    } catch (e) {
      debugPrint('[Matchmaking] pollStatus error: $e');
    }
    return null;
  }

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
