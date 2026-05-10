import 'dart:math';
import 'package:flutter/material.dart';
import 'whot_game_screen.dart'; // for WhotCard, WhotShape

class WhotCardWidget extends StatelessWidget {
  final WhotCard card;
  final double size; // width — height is size * 1.45
  final bool playable; // glows when playable
  final bool selected; // red border when mis-selected
  final WhotShape? calledShape;

  const WhotCardWidget({
    super.key,
    required this.card,
    required this.size,
    this.playable = false,
    this.selected = false,
    this.calledShape,
  });

  @override
  Widget build(BuildContext context) {
    final w = size;
    final h = size * 1.45;
    final isWhot = card.shape == WhotShape.whot;

    // Classic Maroon color from the photo
    const classicMaroon = Color(0xFF7B0000);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      width: w,
      height: h,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(w * 0.08),
        border: Border.all(
          color: selected
              ? Colors.red
              : (playable ? const Color(0xFF00E5FF) : const Color(0xFFD1D1D1)),
          width: playable ? 2.5 : 1.0,
        ),
        boxShadow: playable
            ? [
                BoxShadow(
                    color: const Color(0xFF00E5FF).withOpacity(0.4),
                    blurRadius: 10,
                    spreadRadius: 1)
              ]
            : [
                const BoxShadow(
                    color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))
              ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(w * 0.08 - 1),
        child: CustomPaint(
          size: Size(w, h),
          painter: _WhotCardPainter(card: card, shapeColor: classicMaroon),
        ),
      ),
    );
  }
}

class _WhotCardPainter extends CustomPainter {
  final WhotCard card;
  final Color shapeColor;
  _WhotCardPainter({required this.card, required this.shapeColor});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final isWhot = card.shape == WhotShape.whot;

    // ── Background ──────────────────────────────────────────────────────────
    // Solid off-white for that classic card stock look
    canvas.drawRect(
        Rect.fromLTWH(0, 0, w, h), Paint()..color = const Color(0xFFFAFAFA));

    // ── Number top-left ────────────────────────────────────────────────────
    _drawNumber(canvas, size, card.number, shapeColor,
        x: w * 0.12,
        y: h * 0.06,
        fontSize: w * 0.25,
        anchor: Alignment.topLeft);

    // ── Number bottom-right (rotated 180°) ─────────────────────────────────
    canvas.save();
    canvas.translate(w, h);
    canvas.rotate(pi);
    _drawNumber(canvas, size, card.number, shapeColor,
        x: w * 0.12,
        y: h * 0.06,
        fontSize: w * 0.25,
        anchor: Alignment.topLeft);
    canvas.restore();

    // ── Centre shape ───────────────────────────────────────────────────────
    final cx = w / 2;
    final cy = h / 2;
    final shapeSize = w * 0.5;

    if (isWhot) {
      _drawWhotCentre(canvas, cx, cy, w * 0.45);
    } else {
      _drawShape(canvas, card.shape, cx, cy, shapeSize, shapeColor);
    }

    // ── Special card ribbon ────────────────────────────────────────────────
    // Keeps functionality but matches the photo aesthetic
    if (card.isSpecial && !isWhot) {
      _drawSpecialRibbon(canvas, size, card.specialLabel, shapeColor);
    }
  }

  void _drawShape(Canvas canvas, WhotShape shape, double cx, double cy,
      double size, Color color) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    switch (shape) {
      case WhotShape.circle:
        canvas.drawCircle(Offset(cx, cy), size * 0.5, paint);
        break;
      case WhotShape.triangle:
        final path = Path()
          ..moveTo(cx, cy - size * 0.55)
          ..lineTo(cx + size * 0.55, cy + size * 0.4)
          ..lineTo(cx - size * 0.55, cy + size * 0.4)
          ..close();
        canvas.drawPath(path, paint);
        break;
      case WhotShape.cross:
        final arm = size * 0.2;
        final ext = size * 0.5;
        final path = Path()
          ..moveTo(cx - arm, cy - ext)
          ..lineTo(cx + arm, cy - ext)
          ..lineTo(cx + arm, cy - arm)
          ..lineTo(cx + ext, cy - arm)
          ..lineTo(cx + ext, cy + arm)
          ..lineTo(cx + arm, cy + arm)
          ..lineTo(cx + arm, cy + ext)
          ..lineTo(cx - arm, cy + ext)
          ..lineTo(cx - arm, cy + arm)
          ..lineTo(cx - ext, cy + arm)
          ..lineTo(cx - ext, cy - arm)
          ..lineTo(cx - arm, cy - arm)
          ..close();
        canvas.drawPath(path, paint);
        break;
      case WhotShape.square:
        canvas.drawRect(
            Rect.fromCenter(
                center: Offset(cx, cy), width: size * 0.9, height: size * 0.9),
            paint);
        break;
      case WhotShape.star:
        canvas.drawPath(_starPath(cx, cy, size * 0.55, size * 0.22, 5), paint);
        break;
      default:
        break;
    }
  }

  Path _starPath(
      double cx, double cy, double outerR, double innerR, int points) {
    final path = Path();
    final angleStep = pi / points;
    for (int i = 0; i < points * 2; i++) {
      final r = i.isEven ? outerR : innerR;
      final angle = -pi / 2 + i * angleStep;
      if (i == 0)
        path.moveTo(cx + r * cos(angle), cy + r * sin(angle));
      else
        path.lineTo(cx + r * cos(angle), cy + r * sin(angle));
    }
    return path..close();
  }

  void _drawWhotCentre(Canvas canvas, double cx, double cy, double r) {
    final tp = TextPainter(
      text: TextSpan(
        text: 'Whot',
        style: TextStyle(
            color: shapeColor,
            fontSize: r * 0.45,
            fontWeight: FontWeight.w900,
            fontStyle: FontStyle.italic),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    tp.paint(canvas, Offset(cx - tp.width / 2, cy - tp.height / 1.5));

    // Draw the "W" curls like in the photo
    final paint = Paint()
      ..color = shapeColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawArc(
        Rect.fromCenter(
            center: Offset(cx, cy + r * 0.1), width: r * 0.6, height: r * 0.3),
        0,
        pi,
        false,
        paint);
  }

  void _drawNumber(Canvas canvas, Size size, int number, Color color,
      {required double x,
      required double y,
      required double fontSize,
      required Alignment anchor}) {
    final tp = TextPainter(
      text: TextSpan(
        text: '$number',
        style: TextStyle(
            color: color, fontSize: fontSize, fontWeight: FontWeight.w900),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    tp.paint(canvas, Offset(x, y));
  }

  void _drawSpecialRibbon(Canvas canvas, Size size, String label, Color color) {
    final w = size.width;
    final h = size.height;
    final tp = TextPainter(
      text: TextSpan(
        text: label.toUpperCase(),
        style: TextStyle(
            color: color, fontSize: w * 0.09, fontWeight: FontWeight.w800),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    tp.paint(canvas, Offset((w - tp.width) / 2, h * 0.75));
  }

  @override
  bool shouldRepaint(_WhotCardPainter old) => old.card != card;
}

class WhotCardBack extends StatelessWidget {
  final double size;
  final bool highlighted;
  const WhotCardBack({super.key, this.size = 44, this.highlighted = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size * 1.45,
      decoration: BoxDecoration(
        color: const Color(0xFF0A0E1A),
        borderRadius: BorderRadius.circular(size * 0.1),
        border: Border.all(
            color:
                highlighted ? const Color(0xFFFF6D00) : const Color(0xFF1A2744),
            width: highlighted ? 2 : 1),
      ),
      child: Center(
        child: Text('G',
            style: TextStyle(
                color: (highlighted
                        ? const Color(0xFFFF6D00)
                        : const Color(0xFF00E5FF))
                    .withOpacity(0.3),
                fontSize: size * 0.5,
                fontWeight: FontWeight.w900)),
      ),
    );
  }
}
