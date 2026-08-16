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
import '../../config/api_config.dart';

const Color _kRed    = Color(0xFFE53935);
const Color _kBlue   = Color(0xFF1E88E5);
const Color _kGreen  = Color(0xFF43A047);
const Color _kYellow = Color(0xFFFDD835);
const Color _kSafe   = Color(0xFF22D1EE);
const Color _kBoard  = Color(0xFF0D1120);
const Color _kCell   = Color(0xFF141827);

const List<Color> _kColors = [_kRed, _kYellow, _kGreen, _kBlue];
const List<String> _kNames  = ['Red', 'Yellow', 'Green', 'Blue'];

const List<int> _kStart = [0, 13, 26, 39];
const Set<int> _kSafe52 = {0, 8, 13, 21, 26, 34, 39, 47};

class _Piece {
  int  pos;
  bool inBase;
  bool home;
  int  colorIdx;
  _Piece() : pos = -1, inBase = true, home = false, colorIdx = 0;
  _Piece.copy(_Piece o) : pos = o.pos, inBase = o.inBase, home = o.home, colorIdx = o.colorIdx;
}

_Piece _pieceFromServer(Map<String, dynamic> s) {
  final p = _Piece();
  final pos      = s['position'] as int;
  final inHS     = s['inHomeStretch'] as bool? ?? false;
  final hp       = s['homePosition'] as int? ?? 0;
  final done     = s['completed'] as bool? ?? false;
  final cIdx     = s['colorIdx'] as int? ?? 0;
  p.colorIdx = cIdx;
  if (done) { p.home = true; p.pos = 58; }
  else if (pos == -1) { p.inBase = true; p.pos = -1; }
  else if (inHS) { p.pos = 52 + hp - 1; }
  else { p.pos = pos; }
  return p;
}

class _PracticeLudoService {
  static String get _base => '${ApiConfig.nodeBaseUrl}/api/v1/practice/ludo';
  String? sessionId;
  int playerCount = 2;
  List<int> humanPlayerIndices = [0];
  int diceCount = 1;
  bool dualHome = false;

  Future<Map<String, String>> _authHeaders() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return {'Content-Type': 'application/json'};
    final token = await user.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  Future<Map<String, dynamic>> startGame({int playerRating = 1200, int diceCount = 1}) async {
    final res = await http.post(
      Uri.parse('$_base/start'),
      headers: await _authHeaders(),
      body: jsonEncode({'playerRating': playerRating, 'diceCount': diceCount}),
    ).timeout(const Duration(seconds: 10));
    if (res.statusCode != 200) throw Exception('Failed to start practice game');
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    final data = body['data'] as Map<String, dynamic>;
    sessionId = data['sessionId'] as String;
    final players = data['players'] as List;
    playerCount = players.length;
    humanPlayerIndices = (data['humanPlayerIndices'] as List).cast<int>();
    diceCount = data['diceCount'] as int? ?? 1;
    dualHome = data['dualHome'] as bool? ?? false;
    return data;
  }

  Future<Map<String, dynamic>> rollDice() async {
    final res = await http.post(
      Uri.parse('$_base/roll'),
      headers: await _authHeaders(),
      body: jsonEncode({'sessionId': sessionId}),
    ).timeout(const Duration(seconds: 10));
    if (res.statusCode == 404) throw Exception('Session expired');
    if (res.statusCode != 200) {
      final err = jsonDecode(res.body);
      throw Exception(err['error']?['message'] ?? 'Roll failed');
    }
    return jsonDecode(res.body)['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> movePiece(int pieceId, {int? diceValue}) async {
    final body = <String, dynamic>{'sessionId': sessionId, 'pieceId': pieceId};
    if (diceValue != null) body['diceValue'] = diceValue;
    final res = await http.post(
      Uri.parse('$_base/move'),
      headers: await _authHeaders(),
      body: jsonEncode(body),
    ).timeout(const Duration(seconds: 15));
    if (res.statusCode == 404) throw Exception('Session expired');
    if (res.statusCode != 200) {
      final err = jsonDecode(res.body);
      throw Exception(err['error']?['message'] ?? 'Move failed');
    }
    return jsonDecode(res.body)['data'] as Map<String, dynamic>;
  }

  Future<void> endSession() async {
    if (sessionId == null) return;
    try {
      await http.delete(
        Uri.parse('$_base/${Uri.encodeComponent(sessionId!)}'),
      ).timeout(const Duration(seconds: 5));
    } catch (_) {}
    sessionId = null;
  }
}

class LudoGameScreen extends StatefulWidget {
  final int tokenCount;
  final int playerRating;
  final int diceCount;
  const LudoGameScreen({super.key, this.tokenCount = 4, this.playerRating = 1200, this.diceCount = 1});
  @override State<LudoGameScreen> createState() => _LudoGameScreenState();
}

class _LudoGameScreenState extends State<LudoGameScreen>
    with TickerProviderStateMixin {

  final _PracticeLudoService _svc = _PracticeLudoService();
  late List<List<_Piece>> _pieces;
  int  _current    = 0;
  int  _dice       = 0;
  List<int> _diceValues = [];
  bool _waiting    = true;
  bool _gameOver   = false;
  int  _winner     = -1;
  int  _playerCount = 2;
  int  _humanIndex  = 0;
  int  _diceCount   = 1;
  int  _tokenCount  = 4;
  bool _dualHome    = false;

  bool get _isHuman => _current == _humanIndex;

  bool _botBusy    = false;
  bool _rolling    = false;
  List<int> _legal = [];
  List<Map<String, dynamic>> _legalMoves = [];
  int? _selected;

  List<Map<String, dynamic>> _pendingBotActions = [];

  late AnimationController _diceCtrl;
  late Animation<double>   _diceRot;
  late AnimationController _pulseCtrl;
  late Animation<double>   _pulse;

  @override
  void initState() {
    super.initState();
    _reset();
    _diceCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 500));
    _diceRot = Tween<double>(begin: 0, end: 2 * pi)
        .animate(CurvedAnimation(parent: _diceCtrl, curve: Curves.easeOut));
    _pulseCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 700))
      ..repeat(reverse: true);
    _pulse = Tween<double>(begin: 0.85, end: 1.18)
        .animate(CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));
    _startPractice();
  }

  @override
  void dispose() {
    _svc.endSession();
    _diceCtrl.dispose();
    _pulseCtrl.dispose();
    super.dispose();
  }

  void _reset() {
    _pieces      = [];
    _current     = 0;
    _dice        = 0;
    _diceValues  = [];
    _waiting     = true;
    _gameOver    = false;
    _winner      = -1;
    _legal       = [];
    _legalMoves  = [];
    _selected    = null;
    _botBusy     = false;
    _pendingBotActions = [];
    _playerCount = 2;
    _humanIndex  = 0;
    _diceCount   = 1;
    _tokenCount  = 4;
    _dualHome    = false;
  }

  void _updatePiecesFromPlayers(List<dynamic> players) {
    while (_pieces.length < players.length) _pieces.add([]);
    for (int pl = 0; pl < players.length && pl < 4; pl++) {
      final serverPieces = (players[pl] as Map)['pieces'] as List? ?? [];
      _pieces[pl] = serverPieces
          .map((s) => _pieceFromServer(s as Map<String, dynamic>))
          .toList();
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
      _current = data['currentPlayerIndex'] as int? ?? 0;
      if (mounted) setState(() {
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

    _current = data['currentPlayerIndex'] as int? ?? _current;

    if (data['moreMoves'] == true) {
      _diceValues = (data['diceValues'] as List?)?.cast<int>() ?? [];
      _dice = _diceValues.isNotEmpty ? _diceValues[0] : 0;
      _legal = (data['legalPieceIds'] as List?)?.cast<int>() ?? [];
      _legalMoves = (data['legalMoves'] as List?)
          ?.cast<Map<String, dynamic>>() ?? [];
      _waiting = false;
      _selected = null;
      setState(() {});
      return;
    }

    _gameOver = data['gameOver'] as bool? ?? false;
    if (_gameOver) {
      final winnerUid = data['winner'] as String?;
      _winner = (winnerUid != null && !_svc.humanPlayerIndices
          .any((hi) => players != null && hi < players.length &&
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

    _dice = action['diceValue'] as int? ?? 0;

    if (capture != null) {
      SoundService.instance.play(SoundType.capture);
    }
    if (actionType == 'reach_home') {
      SoundService.instance.play(SoundType.pieceHome);
    }

    if (isWin) {
      _gameOver = true;
      _winner = action['playerIndex'] as int? ?? _current;
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
    if (_svc.sessionId == null) return;
    if (!_waiting || _rolling || _gameOver || !_isHuman || _botBusy) return;
    setState(() => _rolling = true);
    SoundService.instance.play(SoundType.diceRoll);
    _diceCtrl.forward(from: 0);

    try {
      final data = await _svc.rollDice();
      await Future.delayed(const Duration(milliseconds: 520));

      if (!mounted) return;

      final diceValues = (data['diceValues'] as List?)?.cast<int>() ??
          [data['diceValue'] as int];
      final legal = (data['legalPieceIds'] as List).cast<int>();
      final legalMoves = (data['legalMoves'] as List?)
          ?.cast<Map<String, dynamic>>() ?? [];
      final mustPass = data['mustPass'] as bool? ?? false;
      final diceCount = data['diceCount'] as int? ?? 1;

      setState(() {
        _dice       = diceValues.isNotEmpty ? diceValues[0] : 0;
        _diceValues = diceValues;
        _diceCount  = diceCount;
        _waiting    = mustPass;
        _rolling    = false;
        _legal      = legal;
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
      showAppError(context, e);
    }
  }

  Future<void> _sendPass() async {
    try {
      final data = await _svc.movePiece(-1);
      if (!mounted) return;

      _updateStateFromMove(data);

      if (_gameOver) { _showGameOver(); return; }

      if (data['moreMoves'] == true) return;

      final botActions = (data['botActions'] as List?)
          ?.cast<Map<String, dynamic>>() ?? [];
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
      final diceValues = (data['diceValues'] as List?)?.cast<int>() ??
          (data['diceValue'] != null ? [data['diceValue'] as int] : []);
      final legal = (data['legalPieceIds'] as List?)?.cast<int>() ?? [];
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

    try {
      final data = await _svc.movePiece(idx, diceValue: dv);
      if (!mounted) return;

      _updateStateFromMove(data);

      if (_gameOver) { _showGameOver(); return; }

      if (data['moreMoves'] == true) return;

      if (data['extraTurn'] == true) {
        setState(() { _waiting = true; _legal = []; _legalMoves = []; _dice = 0; _diceValues = []; _selected = null; });
        return;
      }

      final botActions = (data['botActions'] as List?)
          ?.cast<Map<String, dynamic>>() ?? [];
      _pendingBotActions = botActions;
      _selected = null;
      await _animateBotActions();

      if (mounted && !_gameOver) {
        _checkPreRolled(data);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() { _selected = null; });
      showAppError(context, e);
    }
  }

  int? _resolveDiceValue(int pieceId) {
    if (_diceCount <= 1) return null;
    if (_legalMoves.isEmpty) return null;
    final matches = _legalMoves
        .where((m) => m['pieceId'] == pieceId)
        .map((m) => m['diceValue'] as int)
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
    final humanWon = _winner == _humanIndex;
    SoundService.instance.play(humanWon ? SoundType.gameWin : SoundType.gameLose);
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        backgroundColor: kBgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20.r)),
        title: Text(
          humanWon ? '\u{1F389} You Win!' : '\u{1F61E} You Lost',
          style: const TextStyle(color: kTextPri, fontWeight: FontWeight.w800),
          textAlign: TextAlign.center,
        ),
        content: Text(
          '${_kNames[_winner % 4]} house wins!',
          style: const TextStyle(color: kTextSec),
          textAlign: TextAlign.center,
        ),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() => _reset());
              _startPractice();
            },
            child: const Text('Play Again',
                style: TextStyle(color: kCyan, fontWeight: FontWeight.w700)),
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
    if (_gameOver)   return 'Game Over';
    if (_botBusy)    return 'Computer is thinking\u2026';
    if (!_isHuman)   return 'Computer\'s turn';
    if (_waiting)    return 'Tap \u{1F3B2} to roll';
    if (_legal.isEmpty) return 'Roll the dice first';
    return 'Tap a glowing piece to move';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: GestureDetector(
          onTap: () => Navigator.pop(context),
          child: Icon(Icons.close_rounded,
              color: const Color(0xFFF1F5F9), size: 20.w),
        ),
        title: Text('L\u00fad\u00f2',
            style: TextStyle(
                color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18.sp)),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.white54),
            onPressed: () {
              _svc.endSession();
              setState(() => _reset());
              _startPractice();
            },
          )
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            ...List.generate(_playerCount, (i) {
              final isHuman = i == _humanIndex;
              final playerPieceList = i < _pieces.length ? _pieces[i] : <_Piece>[];
              final uniqueColors = playerPieceList.map((p) => p.colorIdx).toSet().toList()..sort();
              final colors = uniqueColors.map((ci) => _kColors[ci]).toList();
              final homes = uniqueColors.map((ci) => playerPieceList.where((p) => p.colorIdx == ci && p.home).length).toList();
              final perColorTotal = _tokenCount > 4 ? 4 : _tokenCount;
              return _Strip(
                label: isHuman ? 'You' : 'Computer',
                colors: colors,
                active: _current == i && !_gameOver,
                homes: homes,
                total: perColorTotal,
              );
            }),
            Expanded(
              child: LayoutBuilder(builder: (_, c) {
                final bs = min(c.maxWidth, c.maxHeight);
                return Center(
                  child: AnimatedBuilder(
                    animation: _pulse,
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
                      ]),
                    ),
                  ),
                );
              }),
            ),
            _BottomBar(
              dice: _dice,
              diceValues: _diceValues,
              diceCount: _diceCount,
              waiting: _waiting,
              isHuman: _isHuman,
              rolling: _rolling,
              busy: _botBusy,
              gameOver: _gameOver,
              legal: _legal,
              rot: _diceRot,
              status: _statusText,
              onRoll: _humanRoll,
            ),
            SizedBox(height: 8.h),
          ],
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
    final s    = size.width;
    final cell = s / 15;
    _drawBoard(canvas, s, cell);
    _drawPieces(canvas, s, cell);
  }

  void _drawBoard(Canvas canvas, double s, double cell) {
    final p = Paint();

    p.color = _kBoard;
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(0, 0, s, s), const Radius.circular(14)),
      p,
    );

    final corners = [
      Offset(0, 0),
      Offset(9 * cell, 0),
      Offset(0, 9 * cell),
      Offset(9 * cell, 9 * cell),
    ];
    final cColors = [_kRed, _kGreen, _kYellow, _kBlue];

    for (int i = 0; i < 4; i++) {
      final o  = corners[i];
      final bg = cColors[i];

      p.color = bg.withOpacity(0.15);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
            Rect.fromLTWH(o.dx, o.dy, 6 * cell, 6 * cell),
            const Radius.circular(10)),
        p,
      );

      p.color = bg.withOpacity(0.30);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
            Rect.fromLTWH(o.dx + cell, o.dy + cell, 4 * cell, 4 * cell),
            const Radius.circular(8)),
        p,
      );

      final slots = _baseSlots(cell, i);
      for (final sl in slots) {
        p.color = bg.withOpacity(0.55);
        canvas.drawCircle(sl, cell * 0.38, p);
        p.color = Colors.white.withOpacity(0.12);
        p.style  = PaintingStyle.stroke;
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
      p.color = safe ? _kSafe.withOpacity(0.18) : _kCell;
      canvas.drawRect(rect, p);
      p.color = Colors.white.withOpacity(0.04);
      p.style = PaintingStyle.stroke; p.strokeWidth = 0.5;
      canvas.drawRect(rect, p);
      p.style = PaintingStyle.fill;
      if (safe) _drawStar(canvas, Offset(col * cell + cell / 2, row * cell + cell / 2),
          cell * 0.25, _kSafe.withOpacity(0.45));
    }

    _drawStretches(canvas, cell);
    _drawCentre(canvas, cell);
  }

  void _drawStretches(Canvas canvas, double cell) {
    final p = Paint();
    for (int c = 1; c <= 5; c++) {
      p.color = _kRed.withOpacity(0.35);
      canvas.drawRect(Rect.fromLTWH(c * cell, 7 * cell, cell, cell), p);
    }
    for (int c = 9; c <= 13; c++) {
      p.color = _kGreen.withOpacity(0.35);
      canvas.drawRect(Rect.fromLTWH(c * cell, 7 * cell, cell, cell), p);
    }
    for (int r = 9; r <= 13; r++) {
      p.color = _kYellow.withOpacity(0.35);
      canvas.drawRect(Rect.fromLTWH(7 * cell, r * cell, cell, cell), p);
    }
    for (int r = 1; r <= 5; r++) {
      p.color = _kBlue.withOpacity(0.35);
      canvas.drawRect(Rect.fromLTWH(7 * cell, r * cell, cell, cell), p);
    }
  }

  void _drawCentre(Canvas canvas, double cell) {
    final cx = 7.5 * cell, cy = 7.5 * cell;
    final r  = 2.5 * cell;
    final triColors = [_kBlue, _kGreen, _kYellow, _kRed];
    final angles    = [pi / 2, pi, 3 * pi / 2, 0.0];

    for (int i = 0; i < 4; i++) {
      final paint = Paint()..color = triColors[i].withOpacity(0.5);
      final path  = Path()..moveTo(cx, cy);
      final a = angles[i];
      path.lineTo(cx + r * cos(a - pi / 4), cy - r * sin(a - pi / 4));
      path.lineTo(cx + r * cos(a + pi / 4), cy - r * sin(a + pi / 4));
      path.close();
      canvas.drawPath(path, paint);
    }
    final cp = Paint()..color = _kBoard;
    canvas.drawCircle(Offset(cx, cy), cell * 0.78, cp);
    cp.color = _kSafe.withOpacity(0.55);
    cp.style = PaintingStyle.stroke; cp.strokeWidth = 2;
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
        final sel     = pl == current && selected == i;
        final scale   = (movable && !sel) ? pulse : 1.0;
        final radius  = cell * 0.36 * scale;

        if (movable) {
          final gp = Paint()
            ..color     = _kColors[ci].withOpacity(0.3)
            ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 7);
          canvas.drawCircle(center, radius + 5, gp);
        }

        final fp = Paint()..color = _kColors[ci];
        canvas.drawCircle(center, radius, fp);
        fp.color = Colors.white.withOpacity(0.22);
        canvas.drawCircle(
            Offset(center.dx - radius * 0.18, center.dy - radius * 0.18),
            radius * 0.38, fp);
        fp.color = sel ? Colors.white : Colors.black45;
        fp.style = PaintingStyle.stroke;
        fp.strokeWidth = sel ? 2.5 : 1.2;
        canvas.drawCircle(center, radius, fp);
        fp.style = PaintingStyle.fill;
        _drawText(canvas, '${i + 1}', center, Colors.white, cell * 0.26, bold: true);
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
      case 0: return Offset((1 + step) * cell + cell / 2, 7 * cell + cell / 2);
      case 1: return Offset(7 * cell + cell / 2, (9 + step) * cell + cell / 2);
      case 2: return Offset((9 + step) * cell + cell / 2, 7 * cell + cell / 2);
      case 3: return Offset(7 * cell + cell / 2, (1 + step) * cell + cell / 2);
      default: return Offset(7.5 * cell, 7.5 * cell);
    }
  }

  void _drawStar(Canvas canvas, Offset c, double r, Color color) {
    final p = Paint()..color = color;
    final path = Path();
    for (int i = 0; i < 10; i++) {
      final a  = (i * pi / 5) - pi / 2;
      final rd = i.isEven ? r : r * 0.45;
      final pt = Offset(c.dx + rd * cos(a), c.dy + rd * sin(a));
      if (i == 0) path.moveTo(pt.dx, pt.dy); else path.lineTo(pt.dx, pt.dy);
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
    required this.boardSize, required this.pieces, required this.tokenCount,
    required this.current, required this.legal, required this.isHuman,
    required this.waiting, required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    if (!isHuman || waiting || legal.isEmpty) return const SizedBox.expand();
    final cell = boardSize / 15;
    final painter = _BoardPainter(
      pieces: pieces, tokenCount: tokenCount, current: current,
      legal: legal, selected: null, pulse: 1.0,
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
          left: c.dx - ts / 2, top: c.dy - ts / 2,
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
    required this.label, required this.colors, required this.active,
    required this.homes, required this.total,
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
              width: 8.w, height: 8.h,
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
                      width: 10.w, height: 10.h,
                      decoration: BoxDecoration(
                          shape: BoxShape.circle, color: colors[i])),
                  SizedBox(width: 4.w),
                  Text('$hc/$total',
                      style: TextStyle(
                          color: colors[i], fontSize: 12.sp,
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
  final int dice;
  final List<int> diceValues;
  final int diceCount;
  final bool waiting, isHuman, rolling, busy, gameOver;
  final List<int> legal;
  final Animation<double> rot;
  final String status;
  final VoidCallback onRoll;

  const _BottomBar({
    required this.dice, required this.diceValues, required this.diceCount,
    required this.waiting, required this.isHuman,
    required this.rolling, required this.busy, required this.gameOver,
    required this.legal, required this.rot, required this.status,
    required this.onRoll,
  });

  bool get _canRoll => isHuman && waiting && !gameOver && !busy;

  String _face(int r) {
    const f = ['\u2680','\u2681','\u2682','\u2683','\u2684','\u2685'];
    return (r >= 1 && r <= 6) ? f[r - 1] : '\u{1F3B2}';
  }

  @override
  Widget build(BuildContext context) {
    final showTwoDice = diceCount >= 2 && diceValues.length >= 2;

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
                color: _canRoll ? kCyan : (!isHuman ? kTextSec : kOrange),
                fontSize: 13.sp, fontWeight: FontWeight.w600,
              ),
            ),
          ),
          if (showTwoDice)
            Row(mainAxisSize: MainAxisSize.min, children: [
              _dicePip(diceValues[0]),
              SizedBox(width: 6.w),
              _dicePip(diceValues[1]),
            ])
          else
            AnimatedBuilder(
              animation: rot,
              builder: (_, __) => Transform.rotate(
                angle: rolling ? rot.value : 0,
                child: GestureDetector(
                  onTap: _canRoll ? onRoll : null,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: 52.w, height: 52.h,
                    decoration: BoxDecoration(
                      color: _canRoll ? kOrange : kBgDeep,
                      borderRadius: BorderRadius.circular(12.r),
                      border: Border.all(
                        color: _canRoll ? kOrange : kBorder, width: 2),
                      boxShadow: _canRoll
                          ? [BoxShadow(
                                color: kOrange.withOpacity(0.45),
                                blurRadius: 14, spreadRadius: 1)]
                          : [],
                    ),
                    child: Center(
                      child: dice == 0
                          ? Icon(Icons.casino_rounded,
                              color: Colors.white, size: 26.w)
                          : Text(_face(dice),
                              style: TextStyle(fontSize: 28.sp)),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _dicePip(int value) {
    return Container(
      width: 36.w, height: 36.h,
      decoration: BoxDecoration(
        color: kOrange,
        borderRadius: BorderRadius.circular(8.r),
        border: Border.all(color: kOrange, width: 2),
        boxShadow: [BoxShadow(
            color: kOrange.withOpacity(0.45),
            blurRadius: 8, spreadRadius: 0)],
      ),
      child: Center(
        child: Text(_face(value),
            style: TextStyle(fontSize: 20.sp)),
      ),
    );
  }
}
