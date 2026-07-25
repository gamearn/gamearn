import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:gamearn/config/api_config.dart';
import '../../theme.dart';

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

// ── Board constants ───────────────────────────────────────────────────────────
const _kHoles      = 12;
const _kHolesEach  = 6;
const _kInitSeeds  = 4;
const _kWinScore   = 25;

// ── Models ────────────────────────────────────────────────────────────────────
class _AyoState {
  List<int> board;        // 12 holes: 0–5 = human, 6–11 = bot
  List<int> scores;       // [human, bot]
  int currentPlayer;      // 0 = human, 1 = bot
  bool isTerminal;

  _AyoState({
    required this.board,
    required this.scores,
    required this.currentPlayer,
    required this.isTerminal,
  });

  _AyoState copyWith({
    List<int>? board,
    List<int>? scores,
    int? currentPlayer,
    bool? isTerminal,
  }) => _AyoState(
    board: board ?? List.from(this.board),
    scores: scores ?? List.from(this.scores),
    currentPlayer: currentPlayer ?? this.currentPlayer,
    isTerminal: isTerminal ?? this.isTerminal,
  );
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

  // ── Game state ────────────────────────────────────────────────────────────
  _AyoState _game = _AyoState(
    board: List.filled(_kHoles, _kInitSeeds),
    scores: [0, 0],
    currentPlayer: 0,
    isTerminal: false,
  );

  List<int>  _actionHistory = [];   // sent to /get_move
  int        _selectedHole  = -1;   // human's selected hole (0–5)
  bool       _botBusy       = false;
  bool       _isLoading     = true;
  bool       _loadFailed    = false;
  String     _statusMsg     = 'Loading…';

  // Last sow highlight
  int        _lastSownHole  = -1;
  int        _lastLandHole  = -1;
  Timer?     _highlightTimer;

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
    _glowCtrl.dispose();
    _highlightTimer?.cancel();
    super.dispose();
  }

  // ── Start game ────────────────────────────────────────────────────────────
  Future<void> _startGame() async {
    setState(() { _isLoading = true; _loadFailed = false; });

    try {
      // Warm up Render
      try {
        await http.get(Uri.parse('${ApiConfig.botBaseUrl}/'))
            .timeout(const Duration(seconds: 4));
      } catch (_) {}

      final res = await http.post(
        Uri.parse('${ApiConfig.botBaseUrl}/start_game'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'game_name': 'ayo', 'num_players': 2}),
      ).timeout(const Duration(seconds: 20));

      if (!mounted) return;

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        final board         = List<int>.from(data['board'] as List);
        final startingPlayer = (data['starting_player'] as num).toInt();

        setState(() {
          _game = _AyoState(
            board: board,
            scores: [0, 0],
            currentPlayer: startingPlayer,
            isTerminal: false,
          );
          _actionHistory = [];
          _isLoading = false;
          _statusMsg = startingPlayer == 0
              ? 'Your turn — pick a pit'
              : '${widget.opponentName} goes first';
        });

        if (startingPlayer == 1) {
          await Future.delayed(const Duration(milliseconds: 600));
          _runBotTurn();
        }
      } else {
        setState(() { _isLoading = false; _loadFailed = true; });
      }
    } catch (e) {
      if (mounted) setState(() { _isLoading = false; _loadFailed = true; });
    }
  }

  // ── Human plays ───────────────────────────────────────────────────────────
  void _onHoleTap(int holeIndex) {
    // holeIndex is 0–5 relative to human's row
    if (_game.currentPlayer != 0 || _botBusy || _game.isTerminal) return;
    if (_game.board[holeIndex] == 0) {
      _toast('Empty pit — pick another');
      return;
    }
    setState(() => _selectedHole = holeIndex);
  }

  Future<void> _confirmPlay() async {
    if (_selectedHole < 0 || _game.currentPlayer != 0 || _botBusy) return;

    final hole = _selectedHole;
    setState(() {
      _selectedHole = -1;
      _botBusy = true;
      _statusMsg = 'Sowing…';
    });

    HapticFeedback.lightImpact();

    // Apply move locally so UI is instant
    final newGame = _applyMoveLocally(_game, hole);
    _actionHistory.add(hole);

    setState(() {
      _game = newGame;
      _lastSownHole = hole;
    });

    _highlightLastLand(newGame);

    if (newGame.isTerminal) {
      _botBusy = false;
      _showGameOver();
      return;
    }

    if (newGame.currentPlayer == 1) {
      await Future.delayed(const Duration(milliseconds: 500));
      _botBusy = false;
      _runBotTurn();
    } else {
      // Relay sow gave turn back to human
      setState(() {
        _botBusy = false;
        _statusMsg = 'Your turn — pick a pit';
      });
    }
  }

  // ── Bot turn ──────────────────────────────────────────────────────────────
  Future<void> _runBotTurn() async {
    if (!mounted || _game.isTerminal) return;
    setState(() {
      _botBusy = true;
      _statusMsg = '${widget.opponentName} is thinking…';
    });

    try {
      await Future.delayed(const Duration(milliseconds: 600));

      final res = await http.post(
        Uri.parse('${ApiConfig.botBaseUrl}/get_move'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'game_name': 'ayo',
          'action_history': _actionHistory,
          'player_rating': 1500,
        }),
      ).timeout(const Duration(seconds: 15));

      if (!mounted) return;

      if (res.statusCode == 200) {
        final data   = jsonDecode(res.body) as Map<String, dynamic>;
        final isTerminal = data['is_terminal'] as bool? ?? false;

        if (isTerminal) {
          _botBusy = false;
          _showGameOver();
          return;
        }

        final action = (data['action'] as num).toInt();
        _actionHistory.add(action);

        // Bot action is 0–5 relative to its row; absolute = action + 6
        final absHole = action + _kHolesEach;
        final newGame = _applyMoveLocally(_game, absHole);

        setState(() {
          _game = newGame;
          _lastSownHole = absHole;
        });

        _highlightLastLand(newGame);

        if (newGame.isTerminal) {
          _botBusy = false;
          _showGameOver();
          return;
        }

        if (newGame.currentPlayer == 1) {
          // Bot plays again (relay)
          await Future.delayed(const Duration(milliseconds: 700));
          _runBotTurn();
        } else {
          setState(() {
            _botBusy = false;
            _statusMsg = 'Your turn — pick a pit';
          });
        }
      } else {
        // Network error — give turn back
        setState(() {
          _botBusy = false;
          _game = _game.copyWith(currentPlayer: 0);
          _statusMsg = 'Network error — your turn';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _botBusy = false;
          _game = _game.copyWith(currentPlayer: 0);
          _statusMsg = 'Your turn — pick a pit';
        });
      }
    }
  }

  // ── Local move simulation ─────────────────────────────────────────────────
  // Mirrors ayo.cc logic so UI is instant without waiting for server
  _AyoState _applyMoveLocally(_AyoState state, int absHole) {
    final board   = List<int>.from(state.board);
    final scores  = List<int>.from(state.scores);
    final player  = state.currentPlayer;

    int seeds = board[absHole];
    if (seeds == 0) return state;

    board[absHole] = 0;

    // Sow counterclockwise — in our array layout:
    // Human holes: 0–5 (left to right)
    // Bot holes:   6–11 (right to left visually, but 6–11 in array)
    // Counterclockwise: from human row, go right (increasing index on human side)
    // then wrap to bot side right-to-left (decreasing index on bot side)
    // Array order for CCW: 0,1,2,3,4,5,11,10,9,8,7,6, then back to 0...
    final ccwOrder = [0,1,2,3,4,5,11,10,9,8,7,6];
    int startIdx = ccwOrder.indexOf(absHole);

    int curr = startIdx;
    for (int i = 0; i < seeds; i++) {
      curr = (curr + 1) % _kHoles;
      final hole = ccwOrder[curr];
      if (hole == absHole) {
        // Skip the starting hole if seeds > 11
        curr = (curr + 1) % _kHoles;
      }
      board[ccwOrder[curr]]++;
    }

    final lastHole = ccwOrder[curr];
    setState(() => _lastLandHole = lastHole);

    // Relay sow: if last seed lands in non-empty hole on own side, pick up and continue
    // (This is a simplification — full relay requires recursion; OpenSpiel handles it)

    // Capture: last seed lands in opponent's pit with 2 or 3 seeds
    final opponent = 1 - player;
    final oppStart = opponent * _kHolesEach;
    final oppEnd   = oppStart + _kHolesEach;

    if (lastHole >= oppStart && lastHole < oppEnd) {
      // Capture chain
      int scan = lastHole;
      while (scan >= oppStart && scan < oppEnd &&
             (board[scan] == 2 || board[scan] == 3)) {
        // Grand slam check: would this wipe opponent completely?
        bool wouldWipe = true;
        for (int h = oppStart; h < oppEnd; h++) {
          if (h != scan && board[h] > 0) { wouldWipe = false; break; }
        }
        if (wouldWipe) break; // No grand slam

        scores[player] += board[scan];
        board[scan] = 0;

        // Move scan backward (toward lower index in opponent row)
        scan--;
      }
    }

    // Check win condition
    final isTerminal = scores[0] > _kWinScore ||
                       scores[1] > _kWinScore ||
                       scores[0] + scores[1] == 48 ||
                       _hasNoMoves(board, 0) ||
                       _hasNoMoves(board, 1);

    // Next player
    int nextPlayer = 1 - player;
    if (isTerminal) nextPlayer = player;

    return _AyoState(
      board: board,
      scores: scores,
      currentPlayer: nextPlayer,
      isTerminal: isTerminal,
    );
  }

  bool _hasNoMoves(List<int> board, int player) {
    final start = player * _kHolesEach;
    for (int i = start; i < start + _kHolesEach; i++) {
      if (board[i] > 0) return false;
    }
    return true;
  }

  void _highlightLastLand(_AyoState state) {
    _highlightTimer?.cancel();
    _highlightTimer = Timer(const Duration(milliseconds: 800), () {
      if (mounted) setState(() { _lastSownHole = -1; _lastLandHole = -1; });
    });
  }

  // ── Game over ─────────────────────────────────────────────────────────────
  void _showGameOver() {
    if (!mounted) return;
    final humanScore = _game.scores[0];
    final botScore   = _game.scores[1];
    final isWinner   = humanScore > botScore;

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
                score:  _game.scores[1],
                isBot:  true,
                active: _game.currentPlayer == 1 && !_game.isTerminal,
              ),

              const SizedBox(height: 12),

              // Ayo board
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: _AyoBoardWidget(
                    board:        _game.board,
                    currentPlayer: _game.currentPlayer,
                    selectedHole: _selectedHole,
                    lastSownHole: _lastSownHole,
                    lastLandHole: _lastLandHole,
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
                      color: _game.currentPlayer == 0 && !_botBusy
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
                        onTap: _confirmPlay,
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
                            '(${_game.board[_selectedHole]} seeds)',
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
                score:  _game.scores[0],
                isBot:  false,
                active: _game.currentPlayer == 0 && !_game.isTerminal,
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
              color: score >= _kWinScore ? _green : _border,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.grain_rounded,
                  color: score >= _kWinScore ? _green : _cyan, size: 14),
              const SizedBox(width: 6),
              Text('$score',
                  style: TextStyle(
                      color: score >= _kWinScore ? _green : _txtPri,
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
  final int currentPlayer;
  final int selectedHole;
  final int lastSownHole;
  final int lastLandHole;
  final bool botBusy;
  final ValueChanged<int> onHoleTap;

  const _AyoBoardWidget({
    required this.board,
    required this.currentPlayer,
    required this.selectedHole,
    required this.lastSownHole,
    required this.lastLandHole,
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
          color: const Color(0xFF78350F), // Figma: #78350f
          borderRadius: BorderRadius.circular(13.0),
          border: Border.all(color: const Color(0xFF4B1B00), width: 1.1),
          // Figma doesn't explicitly have the black box shadow here, but it's often good for depth.
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
                  final holeIdx = 11 - i; // right to left = 11,10,9,8,7,6
                  return _HoleWidget(
                    seeds:      board[holeIdx],
                    isSelected: false,
                    isLastSown: lastSownHole == holeIdx,
                    isLastLand: lastLandHole == holeIdx,
                    isPlayable: false,
                    label:      '${6 - i}', // label 6→1 right to left
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
                  final holeIdx = i; // 0–5
                  final isPlayable = currentPlayer == 0 &&
                      !botBusy &&
                      board[holeIdx] > 0;
                  return _HoleWidget(
                    seeds:      board[holeIdx],
                    isSelected: selectedHole == holeIdx,
                    isLastSown: lastSownHole == holeIdx,
                    isLastLand: lastLandHole == holeIdx,
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
    Color borderCol = const Color(0xFF1E293B); // Figma stroke color
    if (isSelected)   borderCol = _cyan;
    if (isLastLand)   borderCol = _green;
    if (isLastSown)   borderCol = _orange;

    return GestureDetector(
      onTap: isPlayable ? onTap : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        width: 48, height: 48, // Slightly larger to match ~47.7px in Figma
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: isSelected
              ? _cyan.withOpacity(0.15)
              : const Color(0xFF0B0E1A), // Figma fill color
          border: Border.all(color: borderCol, width: isSelected ? 2.5 : 2.2), // Figma stroke is 2.17
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
            // Seeds as dots (max 8 shown, then number)
            seeds <= 8
                ? _SeedDots(count: seeds)
                : Text('$seeds',
                    style: const TextStyle(
                        color: Color(0xFFD4A853),
                        fontSize: 14, fontWeight: FontWeight.w900)),
            // Pit label
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
    // Arrange up to 8 seeds in a 3-column grid
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
        Text(isWinner ? '🏆 You Win!' : '💀 You Lost',
            style: const TextStyle(
                color: _txtPri, fontSize: 26, fontWeight: FontWeight.w900)),
        const SizedBox(height: 12),
        // Score display
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
        // Buttons
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
