import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:gamearn/config/api_config.dart';
import '../../theme.dart';
import '../../utils/error_utils.dart';
import '../../services/sound_service.dart';
import '../../services/socket_service.dart';

// ── Palette (matches Gamearn design tokens) ───────────────────────────────────
const _bg = Color(0xFF0B0E1A);
const _navy = Color(0xFF0D1B4B);
const _card = Color(0xFF0F172A);
const _surface = Color(0xFF1E293B);
const _cyan = Color(0xFF22D1EE);
const _orange = Color(0xFFFF5E00);
const _green = Color(0xFF22C55E);
const _txtPri = Color(0xFFF1F5F9);
const _txtSub = Color(0xFF94A3B8);
const _border = Color(0xFF334155);

// ── Board constants (display only — server validates) ─────────────────────────
const _kHoles = 12;
const _kHolesEach = 6;

// ── Practice API service ──────────────────────────────────────────────────────

class _PracticeAyoService {
  static String get _base => '${ApiConfig.nodeBaseUrl}/api/v1/practice/ayo';

  String? sessionId;

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
    final res = await http
        .post(
          Uri.parse('$_base/start'),
          headers: await _authHeaders(),
          body: jsonEncode({'playerRating': playerRating}),
        )
        .timeout(const Duration(seconds: 10));
    if (res.statusCode != 200) throw Exception('Failed to start practice game');
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    final data = body['data'] as Map<String, dynamic>;
    sessionId = data['sessionId'] as String;
    return data;
  }

  Future<Map<String, dynamic>> movePiece(int pitIndex) async {
    final res = await http
        .post(
          Uri.parse('$_base/move'),
          headers: await _authHeaders(),
          body: jsonEncode({'sessionId': sessionId, 'pitIndex': pitIndex}),
        )
        .timeout(const Duration(seconds: 15));
    if (res.statusCode == 404) throw Exception('Session expired');
    if (res.statusCode != 200) {
      final err = jsonDecode(res.body);
      throw Exception(err['error']?['message'] ?? 'Move failed');
    }
    return jsonDecode(res.body)['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getState() async {
    final res = await http
        .get(
          Uri.parse('$_base/state/${Uri.encodeComponent(sessionId!)}'),
          headers: await _authHeaders(),
        )
        .timeout(const Duration(seconds: 10));
    if (res.statusCode == 404) throw Exception('Session expired');
    if (res.statusCode != 200) throw Exception('Failed to get state');
    return jsonDecode(res.body)['data'] as Map<String, dynamic>;
  }

  Future<void> deleteSession() async {
    if (sessionId == null) return;
    try {
      await http
          .delete(
            Uri.parse('$_base/${Uri.encodeComponent(sessionId!)}'),
          )
          .timeout(const Duration(seconds: 5));
    } catch (_) {}
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  AYO GAME SCREEN
// ═════════════════════════════════════════════════════════════════════════════
class AyoGameScreen extends StatefulWidget {
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

  const AyoGameScreen({
    super.key,
    required this.roomId,
    required this.playerId,
    this.playerName = 'You',
    this.playerAvatar = '',
    this.opponentName = 'Gamearn Bot',
    this.opponentAvatar = '',
    this.tournamentTitle = 'AYÒ TOURNAMENT',
    this.prizePool = '₦70,000',
    this.playerRating = 1200,
    this.onBack,
  });

  @override
  State<AyoGameScreen> createState() => _AyoGameScreenState();
}

class _AyoGameScreenState extends State<AyoGameScreen>
    with TickerProviderStateMixin
    implements GameEventHandler {
  // ── Animations ────────────────────────────────────────────────────────────
  late AnimationController _glowCtrl;
  late Animation<double> _glowAnim;

  // ── Game state (from server) ──────────────────────────────────────────────
  List<int> _board = List.filled(_kHoles, 0);
  List<int> _stores = [0, 0];
  int _currentPlayerIndex = 0;
  bool _isTerminal = false;

  int _selectedHole = -1;
  bool _botBusy = false;
  bool _isLoading = true;
  bool _loadFailed = false;
  String _statusMsg = 'Loading…';

  // Turn timeout (auto-move so an idle player never stalls the game)
  Timer? _turnTimer;
  int _turnTimerSec = 20;

  // Last move highlight
  int _lastPit = -1;
  int _lastLandPit = -1;
  Timer? _highlightTimer;

  // Service
  final _PracticeAyoService _svc = _PracticeAyoService();

  // Multiplayer (socket)
  bool _isMp = false;
  String _roomId = '';
  int _humanIndex = 0;
  bool _opponentGone = false;
  bool _gameOverShown = false;
  GamearnSocketService? _socket;

  // ── Init ──────────────────────────────────────────────────────────────────
  @override
  void initState() {
    super.initState();
    _glowCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900))
      ..repeat(reverse: true);
    _glowAnim = Tween(begin: 0.6, end: 1.0)
        .animate(CurvedAnimation(parent: _glowCtrl, curve: Curves.easeInOut));
    _isMp = widget.roomId.isNotEmpty && widget.roomId != 'practice_bot';
    if (_isMp) {
      _roomId = widget.roomId;
      _humanIndex = 0;
      _isLoading = false;
      _statusMsg = 'Waiting for opponent…';
      _socket = GamearnSocketService();
      _socket!.connect(this);
    } else {
      _startGame();
    }
  }

  @override
  void dispose() {
    if (_isMp) {
      _socket?.disconnect();
    } else {
      _svc.deleteSession();
    }
    _glowCtrl.dispose();
    _highlightTimer?.cancel();
    _turnTimer?.cancel();
    super.dispose();
  }

  // ── Start game ────────────────────────────────────────────────────────────
  Future<void> _startGame() async {
    setState(() {
      _isLoading = true;
      _loadFailed = false;
    });
    _turnTimer?.cancel();

    try {
      final data = await _svc.startGame(playerRating: widget.playerRating);

      if (!mounted) return;

      final board = List<int>.from(data['board'] as List);

      setState(() {
        _board = board;
        _stores = List<int>.from(data['stores'] as List);
        _currentPlayerIndex = data['currentPlayerIndex'] as int;
        _selectedHole = -1;
        _lastPit = -1;
        _lastLandPit = -1;
        _isTerminal = false;
        _isLoading = false;
        _statusMsg = 'Your turn — pick a pit';
      });
      _startTurnTimer();
    } catch (e) {
      if (mounted)
        setState(() {
          _isLoading = false;
          _loadFailed = true;
        });
    }
  }

  // ── Human pit tap ─────────────────────────────────────────────────────────
  void _onHoleTap(int holeIndex) {
    // holeIndex is 0–5 (relative to the human's own row)
    if (!_isMyTurn || _botBusy || _isTerminal) return;
    if (_board[_myPits[holeIndex]] == 0) {
      _toast('Empty pit — pick another');
      return;
    }
    setState(() => _selectedHole = holeIndex);
  }

  // ── Execute human move ────────────────────────────────────────────────────
  Future<void> _executeHumanMove() async {
    if (_selectedHole < 0 || !_isMyTurn || _botBusy) return;

    final hole = _selectedHole;
    _turnTimer?.cancel();
    setState(() {
      _selectedHole = -1;
      _botBusy = true;
      _statusMsg = 'Sowing…';
    });

    HapticFeedback.lightImpact();

    if (_isMp) {
      setState(() => _statusMsg = 'Move sent…');
      _socket?.sowPit(_myPits[hole]);
      _highlightLastLand();
      return;
    }

    try {
      final data = await _svc.movePiece(hole);
      if (!mounted) return;

      final board = List<int>.from(data['board'] as List);
      final lastMove = data['lastMove'] as Map<String, dynamic>?;
      final captureTotal = (lastMove?['captureTotal'] as num?)?.toInt() ?? 0;
      final isCapture = captureTotal > 0;
      SoundService.instance
          .play(isCapture ? SoundType.capture : SoundType.pieceMove);

      setState(() {
        _board = board;
        _stores = List<int>.from(data['stores'] as List);
        _currentPlayerIndex = data['currentPlayerIndex'] as int;
        _lastPit = hole;
        _lastLandPit = (lastMove?['lastPit'] as num?)?.toInt() ?? -1;
      });

      _highlightLastLand();

      final botActions = data['botActions'] as List? ?? [];
      final gameOver = data['gameOver'] == true;

      if (botActions.isNotEmpty) {
        await _animateBotActions(botActions);
      }

      if (gameOver || _isTerminal) {
        _showGameOver(
          winner: data['winner'] as String?,
          finalScores: data['finalScores'] as Map<String, dynamic>?,
        );
        return;
      }

      if (!mounted) return;
      setState(() {
        _botBusy = false;
        _statusMsg = 'Your turn — pick a pit';
      });
      _startTurnTimer();
    } catch (e) {
      if (!mounted) return;
      showAppError(context, e);
      setState(() {
        _botBusy = false;
        _statusMsg = 'Your turn — pick a pit';
      });
      _startTurnTimer();
    }
  }

  // ── Animate bot actions ───────────────────────────────────────────────────
  Future<void> _animateBotActions(List<dynamic> actions) async {
    for (final action in actions) {
      if (!mounted || _isTerminal) break;
      final a = action as Map<String, dynamic>;

      final pitIdx = (a['pitIndex'] as num).toInt();
      final lastPit = (a['lastPit'] as num).toInt();
      final capTotal = (a['captureTotal'] as num).toInt();
      final isCap = capTotal > 0;

      setState(() {
        _lastPit = pitIdx;
        _lastLandPit = lastPit;
        _statusMsg = '${widget.opponentName} is thinking…';
      });
      SoundService.instance
          .play(isCap ? SoundType.capture : SoundType.pieceMove);

      await Future.delayed(const Duration(milliseconds: 500));

      if (a['isWin'] == true) {
        return;
      }
    }
  }

  void _highlightLastLand() {
    _highlightTimer?.cancel();
    _highlightTimer = Timer(const Duration(milliseconds: 800), () {
      if (mounted)
        setState(() {
          _lastPit = -1;
          _lastLandPit = -1;
        });
    });
  }

  // ── Game over ─────────────────────────────────────────────────────────────
  void _showGameOver({String? winner, Map<String, dynamic>? finalScores}) {
    if (!mounted || _gameOverShown) return;
    _gameOverShown = true;
    _turnTimer?.cancel();
    setState(() {
      _isTerminal = true;
      _botBusy = false;
    });

    // Server decides the winner (its finalScores include leftover board
    // seeds); fall back to store comparison only if no winner is given.
    final isWinner = winner != null
        ? _isMe(winner)
        : _stores[_isMp ? _humanIndex : 0] >
            _stores[_isMp ? 1 - _humanIndex : 1];
    final humanScore = _isMp
        ? _stores[_humanIndex]
        : (finalScores?['player0'] as num?)?.toInt() ?? _stores[0];
    final botScore = _isMp
        ? _stores[1 - _humanIndex]
        : (finalScores?['player1'] as num?)?.toInt() ?? _stores[1];

    SoundService.instance
        .play(isWinner ? SoundType.gameWin : SoundType.gameLose);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => _GameOverDialog(
        isWinner: isWinner,
        humanScore: humanScore,
        botScore: botScore,
        prizePool: widget.prizePool,
        opponentName: widget.opponentName,
        onClose: widget.onBack ?? () => Navigator.maybePop(context),
        onRematch: () {
          Navigator.pop(context);
          if (_isMp) {
            _socket?.requestRematch();
          } else {
            _startGame();
          }
        },
      ),
    );
  }

  // ── Socket multiplayer ────────────────────────────────────────────────

  List<int> get _myPits =>
      _humanIndex == 0 ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11];

  List<int> get _oppPits =>
      _humanIndex == 0 ? [6, 7, 8, 9, 10, 11] : [0, 1, 2, 3, 4, 5];

  bool get _isMyTurn => _currentPlayerIndex == _humanIndex;

  String _mpStatus() {
    if (_opponentGone) return 'Opponent disconnected — waiting…';
    if (_isTerminal) return 'Game Over';
    return _isMyTurn
        ? 'Your turn — pick a pit'
        : '${widget.opponentName} is thinking…';
  }

  void _applyServerState(Map<String, dynamic> gs) {
    if (!mounted) return;
    final players = gs['players'] as List? ?? [];
    final myUid = widget.playerId;
    var hi = 0;
    if (myUid.isNotEmpty) {
      for (int i = 0; i < players.length; i++) {
        if ((players[i] as Map)['uid'] == myUid) {
          hi = i;
          break;
        }
      }
    }
    final board = List<int>.from(gs['board'] as List? ?? const []);
    final stores = List<int>.from(gs['stores'] as List? ?? [0, 0]);
    final current = gs['currentPlayerIndex'] as int? ?? 0;

    setState(() {
      _board = board;
      _stores = stores;
      _currentPlayerIndex = current;
      _humanIndex = hi;
      _selectedHole = -1;
      _lastPit = -1;
      _lastLandPit = -1;
      _isTerminal = false;
      _isLoading = false;
      _loadFailed = false;
      _botBusy = !_isMyTurn;
      _statusMsg = _mpStatus();
    });
  }

  @override
  void onConnected() {
    if (_roomId.isNotEmpty) _socket?.joinRoom(_roomId, onAck: (_) {});
  }

  @override
  void onMatchFound(
      String roomId, Map<String, dynamic> opponent, int prizePool) {
    if (!mounted) return;
    _roomId = roomId.isNotEmpty ? roomId : _roomId;
    setState(() {});
  }

  @override
  void onMatchStarted(
      Map<String, dynamic> gameState, int entryFee, int prizePool) {
    _applyServerState(gameState);
  }

  @override
  void onMoveMade(String playerUid, Map<String, dynamic> move,
      Map<String, dynamic> gameState, bool isGameOver) {
    if (!mounted) return;
    _applyServerState(gameState);
    if (isGameOver && !_gameOverShown) _showGameOver(winner: playerUid);
  }

  @override
  void onGameOver(String? winnerUid, int prize, String result) {
    if (!mounted || _gameOverShown) return;
    _showGameOver(winner: winnerUid);
  }

  @override
  void onGameStateSync(Map<String, dynamic> gameState) {
    _applyServerState(gameState);
  }

  @override
  void onPlayerJoined(String uid, String displayName) {}

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
    if (!mounted || _gameOverShown) return;
    _showGameOver(winner: winnerUid);
  }

  @override
  void onRematchRequested() {
    if (!mounted || !_isMp) return;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        backgroundColor: _card,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(20.r)),
        title: const Text('Rematch',
            style: TextStyle(color: _txtPri, fontWeight: FontWeight.w800)),
        content: Text('${widget.opponentName} wants a rematch',
            style: const TextStyle(color: _txtSub)),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _socket?.acceptRematch();
            },
            child: const Text('Accept', style: TextStyle(color: _cyan)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Decline', style: TextStyle(color: _txtSub)),
          ),
        ],
      ),
    );
  }

  @override
  void onRematchAccepted(String newRoomId) {
    if (!mounted || !_isMp) return;
    _roomId = newRoomId;
    _gameOverShown = false;
    _isTerminal = false;
    _opponentGone = false;
    setState(() {
      _board = List.filled(_kHoles, 0);
      _stores = [0, 0];
      _statusMsg = 'Waiting for opponent…';
    });
    _socket?.joinRoom(newRoomId, onAck: (_) {});
  }

  @override
  void onMatchAborted(String reason) {
    if (!mounted) return;
    showAppError(context, reason);
    Navigator.maybePop(context);
  }

  @override
  void onError(String message) {
    if (!mounted) return;
    setState(() {
      _isLoading = false;
      _statusMsg = 'Connection lost — retrying…';
    });
    showAppError(context, message);
  }

  @override
  void onDisconnected(String reason) {
    if (mounted) setState(() {});
  }

  /// True when [uid] refers to this screen's human player.
  /// Practice mode falls back to 'practice_anon' when Firebase can't
  /// verify the token server-side, so treat it as "me".
  bool _isMe(String? uid) {
    if (uid == null) return false;
    if (uid == widget.playerId) return true;
    if (uid == 'practice_anon') return true;
    return false;
  }

  // ── Turn timeout ──────────────────────────────────────────────────────────
  void _startTurnTimer() {
    _turnTimer?.cancel();
    if (!mounted || _isMp || _isTerminal || _botBusy || !_isMyTurn) return;
    _turnTimerSec = 20;
    _turnTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      if (_turnTimerSec <= 1) {
        t.cancel();
        _forceMoveOnTimeout();
        return;
      }
      setState(() {
        _turnTimerSec--;
        if (_statusMsg.startsWith('Your turn')) {
          _statusMsg = 'Your turn — pick a pit · ${_turnTimerSec}s';
        }
      });
    });
  }

  void _forceMoveOnTimeout() {
    if (!mounted || _isMp || _botBusy || _isTerminal || !_isMyTurn) return;
    for (int i = 0; i < _kHolesEach; i++) {
      if (_board[_myPits[i]] > 0) {
        _selectedHole = i;
        _executeHumanMove();
        return;
      }
    }
  }

  void _toast(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg,
          style: const TextStyle(color: _txtPri, fontWeight: FontWeight.w600)),
      backgroundColor: _navy,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.r)),
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
        if (_isLoading) _loadingOverlay(),
        if (_loadFailed) _errorOverlay(),
      ]),
    );
  }

  Widget _body() => SafeArea(
        child: Column(children: [
          // ── HEADER ────────────────────────────────────────────────────────────
          Padding(
            padding: EdgeInsets.fromLTRB(16.w, 12.h, 16.w, 0),
            child: Row(children: [
              GestureDetector(
                onTap: () => Navigator.pop(context),
                child: Icon(Icons.close_rounded,
                    color: const Color(0xFFF1F5F9), size: 20.w),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.tournamentTitle,
                        style: TextStyle(
                            color: _orange,
                            fontSize: 16.sp,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.8)),
                    Text('Prize Pool: ${widget.prizePool}',
                        style: TextStyle(
                            color: _cyan,
                            fontSize: 11.sp,
                            fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
            ]),
          ),

          SizedBox(height: 12.h),

          // ── MAIN TABLE ────────────────────────────────────────────────────────
          Expanded(
            child: Padding(
              padding: EdgeInsets.fromLTRB(12.w, 0, 12.w, 12.h),
              child: Container(
                decoration: BoxDecoration(
                  color: _card,
                  borderRadius: BorderRadius.circular(16.r),
                  border: Border.all(color: Colors.white.withOpacity(0.06)),
                ),
                child: Column(children: [
                  SizedBox(height: 16.h),

                  // Bot player info
                  _playerRow(
                    name: widget.opponentName,
                    avatar: widget.opponentAvatar,
                    score: _stores[1 - _humanIndex],
                    isBot: true,
                    active: !_isMyTurn && !_isTerminal,
                    thinking: _botBusy,
                  ),

                  SizedBox(height: 12.h),

                  // Ayo board
                  Expanded(
                    child: Padding(
                      padding: EdgeInsets.symmetric(horizontal: 12.w),
                      child: LayoutBuilder(
                        builder: (context, constraints) {
                          final side =
                              constraints.maxWidth < constraints.maxHeight
                                  ? constraints.maxWidth
                                  : constraints.maxHeight;
                          return Center(
                            child: SizedBox.square(
                              dimension: side,
                              child: _AyoBoardWidget(
                                board: _board,
                                topHoles: _oppPits.reversed.toList(),
                                bottomHoles: _myPits,
                                isMyTurn: _isMyTurn,
                                selectedHole: _selectedHole,
                                lastPit: _lastPit,
                                lastLandPit: _lastLandPit,
                                botBusy: _botBusy,
                                onHoleTap: _onHoleTap,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),

                  SizedBox(height: 12.h),

                  // Status message
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 300),
                    child: Container(
                      key: ValueKey(_statusMsg),
                      padding:
                          EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
                      decoration: BoxDecoration(
                        color: _surface,
                        borderRadius: BorderRadius.circular(20.r),
                        border: Border.all(
                          color: _isMyTurn && !_botBusy
                              ? _cyan.withOpacity(0.4)
                              : _border,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (_botBusy)
                            SizedBox(
                              width: 12.w,
                              height: 12.h,
                              child: CircularProgressIndicator(
                                  color: _cyan, strokeWidth: 2),
                            ),
                          if (_botBusy) SizedBox(width: 8.w),
                          Text(_statusMsg,
                              style: TextStyle(
                                  color: _txtPri,
                                  fontSize: 13.sp,
                                  fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ),

                  SizedBox(height: 12.h),

                  // Confirm button (only when human has selected a hole)
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: _selectedHole >= 0
                        ? GestureDetector(
                            key: const ValueKey('confirm'),
                            onTap: _executeHumanMove,
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 4),
                              padding: EdgeInsets.symmetric(
                                  horizontal: 32.w, vertical: 12.h),
                              decoration: BoxDecoration(
                                color: _cyan,
                                borderRadius: BorderRadius.circular(24.r),
                                boxShadow: [
                                  BoxShadow(
                                      color: _cyan.withOpacity(0.4),
                                      blurRadius: 12)
                                ],
                              ),
                              child: Text(
                                'Sow from pit ${_selectedHole + 1}  '
                                '(${_board[_myPits[_selectedHole]]} seeds)',
                                style: TextStyle(
                                    color: _bg,
                                    fontSize: 13.sp,
                                    fontWeight: FontWeight.w800),
                              ),
                            ),
                          )
                        : SizedBox(key: const ValueKey('empty'), height: 0),
                  ),

                  SizedBox(height: 12.h),

                  // Human player info
                  _playerRow(
                    name: widget.playerName,
                    avatar: widget.playerAvatar,
                    score: _stores[_humanIndex],
                    isBot: false,
                    active: _isMyTurn && !_isTerminal,
                    thinking: false,
                  ),

                  SizedBox(height: 16.h),
                ]),
              ),
            ),
          ),
        ]),
      );

  Widget _playerRow({
    required String name,
    required String avatar,
    required int score,
    required bool isBot,
    required bool active,
    bool thinking = false,
  }) =>
      Padding(
        padding: EdgeInsets.symmetric(horizontal: 16.w),
        child: Row(
          children: [
            // Avatar
            AnimatedBuilder(
              animation: _glowAnim,
              builder: (_, __) => Container(
                width: 44.w,
                height: 44.h,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10.r),
                  border: Border.all(
                    color:
                        active ? _cyan.withOpacity(_glowAnim.value) : _border,
                    width: active ? 2.5 : 1.5,
                  ),
                  color: _surface,
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(9.r),
                  child: avatar.isNotEmpty
                      ? Image.network(avatar,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _avatarInitial(name))
                      : _avatarInitial(name),
                ),
              ),
            ),
            SizedBox(width: 10.w),
            // Name + turn indicator
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name,
                      style: TextStyle(
                          color: _txtPri,
                          fontSize: 13.sp,
                          fontWeight: FontWeight.w700)),
                  if (thinking)
                    Text('thinking…',
                        style: TextStyle(color: _cyan, fontSize: 11.sp))
                  else if (active)
                    Text('Your turn',
                        style: TextStyle(color: _cyan, fontSize: 11.sp)),
                ],
              ),
            ),
            // Score badge
            Container(
              padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 6.h),
              decoration: BoxDecoration(
                color: _surface,
                borderRadius: BorderRadius.circular(20.r),
                border: Border.all(
                  color: _border,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.grain_rounded, color: _cyan, size: 14.w),
                  SizedBox(width: 6.w),
                  Text('$score',
                      style: TextStyle(
                          color: _txtPri,
                          fontSize: 16.sp,
                          fontWeight: FontWeight.w900)),
                ],
              ),
            ),
          ],
        ),
      );

  Widget _avatarInitial(String name) => Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : '?',
          style: TextStyle(
              color: _cyan, fontSize: 18.sp, fontWeight: FontWeight.w900),
        ),
      );

  Widget _loadingOverlay() => Container(
        color: Colors.black87,
        child: Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const CircularProgressIndicator(color: _cyan, strokeWidth: 3),
            SizedBox(height: 16.h),
            Text('Setting up the board…',
                style: TextStyle(
                    color: _cyan,
                    fontSize: 16.sp,
                    fontWeight: FontWeight.w700)),
          ]),
        ),
      );

  Widget _errorOverlay() => Container(
        color: Colors.black87,
        child: Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.wifi_off_rounded, color: _orange, size: 48.w),
            SizedBox(height: 12.h),
            Text('No internet connection',
                style: TextStyle(color: Colors.white, fontSize: 15.sp)),
            SizedBox(height: 6.h),
            Text('Check your network and try again.',
                style: TextStyle(color: Colors.white70, fontSize: 13.sp)),
            SizedBox(height: 20.h),
            GestureDetector(
              onTap: _startGame,
              child: Container(
                padding: EdgeInsets.symmetric(horizontal: 32.w, vertical: 14.h),
                decoration: BoxDecoration(
                    color: _orange, borderRadius: BorderRadius.circular(12.r)),
                child: Text('Retry',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 15.sp,
                        fontWeight: FontWeight.w800)),
              ),
            ),
          ]),
        ),
      );
}

// ═════════════════════════════════════════════════════════════════════════════
//  AYO BOARD WIDGET
// ═════════════════════════════════════════════════════════════════════════════
class _AyoBoardWidget extends StatelessWidget {
  final List<int> board;
  final List<int> topHoles;
  final List<int> bottomHoles;
  final bool isMyTurn;
  final int selectedHole;
  final int lastPit;
  final int lastLandPit;
  final bool botBusy;
  final ValueChanged<int> onHoleTap;

  const _AyoBoardWidget({
    required this.board,
    required this.topHoles,
    required this.bottomHoles,
    required this.isMyTurn,
    required this.selectedHole,
    required this.lastPit,
    required this.lastLandPit,
    required this.botBusy,
    required this.onHoleTap,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (ctx, constraints) {
      final w = constraints.maxWidth;
      final h = constraints.maxHeight;
      final holeSize = ((w - 24) / 6).clamp(30.0, 56.0);
      return Container(
        width: w,
        height: h,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF6A2F18), Color(0xFF2A0F09), Color(0xFF140B0B)],
          ),
          borderRadius: BorderRadius.circular(22.r),
          border: Border.all(color: const Color(0xFFD8892D), width: 2.2),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withOpacity(0.5),
                blurRadius: 20,
                offset: const Offset(0, 8)),
            BoxShadow(
              color: const Color(0xFFD8892D).withOpacity(0.18),
              blurRadius: 12,
            ),
          ],
        ),
        child: Stack(children: [
          Positioned.fill(
            child: IgnorePointer(
              child: CustomPaint(painter: _AyoWoodGrainPainter()),
            ),
          ),
          Align(
            alignment: Alignment.center,
            child: IgnorePointer(
              child: Container(
                width: w * 0.28,
                height: w * 0.28,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const RadialGradient(colors: [
                    Color(0xFF71311B),
                    Color(0xFF210B07),
                    Color(0xFF08090D),
                  ]),
                  border: Border.all(color: const Color(0xFFD8892D), width: 2),
                  boxShadow: const [
                    BoxShadow(
                        color: Colors.black87,
                        blurRadius: 12,
                        offset: Offset(0, 6)),
                  ],
                ),
                alignment: Alignment.center,
                child: Text('AYỌ',
                    style: TextStyle(
                        color: const Color(0xFFFFB347),
                        fontSize: 18.sp,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.2)),
              ),
            ),
          ),
          Align(
            alignment: const Alignment(0, -0.92),
            child: IgnorePointer(
              child: Container(
                padding: EdgeInsets.symmetric(horizontal: 18.w, vertical: 3.h),
                decoration: BoxDecoration(
                  color: const Color(0xFF090B10),
                  borderRadius: BorderRadius.circular(14.r),
                  border: Border.all(color: const Color(0xFFD8892D)),
                ),
                child: Text('♛  AYỌ',
                    style: TextStyle(
                        color: const Color(0xFFFFB347),
                        fontSize: 11.sp,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.4)),
              ),
            ),
          ),
          Column(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              // ── OPPONENT ROW (displayed right to left) ────────────────
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 12.w),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: List.generate(6, (i) {
                    final holeIdx = topHoles[i];
                    return _HoleWidget(
                      seeds: board[holeIdx],
                      isSelected: false,
                      isLastSown: lastPit == holeIdx,
                      isLastLand: lastLandPit == holeIdx,
                      isPlayable: false,
                      label: '${6 - i}',
                      size: holeSize,
                      onTap: () {},
                    );
                  }),
                ),
              ),

              // ── SEPARATOR MARGIN ─────────────────────────────────────────
              SizedBox(height: 12.h),

              // ── HUMAN ROW (left to right) ─────────────────────────────
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 12.w),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: List.generate(6, (i) {
                    final holeIdx = bottomHoles[i];
                    final isPlayable =
                        isMyTurn && !botBusy && board[holeIdx] > 0;
                    return _HoleWidget(
                      seeds: board[holeIdx],
                      isSelected: selectedHole == i,
                      isLastSown: lastPit == holeIdx,
                      isLastLand: lastLandPit == holeIdx,
                      isPlayable: isPlayable,
                      label: '${i + 1}',
                      size: holeSize,
                      onTap: () => onHoleTap(i),
                    );
                  }),
                ),
              ),
            ],
          ),
        ]),
      );
    });
  }
}

// ── HOLE WIDGET ───────────────────────────────────────────────────────────────
class _HoleWidget extends StatelessWidget {
  final int seeds;
  final bool isSelected;
  final bool isLastSown;
  final bool isLastLand;
  final bool isPlayable;
  final String label;
  final double size;
  final VoidCallback onTap;

  const _HoleWidget({
    required this.seeds,
    required this.isSelected,
    required this.isLastSown,
    required this.isLastLand,
    required this.isPlayable,
    required this.label,
    required this.size,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    Color borderCol = const Color(0xFF1E293B);
    if (isSelected) borderCol = _cyan;
    if (isLastLand) borderCol = _green;
    if (isLastSown) borderCol = _orange;

    return GestureDetector(
      onTap: isPlayable ? onTap : null,
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(
              center: const Alignment(-0.25, -0.3),
              colors: isSelected
                  ? const [Color(0xFF264D55), Color(0xFF090D12)]
                  : const [
                      Color(0xFF6E2F1C),
                      Color(0xFF260C08),
                      Color(0xFF08090D)
                    ],
              stops: const [0, 0.62, 1],
            ),
            border: Border.all(
              color: borderCol == const Color(0xFF1E293B)
                  ? const Color(0xFFC56B32)
                  : borderCol,
              width: isSelected ? 2.5 : 2,
            ),
            boxShadow: [
              const BoxShadow(
                  color: Colors.black87, blurRadius: 8, offset: Offset(0, 4)),
              if (isSelected || isPlayable)
                BoxShadow(
                  color: (isSelected ? _cyan : _orange).withOpacity(0.35),
                  blurRadius: 10,
                ),
            ],
          ),
          child: Center(
            child: Stack(
              alignment: Alignment.center,
              children: [
                _SeedDots(count: seeds),
                if (seeds > 8)
                  Positioned(
                    right: 4,
                    bottom: 3,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 4, vertical: 1),
                      decoration: BoxDecoration(
                        color: const Color(0xFF080A0F).withOpacity(0.88),
                        borderRadius: BorderRadius.circular(7),
                        border: Border.all(color: const Color(0xFFD4A853)),
                      ),
                      child: Text('$seeds',
                          style: TextStyle(
                              color: const Color(0xFFD4A853),
                              fontSize: 8.sp,
                              fontWeight: FontWeight.w800)),
                    ),
                  ),
              ],
            ),
          ),
        ),
        SizedBox(height: 3.h),
        Container(
          width: size * 0.58,
          height: 17.h,
          decoration: BoxDecoration(
            color: const Color(0xFF080A0F),
            borderRadius: BorderRadius.circular(9.r),
            border: Border.all(color: const Color(0xFFD8892D), width: 1),
          ),
          alignment: Alignment.center,
          child: Text(label,
              style: TextStyle(
                  color: const Color(0xFFFFD58D),
                  fontSize: 9.sp,
                  fontWeight: FontWeight.w800)),
        ),
      ]),
    );
  }
}

class _AyoWoodGrainPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFFFB45E).withOpacity(0.055)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    for (var i = 0; i < 9; i++) {
      final y = size.height * (i + 1) / 10;
      final path = Path()..moveTo(0, y);
      for (double x = 0; x <= size.width; x += 18) {
        path.lineTo(x, y + 2.5 * sin((x / size.width * pi * 4) + i));
      }
      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ── SEED DOTS ─────────────────────────────────────────────────────────────────
class _SeedDots extends StatelessWidget {
  final int count;
  const _SeedDots({required this.count});

  @override
  Widget build(BuildContext context) {
    if (count == 0) {
      return SizedBox(height: 20.h);
    }
    return SizedBox(
      width: 28,
      height: 20,
      child: CustomPaint(painter: _SeedDotsPainter(count: count)),
    );
  }
}

class _SeedDotsPainter extends CustomPainter {
  final int count;
  _SeedDotsPainter({required this.count});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = const Color(0xFFD4A853);
    final n = min(count, 8);
    final cols = n <= 2 ? n : (n <= 6 ? 3 : 4);
    final rows = (n / cols).ceil();
    final dx = size.width / (cols + 1);
    final dy = size.height / (rows + 1);
    const r = 3.0;
    int drawn = 0;
    for (int row = 0; row < rows && drawn < n; row++) {
      for (int col = 0; col < cols && drawn < n; col++) {
        canvas.drawCircle(
          Offset(dx * (col + 1), dy * (row + 1)),
          r,
          paint,
        );
        drawn++;
      }
    }
  }

  @override
  bool shouldRepaint(_SeedDotsPainter o) => o.count != count;
}

// ═════════════════════════════════════════════════════════════════════════════
//  GAME OVER DIALOG
// ═════════════════════════════════════════════════════════════════════════════
class _GameOverDialog extends StatelessWidget {
  final bool isWinner;
  final int humanScore;
  final int botScore;
  final String prizePool;
  final String opponentName;
  final VoidCallback onClose;
  final VoidCallback onRematch;

  const _GameOverDialog({
    required this.isWinner,
    required this.humanScore,
    required this.botScore,
    required this.prizePool,
    required this.opponentName,
    required this.onClose,
    required this.onRematch,
  });

  @override
  Widget build(BuildContext context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          padding: EdgeInsets.all(28.r),
          decoration: BoxDecoration(
            color: _navy,
            borderRadius: BorderRadius.circular(28.r),
            border: Border.all(
                color: isWinner
                    ? _cyan.withOpacity(0.5)
                    : _orange.withOpacity(0.4)),
          ),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(isWinner ? 'You Win!' : 'You Lost',
                style: TextStyle(
                    color: _txtPri,
                    fontSize: 26.sp,
                    fontWeight: FontWeight.w900)),
            SizedBox(height: 12.h),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _ScoreBadge(
                    label: 'You',
                    score: humanScore,
                    color: isWinner ? _green : _orange),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16.w),
                  child: Text('vs',
                      style: TextStyle(color: _txtSub, fontSize: 14.sp)),
                ),
                _ScoreBadge(
                    label: 'Bot',
                    score: botScore,
                    color: !isWinner ? _green : _orange),
              ],
            ),
            SizedBox(height: 8.h),
            if (isWinner)
              Text('Prize: $prizePool',
                  style: TextStyle(
                      color: _orange,
                      fontSize: 18.sp,
                      fontWeight: FontWeight.w700)),
            SizedBox(height: 24.h),
            Row(children: [
              Expanded(
                child: GestureDetector(
                  onTap: onRematch,
                  child: Container(
                    height: 48.h,
                    decoration: BoxDecoration(
                      color: _surface,
                      borderRadius: BorderRadius.circular(14.r),
                      border: Border.all(color: _border),
                    ),
                    child: Center(
                      child: Text('Rematch',
                          style: TextStyle(
                              color: _txtPri,
                              fontSize: 14.sp,
                              fontWeight: FontWeight.w700)),
                    ),
                  ),
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: GestureDetector(
                  onTap: onClose,
                  child: Container(
                    height: 48.h,
                    decoration: BoxDecoration(
                      color: _orange,
                      borderRadius: BorderRadius.circular(14.r),
                    ),
                    child: Center(
                      child: Text('Back to Lobby',
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 14.sp,
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

class _ScoreBadge extends StatelessWidget {
  final String label;
  final int score;
  final Color color;
  const _ScoreBadge(
      {required this.label, required this.score, required this.color});

  @override
  Widget build(BuildContext context) => Column(
        children: [
          Text('$score',
              style: TextStyle(
                  color: color, fontSize: 32.sp, fontWeight: FontWeight.w900)),
          Text(label, style: TextStyle(color: _txtSub, fontSize: 12.sp)),
        ],
      );
}
