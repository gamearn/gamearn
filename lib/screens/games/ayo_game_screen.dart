import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:gamearn/config/api_config.dart';
import '../../theme.dart';
import '../../services/sound_service.dart';

// ── Palette (matches Gamearn design tokens) ───────────────────────────────────
const _bg       = Color(0xFF0B0E1A);
const _navy     = Color(0xFF0D1B4B);
const _card     = Color(0xFF0F172A);
const _surface  = Color(0xFF1E293B);
const _cyan     = Color(0xFF22D1EE);
const _orange   = Color(0xFFFF5E00);
const _green    = Color(0xFF00E676);
const _txtPri   = Color(0xFFF1F5F9);
const _txtSub   = Color(0xFF94A3B8);
const _border   = Color(0xFF334155);

// ── Board constants (display only — server validates) ─────────────────────────
const _kHoles     = 12;
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
    final res = await http.post(
      Uri.parse('$_base/start'),
      headers: await _authHeaders(),
      body: jsonEncode({'playerRating': playerRating}),
    ).timeout(const Duration(seconds: 10));
    if (res.statusCode != 200) throw Exception('Failed to start practice game');
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    final data = body['data'] as Map<String, dynamic>;
    sessionId = data['sessionId'] as String;
    return data;
  }

  Future<Map<String, dynamic>> movePiece(int pitIndex) async {
    final res = await http.post(
      Uri.parse('$_base/move'),
      headers: await _authHeaders(),
      body: jsonEncode({'sessionId': sessionId, 'pitIndex': pitIndex}),
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
    this.playerName    = 'You',
    this.playerAvatar  = '',
    this.opponentName  = 'Gamearn Bot',
    this.opponentAvatar = '',
    this.tournamentTitle = 'AYÒ TOURNAMENT',
    this.prizePool     = '₦70,000',
    this.playerRating  = 1200,
    this.onBack,
  });

  @override
  State<AyoGameScreen> createState() => _AyoGameScreenState();
}

class _AyoGameScreenState extends State<AyoGameScreen>
    with TickerProviderStateMixin {

  // ── Animations ────────────────────────────────────────────────────────────
  late AnimationController _glowCtrl;
  late Animation<double>   _glowAnim;

  // ── Game state (from server) ──────────────────────────────────────────────
  List<int>  _board          = List.filled(_kHoles, 0);
  List<int>  _stores         = [0, 0];
  int        _currentPlayerIndex = 0;
  bool       _isTerminal     = false;

  int        _selectedHole   = -1;
  bool       _botBusy        = false;
  bool       _isLoading      = true;
  bool       _loadFailed     = false;
  String     _statusMsg      = 'Loading…';

  // Last move highlight
  int        _lastPit        = -1;
  int        _lastLandPit    = -1;
  Timer?     _highlightTimer;

  // Service
  final _PracticeAyoService _svc = _PracticeAyoService();

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
    _highlightTimer?.cancel();
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
        _board             = board;
        _stores            = List<int>.from(data['stores'] as List);
        _currentPlayerIndex = data['currentPlayerIndex'] as int;
        _selectedHole       = -1;
        _lastPit            = -1;
        _lastLandPit        = -1;
        _isTerminal         = false;
        _isLoading          = false;
        _statusMsg          = 'Your turn — pick a pit';
      });
    } catch (e) {
      if (mounted) setState(() { _isLoading = false; _loadFailed = true; });
    }
  }

  // ── Human pit tap ─────────────────────────────────────────────────────────
  void _onHoleTap(int holeIndex) {
    // holeIndex is 0–5 (relative to human's row)
    if (_currentPlayerIndex != 0 || _botBusy || _isTerminal) return;
    if (_board[holeIndex] == 0) {
      _toast('Empty pit — pick another');
      return;
    }
    setState(() => _selectedHole = holeIndex);
  }

  // ── Execute human move ────────────────────────────────────────────────────
  Future<void> _executeHumanMove() async {
    if (_selectedHole < 0 || _currentPlayerIndex != 0 || _botBusy) return;

    final hole = _selectedHole;
    setState(() {
      _selectedHole = -1;
      _botBusy = true;
      _statusMsg = 'Sowing…';
    });

    HapticFeedback.lightImpact();

    try {
      final data = await _svc.movePiece(hole);
      if (!mounted) return;

      final board = List<int>.from(data['board'] as List);
      final lastMove = data['lastMove'] as Map<String, dynamic>?;
      final captureTotal = (lastMove?['captureTotal'] as num?)?.toInt() ?? 0;
      final isCapture = captureTotal > 0;
      SoundService.instance.play(isCapture ? SoundType.capture : SoundType.pieceMove);

      setState(() {
        _board             = board;
        _stores            = List<int>.from(data['stores'] as List);
        _currentPlayerIndex = data['currentPlayerIndex'] as int;
        _lastPit            = hole;
        _lastLandPit        = (lastMove?['lastPit'] as num?)?.toInt() ?? -1;
      });

      _highlightLastLand();

      final botActions = data['botActions'] as List? ?? [];
      final gameOver = data['gameOver'] == true;

      if (botActions.isNotEmpty) {
        await _animateBotActions(botActions);
      }

      if (gameOver || _isTerminal) {
        _showGameOver();
        return;
      }

      if (!mounted) return;
      setState(() {
        _botBusy   = false;
        _statusMsg = 'Your turn — pick a pit';
      });
    } catch (e) {
      if (!mounted) return;
      _toast(e.toString().replaceFirst('Exception: ', ''));
      setState(() {
        _botBusy   = false;
        _statusMsg = 'Your turn — pick a pit';
      });
    }
  }

  // ── Animate bot actions ───────────────────────────────────────────────────
  Future<void> _animateBotActions(List<dynamic> actions) async {
    for (final action in actions) {
      if (!mounted || _isTerminal) break;
      final a = action as Map<String, dynamic>;

      final pitIdx   = (a['pitIndex'] as num).toInt();
      final lastPit  = (a['lastPit'] as num).toInt();
      final capTotal = (a['captureTotal'] as num).toInt();
      final isCap    = capTotal > 0;

      setState(() {
        _lastPit     = pitIdx;
        _lastLandPit = lastPit;
        _statusMsg   = '${widget.opponentName} is thinking…';
      });
      SoundService.instance.play(isCap ? SoundType.capture : SoundType.pieceMove);

      await Future.delayed(const Duration(milliseconds: 500));

      if (a['isWin'] == true) {
        return;
      }
    }
  }

  void _highlightLastLand() {
    _highlightTimer?.cancel();
    _highlightTimer = Timer(const Duration(milliseconds: 800), () {
      if (mounted) setState(() { _lastPit = -1; _lastLandPit = -1; });
    });
  }

  // ── Game over ─────────────────────────────────────────────────────────────
  void _showGameOver() {
    if (!mounted) return;
    setState(() { _isTerminal = true; _botBusy = false; });

    final humanScore = _stores[0];
    final botScore   = _stores[1];
    final isWinner   = humanScore > botScore;

    SoundService.instance.play(isWinner ? SoundType.gameWin : SoundType.gameLose);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => _GameOverDialog(
        isWinner:    isWinner,
        humanScore:  humanScore,
        botScore:    botScore,
        prizePool:   widget.prizePool,
        opponentName: widget.opponentName,
        onClose: widget.onBack ?? () => Navigator.maybePop(context),
        onRematch: () {
          Navigator.pop(context);
          _startGame();
        },
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
                color: _orange,
                borderRadius: BorderRadius.circular(4),
              ),
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
                        color: _cyan, fontSize: 11, fontWeight: FontWeight.w500)),
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
              const SizedBox(height: 16),

              // Bot player info
              _playerRow(
                name:   widget.opponentName,
                avatar: widget.opponentAvatar,
                score:  _stores[1],
                isBot:  true,
                active: _currentPlayerIndex == 1 && !_isTerminal,
              ),

              const SizedBox(height: 12),

              // Ayo board
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: _AyoBoardWidget(
                    board:        _board,
                    currentPlayerIndex: _currentPlayerIndex,
                    selectedHole: _selectedHole,
                    lastPit:      _lastPit,
                    lastLandPit:  _lastLandPit,
                    botBusy:      _botBusy,
                    onHoleTap:    _onHoleTap,
                  ),
                ),
              ),

              const SizedBox(height: 12),

              // Status message
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
                      color: _currentPlayerIndex == 0 && !_botBusy
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

              const SizedBox(height: 12),

              // Confirm button (only when human has selected a hole)
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: _selectedHole >= 0
                    ? GestureDetector(
                        key: const ValueKey('confirm'),
                        onTap: _executeHumanMove,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 4),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 32, vertical: 12),
                          decoration: BoxDecoration(
                            color: _cyan,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(
                                  color: _cyan.withOpacity(0.4),
                                  blurRadius: 12)
                            ],
                          ),
                          child: Text(
                            'Sow from pit ${_selectedHole + 1}  '
                            '(${_board[_selectedHole]} seeds)',
                            style: const TextStyle(
                                color: _bg, fontSize: 13,
                                fontWeight: FontWeight.w800),
                          ),
                        ),
                      )
                    : const SizedBox(key: ValueKey('empty'), height: 0),
              ),

              const SizedBox(height: 12),

              // Human player info
              _playerRow(
                name:   widget.playerName,
                avatar: widget.playerAvatar,
                score:  _stores[0],
                isBot:  false,
                active: _currentPlayerIndex == 0 && !_isTerminal,
              ),

              const SizedBox(height: 16),
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
  }) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16),
    child: Row(
      children: [
        // Avatar
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
        // Name + turn indicator
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name,
                  style: const TextStyle(
                      color: _txtPri, fontSize: 13,
                      fontWeight: FontWeight.w700)),
              if (active)
                const Text('Your turn',
                    style: TextStyle(color: _cyan, fontSize: 11)),
            ],
          ),
        ),
        // Score badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: _surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: _border,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.grain_rounded,
                  color: _cyan, size: 14),
              const SizedBox(width: 6),
              Text('$score',
                  style: const TextStyle(
                      color: _txtPri,
                      fontSize: 16, fontWeight: FontWeight.w900)),
            ],
          ),
        ),
      ],
    ),
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
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
            decoration: BoxDecoration(
                color: _orange, borderRadius: BorderRadius.circular(12)),
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
//  AYO BOARD WIDGET
// ═════════════════════════════════════════════════════════════════════════════
class _AyoBoardWidget extends StatelessWidget {
  final List<int> board;
  final int currentPlayerIndex;
  final int selectedHole;
  final int lastPit;
  final int lastLandPit;
  final bool botBusy;
  final ValueChanged<int> onHoleTap;

  const _AyoBoardWidget({
    required this.board,
    required this.currentPlayerIndex,
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
      return Container(
        width: w, height: h,
        decoration: BoxDecoration(
          color: const Color(0xFF78350F),
          borderRadius: BorderRadius.circular(13.0),
          border: Border.all(color: const Color(0xFF4B1B00), width: 1.1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.5),
              blurRadius: 16, offset: const Offset(0, 6)),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            // ── BOT ROW (holes 6–11, displayed right to left) ────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: List.generate(6, (i) {
                  final holeIdx = 11 - i;
                  return _HoleWidget(
                    seeds:      board[holeIdx],
                    isSelected: false,
                    isLastSown: lastPit == holeIdx,
                    isLastLand: lastLandPit == holeIdx,
                    isPlayable: false,
                    label:      '${6 - i}',
                    onTap:      () {},
                  );
                }),
              ),
            ),

            // ── SEPARATOR MARGIN ─────────────────────────────────────────
            const SizedBox(height: 12),

            // ── HUMAN ROW (holes 0–5, left to right) ─────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: List.generate(6, (i) {
                  final holeIdx = i;
                  final isPlayable = currentPlayerIndex == 0 &&
                      !botBusy &&
                      board[holeIdx] > 0;
                  return _HoleWidget(
                    seeds:      board[holeIdx],
                    isSelected: selectedHole == holeIdx,
                    isLastSown: lastPit == holeIdx,
                    isLastLand: lastLandPit == holeIdx,
                    isPlayable: isPlayable,
                    label:      '${i + 1}',
                    onTap:      () => onHoleTap(holeIdx),
                  );
                }),
              ),
            ),
          ],
        ),
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
  final VoidCallback onTap;

  const _HoleWidget({
    required this.seeds,
    required this.isSelected,
    required this.isLastSown,
    required this.isLastLand,
    required this.isPlayable,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    Color borderCol = const Color(0xFF1E293B);
    if (isSelected)   borderCol = _cyan;
    if (isLastLand)   borderCol = _green;
    if (isLastSown)   borderCol = _orange;

    return GestureDetector(
      onTap: isPlayable ? onTap : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        width: 48, height: 48,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: isSelected
              ? _cyan.withOpacity(0.15)
              : const Color(0xFF0B0E1A),
          border: Border.all(color: borderCol, width: isSelected ? 2.5 : 2.2),
          boxShadow: isSelected
              ? [BoxShadow(color: _cyan.withOpacity(0.4), blurRadius: 10)]
              : isPlayable
                  ? [BoxShadow(
                      color: _orange.withOpacity(0.25), blurRadius: 8)]
                  : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            seeds <= 8
                ? _SeedDots(count: seeds)
                : Text('$seeds',
                    style: const TextStyle(
                        color: Color(0xFFD4A853),
                        fontSize: 14, fontWeight: FontWeight.w900)),
            Text(label,
                style: TextStyle(
                    color: isPlayable
                        ? _txtSub
                        : const Color(0xFF4A2A10),
                    fontSize: 8)),
          ],
        ),
      ),
    );
  }
}

// ── SEED DOTS ─────────────────────────────────────────────────────────────────
class _SeedDots extends StatelessWidget {
  final int count;
  const _SeedDots({required this.count});

  @override
  Widget build(BuildContext context) {
    if (count == 0) {
      return const SizedBox(height: 20);
    }
    return SizedBox(
      width: 28, height: 20,
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
        Text(isWinner ? 'You Win!' : 'You Lost',
            style: const TextStyle(
                color: _txtPri, fontSize: 26, fontWeight: FontWeight.w900)),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _ScoreBadge(label: 'You', score: humanScore,
                color: isWinner ? _green : _orange),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Text('vs',
                  style: TextStyle(color: _txtSub, fontSize: 14)),
            ),
            _ScoreBadge(label: 'Bot', score: botScore,
                color: !isWinner ? _green : _orange),
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
                  border: Border.all(color: _border),
                ),
                child: const Center(
                  child: Text('Rematch',
                      style: TextStyle(color: _txtPri, fontSize: 14,
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
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Center(
                  child: Text('Back to Lobby',
                      style: TextStyle(color: Colors.white, fontSize: 14,
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
              color: color, fontSize: 32, fontWeight: FontWeight.w900)),
      Text(label,
          style: const TextStyle(color: _txtSub, fontSize: 12)),
    ],
  );
}
