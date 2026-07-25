import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../theme.dart';

// ─────────────────────────────────────────────────────────────────
//  LUDO GAME SCREEN  — fixed & wired
//
//  Turn state machine:
//    waitingForDice=true  → human taps dice / bot auto-rolls
//    waitingForDice=false → show result, compute legal moves
//                           human taps piece / bot picks via server
//    after move → check win → next player → waitingForDice=true
//
//  2-player model:
//    Human = players 0 (Red)  & 1 (Yellow)
//    Bot   = players 2 (Green) & 3 (Blue)
// ─────────────────────────────────────────────────────────────────

const String _kAiBase = 'https://gamearn-bot.onrender.com';

const Color _kRed    = Color(0xFFE53935);
const Color _kBlue   = Color(0xFF1E88E5);
const Color _kGreen  = Color(0xFF43A047);
const Color _kYellow = Color(0xFFFDD835);
const Color _kSafe   = Color(0xFF22D1EE);
const Color _kBoard  = Color(0xFF0D1120);
const Color _kCell   = Color(0xFF141827);

const List<Color> _kColors = [_kRed, _kYellow, _kGreen, _kBlue];
const List<String> _kNames  = ['Red', 'Yellow', 'Green', 'Blue'];

// Absolute path start per player on the 52-cell ring
const List<int> _kStart = [0, 13, 26, 39];
// Safety squares (absolute positions)
const Set<int> _kSafe52 = {0, 8, 13, 21, 26, 34, 39, 47};

class _Piece {
  int  pos;        // -1 = base | 0-51 = ring | 52-57 = home stretch | 58 = home
  bool inBase;
  bool home;
  _Piece() : pos = -1, inBase = true, home = false;
  _Piece.copy(_Piece o) : pos = o.pos, inBase = o.inBase, home = o.home;
}

// ─────────────────────────────────────────────────────────────────
class LudoGameScreen extends StatefulWidget {
  final int tokenCount;
  const LudoGameScreen({super.key, this.tokenCount = 4});
  @override State<LudoGameScreen> createState() => _LudoGameScreenState();
}

class _LudoGameScreenState extends State<LudoGameScreen>
    with TickerProviderStateMixin {

  // ── Core state ────────────────────────────────────────────────
  late List<List<_Piece>> _pieces;
  List<int> _actionHistory = [];
  int  _current    = 0;   // current player (0-3)
  int  _dice       = 0;   // 1-6, 0 = not yet rolled
  bool _waiting    = true; // true = need to roll dice
  bool _gameOver   = false;
  int  _winner     = -1;
  int  _consSixes  = 0;    // consecutive sixes

  bool get _isHuman => _current == 0 || _current == 1;

  // ── UI state ──────────────────────────────────────────────────
  bool _botBusy    = false;
  bool _rolling    = false;
  List<int> _legal = [];   // legal piece indices for current player
  int? _selected;          // tapped piece index

  // ── Animations ────────────────────────────────────────────────
  late AnimationController _diceCtrl;
  late Animation<double>   _diceRot;
  late AnimationController _pulseCtrl;
  late Animation<double>   _pulse;

  // ── Init ──────────────────────────────────────────────────────
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
  }

  @override
  void dispose() {
    _diceCtrl.dispose();
    _pulseCtrl.dispose();
    super.dispose();
  }

  void _reset() {
    _pieces = List.generate(4, (_) =>
        List.generate(widget.tokenCount, (_) => _Piece()));
    _actionHistory = [];
    _current     = 0;
    _dice        = 0;
    _waiting     = true;
    _gameOver    = false;
    _winner      = -1;
    _consSixes   = 0;
    _legal       = [];
    _selected    = null;
    _botBusy     = false;
  }

  // ─── DICE ────────────────────────────────────────────────────

  Future<void> _humanRoll() async {
    if (!_waiting || _rolling || _gameOver || !_isHuman) return;
    setState(() => _rolling = true);
    _diceCtrl.forward(from: 0);

    final roll = Random().nextInt(6) + 1;
    await Future.delayed(const Duration(milliseconds: 520));

    _actionHistory.add(roll - 1); // chance action = roll - 1
    setState(() {
      _dice    = roll;
      _waiting = false;
      _rolling = false;
      _legal   = _legalPieces();
    });

    // No moves → auto pass after short delay
    if (_legal.isEmpty) {
      await Future.delayed(const Duration(milliseconds: 600));
      _doPass();
    }
  }

  // ─── MOVE LOGIC ──────────────────────────────────────────────

  List<int> _legalPieces() {
    final out = <int>[];
    for (int i = 0; i < widget.tokenCount; i++) {
      final p = _pieces[_current][i];
      if (p.home) continue;
      if (p.inBase) {
        if (_dice == 6) out.add(i);
      } else {
        if (p.pos + _dice <= 57) out.add(i); // 57 = home (0-indexed max)
      }
    }
    return out;
  }

  void _onPieceTap(int idx) {
    if (_waiting || !_isHuman || _gameOver) return;
    if (!_legal.contains(idx)) return;
    setState(() => _selected = idx);
    _applyMove(_current, idx);
  }

  void _applyMove(int player, int idx) {
    _actionHistory.add(1 + idx); // kMovePieceBase + idx

    setState(() {
      final p    = _pieces[player][idx];
      bool bonus = false;

      if (p.inBase) {
        p.inBase = false;
        p.pos    = 0;
      } else {
        p.pos += _dice;
        if (p.pos >= 57) { p.pos = 57; p.home = true; }
      }

      // Capture (main path only, non-safety)
      if (!p.home && p.pos < 52) {
        final abs = (_kStart[player] + p.pos) % 52;
        if (!_kSafe52.contains(abs)) {
          for (int op = 0; op < 4; op++) {
            if (op == player) continue;
            for (int oi = 0; oi < widget.tokenCount; oi++) {
              final o = _pieces[op][oi];
              if (!o.inBase && !o.home && o.pos < 52) {
                if ((_kStart[op] + o.pos) % 52 == abs) {
                  o.inBase = true; o.pos = -1;
                  bonus = true;
                }
              }
            }
          }
        }
      }

      // Win?
      if (_pieces[player].every((x) => x.home)) {
        _gameOver = true; _winner = player;
        _legal = []; _selected = null;
        return;
      }

      // Six bonus
      if (_dice == 6) {
        _consSixes++;
        if (_consSixes < 3) bonus = true;
        else _consSixes = 0;
      } else {
        _consSixes = 0;
      }

      if (!bonus) _current = (_current + 1) % 4;
      _waiting  = true;
      _legal    = [];
      _selected = null;
      _dice     = 0;
    });

    if (_gameOver) { _showGameOver(); return; }
    // If next player is bot, kick off bot loop
    if (!_isHuman) _botTurn();
  }

  void _doPass() {
    _actionHistory.add(0);
    setState(() {
      _consSixes = 0;
      _current   = (_current + 1) % 4;
      _waiting   = true;
      _legal     = [];
      _dice      = 0;
    });
    if (!_isHuman && !_gameOver) _botTurn();
  }

  // ─── BOT TURN ─────────────────────────────────────────────────
  // Drives itself in a loop while it's still the bot's turn.
  // Human taps _humanRoll() to start their own turn.
  Future<void> _botTurn() async {
    if (_botBusy || _gameOver) return;
    _botBusy = true;

    while (!_isHuman && !_gameOver && mounted) {
      // 1 ─ Roll dice
      await Future.delayed(const Duration(milliseconds: 650));
      if (!mounted || _gameOver) break;

      final roll = Random().nextInt(6) + 1;
      _actionHistory.add(roll - 1);

      if (mounted) setState(() { _dice = roll; _waiting = false; });
      await Future.delayed(const Duration(milliseconds: 400));
      if (!mounted || _gameOver) break;

      // 2 ─ Compute legal moves locally (instant)
      final lp = _legalPieces();

      if (lp.isEmpty) {
        // Pass
        _actionHistory.add(0);
        if (mounted) setState(() {
          _consSixes = 0;
          _current   = (_current + 1) % 4;
          _waiting   = true;
          _legal     = [];
          _dice      = 0;
        });
        if (_isHuman) break;        // human's turn now
        await Future.delayed(const Duration(milliseconds: 300));
        continue;
      }

      // 3 ─ Ask server for move action
      int action = -1;
      try {
        final res = await http.post(
          Uri.parse('$_kAiBase/get_move'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'game_name': 'ludo', 'action_history': List<int>.from(_actionHistory)}),
        ).timeout(const Duration(seconds: 6));
        if (res.statusCode == 200) {
          action = (jsonDecode(res.body)['action'] as num).toInt();
        }
      } catch (_) { /* fall through to random */ }

      // Validate server action; fall back to random legal piece
      final validPieceIdx = (action > 0 && lp.contains(action - 1)) ? action - 1 : lp[Random().nextInt(lp.length)];

      // 4 ─ Apply move directly (no call to _applyMove to avoid recursion)
      await Future.delayed(const Duration(milliseconds: 350));
      if (!mounted || _gameOver) break;

      _actionHistory.add(1 + validPieceIdx);

      if (mounted) setState(() {
        final pc   = _pieces[_current][validPieceIdx];
        bool bonus = false;

        if (pc.inBase) {
          pc.inBase = false;
          pc.pos    = 0;
        } else {
          pc.pos += _dice;
          if (pc.pos >= 57) { pc.pos = 57; pc.home = true; }
        }

        // Capture
        if (!pc.home && pc.pos < 52) {
          final abs = (_kStart[_current] + pc.pos) % 52;
          if (!_kSafe52.contains(abs)) {
            for (int op = 0; op < 4; op++) {
              if (op == _current) continue;
              for (int oi = 0; oi < widget.tokenCount; oi++) {
                final o = _pieces[op][oi];
                if (!o.inBase && !o.home && o.pos < 52) {
                  if ((_kStart[op] + o.pos) % 52 == abs) {
                    o.inBase = true; o.pos = -1; bonus = true;
                  }
                }
              }
            }
          }
        }

        // Win?
        if (_pieces[_current].every((x) => x.home)) {
          _gameOver = true; _winner = _current;
          _legal = []; _dice = 0;
          return;
        }

        // Six bonus
        if (_dice == 6) {
          _consSixes++;
          if (_consSixes < 3) bonus = true; else _consSixes = 0;
        } else {
          _consSixes = 0;
        }

        if (!bonus) _current = (_current + 1) % 4;
        _waiting = true;
        _legal   = [];
        _dice    = 0;
      });

      if (_gameOver) { _showGameOver(); break; }
      if (_isHuman)  break;   // hand off to human
      await Future.delayed(const Duration(milliseconds: 200));
    }

    _botBusy = false;
  }

  // ─── GAME OVER ────────────────────────────────────────────────
  void _showGameOver() {
    final humanWon = _winner == 0 || _winner == 1;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        backgroundColor: kBgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          humanWon ? '🎉 You Win!' : '😞 You Lost',
          style: const TextStyle(color: kTextPri, fontWeight: FontWeight.w800),
          textAlign: TextAlign.center,
        ),
        content: Text(
          '${_kNames[_winner]} house wins!',
          style: const TextStyle(color: kTextSec),
          textAlign: TextAlign.center,
        ),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() => _reset());
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

  // ─── STATUS TEXT ──────────────────────────────────────────────
  String get _statusText {
    if (_gameOver)   return 'Game Over';
    if (_botBusy)    return '${_kNames[_current]} is thinking…';
    if (!_isHuman)   return 'Computer\'s turn';
    if (_waiting)    return 'Tap ⚄ to roll';
    if (_legal.isEmpty) return 'No moves — passing…';
    return 'Tap a glowing piece to move';
  }

  // ─── BUILD ────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final sw = MediaQuery.of(context).size.width;
    final bs = sw - 16; // board size

    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: Colors.white, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Lúdò',
            style: TextStyle(
                color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18)),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.white54),
            onPressed: () => setState(() => _reset()),
          )
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // ── Bot player strip ───────────────────────────────
            _Strip(
              label: 'Computer',
              colors: const [_kGreen, _kBlue],
              active: !_isHuman && !_gameOver,
              homes: [
                _pieces[2].where((x) => x.home).length,
                _pieces[3].where((x) => x.home).length,
              ],
              total: widget.tokenCount,
            ),

            // ── Board ──────────────────────────────────────────
            Expanded(
              child: Center(
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
                          tokenCount: widget.tokenCount,
                          current: _current,
                          legal: _legal,
                          selected: _selected,
                          pulse: _pulse.value,
                        ),
                      ),
                      _TapLayer(
                        boardSize: bs,
                        pieces: _pieces,
                        tokenCount: widget.tokenCount,
                        current: _current,
                        legal: _legal,
                        isHuman: _isHuman,
                        waiting: _waiting,
                        onTap: _onPieceTap,
                      ),
                    ]),
                  ),
                ),
              ),
            ),

            // ── Human player strip ─────────────────────────────
            _Strip(
              label: 'You',
              colors: const [_kRed, _kYellow],
              active: _isHuman && !_gameOver,
              homes: [
                _pieces[0].where((x) => x.home).length,
                _pieces[1].where((x) => x.home).length,
              ],
              total: widget.tokenCount,
            ),

            // ── Bottom bar ─────────────────────────────────────
            _BottomBar(
              dice: _dice,
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

  // ── Board layout ─────────────────────────────────────────────
  void _drawBoard(Canvas canvas, double s, double cell) {
    final p = Paint();

    // Background
    p.color = _kBoard;
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(0, 0, s, s), const Radius.circular(14)),
      p,
    );

    // ── Corners (6×6) ─────────────────────────────────────────
    // Standard Ludo: Red=TL, Green=TR, Yellow=BL, Blue=BR
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

      // Outer fill
      p.color = bg.withOpacity(0.15);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
            Rect.fromLTWH(o.dx, o.dy, 6 * cell, 6 * cell),
            const Radius.circular(10)),
        p,
      );

      // Inner coloured yard
      p.color = bg.withOpacity(0.30);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
            Rect.fromLTWH(o.dx + cell, o.dy + cell, 4 * cell, 4 * cell),
            const Radius.circular(8)),
        p,
      );

      // "Yard" circle overlay for each piece slot
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

    // ── Track cells ────────────────────────────────────────────
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

    // ── Home stretches ─────────────────────────────────────────
    _drawStretches(canvas, cell);

    // ── Centre home ────────────────────────────────────────────
    _drawCentre(canvas, cell);
  }

  void _drawStretches(Canvas canvas, double cell) {
    final p = Paint();
    // Red:    row 7, cols 1-5  → right
    for (int c = 1; c <= 5; c++) {
      p.color = _kRed.withOpacity(0.35);
      canvas.drawRect(Rect.fromLTWH(c * cell, 7 * cell, cell, cell), p);
    }
    // Green:  row 7, cols 9-13 ← left
    for (int c = 9; c <= 13; c++) {
      p.color = _kGreen.withOpacity(0.35);
      canvas.drawRect(Rect.fromLTWH(c * cell, 7 * cell, cell, cell), p);
    }
    // Yellow: col 7, rows 9-13 ↑ up
    for (int r = 9; r <= 13; r++) {
      p.color = _kYellow.withOpacity(0.35);
      canvas.drawRect(Rect.fromLTWH(7 * cell, r * cell, cell, cell), p);
    }
    // Blue:   col 7, rows 1-5  ↓ down
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
    _drawText(canvas, '★', Offset(cx, cy), _kSafe, cell * 0.65);
  }

  // ── Pieces ────────────────────────────────────────────────────
  void _drawPieces(Canvas canvas, double s, double cell) {
    final track = _track();

    for (int pl = 0; pl < 4; pl++) {
      for (int i = 0; i < tokenCount; i++) {
        final pc = pieces[pl][i];
        if (pc.home) continue;

        Offset center;
        if (pc.inBase) {
          center = _baseSlots(cell, pl)[i < 4 ? i : 0];
        } else if (pc.pos >= 52) {
          center = _stretchPos(pl, pc.pos - 52, cell);
        } else {
          final abs = (_kStart[pl] + pc.pos) % 52;
          final (row, col) = track[abs];
          center = Offset(col * cell + cell / 2, row * cell + cell / 2);
        }

        final movable = pl == current && legal.contains(i);
        final sel     = pl == current && selected == i;
        final scale   = (movable && !sel) ? pulse : 1.0;
        final radius  = cell * 0.36 * scale;

        if (movable) {
          final gp = Paint()
            ..color     = _kColors[pl].withOpacity(0.3)
            ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 7);
          canvas.drawCircle(center, radius + 5, gp);
        }

        final fp = Paint()..color = _kColors[pl];
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

  // ── Helpers ───────────────────────────────────────────────────

  // 52-cell track positions on 15×15 grid
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

  // Base yard slot centres for player `pl` (4 slots max)
  List<Offset> _baseSlots(double cell, int pl) {
    // yard inner pads at: TL=(1,1), TR=(10,1), BL=(1,10), BR=(10,10)  [row,col]
    final pads = [
      Offset(cell, cell),           // Red   TL
      Offset(10 * cell, cell),      // Green TR
      Offset(cell, 10 * cell),      // Yellow BL
      Offset(10 * cell, 10 * cell), // Blue  BR
    ];
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
      case 0: return Offset((1 + step) * cell + cell / 2, 7 * cell + cell / 2);   // Red
      case 1: return Offset(7 * cell + cell / 2, (9 + step) * cell + cell / 2);   // Yellow
      case 2: return Offset((9 + step) * cell + cell / 2, 7 * cell + cell / 2);   // Green
      case 3: return Offset(7 * cell + cell / 2, (1 + step) * cell + cell / 2);   // Blue
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

// ─────────────────────────────────────────────────────────────────
//  TAP LAYER
// ─────────────────────────────────────────────────────────────────
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
        Offset c;
        if (pc.inBase) {
          c = painter._baseSlots(cell, current)[idx < 4 ? idx : 0];
        } else if (pc.pos >= 52) {
          c = painter._stretchPos(current, pc.pos - 52, cell);
        } else {
          final abs = (_kStart[current] + pc.pos) % 52;
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

// ─────────────────────────────────────────────────────────────────
//  PLAYER STRIP
// ─────────────────────────────────────────────────────────────────
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
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
      decoration: BoxDecoration(
        color: active ? kBgCard : kBgDeep,
        borderRadius: BorderRadius.circular(12),
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
              width: 8, height: 8,
              decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: active ? kCyan : Colors.white24),
            ),
            const SizedBox(width: 10),
            Text(label,
                style: TextStyle(
                    color: active ? kTextPri : kTextSec,
                    fontWeight: FontWeight.w700,
                    fontSize: 14)),
          ]),
          Row(
            children: List.generate(colors.length, (i) {
              final hc = i < homes.length ? homes[i] : 0;
              return Padding(
                padding: const EdgeInsets.only(left: 12),
                child: Row(children: [
                  Container(
                      width: 10, height: 10,
                      decoration: BoxDecoration(
                          shape: BoxShape.circle, color: colors[i])),
                  const SizedBox(width: 4),
                  Text('$hc/$total',
                      style: TextStyle(
                          color: colors[i], fontSize: 12,
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

// ─────────────────────────────────────────────────────────────────
//  BOTTOM BAR
// ─────────────────────────────────────────────────────────────────
class _BottomBar extends StatelessWidget {
  final int dice;
  final bool waiting, isHuman, rolling, busy, gameOver;
  final List<int> legal;
  final Animation<double> rot;
  final String status;
  final VoidCallback onRoll;

  const _BottomBar({
    required this.dice, required this.waiting, required this.isHuman,
    required this.rolling, required this.busy, required this.gameOver,
    required this.legal, required this.rot, required this.status,
    required this.onRoll,
  });

  bool get _canRoll => isHuman && waiting && !gameOver && !busy;

  String _face(int r) {
    const f = ['⚀','⚁','⚂','⚃','⚄','⚅'];
    return (r >= 1 && r <= 6) ? f[r - 1] : '🎲';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8),
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
      decoration: BoxDecoration(
        color: kBgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kBorder),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              status,
              style: TextStyle(
                color: _canRoll ? kCyan : (!isHuman ? kTextSec : kOrange),
                fontSize: 13, fontWeight: FontWeight.w600,
              ),
            ),
          ),
          AnimatedBuilder(
            animation: rot,
            builder: (_, __) => Transform.rotate(
              angle: rolling ? rot.value : 0,
              child: GestureDetector(
                onTap: _canRoll ? onRoll : null,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 52, height: 52,
                  decoration: BoxDecoration(
                    color: _canRoll ? kOrange : kBgDeep,
                    borderRadius: BorderRadius.circular(12),
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
                        ? const Icon(Icons.casino_rounded,
                            color: Colors.white, size: 26)
                        : Text(_face(dice),
                            style: const TextStyle(fontSize: 28)),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
