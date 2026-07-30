import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'package:gamearn/config/api_config.dart';
import '../../theme.dart';
import '../../services/sound_service.dart';

// ── Palette ───────────────────────────────────────────────────────────────────
const _bg      = Color(0xFF0B0E1A);
const _navy    = Color(0xFF0D1B4B);
const _card    = Color(0xFF0F172A);
const _surface = Color(0xFF1E293B);
const _cyan    = Color(0xFF22D1EE);
const _orange  = Color(0xFFFF5E00);
const _green   = Color(0xFF00E676);
const _txtPri  = Color(0xFFF1F5F9);
const _txtSub  = Color(0xFF94A3B8);
const _border  = Color(0xFF334155);

// Board colours
const _darkSquare  = Color(0xFF2D1B0E);
const _lightSquare = Color(0xFFD4A853);
const _humanPiece  = Color(0xFFF1F5F9);
const _botPiece    = Color(0xFF1A0A00);
const _humanKing   = Color(0xFFFFD700);
const _botKing     = Color(0xFF8B0000);
const _selectRing  = Color(0xFF22D1EE);
const _moveHint    = Color(0xFF22D1EE);
const _captureHint = Color(0xFFFF5E00);

// Cell values (match validator: 0=empty, 1=human_man, 2=human_king,
// 3=bot_man, 4=bot_king)
const _kEmpty     = 0;
const _kHumanMan  = 1;
const _kHumanKing = 2;
const _kBotMan    = 3;
const _kBotKing   = 4;

const _kBoardSize = 8;
const _kCells     = 64;

// ── Practice API service ──────────────────────────────────────────────────────

class _PracticeDraughtsService {
  static String get _base => '${ApiConfig.nodeBaseUrl}/api/v1/practice/draughts';

  String? sessionId;
  List<int> humanPlayerIndices = [];

  Future<Map<String, String>> _authHeaders() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return {'Content-Type': 'application/json'};
    final token = await user.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  Future<Map<String, dynamic>> startGame({int playerRating = 1200}) async {
    final res = await http.post(
      Uri.parse('$_base/start'),
      headers: await _authHeaders(),
      body: jsonEncode({'playerRating': playerRating}),
    ).timeout(const Duration(seconds: 10));
    if (res.statusCode != 200) throw Exception('Failed to start practice game');
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    final data = body['data'] as Map<String, dynamic>;
    sessionId = data['sessionId'] as String;
    humanPlayerIndices = (data['humanPlayerIndices'] as List).cast<int>();
    return data;
  }

  Future<Map<String, dynamic>> movePiece(int fromSq, int toSq, {List<Map<String, dynamic>>? captures}) async {
    final fromRow = fromSq ~/ _kBoardSize;
    final fromCol = fromSq % _kBoardSize;
    final toRow = toSq ~/ _kBoardSize;
    final toCol = toSq % _kBoardSize;

    final body = <String, dynamic>{
      'sessionId': sessionId,
      'fromRow': fromRow,
      'fromCol': fromCol,
      'toRow': toRow,
      'toCol': toCol,
    };
    if (captures != null && captures.isNotEmpty) {
      body['captures'] = captures;
    }

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

  Future<Map<String, dynamic>> getState() async {
    final res = await http.get(
      Uri.parse('$_base/state/${Uri.encodeComponent(sessionId!)}'),
      headers: await _authHeaders(),
    ).timeout(const Duration(seconds: 10));
    if (res.statusCode == 404) throw Exception('Session expired');
    if (res.statusCode != 200) throw Exception('Failed to get state');
    return jsonDecode(res.body)['data'] as Map<String, dynamic>;
  }

  Future<void> deleteSession() async {
    if (sessionId == null) return;
    try {
      await http.delete(
        Uri.parse('$_base/${Uri.encodeComponent(sessionId!)}'),
      ).timeout(const Duration(seconds: 5));
    } catch (_) {}
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  DRAUGHTS GAME SCREEN
// ═════════════════════════════════════════════════════════════════════════════

class DraughtsGameScreen extends StatefulWidget {
  final String roomId;
  final String playerId;
  final String playerName;
  final String playerAvatar;
  final String opponentName;
  final String opponentAvatar;
  final String tournamentTitle;
  final String prizePool;
  final int playerRating;
  final VoidCallback? onBack;

  const DraughtsGameScreen({
    super.key,
    required this.roomId,
    required this.playerId,
    this.playerName     = 'You',
    this.playerAvatar   = '',
    this.opponentName   = 'Gamearn Bot',
    this.opponentAvatar = '',
    this.tournamentTitle = 'DRÁFÙ TOURNAMENT',
    this.prizePool      = '₦70,000',
    this.playerRating   = 1200,
    this.onBack,
  });

  @override
  State<DraughtsGameScreen> createState() => _DraughtsGameScreenState();
}

class _DraughtsGameScreenState extends State<DraughtsGameScreen>
    with TickerProviderStateMixin {

  // ── Animations ────────────────────────────────────────────────────────────
  late AnimationController _glowCtrl;
  late Animation<double>   _glowAnim;

  // ── Game state ────────────────────────────────────────────────────────────
  List<int>  _board          = List.filled(_kCells, _kEmpty);
  int        _currentPlayer  = 0;
  bool       _isTerminal     = false;
  int        _humanPieces    = 12;
  int        _botPieces      = 12;

  // Selection & hints
  int        _selectedSq     = -1;
  List<int>  _legalMoves     = [];
  List<int>  _captureMoves   = [];

  // Busy
  bool       _botBusy        = false;
  bool       _isLoading      = true;
  bool       _loadFailed     = false;
  String     _statusMsg      = 'Loading…';

  // Last move highlight
  int        _lastFrom       = -1;
  int        _lastTo         = -1;

  // Service
  final _PracticeDraughtsService _svc = _PracticeDraughtsService();

  // ── Init ──────────────────────────────────────────────────────────────────
  @override
  void initState() {
    super.initState();
    _glowCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900))
      ..repeat(reverse: true);
    _glowAnim = Tween(begin: 0.6, end: 1.0).animate(
        CurvedAnimation(parent: _glowCtrl, curve: Curves.easeInOut));
    _startGame();
  }

  @override
  void dispose() {
    _svc.deleteSession();
    _glowCtrl.dispose();
    super.dispose();
  }

  // ── Start game ────────────────────────────────────────────────────────────
  Future<void> _startGame() async {
    setState(() { _isLoading = true; _loadFailed = false; });

    try {
      final data = await _svc.startGame(playerRating: widget.playerRating);

      if (!mounted) return;

      final board = List<int>.from(data['board'] as List);

      setState(() {
        _board         = board;
        _currentPlayer = data['currentPlayerIndex'] as int;
        _humanPieces   = data['pieceCounts']['player0'] as int;
        _botPieces     = data['pieceCounts']['player1'] as int;
        _selectedSq    = -1;
        _legalMoves    = [];
        _captureMoves  = [];
        _lastFrom      = -1;
        _lastTo        = -1;
        _isTerminal    = false;
        _isLoading     = false;
        _statusMsg     = 'Your turn — select a piece';
      });
    } catch (e) {
      if (mounted) setState(() { _isLoading = false; _loadFailed = true; });
    }
  }

  // ── Square tap ───────────────────────────────────────────────────────────
  void _onSquareTap(int sq) {
    if (_currentPlayer != 0 || _botBusy || _isTerminal) return;
    final cell = _board[sq];

    // Tap a move hint → execute the move
    if (_legalMoves.contains(sq) && _selectedSq >= 0) {
      _executeHumanMove(_selectedSq, sq);
      return;
    }

    // Tap own piece → select it and show hints
    if (cell == _kHumanMan || cell == _kHumanKing) {
      final moves    = _getMovesFrom(sq);
      final captures = _getCapturesFrom(sq);
      final anyCapture = _anyPieceHasCapture();
      setState(() {
        _selectedSq   = sq;
        _legalMoves   = anyCapture ? captures : moves;
        _captureMoves = captures;
      });
      return;
    }

    // Tap elsewhere → deselect
    setState(() {
      _selectedSq   = -1;
      _legalMoves   = [];
      _captureMoves = [];
    });
  }

  // ── Execute human move ────────────────────────────────────────────────────
  Future<void> _executeHumanMove(int from, int to) async {
    HapticFeedback.lightImpact();
    setState(() { _botBusy = true; _statusMsg = 'Sending move…'; });

    try {
      final data = await _svc.movePiece(from, to);
      if (!mounted) return;

      final board   = List<int>.from(data['board'] as List);
      final captureCount = (data['lastMove'] is Map
          ? (data['lastMove']['captures'] as List?)?.length ?? 0
          : 0);
      final isCapture = captureCount > 0;
      SoundService.instance.play(isCapture ? SoundType.capture : SoundType.pieceMove);

      setState(() {
        _board        = board;
        _selectedSq   = -1;
        _legalMoves   = [];
        _captureMoves = [];
        _lastFrom     = from;
        _lastTo       = to;
        _humanPieces  = data['pieceCounts']['player0'] as int;
        _botPieces    = data['pieceCounts']['player1'] as int;
        _currentPlayer = data['currentPlayerIndex'] as int;
      });

      if (data['additionalCapturesAvailable'] == true) {
        setState(() {
          _botBusy   = false;
          _statusMsg = 'Continue capturing';
        });
        return;
      }

      if (data['gameOver'] == true) {
        _endGame(humanWins: _currentPlayer != 1);
        return;
      }

      final botActions = data['botActions'] as List? ?? [];
      await _animateBotActions(botActions);
    } catch (e) {
      if (!mounted) return;
      _toast(e.toString().replaceFirst('Exception: ', ''));
      setState(() {
        _botBusy   = false;
        _statusMsg = 'Your turn — select a piece';
      });
    }
  }

  // ── Animate bot actions ───────────────────────────────────────────────────
  Future<void> _animateBotActions(List<dynamic> actions) async {
    for (final action in actions) {
      if (!mounted || _isTerminal) break;
      final a = action as Map<String, dynamic>;

      final fromRow = a['fromRow'] as int;
      final fromCol = a['fromCol'] as int;
      final toRow   = a['toRow']   as int;
      final toCol   = a['toCol']   as int;
      final from    = fromRow * _kBoardSize + fromCol;
      final to      = toRow   * _kBoardSize + toCol;
      final isCap   = (a['captures'] as List?)?.isNotEmpty == true;

      setState(() {
        _lastFrom  = from;
        _lastTo    = to;
        _statusMsg = '${widget.opponentName} is thinking…';
      });
      SoundService.instance.play(isCap ? SoundType.capture : SoundType.pieceMove);
      await Future.delayed(const Duration(milliseconds: 500));

      if (a['isWin'] == true) {
        _endGame(humanWins: false);
        return;
      }
    }

    if (!mounted || _isTerminal) return;
    setState(() {
      _botBusy   = false;
      _statusMsg = 'Your turn — select a piece';
    });
  }

  // ── Hint generators (render-only — server validates) ──────────────────────

  List<int> _getMovesFrom(int from) {
    final board = _board;
    final piece = board[from];
    final row   = from ~/ _kBoardSize;
    final col   = from % _kBoardSize;
    final moves = <int>[];

    final isKing  = piece == _kHumanKing || piece == _kBotKing;
    if (isKing) {
      for (final d in [[-1,-1],[-1,1],[1,-1],[1,1]]) {
        final nr = row + d[0], nc = col + d[1];
        if (nr >= 0 && nr < _kBoardSize && nc >= 0 && nc < _kBoardSize) {
          if (board[nr * _kBoardSize + nc] == _kEmpty) moves.add(nr * _kBoardSize + nc);
        }
      }
    } else {
      final isHuman = piece == _kHumanMan || piece == _kHumanKing;
      final dirs = isHuman
          ? [[1,-1],[1,1]]
          : [[-1,-1],[-1,1]];
      for (final d in dirs) {
        final nr = row + d[0], nc = col + d[1];
        if (nr >= 0 && nr < _kBoardSize && nc >= 0 && nc < _kBoardSize) {
          if (board[nr * _kBoardSize + nc] == _kEmpty) moves.add(nr * _kBoardSize + nc);
        }
      }
    }
    moves.addAll(_getCapturesFrom(from));
    return moves;
  }

  List<int> _getCapturesFrom(int from) {
    final board  = _board;
    final piece  = board[from];
    if (piece == _kEmpty) return [];
    final row    = from ~/ _kBoardSize;
    final col    = from % _kBoardSize;
    final isKing = piece == _kHumanKing || piece == _kBotKing;
    final isHuman = piece == _kHumanMan || piece == _kHumanKing;
    final captures = <int>[];

    for (final d in [[-1,-1],[-1,1],[1,-1],[1,1]]) {
      if (!isKing) {
        if (isHuman && d[0] < 0) continue;
        if (!isHuman && d[0] > 0) continue;
      }
      final mr  = row + d[0], mc  = col + d[1];
      final lr  = row + d[0]*2, lc = col + d[1]*2;
      if (lr < 0 || lr >= _kBoardSize || lc < 0 || lc >= _kBoardSize) continue;

      final mid    = mr * _kBoardSize + mc;
      final land   = lr * _kBoardSize + lc;
      final midCell = board[mid];
      final isOpp  = isHuman
          ? (midCell == _kBotMan || midCell == _kBotKing)
          : (midCell == _kHumanMan || midCell == _kHumanKing);
      if (isOpp && board[land] == _kEmpty) captures.add(land);
    }
    return captures;
  }

  bool _anyPieceHasCapture() {
    for (int sq = 0; sq < _kCells; sq++) {
      final c = _board[sq];
      if (c == _kHumanMan || c == _kHumanKing) {
        if (_getCapturesFrom(sq).isNotEmpty) return true;
      }
    }
    return false;
  }

  bool _opponentCanMove(List<int> board, int player) {
    for (int sq = 0; sq < _kCells; sq++) {
      final c = board[sq];
      final isOwn = player == 0
          ? (c == _kHumanMan || c == _kHumanKing)
          : (c == _kBotMan || c == _kBotKing);
      if (!isOwn) continue;
      final row = sq ~/ _kBoardSize, col = sq % _kBoardSize;
      for (final d in [[-1,-1],[-1,1],[1,-1],[1,1]]) {
        final nr = row + d[0], nc = col + d[1];
        if (nr >= 0 && nr < _kBoardSize && nc >= 0 && nc < _kBoardSize) {
          if (board[nr * _kBoardSize + nc] == _kEmpty) return true;
        }
      }
    }
    return false;
  }

  void _endGame({required bool humanWins}) {
    if (!mounted) return;
    SoundService.instance.play(humanWins ? SoundType.gameWin : SoundType.gameLose);
    setState(() { _isTerminal = true; _botBusy = false; });
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => _GameOverDialog(
        isWinner:     humanWins,
        humanPieces:  _humanPieces,
        botPieces:    _botPieces,
        prizePool:    widget.prizePool,
        opponentName: widget.opponentName,
        onClose:  widget.onBack ?? () => Navigator.maybePop(context),
        onRematch: () { Navigator.pop(context); _startGame(); },
      ),
    );
  }

  void _toast(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg,
          style: const TextStyle(color: _txtPri, fontWeight: FontWeight.w600)),
      backgroundColor: _navy,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      duration: const Duration(seconds: 2),
    ));
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  BUILD
  // ══════════════════════════════════════════════════════════════════════════
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: Stack(children: [
        _body(),
        if (_isLoading)  _loadingOverlay(),
        if (_loadFailed) _errorOverlay(),
      ]),
    );
  }

  Widget _body() => SafeArea(
    child: Column(children: [

      // ── HEADER ────────────────────────────────────────────────────────────
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
        child: Row(children: [
          GestureDetector(
            onTap: widget.onBack ?? () => Navigator.maybePop(context),
            child: Container(
              width: 37, height: 37,
              decoration: BoxDecoration(
                  color: _orange, borderRadius: BorderRadius.circular(4)),
              child: const Icon(Icons.arrow_back_ios_new_rounded,
                  color: Colors.white, size: 16),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(widget.tournamentTitle,
                    style: const TextStyle(
                        color: _orange, fontSize: 16,
                        fontWeight: FontWeight.w900, letterSpacing: 0.8)),
                Text('Prize Pool: ${widget.prizePool}',
                    style: const TextStyle(
                        color: _cyan, fontSize: 11,
                        fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ]),
      ),

      const SizedBox(height: 12),

      // ── MAIN TABLE ────────────────────────────────────────────────────────
      Expanded(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
          child: Container(
            decoration: BoxDecoration(
              color: _card,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.06)),
            ),
            child: Column(children: [
              const SizedBox(height: 14),

              // Bot player row
              _playerRow(
                name:    widget.opponentName,
                avatar:  widget.opponentAvatar,
                pieces:  _botPieces,
                isBot:   true,
                active:  _currentPlayer == 1 && !_isTerminal,
                isBusy:  _botBusy,
              ),

              const SizedBox(height: 10),

              // Board
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: AspectRatio(
                    aspectRatio: 1,
                    child: _DraughtsBoardWidget(
                      board:        _board,
                      selectedSq:   _selectedSq,
                      legalMoves:   _legalMoves,
                      captureMoves: _captureMoves,
                      lastFrom:     _lastFrom,
                      lastTo:       _lastTo,
                      onTap:        _onSquareTap,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 10),

              // Status
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: Container(
                  key: ValueKey(_statusMsg),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: _surface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: _currentPlayer == 0 && !_botBusy
                          ? _cyan.withOpacity(0.4)
                          : _border,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (_botBusy)
                        const SizedBox(
                          width: 12, height: 12,
                          child: CircularProgressIndicator(
                              color: _cyan, strokeWidth: 2),
                        ),
                      if (_botBusy) const SizedBox(width: 8),
                      Text(_statusMsg,
                          style: const TextStyle(
                              color: _txtPri, fontSize: 13,
                              fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 10),

              // Human player row
              _playerRow(
                name:   widget.playerName,
                avatar: widget.playerAvatar,
                pieces: _humanPieces,
                isBot:  false,
                active: _currentPlayer == 0 && !_isTerminal,
                isBusy: false,
              ),

              const SizedBox(height: 14),
            ]),
          ),
        ),
      ),
    ]),
  );

  Widget _playerRow({
    required String name,
    required String avatar,
    required int pieces,
    required bool isBot,
    required bool active,
    required bool isBusy,
  }) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16),
    child: Row(children: [
      AnimatedBuilder(
        animation: _glowAnim,
        builder: (_, __) => Container(
          width: 44, height: 44,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: active
                  ? _cyan.withOpacity(_glowAnim.value)
                  : _border,
              width: active ? 2.5 : 1.5,
            ),
            color: _surface,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(9),
            child: avatar.isNotEmpty
                ? Image.network(avatar, fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => _avatarInitial(name))
                : _avatarInitial(name),
          ),
        ),
      ),
      const SizedBox(width: 10),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(name,
                style: const TextStyle(
                    color: _txtPri, fontSize: 13,
                    fontWeight: FontWeight.w700)),
            if (isBusy)
              const Text('thinking…',
                  style: TextStyle(color: _cyan, fontSize: 11)),
          ],
        ),
      ),
      // Piece count + colour indicator
      Row(children: [
        Container(
          width: 14, height: 14,
          decoration: BoxDecoration(
            color: isBot ? _botPiece : _humanPiece,
            shape: BoxShape.circle,
            border: Border.all(
                color: isBot ? _border : const Color(0xFFCBD5E1)),
          ),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: _surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
                color: pieces == 0 ? _orange : _border),
          ),
          child: Text('$pieces',
              style: TextStyle(
                  color: pieces == 0 ? _orange : _txtPri,
                  fontSize: 16, fontWeight: FontWeight.w900)),
        ),
      ]),
    ]),
  );

  Widget _avatarInitial(String name) => Center(
    child: Text(
      name.isNotEmpty ? name[0].toUpperCase() : '?',
      style: const TextStyle(
          color: _cyan, fontSize: 18, fontWeight: FontWeight.w900),
    ),
  );

  Widget _loadingOverlay() => Container(
    color: Colors.black87,
    child: const Center(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        CircularProgressIndicator(color: _cyan, strokeWidth: 3),
        SizedBox(height: 16),
        Text('Setting up the board…',
            style: TextStyle(color: _cyan, fontSize: 16,
                fontWeight: FontWeight.w700)),
      ]),
    ),
  );

  Widget _errorOverlay() => Container(
    color: Colors.black87,
    child: Center(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.wifi_off_rounded, color: _orange, size: 48),
        const SizedBox(height: 12),
        const Text('Could not reach game server',
            style: TextStyle(color: Colors.white, fontSize: 15)),
        const SizedBox(height: 20),
        GestureDetector(
          onTap: _startGame,
          child: Container(
            padding: const EdgeInsets.symmetric(
                horizontal: 32, vertical: 14),
            decoration: BoxDecoration(
                color: _orange,
                borderRadius: BorderRadius.circular(12)),
            child: const Text('Retry',
                style: TextStyle(color: Colors.white,
                    fontSize: 15, fontWeight: FontWeight.w800)),
          ),
        ),
      ]),
    ),
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  DRAUGHTS BOARD WIDGET
// ═════════════════════════════════════════════════════════════════════════════

class _DraughtsBoardWidget extends StatelessWidget {
  final List<int> board;
  final int       selectedSq;
  final List<int> legalMoves;
  final List<int> captureMoves;
  final int       lastFrom;
  final int       lastTo;
  final ValueChanged<int> onTap;

  const _DraughtsBoardWidget({
    required this.board,
    required this.selectedSq,
    required this.legalMoves,
    required this.captureMoves,
    required this.lastFrom,
    required this.lastTo,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF6B3A1F), width: 3),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.5),
              blurRadius: 16, offset: const Offset(0, 6)),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: GridView.builder(
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: _kBoardSize,
          ),
          itemCount: _kCells,
          itemBuilder: (ctx, idx) {
            final row = idx ~/ _kBoardSize;
            final col = idx % _kBoardSize;
            final isDark   = (row + col) % 2 == 1;
            final cell     = board[idx];
            final isSel    = selectedSq == idx;
            final isMove   = legalMoves.contains(idx);
            final isCap    = captureMoves.contains(idx);
            final isLast   = lastFrom == idx || lastTo == idx;

            Color sqColor = isDark ? _darkSquare : _lightSquare;
            if (isSel)  sqColor = _darkSquare.withRed(80);
            if (isLast) sqColor = isDark
                ? const Color(0xFF3D2B1F)
                : const Color(0xFFE8C87A);

            return GestureDetector(
              onTap: isDark ? () => onTap(idx) : null,
              child: Container(
                color: sqColor,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    if (isMove && cell == _kEmpty && isDark)
                      Container(
                        width: 10, height: 10,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isCap
                              ? _captureHint.withOpacity(0.7)
                              : _moveHint.withOpacity(0.6),
                        ),
                      ),
                    if (cell != _kEmpty)
                      _PieceWidget(
                        cell:     cell,
                        selected: isSel,
                        isMove:   isMove && cell != _kEmpty,
                      ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

// ── PIECE WIDGET ──────────────────────────────────────────────────────────────
class _PieceWidget extends StatelessWidget {
  final int  cell;
  final bool selected;
  final bool isMove;

  const _PieceWidget({
    required this.cell,
    required this.selected,
    required this.isMove,
  });

  @override
  Widget build(BuildContext context) {
    final isHuman = cell == _kHumanMan || cell == _kHumanKing;
    final isKing  = cell == _kHumanKing || cell == _kBotKing;
    final base    = isHuman ? _humanPiece : _botPiece;
    final ring    = selected ? _selectRing : (isHuman
        ? const Color(0xFFCBD5E1)
        : const Color(0xFF4A2A10));

    return AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      width:  selected ? 28 : 24,
      height: selected ? 28 : 24,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: base,
        border: Border.all(color: ring, width: selected ? 2.5 : 1.5),
        boxShadow: [
          BoxShadow(
              color: selected
                  ? _selectRing.withOpacity(0.5)
                  : Colors.black.withOpacity(0.4),
              blurRadius: selected ? 8 : 4),
        ],
      ),
      child: isKing
          ? Center(
              child: Text('♛',
                  style: TextStyle(
                      fontSize: 12,
                      color: isHuman
                          ? const Color(0xFF1A0A00)
                          : const Color(0xFFFFD700))),
            )
          : null,
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  GAME OVER DIALOG
// ═════════════════════════════════════════════════════════════════════════════
class _GameOverDialog extends StatelessWidget {
  final bool   isWinner;
  final int    humanPieces;
  final int    botPieces;
  final String prizePool;
  final String opponentName;
  final VoidCallback onClose;
  final VoidCallback onRematch;

  const _GameOverDialog({
    required this.isWinner,
    required this.humanPieces,
    required this.botPieces,
    required this.prizePool,
    required this.opponentName,
    required this.onClose,
    required this.onRematch,
  });

  @override
  Widget build(BuildContext context) => Dialog(
    backgroundColor: Colors.transparent,
    child: Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: _navy,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(
            color: isWinner
                ? _cyan.withOpacity(0.5)
                : _orange.withOpacity(0.4)),
      ),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text(isWinner ? '🏆 You Win!' : '💀 You Lost',
            style: const TextStyle(
                color: _txtPri, fontSize: 26,
                fontWeight: FontWeight.w900)),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _PieceBadge(
                label: 'You',
                count: humanPieces,
                color: isWinner ? _green : _orange,
                isHuman: true),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Text('vs',
                  style: TextStyle(color: _txtSub, fontSize: 14)),
            ),
            _PieceBadge(
                label: 'Bot',
                count: botPieces,
                color: !isWinner ? _green : _orange,
                isHuman: false),
          ],
        ),
        const SizedBox(height: 8),
        if (isWinner)
          Text('Prize: $prizePool',
              style: const TextStyle(
                  color: _orange, fontSize: 18,
                  fontWeight: FontWeight.w700)),
        const SizedBox(height: 24),
        Row(children: [
          Expanded(
            child: GestureDetector(
              onTap: onRematch,
              child: Container(
                height: 48,
                decoration: BoxDecoration(
                    color: _surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: _border)),
                child: const Center(
                  child: Text('Rematch',
                      style: TextStyle(
                          color: _txtPri, fontSize: 14,
                          fontWeight: FontWeight.w700)),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: GestureDetector(
              onTap: onClose,
              child: Container(
                height: 48,
                decoration: BoxDecoration(
                    color: _orange,
                    borderRadius: BorderRadius.circular(14)),
                child: const Center(
                  child: Text('Back to Lobby',
                      style: TextStyle(
                          color: Colors.white, fontSize: 14,
                          fontWeight: FontWeight.w800)),
                ),
              ),
            ),
          ),
        ]),
      ]),
    ),
  );
}

class _PieceBadge extends StatelessWidget {
  final String  label;
  final int     count;
  final Color   color;
  final bool    isHuman;

  const _PieceBadge({
    required this.label,
    required this.count,
    required this.color,
    required this.isHuman,
  });

  @override
  Widget build(BuildContext context) => Column(children: [
    Row(mainAxisSize: MainAxisSize.min, children: [
      Container(
        width: 16, height: 16,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: isHuman ? _humanPiece : _botPiece,
          border: Border.all(
              color: isHuman
                  ? const Color(0xFFCBD5E1)
                  : const Color(0xFF4A2A10)),
        ),
      ),
      const SizedBox(width: 6),
      Text('$count',
          style: TextStyle(
              color: color, fontSize: 28,
              fontWeight: FontWeight.w900)),
    ]),
    Text(label,
        style: const TextStyle(color: _txtSub, fontSize: 12)),
  ]);
}
