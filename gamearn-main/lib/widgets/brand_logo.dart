import 'dart:math';
import 'package:flutter/material.dart';

enum BrandType { google, facebook, apple }

class BrandLogo extends StatelessWidget {
  final BrandType type;
  final double size;

  const BrandLogo({super.key, required this.type, this.size = 24});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        size: Size(size, size),
        painter: _BrandPainter(type: type),
      ),
    );
  }
}

class _BrandPainter extends CustomPainter {
  final BrandType type;
  _BrandPainter({required this.type});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    switch (type) {
      case BrandType.google:
        _paintGoogle(canvas, w, h);
        break;
      case BrandType.facebook:
        _paintFacebook(canvas, w, h);
        break;
      case BrandType.apple:
        _paintApple(canvas, w, h);
        break;
    }
  }

  void _paintGoogle(Canvas canvas, double w, double h) {
    // Simplified Google 'G' with correct colors
    final paint = Paint()..style = PaintingStyle.stroke..strokeWidth = w * 0.2;
    final center = Offset(w / 2, h / 2);
    final radius = w * 0.4;

    // Red sector (top)
    canvas.drawArc(Rect.fromCircle(center: center, radius: radius), -2.8, 1.2, false, 
        paint..color = const Color(0xFFEA4335));
    // Yellow sector (bottom left)
    canvas.drawArc(Rect.fromCircle(center: center, radius: radius), 1.8, 1.0, false, 
        paint..color = const Color(0xFFFBBC05));
    // Green sector (bottom right)
    canvas.drawArc(Rect.fromCircle(center: center, radius: radius), 0.3, 1.5, false, 
        paint..color = const Color(0xFF34A853));
    // Blue sector (right + bar)
    canvas.drawArc(Rect.fromCircle(center: center, radius: radius), -0.5, 0.8, false, 
        paint..color = const Color(0xFF4285F4));
    
    // Draw the bar
    final barPaint = Paint()..color = const Color(0xFF4285F4)..style = PaintingStyle.fill;
    canvas.drawRect(Rect.fromLTWH(w * 0.5, h * 0.4, w * 0.45, h * 0.2), barPaint);
  }

  void _paintFacebook(Canvas canvas, double w, double h) {
    final paint = Paint()..color = const Color(0xFF1877F2)..style = PaintingStyle.fill;
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(0, 0, w, h), Radius.circular(w * 0.2)), paint);
    
    // Draw the white 'f'
    final fPaint = Paint()..color = Colors.white..style = PaintingStyle.fill;
    final path = Path()
      ..moveTo(w * 0.7, h)
      ..lineTo(w * 0.7, h * 0.55)
      ..lineTo(w * 0.85, h * 0.55)
      ..lineTo(w * 0.88, h * 0.4)
      ..lineTo(w * 0.7, h * 0.4)
      ..lineTo(w * 0.7, h * 0.3)
      ..cubicTo(w * 0.7, h * 0.2, w * 0.75, h * 0.15, w * 0.85, h * 0.15)
      ..lineTo(w * 0.9, h * 0.15)
      ..lineTo(w * 0.9, 0)
      ..lineTo(w * 0.75, 0)
      ..cubicTo(w * 0.55, 0, w * 0.45, h * 0.1, w * 0.45, h * 0.3)
      ..lineTo(w * 0.45, h * 0.4)
      ..lineTo(w * 0.35, h * 0.4)
      ..lineTo(w * 0.35, h * 0.55)
      ..lineTo(w * 0.45, h * 0.55)
      ..lineTo(w * 0.45, h)
      ..close();
    canvas.drawPath(path, fPaint);
  }

  void _paintApple(Canvas canvas, double w, double h) {
    // Basic Apple silhouette
    final paint = Paint()..color = Colors.white..style = PaintingStyle.fill;
    final path = Path()
      ..moveTo(w * 0.5, h * 0.95)
      ..cubicTo(w * 0.4, h * 0.95, w * 0.25, h * 0.8, w * 0.2, h * 0.5)
      ..cubicTo(w * 0.15, h * 0.2, w * 0.3, h * 0.1, w * 0.5, h * 0.15)
      ..cubicTo(w * 0.7, h * 0.1, w * 0.85, h * 0.2, w * 0.8, h * 0.5)
      ..cubicTo(w * 0.75, h * 0.6, w * 0.75, h * 0.6, w * 0.8, h * 0.7)
      ..cubicTo(w * 0.85, h * 0.8, w * 0.7, h * 0.95, w * 0.5, h * 0.95)
      ..close();
    
    // Bite
    final bitePath = Path()
      ..addOval(Rect.fromCircle(center: Offset(w * 0.85, h * 0.4), radius: w * 0.15));
    
    final finalPath = Path.combine(PathOperation.difference, path, bitePath);
    
    // Leaf
    final leafPath = Path()
      ..moveTo(w * 0.5, h * 0.1)
      ..quadraticBezierTo(w * 0.55, 0, w * 0.7, 0)
      ..quadraticBezierTo(w * 0.6, h * 0.1, w * 0.5, h * 0.1)
      ..close();
    
    canvas.drawPath(finalPath, paint);
    canvas.drawPath(leafPath, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
