import 'dart:math';
import 'package:flutter/material.dart';

// ─────────────────────────────────────────────────────────────────
//  WHOT GAME SCREEN
//  Matches Figma design: dark bg #0B0E1A, cyan glow #22D1EE,
//  orange accent #FF5E00. Oval card table, player hands top/bottom,
//  center pile, confirm indicator, action overlay.
// ─────────────────────────────────────────────────────────────────

// ── Colors ────────────────────────────────────────────────────────
const _bg = Color(0xFF0B0E1A);
const _cyan = Color(0xFF22D1EE);
const _orange = Color(0xFFFF5E00);
const _surface = Color(0xFF1E293B);
const _textPrimary = Color(0xFFF1F5F9);
const _textSub = Color(0xFF94A3B8);
const _green = Color(0xFF2BEE79);

// ── Whot Card Shapes ──────────────────────────────────────────────
enum WhotShape { circle, triangle, cross, square, star, whot }

// ── Card Model ────────────────────────────────────────────────────
class WhotCard {
  final WhotShape shape;
  final int number; // 1–14, 20 = Whot
  final bool isFaceDown;

  const WhotCard({
    required this.shape,
    required this.number,
    this.isFaceDown = false,
  });

  static WhotCard faceDown() =>
      const WhotCard(shape: WhotShape.circle, number: 0, isFaceDown: true);
}

// ── Game Screen ───────────────────────────────────────────────────
class WhotGameScreen extends StatefulWidget {
  final String opponentName;
  final String opponentAvatar; // asset path or network url
  final String playerName;
  final String playerAvatar;
  final VoidCallback? onBack;

  const WhotGameScreen({
    super.key,
    this.opponentName = 'Opponent',
    this.opponentAvatar = '',
    this.playerName = 'You',
    this.playerAvatar = '',
    this.onBack,
  });

  @override
  State<WhotGameScreen> createState() => _WhotGameScreenState();
}

class _WhotGameScreenState extends State<WhotGameScreen>
    with TickerProviderStateMixin {
  late AnimationController _glowController;
  late AnimationController _cardPlayController;
  late Animation<double> _glowAnim;

  // Dummy game state
  final List<WhotCard> _playerHand = [
    const WhotCard(shape: WhotShape.circle, number: 3),
    const WhotCard(shape: WhotShape.triangle, number: 7),
    const WhotCard(shape: WhotShape.cross, number: 5),
    const WhotCard(shape: WhotShape.square, number: 2),
    const WhotCard(shape: WhotShape.star, number: 8),
    const WhotCard(shape: WhotShape.circle, number: 1),
  ];

  final List<WhotCard> _opponentHand = List.generate(
    5,
    (_) => WhotCard.faceDown(),
  );

  final WhotCard _topCard =
      const WhotCard(shape: WhotShape.circle, number: 5);

  int _selectedCardIndex = -1;
  bool _isPlayerTurn = true;
  int _opponentCardCount = 5;
  int _playerCardCount = 6;
  bool _showCallCard = false;

  @override
  void initState() {
    super.initState();
    _glowController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    _glowAnim = Tween<double>(begin: 0.4, end: 0.9).animate(
      CurvedAnimation(parent: _glowController, curve: Curves.easeInOut),
    );

    _cardPlayController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
  }

  @override
  void dispose() {
    _glowController.dispose();
    _cardPlayController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: Stack(
        children: [
          // Background glow
          _BackgroundGlow(animation: _glowAnim),

          // Main layout
          SafeArea(
            child: Column(
              children: [
                _buildTopBar(),
                _buildOpponentArea(),
                Expanded(child: _buildTable()),
                _buildPlayerArea(),
                const SizedBox(height: 16),
              ],
            ),
          ),

          // Call card overlay
          if (_showCallCard) _buildCallCardOverlay(),
        ],
      ),
    );
  }

  // ── Top Bar ──────────────────────────────────────────────────────
  Widget _buildTopBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Row(
        children: [
          GestureDetector(
            onTap: widget.onBack ?? () => Navigator.maybePop(context),
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: _surface,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.arrow_back_ios_new,
                  color: _textPrimary, size: 16),
            ),
          ),
          const Spacer(),
          Column(
            children: [
              const Text('WHOT',
                  style: TextStyle(
                      color: _cyan,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 3)),
              Text(
                _isPlayerTurn ? 'Your turn' : "${widget.opponentName}'s turn",
                style: TextStyle(
                  color: _isPlayerTurn ? _orange : _textSub,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const Spacer(),
          // Settings
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: _surface,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.more_vert, color: _textPrimary, size: 20),
          ),
        ],
      ),
    );
  }

  // ── Opponent Area ─────────────────────────────────────────────────
  Widget _buildOpponentArea() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          _PlayerInfo(
            name: widget.opponentName,
            avatarUrl: widget.opponentAvatar,
            cardCount: _opponentCardCount,
            isActive: !_isPlayerTurn,
          ),
          const Spacer(),
          // Opponent cards (face down fan)
          SizedBox(
            height: 60,
            width: 130,
            child: Stack(
              children: List.generate(
                min(_opponentCardCount, 5),
                (i) => Positioned(
                  left: i * 20.0,
                  child: _WhotCardWidget(
                    card: WhotCard.faceDown(),
                    width: 44,
                    height: 60,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Game Table ────────────────────────────────────────────────────
  Widget _buildTable() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: CustomPaint(
        painter: _TablePainter(),
        child: Center(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Draw pile
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _WhotCardWidget(
                    card: WhotCard.faceDown(),
                    width: 64,
                    height: 88,
                  ),
                  const SizedBox(height: 6),
                  const Text('Draw', style: TextStyle(color: _textSub, fontSize: 11)),
                ],
              ),
              const SizedBox(width: 32),
              // Top of discard pile
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _WhotCardWidget(
                    card: _topCard,
                    width: 64,
                    height: 88,
                    isTop: true,
                  ),
                  const SizedBox(height: 6),
                  const Text('Pile', style: TextStyle(color: _textSub, fontSize: 11)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Player Area ───────────────────────────────────────────────────
  Widget _buildPlayerArea() {
    return Column(
      children: [
        // Card hand
        SizedBox(
          height: 90,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _playerHand.length,
            itemBuilder: (context, i) {
              final isSelected = _selectedCardIndex == i;
              final isValidPlay = _canPlayCard(_playerHand[i]);
              
              return GestureDetector(
                onTap: () {
                  if (!isValidPlay && !isSelected) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Invalid card! Must match shape or number.'),
                        backgroundColor: Colors.redAccent,
                        behavior: SnackBarBehavior.floating,
                        duration: Duration(seconds: 1),
                      )
                    );
                    return;
                  }
                  setState(() {
                    _selectedCardIndex = isSelected ? -1 : i;
                  });
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  curve: Curves.easeOut,
                  margin: EdgeInsets.only(
                    right: 8,
                    bottom: isSelected ? 12 : 0,
                  ),
                  child: _WhotCardWidget(
                    card: _playerHand[i],
                    width: 56,
                    height: 76,
                    isSelected: isSelected,
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 12),
        // Action row
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            children: [
              _PlayerInfo(
                name: widget.playerName,
                avatarUrl: widget.playerAvatar,
                cardCount: _playerCardCount,
                isActive: _isPlayerTurn,
                isPlayer: true,
              ),
              const Spacer(),
              // Action buttons
              if (_selectedCardIndex >= 0)
                _ActionButton(
                  label: 'Play',
                  color: _orange,
                  onTap: _playCard,
                )
              else
                _ActionButton(
                  label: 'Draw',
                  color: _surface,
                  textColor: _textPrimary,
                  onTap: _drawCard,
                ),
              const SizedBox(width: 8),
              _ActionButton(
                label: 'Call',
                color: _green.withOpacity(0.15),
                textColor: _green,
                borderColor: _green,
                onTap: () => setState(() => _showCallCard = true),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ── Call Card Overlay ─────────────────────────────────────────────
  Widget _buildCallCardOverlay() {
    return GestureDetector(
      onTap: () => setState(() => _showCallCard = false),
      child: Container(
        color: Colors.black54,
        child: Center(
          child: Container(
            margin: const EdgeInsets.all(20),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: _bg,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: _cyan.withOpacity(0.2)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Call Card',
                    style: TextStyle(
                        color: _textPrimary,
                        fontSize: 18,
                        fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Text(
                  'Declare your last card when you have 1 left',
                  style:
                      const TextStyle(color: _textSub, fontSize: 13),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _orange,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                    minimumSize: const Size(double.infinity, 48),
                  ),
                  onPressed: () => setState(() => _showCallCard = false),
                  child: const Text('CALL CARD!',
                      style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  bool _canPlayCard(WhotCard card) {
    // A valid play: matching shape, matching number (cross-suit), or Whot card (id 20)
    if (card.shape == WhotShape.whot || card.number == 20) return true;
    if (card.shape == _topCard.shape) return true;
    if (card.number == _topCard.number) return true;
    return false;
  }

  void _playCard() {
    if (_selectedCardIndex < 0) return;
    setState(() {
      _playerHand.removeAt(_selectedCardIndex);
      _selectedCardIndex = -1;
      _playerCardCount--;
      _isPlayerTurn = false;
    });
    // Simulate opponent turn
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted) setState(() => _isPlayerTurn = true);
    });
  }

  void _drawCard() {
    setState(() {
      _playerHand.add(
        const WhotCard(shape: WhotShape.triangle, number: 4),
      );
      _playerCardCount++;
      _isPlayerTurn = false;
    });
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted) setState(() => _isPlayerTurn = true);
    });
  }
}

// ── Background Glow ───────────────────────────────────────────────
class _BackgroundGlow extends StatelessWidget {
  final Animation<double> animation;
  const _BackgroundGlow({required this.animation});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: animation,
      builder: (_, __) => Positioned(
        left: -55,
        top: 172,
        child: Container(
          width: 500,
          height: 500,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(
              colors: [
                _cyan.withOpacity(animation.value * 0.12),
                Colors.transparent,
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Table Painter (oval green table) ─────────────────────────────
class _TablePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    final paint = Paint()
      ..color = const Color(0xFF0F2A1A)
      ..style = PaintingStyle.fill;

    final path = Path()
      ..moveTo(size.width * 0.5, size.height)
      ..arcToPoint(
        Offset(size.width * 0.5, 0),
        radius: Radius.elliptical(size.width * 0.6, size.height * 0.55),
        clockwise: false,
      )
      ..arcToPoint(
        Offset(size.width * 0.5, size.height),
        radius: Radius.elliptical(size.width * 0.6, size.height * 0.55),
        clockwise: false,
      )
      ..close();

    canvas.drawPath(path, paint);

    // Border
    final borderPaint = Paint()
      ..color = const Color(0xFF1E3A2A)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawPath(path, borderPaint);
  }

  @override
  bool shouldRepaint(_TablePainter old) => false;
}

// ── Player Info Widget ────────────────────────────────────────────
class _PlayerInfo extends StatelessWidget {
  final String name;
  final String avatarUrl;
  final int cardCount;
  final bool isActive;
  final bool isPlayer;

  const _PlayerInfo({
    required this.name,
    required this.avatarUrl,
    required this.cardCount,
    required this.isActive,
    this.isPlayer = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: isActive ? _orange : _surface,
              width: 2,
            ),
            color: _surface,
          ),
          child: ClipOval(
            child: avatarUrl.isNotEmpty
                ? Image.network(avatarUrl, fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => _defaultAvatar())
                : _defaultAvatar(),
          ),
        ),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              name,
              style: const TextStyle(
                  color: _textPrimary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600),
            ),
            Row(
              children: [
                const Icon(Icons.style, color: _textSub, size: 12),
                const SizedBox(width: 3),
                Text('$cardCount cards',
                    style: const TextStyle(color: _textSub, fontSize: 11)),
              ],
            ),
          ],
        ),
      ],
    );
  }

  Widget _defaultAvatar() => Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : '?',
          style: const TextStyle(
              color: _cyan, fontSize: 18, fontWeight: FontWeight.w700),
        ),
      );
}

// ── Action Button ─────────────────────────────────────────────────
class _ActionButton extends StatelessWidget {
  final String label;
  final Color color;
  final Color textColor;
  final Color? borderColor;
  final VoidCallback onTap;

  const _ActionButton({
    required this.label,
    required this.color,
    this.textColor = Colors.white,
    this.borderColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(12),
          border: borderColor != null
              ? Border.all(color: borderColor!, width: 1.5)
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            color: textColor,
            fontSize: 13,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }
}

// ── Whot Card Widget ──────────────────────────────────────────────
class _WhotCardWidget extends StatelessWidget {
  final WhotCard card;
  final double width;
  final double height;
  final bool isSelected;
  final bool isTop;

  const _WhotCardWidget({
    required this.card,
    required this.width,
    required this.height,
    this.isSelected = false,
    this.isTop = false,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: isSelected
                ? _orange.withOpacity(0.5)
                : isTop
                    ? _cyan.withOpacity(0.3)
                    : Colors.black.withOpacity(0.4),
            blurRadius: isSelected ? 12 : 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: CustomPaint(
          painter: _CardPainter(card: card, isSelected: isSelected),
        ),
      ),
    );
  }
}

// ── Card Painter ──────────────────────────────────────────────────
class _CardPainter extends CustomPainter {
  final WhotCard card;
  final bool isSelected;

  _CardPainter({required this.card, this.isSelected = false});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    if (card.isFaceDown) {
      _paintFaceDown(canvas, size);
      return;
    }

    // Card background
    final bgPaint = Paint()..color = const Color(0xFFF8F9FA);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(0, 0, w, h),
        const Radius.circular(8),
      ),
      bgPaint,
    );

    // Border if selected
    if (isSelected) {
      final borderPaint = Paint()
        ..color = _orange
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2;
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(1, 1, w - 2, h - 2),
          const Radius.circular(7),
        ),
        borderPaint,
      );
    }

    final shapeColor = _shapeColor(card.shape);
    final paint = Paint()
      ..color = shapeColor
      ..style = PaintingStyle.fill;

    // Number top-left
    final tp = TextPainter(
      text: TextSpan(
        text: card.number == 20 ? 'W' : '${card.number}',
        style: TextStyle(
            color: shapeColor,
            fontSize: w * 0.25,
            fontWeight: FontWeight.w800),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    tp.paint(canvas, Offset(4, 3));

    // Shape center
    final cx = w / 2;
    final cy = h / 2 + 4;
    final r = min(w, h) * 0.22;
    _drawShape(canvas, paint, card.shape, cx, cy, r);
  }

  void _paintFaceDown(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    final bg = Paint()..color = const Color(0xFF1A2744);
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(0, 0, w, h), const Radius.circular(8)),
      bg,
    );

    // Pattern
    final patternPaint = Paint()
      ..color = _cyan.withOpacity(0.12)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    for (double y = 0; y < h; y += 8) {
      canvas.drawLine(Offset(0, y), Offset(w, y), patternPaint);
    }

    // Center logo
    final logoPaint = Paint()
      ..color = _cyan.withOpacity(0.4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawOval(
      Rect.fromCenter(center: Offset(w / 2, h / 2), width: w * 0.5, height: h * 0.3),
      logoPaint,
    );
  }

  Color _shapeColor(WhotShape s) {
    switch (s) {
      case WhotShape.circle:
        return const Color(0xFFE53935);
      case WhotShape.triangle:
        return const Color(0xFF1E88E5);
      case WhotShape.cross:
        return const Color(0xFF43A047);
      case WhotShape.square:
        return const Color(0xFFF4511E);
      case WhotShape.star:
        return const Color(0xFF8E24AA);
      case WhotShape.whot:
        return const Color(0xFFFF5E00);
    }
  }

  void _drawShape(
      Canvas canvas, Paint paint, WhotShape shape, double cx, double cy, double r) {
    switch (shape) {
      case WhotShape.circle:
        canvas.drawCircle(Offset(cx, cy), r, paint);
        break;
      case WhotShape.triangle:
        final path = Path()
          ..moveTo(cx, cy - r)
          ..lineTo(cx + r, cy + r)
          ..lineTo(cx - r, cy + r)
          ..close();
        canvas.drawPath(path, paint);
        break;
      case WhotShape.cross:
        final t = r * 0.35;
        final cross = Path()
          ..addRect(Rect.fromCenter(center: Offset(cx, cy), width: t * 2, height: r * 2))
          ..addRect(Rect.fromCenter(center: Offset(cx, cy), width: r * 2, height: t * 2));
        canvas.drawPath(cross, paint);
        break;
      case WhotShape.square:
        canvas.drawRect(
          Rect.fromCenter(center: Offset(cx, cy), width: r * 1.6, height: r * 1.6),
          paint,
        );
        break;
      case WhotShape.star:
        _drawStar(canvas, paint, cx, cy, r);
        break;
      case WhotShape.whot:
        final tp = TextPainter(
          text: TextSpan(
            text: 'WHOT',
            style: TextStyle(
                color: paint.color,
                fontSize: r * 0.7,
                fontWeight: FontWeight.w900),
          ),
          textDirection: TextDirection.ltr,
        )..layout();
        tp.paint(canvas, Offset(cx - tp.width / 2, cy - tp.height / 2));
        break;
    }
  }

  void _drawStar(Canvas canvas, Paint paint, double cx, double cy, double r) {
    final path = Path();
    const points = 5;
    final innerR = r * 0.45;
    for (int i = 0; i < points * 2; i++) {
      final angle = (i * pi / points) - pi / 2;
      final radius = i.isEven ? r : innerR;
      final x = cx + radius * cos(angle);
      final y = cy + radius * sin(angle);
      if (i == 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    }
    path.close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_CardPainter old) =>
      old.card != card || old.isSelected != isSelected;
}

// ─────────────────────────────────────────────────────────────────
//  USAGE EXAMPLE
//
//  WhotGameScreen(
//    opponentName: 'Chukwuemeka',
//    playerName: 'Greatman',
//    onBack: () => Navigator.pop(context),
//  )
// ─────────────────────────────────────────────────────────────────
