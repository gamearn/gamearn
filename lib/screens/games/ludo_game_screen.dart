import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../theme.dart';

// ─────────────────────────────────────────────────────────────────
//  LUDO GAME SCREEN
//  2-player mode: Human controls Red + Yellow houses (players 0 & 1)
//                 Bot controls Green + Blue houses (players 2 & 3)
//  Token count: 2 or 4 pieces per house (from lobby)
//  Engine: OpenSpiel ludo via ai_service.py
// ─────────────────────────────────────────────────────────────────

const String _kAiServiceUrl = 'https://gamearn-ai.onrender.com';

// Board colours — standard Ludo palette on dark bg
const Color _kRed    = Color(0xFFE53935);
const Color _kBlue   = Color(0xFF1E88E5);
const Color _kGreen  = Color(0xFF43A047);
const Color _kYellow = Color(0xFFFDD835);
const Color _kBoard  = Color(0xFF141827);
const Color _kCell   = Color(0xFF1E2438);
const Color _kSafe   = Color(0xFF22D1EE); // safety square highlight

// Player index → colour
const List<Color> _kPlayerColors = [_kRed, _kYellow, _kGreen, _kBlue];
const List<String> _kPlayerNames = ['Red', 'Yellow', 'Green', 'Blue'];

// OpenSpiel ludo.cc start positions on the 52-cell main path
const List<int> _kStartPositions = [0, 13, 26, 39];

// Safety squares (absolute positions on 52-cell ring)
const List<int> _kSafetySquares = [0, 8, 13, 21, 26, 34, 39, 47];

// ── Piece state ───────────────────────────────────────────────────
class _Piece {
  int position;   // -1 = base, 0–51 = main path, 52–57 = home stretch, 58 = home
  bool isInBase;
  bool isHome;

  _Piece() : position = -1, isInBase = true, isHome = false;

  _Piece.from(_Piece other)
      : position = other.position,
        isInBase = other.isInBase,
        isHome = other.isHome;
}

// ─────────────────────────────────────────────────────────────────
class LudoGameScreen extends StatefulWidget {
  final int tokenCount; // 2 or 4

  const LudoGameScreen({super.key, this.tokenCount = 4});

  @override
  State<LudoGameScreen> createState() => _LudoGameScreenState();
}

class _LudoGameScreenState extends State<LudoGameScreen>
    with TickerProviderStateMixin {
  // ── Game state ─────────────────────────────────────────────────
  late List<List<_Piece>> _pieces; // [player][piece]
  List<int> _actionHistory = [];
  int _currentPlayer = 0;
  int _diceRoll = 0;
  bool _waitingForDice = true;
  bool _gameOver = false;
  int _winner = -1;
  int _consecutiveSixes = 0;

  // Human controls players 0 & 1; bot controls 2 & 3
  bool get _isHumanTurn => _currentPlayer == 0 || _currentPlayer == 1;

  // ── UI state ───────────────────────────────────────────────────
  bool _botBusy = false;
  bool _diceRolling = false;
  int? _selectedPiece;   // index of piece human tapped
  List<int> _legalPieces = []; // piece indices human can move

  // ── Animations ─────────────────────────────────────────────────
  late AnimationController _diceController;
  late Animation<double> _diceRotation;
  late AnimationController _pieceController;
  late Animation<double> _piecePulse;

  @override
  void initState() {
    super.initState();
    _initPieces();

    _diceController = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 600));
    _diceRotation = Tween<double>(begin: 0, end: 2 * pi)
        .animate(CurvedAnimation(parent: _diceController, curve: Curves.easeOut));

    _pieceController = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 800))
      ..repeat(reverse: true);
    _piecePulse = Tween<double>(begin: 0.85, end: 1.15)
        .animate(CurvedAnimation(parent: _pieceController, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _diceController.dispose();
    _pieceController.dispose();
    super.dispose();
  }

  void _initPieces() {
    _pieces = List.generate(
      4,
      (_) => List.generate(widget.tokenCount, (_) => _Piece()),
    );
    _actionHistory = [];
    _currentPlayer = 0;
    _diceRoll = 0;
    _waitingForDice = true;
    _gameOver = false;
    _winner = -1;
    _consecutiveSixes = 0;
    _legalPieces = [];
    _selectedPiece = null;
  }

  // ── Dice roll ──────────────────────────────────────────────────
  Future<void> _rollDice() async {
    if (!_waitingForDice || _diceRolling || _gameOver) return;
    if (!_isHumanTurn) return;

    setState(() => _diceRolling = true);
    _diceController.forward(from: 0);

    // Simulate random roll (chance node)
    final roll = Random().nextInt(6) + 1;
    await Future.delayed(const Duration(milliseconds: 620));

    final chanceAction = roll - 1; // OpenSpiel: action = roll - 1
    _actionHistory.add(chanceAction);

    setState(() {
      _diceRoll = roll;
      _waitingForDice = false;
      _diceRolling = false;
      _legalPieces = _computeLegalPieces();
    });

    if (_legalPieces.isEmpty) {
      // No moves: pass
      await Future.delayed(const Duration(milliseconds: 500));
      _applyPass();
    }
  }

  // ── Compute which pieces the human can move ────────────────────
  List<int> _computeLegalPieces() {
    final list = <int>[];
    for (int i = 0; i < widget.tokenCount; i++) {
      final p = _pieces[_currentPlayer][i];
      if (p.isHome) continue;
      if (p.isInBase) {
        if (_diceRoll == 6) list.add(i);
      } else {
        if (p.position + _diceRoll <= 57) list.add(i); // kTotalSteps = 58 (0-indexed 57)
      }
    }
    return list;
  }

  // ── Human taps a piece ─────────────────────────────────────────
  void _onPieceTapped(int pieceIdx) {
    if (_waitingForDice || !_isHumanTurn || _gameOver) return;
    if (!_legalPieces.contains(pieceIdx)) return;

    setState(() => _selectedPiece = pieceIdx);
    _applyMove(_currentPlayer, pieceIdx);
  }

  // ── Apply a move (local state + action history) ────────────────
  void _applyMove(int player, int pieceIdx) {
    final action = 1 + pieceIdx; // kMovePieceBase + pieceIdx
    _actionHistory.add(action);

    setState(() {
      final p = _pieces[player][pieceIdx];
      bool bonusRoll = false;

      if (p.isInBase) {
        p.isInBase = false;
        p.position = 0;
      } else {
        p.position += _diceRoll;
        if (p.position >= 57) {
          // accounting for 0-indexed home = position 57
          p.position = 57;
          p.isHome = true;
        }
      }

      // Capture check (only on main path, non-safety)
      if (!p.isHome && p.position < 52) {
        final absPos = _getAbsPos(player, p.position);
        if (!_kSafetySquares.contains(absPos)) {
          for (int op = 0; op < 4; op++) {
            if (op == player) continue;
            for (int oi = 0; oi < widget.tokenCount; oi++) {
              final other = _pieces[op][oi];
              if (!other.isInBase && !other.isHome && other.position < 52) {
                if (_getAbsPos(op, other.position) == absPos) {
                  other.isInBase = true;
                  other.position = -1;
                  bonusRoll = true;
                }
              }
            }
          }
        }
      }

      // Win check
      final allHome = _pieces[player].every((pc) => pc.isHome);
      if (allHome) {
        _gameOver = true;
        _winner = player;
        _legalPieces = [];
        _selectedPiece = null;
        return;
      }

      // Six bonus
      if (_diceRoll == 6) {
        _consecutiveSixes++;
        if (_consecutiveSixes < 3) bonusRoll = true;
        else _consecutiveSixes = 0;
      } else {
        _consecutiveSixes = 0;
      }

      if (!bonusRoll) {
        _currentPlayer = (_currentPlayer + 1) % 4;
      }

      _waitingForDice = true;
      _legalPieces = [];
      _selectedPiece = null;
    });

    if (_gameOver) {
      _showGameOverDialog();
      return;
    }

    // If now bot's turn, trigger bot
    if (!_isHumanTurn) {
      _runBotTurn();
    }
  }

  void _applyPass() {
    // action 0 = kPassAction
    _actionHistory.add(0);
    setState(() {
      _consecutiveSixes = 0;
      _currentPlayer = (_currentPlayer + 1) % 4;
      _waitingForDice = true;
      _legalPieces = [];
    });
    if (!_isHumanTurn) _runBotTurn();
  }

  int _getAbsPos(int player, int relPos) {
    return (_kStartPositions[player] + relPos) % 52;
  }

  // ── Bot turn ───────────────────────────────────────────────────
  Future<void> _runBotTurn() async {
    if (_botBusy || _gameOver) return;
    _botBusy = true;

    try {
      // Bot rolls dice first (chance node)
      await Future.delayed(const Duration(milliseconds: 700));
      final roll = Random().nextInt(6) + 1;
      final chanceAction = roll - 1;
      _actionHistory.add(chanceAction);

      setState(() {
        _diceRoll = roll;
        _waitingForDice = false;
      });

      await Future.delayed(const Duration(milliseconds: 500));

      // Ask server for move
      final response = await http
          .post(
            Uri.parse('$_kAiServiceUrl/get_move'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'game_name': 'ludo',
              'action_history': _actionHistory,
            }),
          )
          .timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final action = data['action'] as int;

        if (action == 0) {
          // Pass
          _actionHistory.add(0);
          setState(() {
            _consecutiveSixes = 0;
            _currentPlayer = (_currentPlayer + 1) % 4;
            _waitingForDice = true;
            _legalPieces = [];
          });
        } else {
          // Move piece
          final pieceIdx = action - 1; // kMovePieceBase
          if (pieceIdx >= 0 && pieceIdx < widget.tokenCount) {
            await Future.delayed(const Duration(milliseconds: 300));
            _applyMove(_currentPlayer, pieceIdx);
            return; // _applyMove handles next turn
          }
        }
      } else {
        // Server error → pass
        _applyPass();
      }
    } catch (e) {
      // Network error → pass
      if (mounted) _applyPass();
    } finally {
      _botBusy = false;
    }

    // Continue if still bot's turn
    if (!_isHumanTurn && !_gameOver && mounted) {
      _runBotTurn();
    }
  }

  // ── Game over dialog ───────────────────────────────────────────
  void _showGameOverDialog() {
    final isHumanWinner = _winner == 0 || _winner == 1;
    final winnerName = _kPlayerNames[_winner];
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        backgroundColor: kBgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          isHumanWinner ? '🎉 You Win!' : '😞 You Lost',
          style: const TextStyle(color: kTextPri, fontWeight: FontWeight.w800),
          textAlign: TextAlign.center,
        ),
        content: Text(
          '$winnerName house wins the game!',
          style: const TextStyle(color: kTextSec),
          textAlign: TextAlign.center,
        ),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() => _initPieces());
            },
            child: const Text('Play Again', style: TextStyle(color: kCyan, fontWeight: FontWeight.w700)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Exit', style: TextStyle(color: kTextSec)),
          ),
        ],
      ),
    );
  }

  // ── Build ──────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final screenW = MediaQuery.of(context).size.width;
    final boardSize = screenW - 16;

    return Scaffold(
      backgroundColor: kBgDeep,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: Colors.white, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Lúdò',
          style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
              fontSize: 18,
              letterSpacing: 0.5),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.white54),
            onPressed: () => setState(() => _initPieces()),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // ── Top player strip (Bot — Green + Blue) ─────────────
            _PlayerStrip(
              label: 'Computer',
              colors: const [_kGreen, _kBlue],
              isActive: !_isHumanTurn && !_gameOver,
              pieceCounts: [
                _pieces[2].where((p) => p.isHome).length,
                _pieces[3].where((p) => p.isHome).length,
              ],
              totalPieces: widget.tokenCount,
            ),

            // ── Board ──────────────────────────────────────────────
            Expanded(
              child: Center(
                child: SizedBox(
                  width: boardSize,
                  height: boardSize,
                  child: Stack(
                    children: [
                      // Board painter
                      CustomPaint(
                        size: Size(boardSize, boardSize),
                        painter: _LudoBoardPainter(
                          pieces: _pieces,
                          tokenCount: widget.tokenCount,
                          currentPlayer: _currentPlayer,
                          legalPieces: _legalPieces,
                          selectedPiece: _selectedPiece,
                          pulseFactor: _piecePulse.value,
                        ),
                      ),
                      // Tap detector overlay for pieces
                      _PieceTapOverlay(
                        boardSize: boardSize,
                        pieces: _pieces,
                        tokenCount: widget.tokenCount,
                        currentPlayer: _currentPlayer,
                        legalPieces: _legalPieces,
                        isHumanTurn: _isHumanTurn,
                        waitingForDice: _waitingForDice,
                        onPieceTapped: _onPieceTapped,
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // ── Bottom player strip (Human — Red + Yellow) ─────────
            _PlayerStrip(
              label: 'You',
              colors: const [_kRed, _kYellow],
              isActive: _isHumanTurn && !_gameOver,
              pieceCounts: [
                _pieces[0].where((p) => p.isHome).length,
                _pieces[1].where((p) => p.isHome).length,
              ],
              totalPieces: widget.tokenCount,
            ),

            // ── Dice + status bar ──────────────────────────────────
            _BottomBar(
              diceRoll: _diceRoll,
              waitingForDice: _waitingForDice,
              isHumanTurn: _isHumanTurn,
              diceRolling: _diceRolling,
              botBusy: _botBusy,
              gameOver: _gameOver,
              currentPlayer: _currentPlayer,
              legalPieces: _legalPieces,
              diceRotation: _diceRotation,
              onRollDice: _rollDice,
            ),

            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
//  BOARD PAINTER
// ─────────────────────────────────────────────────────────────────

class _LudoBoardPainter extends CustomPainter {
  final List<List<_Piece>> pieces;
  final int tokenCount;
  final int currentPlayer;
  final List<int> legalPieces;
  final int? selectedPiece;
  final double pulseFactor;

  _LudoBoardPainter({
    required this.pieces,
    required this.tokenCount,
    required this.currentPlayer,
    required this.legalPieces,
    required this.selectedPiece,
    required this.pulseFactor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width;
    final cell = s / 15; // 15×15 grid

    _drawBoard(canvas, s, cell);
    _drawPieces(canvas, s, cell);
  }

  void _drawBoard(Canvas canvas, double s, double cell) {
    final paint = Paint();

    // Background
    paint.color = _kBoard;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
          Rect.fromLTWH(0, 0, s, s), const Radius.circular(16)),
      paint,
    );

    // ── Home bases (corners 6×6) ───────────────────────────────
    final bases = [
      Offset(0, 0),          // Red (top-left)
      Offset(9 * cell, 0),   // Blue (top-right) — swapped for 2P layout
      Offset(0, 9 * cell),   // Yellow (bottom-left)
      Offset(9 * cell, 9 * cell), // Green (bottom-right)
    ];
    final baseColors = [_kRed, _kBlue, _kYellow, _kGreen];

    for (int i = 0; i < 4; i++) {
      // Outer base
      paint.color = baseColors[i].withOpacity(0.18);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(bases[i].dx, bases[i].dy, 6 * cell, 6 * cell),
          const Radius.circular(12),
        ),
        paint,
      );
      // Inner coloured pad
      paint.color = baseColors[i].withOpacity(0.35);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(
              bases[i].dx + cell, bases[i].dy + cell, 4 * cell, 4 * cell),
          const Radius.circular(8),
        ),
        paint,
      );
      // Corner label
      _drawText(
        canvas,
        _kPlayerNames[i][0],
        Offset(bases[i].dx + 3 * cell, bases[i].dy + 3 * cell),
        baseColors[i],
        cell * 0.7,
        bold: true,
      );
    }

    // ── Track cells (outer ring) ──────────────────────────────
    // Build list of all 52 track positions (row, col) on the 15×15 grid
    final track = _buildTrackCells();

    for (int i = 0; i < track.length; i++) {
      final (row, col) = track[i];
      final rect = Rect.fromLTWH(col * cell, row * cell, cell, cell);

      // Safety square highlight
      final isSafe = _kSafetySquares.contains(i);
      paint.color = isSafe ? _kSafe.withOpacity(0.22) : _kCell;
      canvas.drawRect(rect, paint);

      // Cell border
      paint.color = Colors.white.withOpacity(0.05);
      paint.style = PaintingStyle.stroke;
      paint.strokeWidth = 0.5;
      canvas.drawRect(rect, paint);
      paint.style = PaintingStyle.fill;

      // Star on safety square
      if (isSafe) {
        _drawStar(canvas, Offset(col * cell + cell / 2, row * cell + cell / 2),
            cell * 0.28, _kSafe.withOpacity(0.5));
      }
    }

    // ── Home stretches (coloured lanes) ───────────────────────
    _drawHomeStretches(canvas, cell);

    // ── Centre home triangle ───────────────────────────────────
    _drawCentreHome(canvas, cell);
  }

  // 52-cell track: column/row positions on 15×15 grid
  // Standard Ludo board layout
  List<(int, int)> _buildTrackCells() {
    final cells = <(int, int)>[];
    // Top section going right (row 6, col 0–5)
    for (int c = 0; c <= 5; c++) cells.add((6, c));
    // Right of top-left base, column 6 going up (rows 5→0)
    for (int r = 5; r >= 0; r--) cells.add((r, 6));
    // Top row going right (row 0, cols 7–8)
    for (int c = 7; c <= 8; c++) cells.add((0, c));
    // Column 8 going down (rows 1→5)
    for (int r = 1; r <= 5; r++) cells.add((r, 8));
    // Row 6 going right (cols 9–14)
    for (int c = 9; c <= 14; c++) cells.add((6, c));
    // Column 14 going down (rows 7→8)
    for (int r = 7; r <= 8; r++) cells.add((r, 14));
    // Row 8 going left (cols 13→9)
    for (int c = 13; c >= 9; c--) cells.add((8, c));
    // Column 8 going down (rows 9→14)
    for (int r = 9; r <= 14; r++) cells.add((8, r));
    // Row 14 going left (cols 7→6)
    for (int c = 7; c >= 6; c--) cells.add((14, c));
    // Column 6 going up (rows 13→9)
    for (int r = 13; r >= 9; r--) cells.add((r, 6));
    // Row 8 going left (cols 5→0)
    for (int c = 5; c >= 0; c--) cells.add((8, c));
    // Column 0 going up (rows 7→7)
    cells.add((7, 0));
    return cells;
  }

  void _drawHomeStretches(Canvas canvas, double cell) {
    final paint = Paint();
    // Red: row 7, cols 1–5 (→ centre)
    for (int c = 1; c <= 5; c++) {
      paint.color = _kRed.withOpacity(0.4);
      canvas.drawRect(Rect.fromLTWH(c * cell, 7 * cell, cell, cell), paint);
    }
    // Blue: col 7, rows 1–5 (↓ centre)
    for (int r = 1; r <= 5; r++) {
      paint.color = _kBlue.withOpacity(0.4);
      canvas.drawRect(Rect.fromLTWH(7 * cell, r * cell, cell, cell), paint);
    }
    // Yellow: col 7, rows 9–13 (↑ centre)
    for (int r = 9; r <= 13; r++) {
      paint.color = _kYellow.withOpacity(0.4);
      canvas.drawRect(Rect.fromLTWH(7 * cell, r * cell, cell, cell), paint);
    }
    // Green: row 7, cols 9–13 (← centre)
    for (int c = 9; c <= 13; c++) {
      paint.color = _kGreen.withOpacity(0.4);
      canvas.drawRect(Rect.fromLTWH(c * cell, 7 * cell, cell, cell), paint);
    }
  }

  void _drawCentreHome(Canvas canvas, double cell) {
    final cx = 7.5 * cell;
    final cy = 7.5 * cell;
    final r = 2.5 * cell;

    final path = Path();
    // Draw 4 coloured triangles pointing to centre
    final colors = [_kBlue, _kGreen, _kYellow, _kRed];
    final angles = [pi / 2, pi, 3 * pi / 2, 0]; // top, left, bottom, right
    for (int i = 0; i < 4; i++) {
      final paint = Paint()..color = colors[i].withOpacity(0.5);
      final p = Path();
      p.moveTo(cx, cy);
      final a = angles[i];
      p.lineTo(cx + r * cos(a - pi / 4), cy - r * sin(a - pi / 4));
      p.lineTo(cx + r * cos(a + pi / 4), cy - r * sin(a + pi / 4));
      p.close();
      canvas.drawPath(p, paint);
    }

    // Centre circle
    final paint = Paint()..color = _kBoard;
    canvas.drawCircle(Offset(cx, cy), cell * 0.8, paint);
    paint.color = _kSafe.withOpacity(0.6);
    paint.style = PaintingStyle.stroke;
    paint.strokeWidth = 2;
    canvas.drawCircle(Offset(cx, cy), cell * 0.8, paint);
    _drawText(canvas, '★', Offset(cx, cy), _kSafe, cell * 0.7);
  }

  void _drawPieces(Canvas canvas, double s, double cell) {
    final track = _buildTrackCells();
    final colors = [_kRed, _kYellow, _kGreen, _kBlue];

    // Base slot positions for each player corner
    final baseSlots = _buildBaseSlots(cell);

    for (int p = 0; p < 4; p++) {
      for (int i = 0; i < tokenCount; i++) {
        final piece = pieces[p][i];
        if (piece.isHome) continue;

        Offset center;
        if (piece.isInBase) {
          center = baseSlots[p][i];
        } else if (piece.position >= 52) {
          // Home stretch
          center = _homeStretchPos(p, piece.position - 52, cell);
        } else {
          // Main track
          final absPos = (_kStartPositions[p] + piece.position) % 52;
          final (row, col) = track[absPos];
          center = Offset(col * cell + cell / 2, row * cell + cell / 2);
        }

        final isMovable = p == currentPlayer && legalPieces.contains(i);
        final isSelected = p == currentPlayer && selectedPiece == i;
        final scale = (isMovable && !isSelected) ? pulseFactor : 1.0;
        final radius = cell * 0.38 * scale;

        // Glow for movable pieces
        if (isMovable) {
          final glowPaint = Paint()
            ..color = colors[p].withOpacity(0.35)
            ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6);
          canvas.drawCircle(center, radius + 4, glowPaint);
        }

        // Piece body
        final paint = Paint()..color = colors[p];
        canvas.drawCircle(center, radius, paint);

        // Inner highlight
        paint.color = Colors.white.withOpacity(0.25);
        canvas.drawCircle(
            Offset(center.dx - radius * 0.2, center.dy - radius * 0.2),
            radius * 0.4,
            paint);

        // Border
        paint.color = isSelected
            ? Colors.white
            : Colors.black.withOpacity(0.4);
        paint.style = PaintingStyle.stroke;
        paint.strokeWidth = isSelected ? 2.5 : 1.2;
        canvas.drawCircle(center, radius, paint);
        paint.style = PaintingStyle.fill;

        // Piece number
        _drawText(canvas, '${i + 1}', center, Colors.white, cell * 0.28,
            bold: true);
      }
    }
  }

  List<List<Offset>> _buildBaseSlots(double cell) {
    // 4-piece layout in each 4×4 base inner pad
    // Base pads start at (1,1), (1,10), (10,1), (10,10) of 15×15 grid
    final padStarts = [
      Offset(cell, cell),           // Red top-left
      Offset(10 * cell, cell),      // Blue top-right
      Offset(cell, 10 * cell),      // Yellow bottom-left
      Offset(10 * cell, 10 * cell), // Green bottom-right
    ];
    final slotOffsets = [
      Offset(cell * 0.75, cell * 0.75),
      Offset(cell * 2.25, cell * 0.75),
      Offset(cell * 0.75, cell * 2.25),
      Offset(cell * 2.25, cell * 2.25),
    ];
    return List.generate(4, (p) {
      return List.generate(4, (i) {
        final idx = i < slotOffsets.length ? i : 0;
        return padStarts[p] + slotOffsets[idx];
      });
    });
  }

  Offset _homeStretchPos(int player, int step, double cell) {
    // step 0–4 = home stretch cells, step 5 = centre
    switch (player) {
      case 0: // Red: row 7, cols 1–5
        return Offset((1 + step) * cell + cell / 2, 7 * cell + cell / 2);
      case 1: // Yellow: col 7, rows 9–13
        return Offset(7 * cell + cell / 2, (9 + step) * cell + cell / 2);
      case 2: // Green: row 7, cols 9–13
        return Offset((9 + step) * cell + cell / 2, 7 * cell + cell / 2);
      case 3: // Blue: col 7, rows 1–5
        return Offset(7 * cell + cell / 2, (1 + step) * cell + cell / 2);
      default:
        return Offset(7.5 * cell, 7.5 * cell);
    }
  }

  void _drawStar(Canvas canvas, Offset center, double r, Color color) {
    final paint = Paint()..color = color;
    final path = Path();
    for (int i = 0; i < 10; i++) {
      final angle = (i * pi / 5) - pi / 2;
      final rad = i.isEven ? r : r * 0.45;
      final x = center.dx + rad * cos(angle);
      final y = center.dy + rad * sin(angle);
      if (i == 0) path.moveTo(x, y); else path.lineTo(x, y);
    }
    path.close();
    canvas.drawPath(path, paint);
  }

  void _drawText(Canvas canvas, String text, Offset center, Color color,
      double size, {bool bold = false}) {
    final tp = TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(
          color: color,
          fontSize: size,
          fontWeight: bold ? FontWeight.w900 : FontWeight.w400,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    tp.paint(
        canvas, center - Offset(tp.width / 2, tp.height / 2));
  }

  @override
  bool shouldRepaint(_LudoBoardPainter old) => true;
}

// ─────────────────────────────────────────────────────────────────
//  PIECE TAP OVERLAY
//  Transparent gesture layer aligned with the board
// ─────────────────────────────────────────────────────────────────

class _PieceTapOverlay extends StatelessWidget {
  final double boardSize;
  final List<List<_Piece>> pieces;
  final int tokenCount;
  final int currentPlayer;
  final List<int> legalPieces;
  final bool isHumanTurn;
  final bool waitingForDice;
  final void Function(int pieceIdx) onPieceTapped;

  const _PieceTapOverlay({
    required this.boardSize,
    required this.pieces,
    required this.tokenCount,
    required this.currentPlayer,
    required this.legalPieces,
    required this.isHumanTurn,
    required this.waitingForDice,
    required this.onPieceTapped,
  });

  @override
  Widget build(BuildContext context) {
    if (!isHumanTurn || waitingForDice || legalPieces.isEmpty) {
      return const SizedBox.expand();
    }

    final cell = boardSize / 15;
    final painter = _LudoBoardPainter(
      pieces: pieces,
      tokenCount: tokenCount,
      currentPlayer: currentPlayer,
      legalPieces: legalPieces,
      selectedPiece: null,
      pulseFactor: 1.0,
    );

    final track = painter._buildTrackCells();
    final baseSlots = painter._buildBaseSlots(cell);

    return Stack(
      children: List.generate(legalPieces.length, (idx) {
        final pieceIdx = legalPieces[idx];
        final piece = pieces[currentPlayer][pieceIdx];

        Offset center;
        if (piece.isInBase) {
          center = baseSlots[currentPlayer][pieceIdx];
        } else if (piece.position >= 52) {
          center = painter._homeStretchPos(
              currentPlayer, piece.position - 52, cell);
        } else {
          final absPos =
              (_kStartPositions[currentPlayer] + piece.position) % 52;
          final (row, col) = track[absPos];
          center = Offset(col * cell + cell / 2, row * cell + cell / 2);
        }

        const tapSize = 44.0;
        return Positioned(
          left: center.dx - tapSize / 2,
          top: center.dy - tapSize / 2,
          child: GestureDetector(
            onTap: () => onPieceTapped(pieceIdx),
            child: Container(
              width: tapSize,
              height: tapSize,
              color: Colors.transparent,
            ),
          ),
        );
      }),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
//  PLAYER STRIP
// ─────────────────────────────────────────────────────────────────

class _PlayerStrip extends StatelessWidget {
  final String label;
  final List<Color> colors;
  final bool isActive;
  final List<int> pieceCounts; // home counts per house
  final int totalPieces;

  const _PlayerStrip({
    required this.label,
    required this.colors,
    required this.isActive,
    required this.pieceCounts,
    required this.totalPieces,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: isActive ? kBgCard : kBgDeep,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isActive ? kCyan.withOpacity(0.4) : kBorder,
          width: isActive ? 1.5 : 1,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isActive ? kCyan : Colors.white24,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                label,
                style: TextStyle(
                  color: isActive ? kTextPri : kTextSec,
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          // House indicators
          Row(
            children: List.generate(colors.length, (i) {
              final homeCount = i < pieceCounts.length ? pieceCounts[i] : 0;
              return Padding(
                padding: const EdgeInsets.only(left: 12),
                child: Row(
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: colors[i],
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '$homeCount/$totalPieces',
                      style: TextStyle(
                        color: colors[i],
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
//  BOTTOM BAR — Dice + status
// ─────────────────────────────────────────────────────────────────

class _BottomBar extends StatelessWidget {
  final int diceRoll;
  final bool waitingForDice;
  final bool isHumanTurn;
  final bool diceRolling;
  final bool botBusy;
  final bool gameOver;
  final int currentPlayer;
  final List<int> legalPieces;
  final Animation<double> diceRotation;
  final VoidCallback onRollDice;

  const _BottomBar({
    required this.diceRoll,
    required this.waitingForDice,
    required this.isHumanTurn,
    required this.diceRolling,
    required this.botBusy,
    required this.gameOver,
    required this.currentPlayer,
    required this.legalPieces,
    required this.diceRotation,
    required this.onRollDice,
  });

  String get _statusText {
    if (gameOver) return 'Game Over';
    if (!isHumanTurn) return 'Computer is thinking...';
    if (waitingForDice) return 'Tap the dice to roll';
    if (legalPieces.isEmpty) return 'No moves — passing turn';
    return 'Tap a highlighted piece to move';
  }

  Color get _statusColor {
    if (!isHumanTurn) return kTextSec;
    if (waitingForDice) return kCyan;
    return kOrange;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: kBgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: kBorder),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Status text
          Expanded(
            child: Text(
              _statusText,
              style: TextStyle(
                color: _statusColor,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),

          // Dice
          AnimatedBuilder(
            animation: diceRotation,
            builder: (_, __) {
              return Transform.rotate(
                angle: diceRolling ? diceRotation.value : 0,
                child: GestureDetector(
                  onTap: isHumanTurn && waitingForDice && !gameOver
                      ? onRollDice
                      : null,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: isHumanTurn && waitingForDice && !gameOver
                          ? kOrange
                          : kBgDeep,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isHumanTurn && waitingForDice && !gameOver
                            ? kOrange
                            : kBorder,
                        width: 2,
                      ),
                      boxShadow: isHumanTurn && waitingForDice && !gameOver
                          ? [BoxShadow(
                              color: kOrange.withOpacity(0.4),
                              blurRadius: 12,
                              spreadRadius: 1,
                            )]
                          : [],
                    ),
                    child: Center(
                      child: diceRoll == 0
                          ? const Icon(Icons.casino_rounded,
                              color: Colors.white, size: 26)
                          : Text(
                              _diceFace(diceRoll),
                              style: const TextStyle(fontSize: 28),
                            ),
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  String _diceFace(int roll) {
    const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    if (roll < 1 || roll > 6) return '🎲';
    return faces[roll - 1];
  }
}
