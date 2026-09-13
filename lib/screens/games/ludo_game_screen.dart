import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import '../../theme.dart';
import '../../utils/error_utils.dart';
import '../../services/sound_service.dart';
import '../../services/socket_service.dart';
import '../../config/api_config.dart';

const Color _kRed = Color(0xFFFF2038);
const Color _kBlue = Color(0xFF078CFF);
const Color _kGreen = Color(0xFF16DB45);
const Color _kYellow = Color(0xFFFFD216);
const Color _kSafe = Color(0xFFFFD31A);
const Color _kBoard = Color(0xFF071326);
const Color _kCell = Color(0xFFF4F0EC);

const List<Color> _kColors = [_kRed, _kYellow, _kGreen, _kBlue];
const List<String> _kNames = ['Red', 'Yellow', 'Green', 'Blue'];

const List<int> _kStart = [0, 13, 26, 39];
const Set<int> _kSafe52 = {0, 8, 13, 21, 26, 34, 39, 47};

int? _jsonInt(dynamic value) => value is num ? value.toInt() : int.tryParse('$value');

List<int> _jsonIntList(dynamic value) => value is List
    ? value.map(_jsonInt).whereType<int>().toList(growable: false)
    : const <int>[];

List<Map<String, dynamic>> _jsonMapList(dynamic value) => value is List
    ? value
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList(growable: false)
    : const <Map<String, dynamic>>[];

class _Piece {
  int pos;
  bool inBase;
  bool home;
  int colorIdx;
  _Piece()
      : pos = -1,
        inBase = true,
        home = false,
        colorIdx = 0;
  _Piece.copy(_Piece o)
      : pos = o.pos,
        inBase = o.inBase,
        home = o.home,
        colorIdx = o.colorIdx;
}

_Piece _pieceFromServer(Map<String, dynamic> s) {
  final p = _Piece();
  final pos = _jsonInt(s['position']) ?? -1;
  final inHS = s['inHomeStretch'] as bool? ?? false;
  final hp = _jsonInt(s['homePosition']) ?? 0;
  final done = s['completed'] as bool? ?? false;
  final cIdx = _jsonInt(s['colorIdx']) ?? 0;
  p.colorIdx = cIdx;
  if (done) {
    p.home = true;
    p.pos = 58;
  } else if (pos == -1) {
    p.inBase = true;
    p.pos = -1;
  } else if (inHS) {
    p.pos = 52 + hp - 1;
  } else {
    p.pos = pos;
  }
  return p;
}

class _PracticeLudoService {
  static String get _base => '${ApiConfig.nodeBaseUrl}/api/v1/practice/ludo';
  String? sessionId;
  int playerCount = 2;
  List<int> humanPlayerIndices = [0];
  int diceCount = 1;
  bool dualHome = false;

  String _errorMessage(http.Response response, String fallback) {
    try {
      final body = jsonDecode(response.body);
      if (body is Map && body['error'] is Map) {
        final message = (body['error'] as Map)['message'];
        if (message is String && message.trim().isNotEmpty) return message;
      }
    } catch (_) {}
    return fallback;
  }

  Future<Map<String, String>> _authHeaders() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return {'Content-Type': 'application/json'};
    final token = await user.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  Future<Map<String, dynamic>> startGame(
      {int playerRating = 1200, int diceCount = 1}) async {
    final res = await http
        .post(
          Uri.parse('$_base/start'),
          headers: await _authHeaders(),
          body: jsonEncode(
              {'playerRating': playerRating, 'diceCount': diceCount}),
        )
        .timeout(const Duration(seconds: 10));
    if (res.statusCode != 200) {
      throw Exception(_errorMessage(res, 'Unable to start the Ludo game'));
    }
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    final data = body['data'] as Map<String, dynamic>;
    sessionId = data['sessionId'] as String;
    final players = data['players'] as List;
    playerCount = players.length;
    humanPlayerIndices = _jsonIntList(data['humanPlayerIndices']);
    diceCount = _jsonInt(data['diceCount']) ?? 1;
    dualHome = data['dualHome'] as bool? ?? false;
    return data;
  }

  Future<Map<String, dynamic>> rollDice() async {
    final res = await http
        .post(
          Uri.parse('$_base/roll'),
          headers: await _authHeaders(),
          body: jsonEncode({'sessionId': sessionId}),
        )
        .timeout(const Duration(seconds: 10));
    if (res.statusCode == 404) throw Exception('Session expired');
    if (res.statusCode != 200) {
      throw Exception(_errorMessage(res, 'Unable to roll the dice'));
    }
    return jsonDecode(res.body)['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> movePiece(int pieceId, {int? diceValue}) async {
    final body = <String, dynamic>{'sessionId': sessionId, 'pieceId': pieceId};
    if (diceValue != null) body['diceValue'] = diceValue;
    final res = await http
        .post(
          Uri.parse('$_base/move'),
          headers: await _authHeaders(),
          body: jsonEncode(body),
        )
        .timeout(const Duration(seconds: 15));
    if (res.statusCode == 404) throw Exception('Session expired');
    if (res.statusCode != 200) {
      throw Exception(_errorMessage(res, 'Unable to move that piece'));
    }
    return jsonDecode(res.body)['data'] as Map<String, dynamic>;
  }

  Future<void> endSession() async {
    if (sessionId == null) return;
    try {
      await http
          .delete(
            Uri.parse('$_base/${Uri.encodeComponent(sessionId!)}'),
          )
          .timeout(const Duration(seconds: 5));
    } catch (_) {}
    sessionId = null;
  }
}

class LudoGameScreen extends StatefulWidget {
  final int tokenCount;
  final int playerRating;
  final int diceCount;
  final String? roomId;
  final String? playerId;
  final String? opponentName;
  final int prizePool;
  const LudoGameScreen({
    super.key,
    this.tokenCount = 4,
    this.playerRating = 1200,
    this.diceCount = 1,
    this.roomId,
    this.playerId,
    this.opponentName,
    this.prizePool = 0,
  });
  bool get isMultiplayer =>
      roomId != null && roomId!.isNotEmpty && roomId != 'practice_bot';
  @override
  State<LudoGameScreen> createState() => _LudoGameScreenState();
}

class _LudoGameScreenState extends State<LudoGameScreen>
    with TickerProviderStateMixin
    implements GameEventHandler {
  final _PracticeLudoService _svc = _PracticeLudoService();
  late List<List<_Piece>> _pieces;
  int _current = 0;
  int _dice = 0;
  List<int> _diceValues = [];
  bool _waiting = true;
  bool _gameOver = false;
  int _winner = -1;
  int _playerCount = 2;
  int _humanIndex = 0;
  int _diceCount = 1;
  int _tokenCount = 4;
  bool _dualHome = false;

  // ── Multiplayer ────────────────────────────────────────────────
  bool _isMp = false;
  late String _roomId;
  String _opponentName = 'Gamearn Bot';
  Map<int, String> _playerNames = {}; // per-seat names (2-4 player rooms)
  int _prizePool = 0;
  bool _opponentGone = false;
  bool _scattering = false;
  bool _gameOverShown = false;
  GamearnSocketService? _socket;
  final Random _srng = Random();
  List<Offset> _scatterPoints = [];

  bool get _isHuman => _current == _humanIndex;

  bool _botBusy = false;
  bool _rolling = false;
  List<int> _legal = [];
  List<Map<String, dynamic>> _legalMoves = [];
  int? _selected;

  List<Map<String, dynamic>> _pendingBotActions = [];

  late AnimationController _pulseCtrl;
  late Animation<double> _pulse;
  late AnimationController _diceScatterCtrl;

  @override
  void initState() {
    super.initState();
    _isMp = widget.isMultiplayer;
    _roomId = widget.roomId ?? '';
    _opponentName = widget.opponentName ?? 'Opponent';
    _prizePool = widget.prizePool;
    _reset();
    _pulseCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 700))
      ..repeat(reverse: true);
    _pulse = Tween<double>(begin: 0.85, end: 1.18)
        .animate(CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));
    _diceScatterCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1100))
      ..addStatusListener((status) {
        if (status == AnimationStatus.completed && mounted) {
          setState(() {
            _scattering = false;
            _rolling = false;
          });
        }
      });
    if (_isMp) {
      _connectSocket();
    } else {
      _startPractice();
    }
  }

  @override
  void dispose() {
    if (_isMp) {
      _socket?.disconnect();
    } else {
      _svc.endSession();
    }
    _pulseCtrl.dispose();
    _diceScatterCtrl.dispose();
    super.dispose();
  }

  void _connectSocket() {
    setState(() => _waiting = true);
    _socket = GamearnSocketService();
    _socket!.connect(this);
  }

  // ── GameEventHandler ───────────────────────────────────────────

  @override
  void onConnected() {
    if (_roomId.isEmpty) return;
    _socket?.joinRoom(_roomId, onAck: (data) {
      if (!mounted) return;
      final gs = data['gameState'];
      if (gs is Map<String, dynamic>) _applyServerGameState(gs);
    });
  }

  @override
  void onGameStateSync(Map<String, dynamic> gameState) {
    if (mounted) _applyServerGameState(gameState);
  }

  @override
  void onMatchFound(
      String roomId, Map<String, dynamic> opponent, int prizePool) {
    if (!mounted) return;
    _roomId = roomId.isNotEmpty ? roomId : _roomId;
    _opponentName = (opponent['displayName'] as String?)?.isNotEmpty == true
        ? opponent['displayName'] as String
        : _opponentName;
    _prizePool = prizePool;
    setState(() {});
  }

  @override
  void onMatchStarted(
      Map<String, dynamic> gameState, int entryFee, int prizePool) {
    if (!mounted) return;
    _prizePool = prizePool;
    _applyServerGameState(gameState);
  }

  @override
  void onMoveMade(String playerUid, Map<String, dynamic> move,
      Map<String, dynamic> gameState, bool isGameOver) {
    if (!mounted) return;
    if ((move['action'] as String?) == 'roll_dice') _playScatter();
    _applyServerGameState(gameState);
    if (isGameOver && !_gameOverShown) {
      _winner = _indexOfUid(playerUid);
      _showGameOver();
    }
  }

  @override
  void onGameOver(String? winnerUid, int prize, String result) {
    if (!mounted) return;
    _prizePool = prize;
    _winner = _indexOfUid(winnerUid);
    _gameOver = true;
    if (!_gameOverShown) _showGameOver();
  }

  @override
  void onOpponentDisconnected(int graceSeconds) {
    if (mounted) setState(() => _opponentGone = true);
  }

  @override
  void onOpponentReconnected() {
    if (mounted) setState(() => _opponentGone = false);
  }

  @override
  void onOpponentForfeited(String? winnerUid) {
    if (!mounted) return;
    _winner = _indexOfUid(winnerUid);
    _gameOver = true;
    if (!_gameOverShown) _showGameOver();
  }

  @override
  void onError(String message) {
    if (!mounted) return;
    setState(() => _waiting = true);
    showAppError(context, message);
  }

  @override
  void onDisconnected(String reason) {
    if (mounted) setState(() {});
  }

  @override
  void onPlayerJoined(String uid, String displayName) {}

  @override
  void onMatchAborted(String reason) {
    if (!mounted) return;
    showAppError(context, 'Match cancelled: $reason');
  }

  @override
  void onRematchRequested() {}

  @override
  void onRematchAccepted(String newRoomId) {
    if (!mounted) return;
    setState(() {
      _roomId = newRoomId;
      _gameOver = false;
      _gameOverShown = false;
      _winner = -1;
      _waiting = true;
      _pieces = [];
      _dice = 0;
      _diceValues = [];
      _legal = [];
      _legalMoves = [];
      _scattering = false;
      _opponentGone = false;
    });
    _socket?.joinRoom(_roomId, onAck: (data) {
      if (!mounted) return;
      final gs = data['gameState'];
      if (gs is Map<String, dynamic>) _applyServerGameState(gs);
    });
  }

  int _indexOfUid(String? uid) {
    if (uid == null || uid.isEmpty) return -1;
    if (uid == widget.playerId) return _humanIndex;
    for (int i = 0; i < _playerCount; i++) {
      if (i != _humanIndex) return i;
    }
    return 1 - _humanIndex;
  }

  void _playScatter() {
    if (!mounted) return;
    setState(() {
      _scattering = true;
      _buildScatterPoints();
    });
    _diceScatterCtrl.forward(from: 0);
  }

  void _buildScatterPoints() {
    _scatterPoints = List.generate(5, (i) {
      final side = i.isEven;
      final top = (i ~/ 2).isEven;
      return Offset(
        side
            ? 0.16 + _srng.nextDouble() * 0.22
            : 0.62 + _srng.nextDouble() * 0.22,
        top
            ? 0.18 + _srng.nextDouble() * 0.22
            : 0.60 + _srng.nextDouble() * 0.22,
      );
    });
  }

  // ── Server state ───────────────────────────────────────────────

  void _applyServerGameState(Map<String, dynamic> gs) {
    final players = gs['players'] as List? ?? [];
    _updatePiecesFromPlayers(players);
    _playerCount = players.isNotEmpty ? players.length : _playerCount;

    // Capture per-seat names for 3-4 player rooms
    _playerNames = {
      for (int i = 0; i < players.length; i++)
        i: ((players[i] as Map)['displayName'] as String?)?.trim().isNotEmpty ==
                true
            ? (players[i] as Map)['displayName'] as String
            : 'Player ${i + 1}',
    };

    final myUid = widget.playerId;
    if (myUid != null && myUid.isNotEmpty) {
      for (int i = 0; i < players.length; i++) {
        if (((players[i] as Map)['uid'] as String?) == myUid) {
          _humanIndex = i;
          break;
        }
      }
    }

    final idx = _jsonInt(gs['currentPlayerIndex']);
    if (idx != null && idx >= 0 && idx < _playerCount) _current = idx;

    final isMyTurn = _current == _humanIndex;
    final dv = _jsonIntList(gs['diceValues']);
    final legal = _jsonIntList(gs['legalPieceIds']);

    setState(() {
      _diceValues = dv;
      _dice = dv.isNotEmpty ? dv.first : (_jsonInt(gs['diceValue']) ?? 0);
      _legal = legal;
      _legalMoves = _jsonMapList(gs['legalMoves']);
      _selected = null;
      _rolling = false;
      _waiting = dv.isEmpty || !isMyTurn;
    });
  }

  void _reset() {
    _pieces = [];
    _current = 0;
    _dice = 0;
    _diceValues = [];
    _waiting = true;
    _gameOver = false;
    _winner = -1;
    _legal = [];
    _legalMoves = [];
    _selected = null;
    _botBusy = false;
    _pendingBotActions = [];
    _playerCount = 2;
    _humanIndex = 0;
    _diceCount = 1;
    _tokenCount = 4;
    _dualHome = false;
    _opponentGone = false;
    _scattering = false;
    _gameOverShown = false;
  }

  void _updatePiecesFromPlayers(List<dynamic> players) {
    while (_pieces.length < players.length) _pieces.add([]);
    // Server colors: ['red','green','yellow','blue'] — map to Flutter palette
    // indices [red=0, yellow=1, green=2, blue=3] so pieces match their base
    // and home stretch.
    const _colorToIdx = {'red': 0, 'green': 2, 'yellow': 1, 'blue': 3};
    for (int pl = 0; pl < players.length && pl < 4; pl++) {
      final player = players[pl] as Map;
      final serverPieces = player['pieces'] as List? ?? [];
      final colorName = (player['color'] as String?)?.toLowerCase();
      final cIdx = _dualHome
          ? null
          : (_colorToIdx[colorName] ?? (player['index'] as int? ?? pl));
      _pieces[pl] = serverPieces.map((s) {
        final p = _pieceFromServer(Map<String, dynamic>.from(s as Map));
        if (cIdx != null) p.colorIdx = cIdx;
        return p;
      }).toList();
    }
  }

  Future<void> _startPractice() async {
    try {
      setState(() => _waiting = false);
      final data = await _svc.startGame(
          playerRating: widget.playerRating, diceCount: widget.diceCount);
      final players = data['players'] as List;
      _playerCount = players.length;
      _humanIndex = _svc.humanPlayerIndices.isNotEmpty
          ? _svc.humanPlayerIndices.first
          : 0;
      _diceCount = _svc.diceCount;
      _dualHome = _svc.dualHome;
      _tokenCount = players.isNotEmpty
          ? ((players[0] as Map)['pieces'] as List?)?.length ?? 4
          : 4;
      _updatePiecesFromPlayers(players);
      _current = _jsonInt(data['currentPlayerIndex']) ?? 0;
      if (mounted)
        setState(() {
          _waiting = true;
        });
    } catch (e) {
      if (mounted) showAppError(context, e);
    }
  }

  void _updateStateFromMove(Map<String, dynamic> data) {
    final players = data['players'] as List?;
    if (players != null) {
      _updatePiecesFromPlayers(players);
      _playerCount = players.length;
      _humanIndex = _svc.humanPlayerIndices.isNotEmpty
          ? _svc.humanPlayerIndices.first
          : 0;
    }

    _current = _jsonInt(data['currentPlayerIndex']) ?? _current;

    if (data['moreMoves'] == true) {
      _diceValues = _jsonIntList(data['diceValues']);
      _dice = _diceValues.isNotEmpty ? _diceValues[0] : 0;
      _legal = _jsonIntList(data['legalPieceIds']);
      _legalMoves = _jsonMapList(data['legalMoves']);
      _waiting = false;
      _selected = null;
      setState(() {});
      return;
    }

    _gameOver = data['gameOver'] as bool? ?? false;
    if (_gameOver) {
      final winnerUid = data['winner'] as String?;
      _winner = (winnerUid != null &&
              !_svc.humanPlayerIndices.any((hi) =>
                  players != null &&
                  hi < players.length &&
                  (players[hi] as Map)['uid'] == winnerUid))
          ? _current
          : _humanIndex;
      _legal = [];
      _legalMoves = [];
      _waiting = false;
      _dice = 0;
      _diceValues = [];
    }

    setState(() {});
  }

  void _applyBotAction(Map<String, dynamic> action) {
    final actionType = action['action'] as String? ?? 'move';
    final capture = action['capture'] as Map<String, dynamic>?;
    final isWin = action['isWin'] as bool? ?? false;

    _dice = _jsonInt(action['diceValue']) ?? 0;

    if (capture != null) {
      SoundService.instance.play(SoundType.capture);
    }
    if (actionType == 'reach_home') {
      SoundService.instance.play(SoundType.pieceHome);
    }

    if (isWin) {
      _gameOver = true;
      _winner = _jsonInt(action['playerIndex']) ?? _current;
      _legal = [];
      _dice = 0;
      SoundService.instance.play(SoundType.gameLose);
    }
  }

  Future<void> _animateBotActions() async {
    if (_pendingBotActions.isEmpty) return;
    _botBusy = true;

    final actions = List<Map<String, dynamic>>.from(_pendingBotActions);
    _pendingBotActions.clear();

    for (final action in actions) {
      if (!mounted || _gameOver) break;
      setState(() => _applyBotAction(action));
      await Future.delayed(const Duration(milliseconds: 600));
      if (action['isWin'] == true) {
        _botBusy = false;
        _showGameOver();
        return;
      }
    }

    if (mounted && !_gameOver) {
      setState(() {
        _botBusy = false;
        _waiting = true;
        _legal = [];
        _legalMoves = [];
        _dice = 0;
        _diceValues = [];
      });
    }
  }

  Future<void> _humanRoll() async {
    if (_gameOver || _botBusy) return;
    if (!_waiting || _rolling || !_isHuman || _scattering) return;
    setState(() => _rolling = true);
    SoundService.instance.play(SoundType.diceRoll);

    if (_isMp) {
      _socket?.rollDice();
      return;
    }

    if (_svc.sessionId == null) {
      setState(() => _rolling = false);
      await _startPractice();
      return;
    }
    setState(() {});
    _playScatter();

    try {
      final data = await _svc.rollDice();
      await Future.delayed(const Duration(milliseconds: 520));

      if (!mounted) return;

      var diceValues = _jsonIntList(data['diceValues']);
      final singleDice = _jsonInt(data['diceValue']);
      if (diceValues.isEmpty && singleDice != null) diceValues = [singleDice];
      if (diceValues.isEmpty) {
        throw const FormatException('The game server returned no dice result');
      }
      final legal = _jsonIntList(data['legalPieceIds']);
      final legalMoves = _jsonMapList(data['legalMoves']);
      final mustPass = data['mustPass'] as bool? ?? false;
      final diceCount = _jsonInt(data['diceCount']) ?? 1;

      setState(() {
        _dice = diceValues.isNotEmpty ? diceValues[0] : 0;
        _diceValues = diceValues;
        _diceCount = diceCount;
        _waiting = mustPass;
        _rolling = false;
        _legal = legal;
        _legalMoves = legalMoves;
      });

      if (mustPass) {
        await Future.delayed(const Duration(milliseconds: 400));
        if (!mounted) return;
        await _sendPass();
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _rolling = false);
      showAppError(context, e, onRetry: _humanRoll);
    }
  }

  Future<void> _sendPass() async {
    try {
      final data = await _svc.movePiece(-1);
      if (!mounted) return;

      _updateStateFromMove(data);

      if (_gameOver) {
        _showGameOver();
        return;
      }

      if (data['moreMoves'] == true) return;

      final botActions = _jsonMapList(data['botActions']);
      _pendingBotActions = botActions;
      await _animateBotActions();

      if (mounted && !_gameOver) {
        _checkPreRolled(data);
      }
    } catch (e) {
      if (mounted) _setHumanTurn();
    }
  }

  void _checkPreRolled(Map<String, dynamic> data) {
    final diceRolled = data['diceRolled'] as bool? ?? false;
    if (diceRolled) {
      var diceValues = _jsonIntList(data['diceValues']);
      final singleDice = _jsonInt(data['diceValue']);
      if (diceValues.isEmpty && singleDice != null) diceValues = [singleDice];
      final legal = _jsonIntList(data['legalPieceIds']);
      setState(() {
        _diceValues = diceValues;
        _dice = diceValues.isNotEmpty ? diceValues[0] : 0;
        _legal = legal;
        _waiting = legal.isEmpty;
      });
      if (legal.isEmpty) {
        _sendPass();
      }
    }
  }

  Future<void> _onPieceTap(int idx) async {
    if (_waiting || !_isHuman || _gameOver || _botBusy) return;
    if (!_legal.contains(idx)) return;
    setState(() => _selected = idx);

    final dv = _resolveDiceValue(idx);

    if (_isMp) {
      _socket?.movePiece(idx, dv ?? _dice);
      return;
    }

    try {
      final data = await _svc.movePiece(idx, diceValue: dv);
      if (!mounted) return;

      _updateStateFromMove(data);

      if (_gameOver) {
        _showGameOver();
        return;
      }

      if (data['moreMoves'] == true) return;

      if (data['extraTurn'] == true) {
        setState(() {
          _waiting = true;
          _legal = [];
          _legalMoves = [];
          _dice = 0;
          _diceValues = [];
          _selected = null;
        });
        return;
      }

      final botActions = _jsonMapList(data['botActions']);
      _pendingBotActions = botActions;
      _selected = null;
      await _animateBotActions();

      if (mounted && !_gameOver) {
        _checkPreRolled(data);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _selected = null;
      });
      showAppError(context, e);
    }
  }

  int? _resolveDiceValue(int pieceId) {
    if (_diceCount <= 1) return null;
    if (_legalMoves.isEmpty) return null;
    final matches = _legalMoves
        .where((m) => m['pieceId'] == pieceId)
        .map((m) => _jsonInt(m['diceValue']))
        .whereType<int>()
        .toSet()
        .toList();
    if (matches.isEmpty) return null;
    return matches.first;
  }

  void _setHumanTurn() {
    setState(() {
      _waiting = true;
      _legal = [];
      _legalMoves = [];
      _dice = 0;
      _diceValues = [];
      _selected = null;
    });
  }

  void _showGameOver() {
    if (!mounted || _gameOverShown) return;
    _gameOverShown = true;
    _gameOver = true;
    final humanWon = _winner == _humanIndex;
    final winnerName = _isMp
        ? (humanWon ? 'You' : _nameFor(_winner))
        : (_winner >= 0 && _winner < _kNames.length
            ? _kNames[_winner % 4]
            : 'Opponent');
    final subtitle = _isMp
        ? (_prizePool > 0
            ? '${humanWon ? 'You won' : '$winnerName won'}\nPrize: \u20A6${(_prizePool / 100).toStringAsFixed(0)}'
            : '$winnerName wins!')
        : '$winnerName house wins!';
    SoundService.instance
        .play(humanWon ? SoundType.gameWin : SoundType.gameLose);
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        backgroundColor: kBgCard,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(20.r)),
        title: Text(
          humanWon ? '\u{1F389} You Win!' : '\u{1F61E} You Lost',
          style: const TextStyle(color: kTextPri, fontWeight: FontWeight.w800),
          textAlign: TextAlign.center,
        ),
        content: Text(
          subtitle,
          style: const TextStyle(color: kTextSec),
          textAlign: TextAlign.center,
        ),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              if (_isMp) {
                _socket?.requestRematch();
              } else {
                setState(() => _reset());
                _startPractice();
              }
            },
            child: Text(_isMp ? 'Rematch' : 'Play Again',
                style:
                    const TextStyle(color: kCyan, fontWeight: FontWeight.w700)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Exit', style: TextStyle(color: kTextSec)),
          ),
        ],
      ),
    );
  }

  String get _statusText {
    if (_gameOver) return 'Game Over';
    if (_opponentGone) return 'Opponent disconnected \u2014 waiting\u2026';
    if (_isMp) {
      if (!_isHuman) return '${_nameFor(_current)} is rolling\u2026';
      if (_rolling || _scattering) return 'Rolling\u2026';
      if (_waiting) return 'Tap the \u{1F3B2} to roll';
      if (_legal.isEmpty) return 'Roll the dice first';
      return 'Tap a glowing piece to move';
    }
    if (_botBusy) return 'Gamearn Bot is thinking\u2026';
    if (!_isHuman) return 'Gamearn Bot\'s turn';
    if (_waiting) return 'Tap \u{1F3B2} to roll';
    if (_legal.isEmpty) return 'Roll the dice first';
    return 'Tap a glowing piece to move';
  }

  String _shortName(String name) =>
      name.length <= 12 ? name : '${name.substring(0, 12)}\u2026';

  /// Seat label for a player index — "You" for this device, the seat display
  /// name otherwise. Falls back to the passed opponent name for 2-player rooms.
  String _nameFor(int i) {
    if (i == _humanIndex) return 'You';
    final n = _playerNames[i];
    if (n != null && n.isNotEmpty) return _shortName(n);
    if (_opponentName.isNotEmpty && _opponentName != 'Gamearn Bot') {
      return _shortName(_opponentName);
    }
    return 'Player ${i + 1}';
  }

  @override
  Widget build(BuildContext context) {
    Widget playerStrip(int i) {
      final isHuman = i == _humanIndex;
      final playerPieceList = i < _pieces.length ? _pieces[i] : <_Piece>[];
      final uniqueColors = playerPieceList.map((p) => p.colorIdx).toSet().toList()
        ..sort();
      final colors = uniqueColors.map((ci) => _kColors[ci]).toList();
      final homes = uniqueColors
          .map((ci) => playerPieceList
              .where((p) => p.colorIdx == ci && p.home)
              .length)
          .toList();
      final perColorTotal = _tokenCount > 4 ? 4 : _tokenCount;
      final label = isHuman ? 'You' : (_isMp ? _nameFor(i) : 'Gamearn Bot');
      return _Strip(
        label: label,
        colors: colors,
        active: _current == i && !_gameOver,
        homes: homes,
        total: perColorTotal,
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF10177B),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: GestureDetector(
          onTap: () => Navigator.pop(context),
          child: Icon(Icons.close_rounded,
              color: const Color(0xFFF1F5F9), size: 20.w),
        ),
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(4, (i) {
            const letters = ['L', 'U', 'D', 'O'];
            const colors = [_kRed, _kYellow, _kGreen, _kBlue];
            return Transform.rotate(
              angle: (i - 1.5) * 0.055,
              child: Text(letters[i],
                  style: TextStyle(
                      color: colors[i],
                      fontWeight: FontWeight.w900,
                      fontSize: 25.sp,
                      shadows: const [
                        Shadow(color: Color(0xFF00113E), blurRadius: 4)
                      ])),
            );
          }),
        ),
        centerTitle: true,
        actions: [
          if (!_isMp)
            IconButton(
              icon: const Icon(Icons.refresh_rounded, color: Colors.white54),
              onPressed: () {
                _svc.endSession();
                setState(() => _reset());
                _startPractice();
              },
            )
          else if (_prizePool > 0)
            Padding(
              padding: EdgeInsets.only(right: 12.w),
              child: Center(
                child: Container(
                  padding:
                      EdgeInsets.symmetric(horizontal: 10.w, vertical: 5.h),
                  decoration: BoxDecoration(
                    color: kOrange.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20.r),
                    border: Border.all(color: kOrange.withOpacity(0.5)),
                  ),
                  child: Text('\u20A6${(_prizePool / 100).toStringAsFixed(0)}',
                      style: TextStyle(
                          color: kOrange,
                          fontWeight: FontWeight.w800,
                          fontSize: 13.sp)),
                ),
              ),
            ),
        ],
      ),
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            colors: [Color(0xFF06429C), Color(0xFF18227F), Color(0xFF3022B8)],
            stops: [0, 0.62, 1],
          ),
        ),
        child: SafeArea(
          child: Column(
          children: [
            ...List.generate(_playerCount, (i) =>
                i == _humanIndex ? const SizedBox.shrink() : playerStrip(i)),
            Expanded(
              child: LayoutBuilder(builder: (_, c) {
                final bs = min(c.maxWidth, c.maxHeight);
                return Center(
                  child: AnimatedBuilder(
                    animation: Listenable.merge([_pulse, _diceScatterCtrl]),
                    builder: (_, __) => SizedBox(
                      width: bs,
                      height: bs,
                      child: Stack(children: [
                        CustomPaint(
                          size: Size(bs, bs),
                          painter: _BoardPainter(
                            pieces: _pieces,
                            tokenCount: _tokenCount,
                            current: _current,
                            legal: _legal,
                            selected: _selected,
                            pulse: _pulse.value,
                          ),
                        ),
                        _TapLayer(
                          boardSize: bs,
                          pieces: _pieces,
                          tokenCount: _tokenCount,
                          current: _current,
                          legal: _legal,
                          isHuman: _isHuman,
                          waiting: _waiting,
                          onTap: _onPieceTap,
                        ),
                        _CenterDice(
                          boardSize: bs,
                          dice: _dice,
                          diceValues: _diceValues,
                          diceCount: _diceCount,
                          waiting: _waiting,
                          canRoll: _isHuman && !_gameOver,
                          scattering: _scattering,
                          t: _diceScatterCtrl.value,
                          points: _scatterPoints,
                          pulse: _pulse.value,
                          onRoll: _humanRoll,
                        ),
                      ]),
                    ),
                  ),
                );
              }),
            ),
            if (_humanIndex >= 0 && _humanIndex < _playerCount)
              playerStrip(_humanIndex),
            _BottomBar(
              status: _statusText,
              isHuman: _isHuman,
              waiting: _waiting,
              gameOver: _gameOver,
            ),
            SizedBox(height: 8.h),
          ],
          ),
        ),
      ),
    );
  }
}

class _BoardPainter extends CustomPainter {
  final List<List<_Piece>> pieces;
  final int tokenCount, current;
  final List<int> legal;
  final int? selected;
  final double pulse;

  const _BoardPainter({
    required this.pieces,
    required this.tokenCount,
    required this.current,
    required this.legal,
    required this.selected,
    required this.pulse,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width;
    final cell = s / 15;
    _drawBoard(canvas, s, cell);
    _drawPieces(canvas, s, cell);
  }

  void _drawBoard(Canvas canvas, double s, double cell) {
    final p = Paint();

    p.shader = const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFF172544), Color(0xFF050A16), Color(0xFF102C59)],
    ).createShader(Rect.fromLTWH(0, 0, s, s));
    canvas.drawRRect(
      RRect.fromRectAndRadius(
          Rect.fromLTWH(0, 0, s, s), const Radius.circular(14)),
      p,
    );
    p.shader = null;
    p.style = PaintingStyle.stroke;
    p.strokeWidth = max(2, cell * 0.12);
    p.color = const Color(0xFF168BFF);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
          Rect.fromLTWH(1, 1, s - 2, s - 2), const Radius.circular(14)),
      p,
    );
    p.style = PaintingStyle.fill;

    final corners = [
      Offset(0, 0),
      Offset(9 * cell, 0),
      Offset(0, 9 * cell),
      Offset(9 * cell, 9 * cell),
    ];
    final cColors = [_kRed, _kGreen, _kYellow, _kBlue];

    for (int i = 0; i < 4; i++) {
      final o = corners[i];
      final bg = cColors[i];

      p.color = bg.withOpacity(0.92);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
            Rect.fromLTWH(o.dx + cell * 0.12, o.dy + cell * 0.12, 5.76 * cell,
                5.76 * cell),
            Radius.circular(cell * 0.7)),
        p,
      );

      p.color = const Color(0xFF071326).withOpacity(0.86);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
            Rect.fromLTWH(o.dx + cell, o.dy + cell, 4 * cell, 4 * cell),
            Radius.circular(cell * 0.65)),
        p,
      );

      final slots = _baseSlots(cell, i);
      for (final sl in slots) {
        p.color = bg;
        canvas.drawCircle(sl, cell * 0.38, p);
        p.color = Colors.white.withOpacity(0.52);
        p.style = PaintingStyle.stroke;
        p.strokeWidth = 1.5;
        canvas.drawCircle(sl, cell * 0.38, p);
        p.style = PaintingStyle.fill;
      }
    }

    final track = _track();
    for (int i = 0; i < track.length; i++) {
      final (row, col) = track[i];
      final rect = Rect.fromLTWH(col * cell, row * cell, cell, cell);
      final safe = _kSafe52.contains(i);
      p.color = safe ? _kSafe.withOpacity(0.88) : _kCell;
      canvas.drawRect(rect, p);
      p.color = const Color(0xFF9EA4AF).withOpacity(0.65);
      p.style = PaintingStyle.stroke;
      p.strokeWidth = 0.5;
      canvas.drawRect(rect, p);
      p.style = PaintingStyle.fill;
      if (safe)
        _drawStar(canvas, Offset(col * cell + cell / 2, row * cell + cell / 2),
            cell * 0.25, Colors.white);
    }

    _drawStretches(canvas, cell);
    _drawCentre(canvas, cell);
  }

  void _drawStretches(Canvas canvas, double cell) {
    final p = Paint();
    for (int c = 1; c <= 5; c++) {
      p.color = _kRed.withOpacity(0.92);
      canvas.drawRect(Rect.fromLTWH(c * cell, 7 * cell, cell, cell), p);
    }
    for (int c = 9; c <= 13; c++) {
      p.color = _kGreen.withOpacity(0.92);
      canvas.drawRect(Rect.fromLTWH(c * cell, 7 * cell, cell, cell), p);
    }
    for (int r = 9; r <= 13; r++) {
      p.color = _kYellow.withOpacity(0.92);
      canvas.drawRect(Rect.fromLTWH(7 * cell, r * cell, cell, cell), p);
    }
    for (int r = 1; r <= 5; r++) {
      p.color = _kBlue.withOpacity(0.92);
      canvas.drawRect(Rect.fromLTWH(7 * cell, r * cell, cell, cell), p);
    }
  }

  void _drawCentre(Canvas canvas, double cell) {
    final cx = 7.5 * cell, cy = 7.5 * cell;
    final r = 2.5 * cell;
    final triColors = [_kBlue, _kGreen, _kYellow, _kRed];
    final angles = [pi / 2, pi, 3 * pi / 2, 0.0];

    for (int i = 0; i < 4; i++) {
      final paint = Paint()..color = triColors[i];
      final path = Path()..moveTo(cx, cy);
      final a = angles[i];
      path.lineTo(cx + r * cos(a - pi / 4), cy - r * sin(a - pi / 4));
      path.lineTo(cx + r * cos(a + pi / 4), cy - r * sin(a + pi / 4));
      path.close();
      canvas.drawPath(path, paint);
    }
    final cp = Paint()..color = _kBoard;
    canvas.drawCircle(Offset(cx, cy), cell * 0.78, cp);
    cp.color = _kSafe.withOpacity(0.55);
    cp.style = PaintingStyle.stroke;
    cp.strokeWidth = 2;
    canvas.drawCircle(Offset(cx, cy), cell * 0.78, cp);
    _drawText(canvas, '\u2605', Offset(cx, cy), _kSafe, cell * 0.65);
  }

  void _drawPieces(Canvas canvas, double s, double cell) {
    final track = _track();

    for (int pl = 0; pl < pieces.length; pl++) {
      final pieceList = pieces[pl];
      for (int i = 0; i < pieceList.length; i++) {
        final pc = pieceList[i];
        if (pc.home) continue;

        final ci = pc.colorIdx;

        Offset center;
        if (pc.inBase) {
          center = _baseSlots(cell, pl)[i];
        } else if (pc.pos >= 52) {
          center = _stretchPos(ci, pc.pos - 52, cell);
        } else {
          final abs = pc.pos;
          final (row, col) = track[abs];
          center = Offset(col * cell + cell / 2, row * cell + cell / 2);
        }

        final movable = pl == current && legal.contains(i);
        final sel = pl == current && selected == i;
        final scale = (movable && !sel) ? pulse : 1.0;
        final radius = cell * 0.36 * scale;

        if (movable) {
          final gp = Paint()
            ..color = _kColors[ci].withOpacity(0.3)
            ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 7);
          canvas.drawCircle(center, radius + 5, gp);
        }

        final fp = Paint()..color = _kColors[ci];
        canvas.drawCircle(center, radius, fp);
        fp.color = Colors.white.withOpacity(0.22);
        canvas.drawCircle(
            Offset(center.dx - radius * 0.18, center.dy - radius * 0.18),
            radius * 0.38,
            fp);
        fp.color = sel ? Colors.white : Colors.black45;
        fp.style = PaintingStyle.stroke;
        fp.strokeWidth = sel ? 2.5 : 1.2;
        canvas.drawCircle(center, radius, fp);
        fp.style = PaintingStyle.fill;
        _drawText(canvas, '${i + 1}', center, Colors.white, cell * 0.26,
            bold: true);
      }
    }
  }

  List<(int, int)> _track() {
    final c = <(int, int)>[];
    for (int j = 0; j <= 5; j++) c.add((6, j));
    for (int r = 5; r >= 0; r--) c.add((r, 6));
    for (int j = 7; j <= 8; j++) c.add((0, j));
    for (int r = 1; r <= 5; r++) c.add((r, 8));
    for (int j = 9; j <= 14; j++) c.add((6, j));
    for (int r = 7; r <= 8; r++) c.add((r, 14));
    for (int j = 13; j >= 9; j--) c.add((8, j));
    for (int r = 9; r <= 14; r++) c.add((8, r));
    for (int j = 7; j >= 6; j--) c.add((14, j));
    for (int r = 13; r >= 9; r--) c.add((r, 6));
    for (int j = 5; j >= 0; j--) c.add((8, j));
    c.add((7, 0));
    return c;
  }

  List<Offset> _baseSlots(double cell, int pl) {
    final pads = [
      Offset(cell, cell),
      Offset(10 * cell, cell),
      Offset(cell, 10 * cell),
      Offset(10 * cell, 10 * cell),
    ];
    if (tokenCount > 4) {
      return List.generate(8, (i) {
        final row = i < 4 ? 0.7 : 2.8;
        final col = 0.6 + (i % 4) * 1.2;
        return pads[pl] + Offset(cell * col, cell * row);
      });
    }
    final offs = [
      Offset(cell * 0.75, cell * 0.75),
      Offset(cell * 2.25, cell * 0.75),
      Offset(cell * 0.75, cell * 2.25),
      Offset(cell * 2.25, cell * 2.25),
    ];
    return List.generate(4, (i) => pads[pl] + offs[i % offs.length]);
  }

  Offset _stretchPos(int pl, int step, double cell) {
    switch (pl) {
      case 0:
        return Offset((1 + step) * cell + cell / 2, 7 * cell + cell / 2);
      case 1:
        return Offset(7 * cell + cell / 2, (9 + step) * cell + cell / 2);
      case 2:
        return Offset((9 + step) * cell + cell / 2, 7 * cell + cell / 2);
      case 3:
        return Offset(7 * cell + cell / 2, (1 + step) * cell + cell / 2);
      default:
        return Offset(7.5 * cell, 7.5 * cell);
    }
  }

  void _drawStar(Canvas canvas, Offset c, double r, Color color) {
    final p = Paint()..color = color;
    final path = Path();
    for (int i = 0; i < 10; i++) {
      final a = (i * pi / 5) - pi / 2;
      final rd = i.isEven ? r : r * 0.45;
      final pt = Offset(c.dx + rd * cos(a), c.dy + rd * sin(a));
      if (i == 0)
        path.moveTo(pt.dx, pt.dy);
      else
        path.lineTo(pt.dx, pt.dy);
    }
    path.close();
    canvas.drawPath(path, p);
  }

  void _drawText(Canvas canvas, String text, Offset c, Color color, double size,
      {bool bold = false}) {
    final tp = TextPainter(
      text: TextSpan(
          text: text,
          style: TextStyle(
              color: color,
              fontSize: size,
              fontWeight: bold ? FontWeight.w900 : FontWeight.w400)),
      textDirection: TextDirection.ltr,
    )..layout();
    tp.paint(canvas, c - Offset(tp.width / 2, tp.height / 2));
  }

  @override
  bool shouldRepaint(_BoardPainter o) => true;
}

class _TapLayer extends StatelessWidget {
  final double boardSize;
  final List<List<_Piece>> pieces;
  final int tokenCount, current;
  final List<int> legal;
  final bool isHuman, waiting;
  final void Function(int) onTap;

  const _TapLayer({
    required this.boardSize,
    required this.pieces,
    required this.tokenCount,
    required this.current,
    required this.legal,
    required this.isHuman,
    required this.waiting,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    if (!isHuman || waiting || legal.isEmpty) return const SizedBox.expand();
    final cell = boardSize / 15;
    final painter = _BoardPainter(
      pieces: pieces,
      tokenCount: tokenCount,
      current: current,
      legal: legal,
      selected: null,
      pulse: 1.0,
    );
    final track = painter._track();
    return Stack(
      children: legal.map((idx) {
        final pc = pieces[current][idx];
        final ci = pc.colorIdx;
        Offset c;
        if (pc.inBase) {
          c = painter._baseSlots(cell, current)[idx];
        } else if (pc.pos >= 52) {
          c = painter._stretchPos(ci, pc.pos - 52, cell);
        } else {
          final abs = pc.pos;
          final (row, col) = track[abs];
          c = Offset(col * cell + cell / 2, row * cell + cell / 2);
        }
        const ts = 48.0;
        return Positioned(
          left: c.dx - ts / 2,
          top: c.dy - ts / 2,
          child: GestureDetector(
            onTap: () => onTap(idx),
            child: Container(width: ts, height: ts, color: Colors.transparent),
          ),
        );
      }).toList(),
    );
  }
}

class _Strip extends StatelessWidget {
  final String label;
  final List<Color> colors;
  final bool active;
  final List<int> homes;
  final int total;

  const _Strip({
    required this.label,
    required this.colors,
    required this.active,
    required this.homes,
    required this.total,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      margin: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
      padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 9.h),
      decoration: BoxDecoration(
        color: active ? kBgCard : kBgDeep,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(
          color: active ? kCyan.withOpacity(0.4) : kBorder,
          width: active ? 1.5 : 1,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(children: [
            Container(
              width: 8.w,
              height: 8.h,
              decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: active ? kCyan : Colors.white24),
            ),
            SizedBox(width: 10.w),
            Text(label,
                style: TextStyle(
                    color: active ? kTextPri : kTextSec,
                    fontWeight: FontWeight.w700,
                    fontSize: 14.sp)),
          ]),
          Row(
            children: List.generate(colors.length, (i) {
              final hc = i < homes.length ? homes[i] : 0;
              return Padding(
                padding: EdgeInsets.only(left: 12.w),
                child: Row(children: [
                  Container(
                      width: 10.w,
                      height: 10.h,
                      decoration: BoxDecoration(
                          shape: BoxShape.circle, color: colors[i])),
                  SizedBox(width: 4.w),
                  Text('$hc/$total',
                      style: TextStyle(
                          color: colors[i],
                          fontSize: 12.sp,
                          fontWeight: FontWeight.w600)),
                ]),
              );
            }),
          ),
        ],
      ),
    );
  }
}

class _BottomBar extends StatelessWidget {
  final String status;
  final bool isHuman, waiting, gameOver;

  const _BottomBar({
    required this.status,
    required this.isHuman,
    required this.waiting,
    required this.gameOver,
  });

  @override
  Widget build(BuildContext context) {
    final canRoll = isHuman && waiting && !gameOver;
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 8.w),
      padding: EdgeInsets.symmetric(horizontal: 18.w, vertical: 12.h),
      decoration: BoxDecoration(
        color: kBgCard,
        borderRadius: BorderRadius.circular(14.r),
        border: Border.all(color: kBorder),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              status,
              style: TextStyle(
                color: canRoll ? kCyan : (isHuman ? kOrange : kTextSec),
                fontSize: 13.sp,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Icon(Icons.casino_rounded,
              color: canRoll ? kCyan : Colors.white12, size: 20.w),
        ],
      ),
    );
  }
}

// ── Centre dice with board-scatter roll animation ─────────────────────────────
// The dice lives in the middle of the board. On a roll it bounces out across the
// board, tumbles (rotating + cycling faces), then returns to the centre to show
// the result.

class _CenterDice extends StatelessWidget {
  final double boardSize;
  final int dice;
  final List<int> diceValues;
  final int diceCount;
  final bool waiting;
  final bool canRoll;
  final bool scattering;
  final double t;
  final List<Offset> points;
  final double pulse;
  final VoidCallback onRoll;

  const _CenterDice({
    required this.boardSize,
    required this.dice,
    required this.diceValues,
    required this.diceCount,
    required this.waiting,
    required this.canRoll,
    required this.scattering,
    required this.t,
    required this.points,
    required this.pulse,
    required this.onRoll,
  });

  static String _face(int r) {
    const f = ['\u2680', '\u2681', '\u2682', '\u2683', '\u2684', '\u2685'];
    return (r >= 1 && r <= 6) ? f[r - 1] : '\u2680';
  }

  Offset _normPos() {
    if (!scattering || points.isEmpty) return const Offset(0.5, 0.5);
    final pts = [const Offset(0.5, 0.5), ...points, const Offset(0.5, 0.5)];
    final n = pts.length - 1;
    final f = t * n;
    var i = f.floor();
    if (i < 0) i = 0;
    if (i > n - 1) i = n - 1;
    final frac = (f - i).clamp(0.0, 1.0);
    return Offset.lerp(pts[i], pts[i + 1], frac)!;
  }

  @override
  Widget build(BuildContext context) {
    final box = boardSize * 0.12;
    final norm = _normPos();
    final left = norm.dx * boardSize - box / 2;
    final top = norm.dy * boardSize - box / 2;
    final angle = scattering ? t * 10 * pi : 0.0;
    final scale = scattering
        ? (1.0 + 0.28 * sin(t * 6 * pi))
        : (canRoll && waiting ? pulse : 1.0);
    final enabled = canRoll && waiting && !scattering;

    final faceCount = (diceValues.length >= 2 || diceCount >= 2) ? 2 : 1;
    final showTwo = faceCount == 2;
    final cell = showTwo ? box * 0.46 : box;

    final faces = <String>[];
    if (scattering) {
      final base = (t * 24).floor() % 6;
      faces.add(_face(base + 1));
      if (showTwo) faces.add(_face((base + 3) % 6 + 1));
    } else {
      final v0 = diceValues.isNotEmpty ? diceValues[0] : dice;
      final v1 = diceValues.length >= 2 ? diceValues[1] : 0;
      faces.add(_face(v0));
      if (showTwo) faces.add(_face(v1));
    }

    Widget dieShell(String face, double w) => Container(
          width: w,
          height: w,
          decoration: BoxDecoration(
            color: enabled
                ? kOrange
                : (dice > 0 || scattering ? kOrange : kBgDeep),
            borderRadius: BorderRadius.circular(w * 0.22),
            border: Border.all(color: enabled ? kOrange : kBorder, width: 2),
            boxShadow: enabled
                ? [
                    BoxShadow(
                        color: kOrange.withOpacity(0.5),
                        blurRadius: 16,
                        spreadRadius: 2)
                  ]
                : [],
          ),
          child: Center(
            child: dice == 0 && !scattering
                ? Icon(Icons.casino_rounded, color: Colors.white, size: w * 0.5)
                : Text(face, style: TextStyle(fontSize: w * 0.5, height: 1)),
          ),
        );

    return Positioned(
      left: left,
      top: top,
      width: box,
      height: box,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: enabled ? onRoll : null,
        child: Transform.rotate(
          angle: angle,
          child: Transform.scale(
            scale: scale,
            child: Center(
              child: showTwo
                  ? Row(mainAxisSize: MainAxisSize.min, children: [
                      dieShell(faces[0], cell),
                      SizedBox(width: box * 0.08),
                      dieShell(faces[1], cell),
                    ])
                  : dieShell(faces[0], box),
            ),
          ),
        ),
      ),
    );
  }
}
