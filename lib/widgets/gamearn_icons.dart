import 'package:flutter/material.dart';
import 'package:gamearn/l10n/app_localizations.dart';
import '../theme.dart';

// ─────────────────────────────────────────────────────────────────
//  GAMEARN CUSTOM NAV ICONS
//  Extracted from Figma SVG assets. Each icon has inactive (white)
//  and active (#FF5E00 orange) states matching the design.
// ─────────────────────────────────────────────────────────────────

const Color _kActive = Color(0xFFFF5E00);
const Color _kInactive = Colors.white;

// ── Home Icon ────────────────────────────────────────────────────
class HomeNavIcon extends StatelessWidget {
  final bool isActive;
  const HomeNavIcon({super.key, this.isActive = false});

  @override
  Widget build(BuildContext context) {
    final color = isActive ? _kActive : _kInactive;
    return SizedBox(
      width: 22,
      height: 22,
      child: CustomPaint(painter: _HomePainter(color: color)),
    );
  }
}

class _HomePainter extends CustomPainter {
  final Color color;
  _HomePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    // Scale from SVG viewBox 20..46 x 20..38 → 24x24
    final sx = size.width / 26;
    final sy = size.height / 18;

    canvas.save();
    canvas.scale(sx, sy);
    canvas.translate(-20, -20);

    final path = Path();
    // Outer house shape
    path.moveTo(29.5, 36);
    path.lineTo(29.5, 22);
    path.lineTo(43.5, 22);
    path.lineTo(43.5, 36);
    path.close();

    // Outline frame
    final frame = Path();
    frame.moveTo(29.5, 38);
    frame.cubicTo(28.95, 38, 28.479, 37.804, 28.088, 37.413);
    frame.cubicTo(27.696, 37.021, 27.5, 36.55, 27.5, 36);
    frame.lineTo(27.5, 22);
    frame.cubicTo(27.5, 21.45, 27.696, 20.979, 28.088, 20.588);
    frame.cubicTo(28.479, 20.196, 28.95, 20, 29.5, 20);
    frame.lineTo(43.5, 20);
    frame.cubicTo(44.05, 20, 44.521, 20.196, 44.913, 20.588);
    frame.cubicTo(45.304, 20.979, 45.5, 21.45, 45.5, 22);
    frame.lineTo(45.5, 24.5);
    frame.lineTo(43.5, 24.5);
    frame.lineTo(43.5, 22);
    frame.lineTo(29.5, 22);
    frame.lineTo(29.5, 36);
    frame.lineTo(43.5, 36);
    frame.lineTo(43.5, 33.5);
    frame.lineTo(45.5, 33.5);
    frame.lineTo(45.5, 36);
    frame.cubicTo(45.5, 36.55, 45.304, 37.021, 44.913, 37.413);
    frame.cubicTo(44.521, 37.804, 44.05, 38, 43.5, 38);
    frame.lineTo(29.5, 38);
    frame.close();

    // Inner card/screen
    final inner = Path();
    inner.moveTo(37.5, 34);
    inner.cubicTo(36.95, 34, 36.479, 33.804, 36.088, 33.413);
    inner.cubicTo(35.696, 33.021, 35.5, 32.55, 35.5, 32);
    inner.lineTo(35.5, 26);
    inner.cubicTo(35.5, 25.45, 35.696, 24.979, 36.088, 24.588);
    inner.cubicTo(36.479, 24.196, 36.95, 24, 37.5, 24);
    inner.lineTo(44.5, 24);
    inner.cubicTo(45.05, 24, 45.521, 24.196, 45.913, 24.588);
    inner.cubicTo(46.304, 24.979, 46.5, 25.45, 46.5, 26);
    inner.lineTo(46.5, 32);
    inner.cubicTo(46.5, 32.55, 46.304, 33.021, 45.913, 33.413);
    inner.cubicTo(45.521, 33.804, 45.05, 34, 44.5, 34);
    inner.lineTo(37.5, 34);
    inner.close();
    inner.moveTo(44.5, 32);
    inner.lineTo(44.5, 26);
    inner.lineTo(37.5, 26);
    inner.lineTo(37.5, 32);
    inner.lineTo(44.5, 32);
    inner.close();

    // Dot
    final dot = Path();
    dot.addOval(Rect.fromCenter(
      center: const Offset(40.5, 29),
      width: 3,
      height: 3,
    ));

    canvas.drawPath(frame, paint);
    canvas.drawPath(inner, paint);
    canvas.drawPath(dot, paint);
    canvas.restore();
  }

  @override
  bool shouldRepaint(_HomePainter old) => old.color != color;
}

// ── Game Icon ─────────────────────────────────────────────────────
class GameNavIcon extends StatelessWidget {
  final bool isActive;
  const GameNavIcon({super.key, this.isActive = false});

  @override
  Widget build(BuildContext context) {
    final color = isActive ? _kActive : _kInactive;
    return SizedBox(
      width: 22,
      height: 22,
      child: CustomPaint(painter: _GamePainter(color: color)),
    );
  }
}

class _GamePainter extends CustomPainter {
  final Color color;
  _GamePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    final sx = size.width / 20;
    final sy = size.height / 16;
    canvas.save();
    canvas.scale(sx, sy);
    canvas.translate(-27, -20);

    // Controller body
    final body = Path();
    body.moveTo(29.55, 36);
    body.cubicTo(28.7, 36, 28.042, 35.704, 27.575, 35.113);
    body.cubicTo(27.108, 34.521, 26.933, 33.8, 27.05, 32.95);
    body.lineTo(28.1, 25.45);
    body.cubicTo(28.25, 24.45, 28.696, 23.625, 29.437, 22.975);
    body.cubicTo(30.179, 22.325, 31.05, 22, 32.05, 22);
    body.lineTo(41.95, 22);
    body.cubicTo(42.95, 22, 43.821, 22.325, 44.562, 22.975);
    body.cubicTo(45.304, 23.625, 45.75, 24.45, 45.9, 25.45);
    body.lineTo(46.95, 32.95);
    body.cubicTo(47.067, 33.8, 46.892, 34.521, 46.425, 35.113);
    body.cubicTo(45.958, 35.704, 45.3, 36, 44.45, 36);
    body.cubicTo(44.1, 36, 43.775, 35.938, 43.475, 35.813);
    body.cubicTo(43.175, 35.688, 42.9, 35.5, 42.65, 35.25);
    body.lineTo(40.4, 33);
    body.lineTo(33.6, 33);
    body.lineTo(31.35, 35.25);
    body.cubicTo(31.1, 35.5, 30.825, 35.688, 30.525, 35.813);
    body.cubicTo(30.225, 35.938, 29.9, 36, 29.55, 36);
    body.close();
    // inner notch
    body.moveTo(29.95, 33.85);
    body.lineTo(32.8, 31);
    body.lineTo(41.2, 31);
    body.lineTo(44.05, 33.85);
    body.close();

    canvas.drawPath(body, paint);

    // Right buttons (circle + diamond)
    final rDot1 = Path();
    rDot1.addOval(
        Rect.fromCenter(center: const Offset(42, 29), width: 2, height: 2));
    final rDot2 = Path();
    rDot2.addOval(
        Rect.fromCenter(center: const Offset(40, 26), width: 2, height: 2));
    canvas.drawPath(rDot1, paint);
    canvas.drawPath(rDot2, paint);

    // D-pad cross
    final dpad = Path();
    dpad.moveTo(32.75, 30);
    dpad.lineTo(34.25, 30);
    dpad.lineTo(34.25, 28.25);
    dpad.lineTo(36, 28.25);
    dpad.lineTo(36, 26.75);
    dpad.lineTo(34.25, 26.75);
    dpad.lineTo(34.25, 25);
    dpad.lineTo(32.75, 25);
    dpad.lineTo(32.75, 26.75);
    dpad.lineTo(31, 26.75);
    dpad.lineTo(31, 28.25);
    dpad.lineTo(32.75, 28.25);
    dpad.lineTo(32.75, 30);
    dpad.close();
    canvas.drawPath(dpad, paint);

    canvas.restore();
  }

  @override
  bool shouldRepaint(_GamePainter old) => old.color != color;
}

// ── Profile Icon ──────────────────────────────────────────────────
class ProfileNavIcon extends StatelessWidget {
  final bool isActive;
  const ProfileNavIcon({super.key, this.isActive = false});

  @override
  Widget build(BuildContext context) {
    final color = isActive ? _kActive : _kInactive;
    return SizedBox(
      width: 22,
      height: 22,
      child: CustomPaint(painter: _ProfilePainter(color: color)),
    );
  }
}

class _ProfilePainter extends CustomPainter {
  final Color color;
  _ProfilePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    final sx = size.width / 16;
    final sy = size.height / 16;
    canvas.save();
    canvas.scale(sx, sy);
    canvas.translate(-29, -21);

    // Head circle
    final head = Path();
    head.addOval(const Rect.fromLTWH(33, 21, 8, 8));
    canvas.drawPath(head, paint);

    // Body
    final body = Path();
    body.moveTo(29, 37);
    body.lineTo(29, 34.2);
    body.cubicTo(29, 33.633, 29.146, 33.113, 29.438, 32.638);
    body.cubicTo(29.729, 32.163, 30.117, 31.8, 30.6, 31.55);
    body.cubicTo(31.633, 31.033, 32.683, 30.646, 33.75, 30.388);
    body.cubicTo(34.817, 30.129, 35.9, 30, 37, 30);
    body.cubicTo(38.1, 30, 39.183, 30.129, 40.25, 30.388);
    body.cubicTo(41.317, 30.646, 42.367, 31.033, 43.4, 31.55);
    body.cubicTo(43.883, 31.8, 44.271, 32.163, 44.563, 32.638);
    body.cubicTo(44.854, 33.113, 45, 33.633, 45, 34.2);
    body.lineTo(45, 37);
    body.lineTo(29, 37);
    body.close();
    // inner
    body.moveTo(31, 35);
    body.lineTo(43, 35);
    body.lineTo(43, 34.2);
    body.cubicTo(43, 34.017, 42.954, 33.85, 42.863, 33.7);
    body.cubicTo(42.771, 33.55, 42.65, 33.433, 42.5, 33.35);
    body.cubicTo(41.6, 32.9, 40.692, 32.563, 39.775, 32.338);
    body.cubicTo(38.858, 32.113, 37.933, 32, 37, 32);
    body.cubicTo(36.067, 32, 35.142, 32.113, 34.225, 32.338);
    body.cubicTo(33.308, 32.563, 32.4, 32.9, 31.5, 33.35);
    body.cubicTo(31.35, 33.433, 31.229, 33.55, 31.138, 33.7);
    body.cubicTo(31.046, 33.85, 31, 34.017, 31, 34.2);
    body.lineTo(31, 35);
    body.close();

    canvas.drawPath(body, paint);
    canvas.restore();
  }

  @override
  bool shouldRepaint(_ProfilePainter old) => old.color != color;
}

// ── Wallet Icon ───────────────────────────────────────────────────
class WalletNavIcon extends StatelessWidget {
  final bool isActive;
  const WalletNavIcon({super.key, this.isActive = false});

  @override
  Widget build(BuildContext context) {
    final color = isActive ? _kActive : _kInactive;
    return SizedBox(
      width: 22,
      height: 22,
      child: CustomPaint(painter: _WalletPainter(color: color)),
    );
  }
}

class _WalletPainter extends CustomPainter {
  final Color color;
  _WalletPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    final sx = size.width / 20;
    final sy = size.height / 18;
    canvas.save();
    canvas.scale(sx, sy);
    canvas.translate(-27.5, -20);

    // Card back
    final back = Path();
    back.moveTo(29.5, 38);
    back.cubicTo(28.95, 38, 28.479, 37.804, 28.088, 37.413);
    back.cubicTo(27.696, 37.021, 27.5, 36.55, 27.5, 36);
    back.lineTo(27.5, 22);
    back.cubicTo(27.5, 21.45, 27.696, 20.979, 28.088, 20.588);
    back.cubicTo(28.479, 20.196, 28.95, 20, 29.5, 20);
    back.lineTo(43.5, 20);
    back.cubicTo(44.05, 20, 44.521, 20.196, 44.913, 20.588);
    back.cubicTo(45.304, 20.979, 45.5, 21.45, 45.5, 22);
    back.lineTo(45.5, 24.5);
    back.lineTo(43.5, 24.5);
    back.lineTo(43.5, 22);
    back.lineTo(29.5, 22);
    back.lineTo(29.5, 36);
    back.lineTo(43.5, 36);
    back.lineTo(43.5, 33.5);
    back.lineTo(45.5, 33.5);
    back.lineTo(45.5, 36);
    back.cubicTo(45.5, 36.55, 45.304, 37.021, 44.913, 37.413);
    back.cubicTo(44.521, 37.804, 44.05, 38, 43.5, 38);
    back.lineTo(29.5, 38);
    back.close();

    // Wallet pocket
    final pocket = Path();
    pocket.moveTo(37.5, 34);
    pocket.cubicTo(36.95, 34, 36.479, 33.804, 36.088, 33.413);
    pocket.cubicTo(35.696, 33.021, 35.5, 32.55, 35.5, 32);
    pocket.lineTo(35.5, 26);
    pocket.cubicTo(35.5, 25.45, 35.696, 24.979, 36.088, 24.588);
    pocket.cubicTo(36.479, 24.196, 36.95, 24, 37.5, 24);
    pocket.lineTo(44.5, 24);
    pocket.cubicTo(45.05, 24, 45.521, 24.196, 45.913, 24.588);
    pocket.cubicTo(46.304, 24.979, 46.5, 25.45, 46.5, 26);
    pocket.lineTo(46.5, 32);
    pocket.cubicTo(46.5, 32.55, 46.304, 33.021, 45.913, 33.413);
    pocket.cubicTo(45.521, 33.804, 45.05, 34, 44.5, 34);
    pocket.lineTo(37.5, 34);
    pocket.close();
    pocket.moveTo(44.5, 32);
    pocket.lineTo(44.5, 26);
    pocket.lineTo(37.5, 26);
    pocket.lineTo(37.5, 32);
    pocket.lineTo(44.5, 32);
    pocket.close();

    // Coin dot
    final dot = Path();
    dot.addOval(Rect.fromCenter(
      center: const Offset(40.5, 29),
      width: 3,
      height: 3,
    ));

    canvas.drawPath(back, paint);
    canvas.drawPath(pocket, paint);
    canvas.drawPath(dot, paint);
    canvas.restore();
  }

  @override
  bool shouldRepaint(_WalletPainter old) => old.color != color;
}

// ─────────────────────────────────────────────────────────────────
//  GAMEARN BOTTOM NAV BAR
//  Drop-in replacement for your existing BottomNavigationBar.
//  Usage:
//    GamearnBottomNav(
//      currentIndex: _tabIndex,
//      onTap: (i) => setState(() => _tabIndex = i),
//    )
// ─────────────────────────────────────────────────────────────────

class GamearnBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const GamearnBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final labels = [
      l10n.navHome,
      l10n.navGames,
      l10n.navWallet,
      l10n.navProfile
    ];
    return Container(
      height: 72,
      decoration: BoxDecoration(
        color: context.bg,
        border: Border(
          top: BorderSide(color: context.border, width: 1),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _NavItem(
            icon: Icon(
              currentIndex == 0 ? Icons.home_rounded : Icons.home_outlined,
              color: currentIndex == 0
                  ? kOrange
                  : (context.isDark ? Colors.white : kLightSub),
              size: 25,
            ),
            label: labels[0],
            isActive: currentIndex == 0,
            onTap: () => onTap(0),
          ),
          _NavItem(
            icon: GameNavIcon(isActive: currentIndex == 1),
            label: labels[1],
            isActive: currentIndex == 1,
            onTap: () => onTap(1),
          ),
          _NavItem(
            icon: WalletNavIcon(isActive: currentIndex == 2),
            label: labels[2],
            isActive: currentIndex == 2,
            onTap: () => onTap(2),
          ),
          _NavItem(
            icon: ProfileNavIcon(isActive: currentIndex == 3),
            label: labels[3],
            isActive: currentIndex == 3,
            onTap: () => onTap(3),
          ),
        ],
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final Widget icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _NavItem({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 64,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedScale(
              scale: isActive ? 1.15 : 1.0,
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOut,
              child: icon,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isActive ? FontWeight.w700 : FontWeight.w400,
                color: isActive
                    ? kOrange
                    : (context.isDark ? Colors.white : kLightSub),
                letterSpacing: 0.3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
